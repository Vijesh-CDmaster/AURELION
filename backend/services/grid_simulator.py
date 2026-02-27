"""
Grid Simulator — Central simulation engine for Grid-Entropy Sentinel.
Replaces TinkerCAD hardware with realistic software-simulated grid data.
Maintains all state and ticks every second to produce real-time data streams.
"""

import asyncio
import json
import math
import random
import time
from collections import deque
from pathlib import Path
from typing import Any, Dict, List, Optional

CONFIG_PATH = Path(__file__).parent.parent / "config.json"

# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _ts() -> str:
    return time.strftime("%H:%M:%S")


def _iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# ──────────────────────────────────────────────────────────────────────
# Grid Simulator
# ──────────────────────────────────────────────────────────────────────

class GridSimulator:
    """In-memory grid simulation engine.  Produces realistic data for every
    page of the dashboard without requiring physical TinkerCAD hardware."""

    NUM_TRANSFORMERS = 12
    DEVICES_PER_TYPE_PER_ZONE = 10  # 10 EVs + 10 HVACs + 10 batteries per zone = 360 total
    TICK_INTERVAL = 1.0  # seconds

    # ── Init ──────────────────────────────────────────────────────────

    def __init__(self) -> None:
        self.tick_count: int = 0
        self.start_time: float = time.time()
        self.config = self._load_config()

        # ━━ Frequency ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.frequency: float = 50.00
        self.prev_frequency: float = 50.00
        self.dfdt: float = 0.0
        self.freq_status: str = "stable"
        self.freq_history: deque = deque(maxlen=1000)

        # Per-transformer
        self.transformers: List[Dict[str, Any]] = []
        for i in range(self.NUM_TRANSFORMERS):
            self.transformers.append({
                "id": f"T{i + 1}",
                "name": f"Transformer Zone {i + 1}",
                "hz": 50.0,
                "offset": random.gauss(0, 0.02),
                "load_pct": random.uniform(40, 80),
                "capacity_kw": round(random.uniform(800, 1500), 1),
                "status": "stable",
            })

        # ━━ Solar / Forecast ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.solar_irradiance: float = 72.0
        self.predicted_irradiance: float = 72.0
        self.forecast_confidence: float = 88.0
        self.forecast_uncertainty: float = 12.0
        self.false_calm: bool = False
        self.cloud_event_active: bool = False
        self._cloud_timer: int = 0
        self._cloud_drop: float = 0.0
        self.shadow_direction: float = random.uniform(0, 360)
        self.shadow_speed: float = round(random.uniform(0.5, 5.0), 2)
        self.solar_history: deque = deque(maxlen=500)
        self.forecast_accuracy_history: deque = deque(maxlen=200)
        self._irr_variance_window: deque = deque(maxlen=30)

        # ━━ MARL Agents ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.agent_clusters: List[Dict[str, Any]] = []
        for i in range(self.NUM_TRANSFORMERS):
            total = random.randint(80, 120)
            active = random.randint(20, total)
            self.agent_clusters.append({
                "cluster_id": f"C{i + 1}",
                "transformer_id": f"T{i + 1}",
                "name": f"Cluster {i + 1}",
                "total": total,
                "active": active,
                "idle": total - active,
                "responding": 0,
                "capacity_kw": round(random.uniform(200, 600), 1),
                "status": "idle",
            })
        self.virtual_inertia: float = 45.0
        self.reward_mode: str = "normal"
        self.reward_weights: Dict[str, float] = {
            "stability": 0.5, "comfort": 0.3, "efficiency": 0.2
        }
        self.agent_response_log: deque = deque(maxlen=100)
        self.agent_response_timeline: deque = deque(maxlen=200)
        self.marl_cumulative_reward: float = 0.0
        self.marl_reward_history: deque = deque(maxlen=200)
        self.active_agents: int = sum(c["active"] for c in self.agent_clusters)

        # ━━ Adversarial Defense ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.attack_active: bool = False
        self.coherence_score: float = 0.0
        self.defense_active: bool = False
        self.desync_strength: float = 0.0
        self.attack_intensity: int = 0
        self.coherence_history: deque = deque(maxlen=500)
        self.appliance_sync: List[bool] = [False] * 9  # 3×3 grid
        self.defense_log: deque = deque(maxlen=100)
        self.attacks_mitigated: int = 0
        self.recovery_progress: float = 0.0
        self.nodes_at_risk: int = 0
        self.avg_detection_time_ms: float = 145.0
        self.false_positive_rate: float = 2.3
        self.recovery_efficiency: float = 94.0

        # ━━ VPP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.vpp_clusters: List[Dict[str, Any]] = []
        for i in range(self.NUM_TRANSFORMERS):
            self.vpp_clusters.append({
                "zone_id": f"T{i + 1}",
                "name": f"Zone {i + 1} VPP",
                "members": random.randint(30, 100),
                "capacity_kw": round(random.uniform(100, 500), 1),
                "v2g_contribution_kw": round(random.uniform(10, 100), 1),
                "status": random.choice(["active", "idle"]),
            })
        self.vpp_formation_log: deque = deque(maxlen=50)
        self.vpp_capacity_history: deque = deque(maxlen=200)
        self.total_vpp_capacity: float = sum(c["capacity_kw"] for c in self.vpp_clusters)
        self.reserved_buffer_kw: float = round(self.total_vpp_capacity * 0.1, 1)

        # ━━ Devices ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.devices: List[Dict[str, Any]] = []
        dev_id = 1
        for zone_idx in range(self.NUM_TRANSFORMERS):
            zone = f"T{zone_idx + 1}"
            for dev_type in ("ev", "hvac", "battery"):
                for _ in range(self.DEVICES_PER_TYPE_PER_ZONE):
                    base_load = {"ev": (1500, 7000), "hvac": (800, 3000), "battery": (-2000, 2000)}
                    lo, hi = base_load[dev_type]
                    self.devices.append({
                        "id": f"DEV-{dev_id:04d}",
                        "type": dev_type,
                        "zone": zone,
                        "status": random.choices(
                            ["online", "offline", "standby"], weights=[70, 15, 15]
                        )[0],
                        "load_w": round(random.uniform(lo, hi), 1),
                        "last_seen": _iso(),
                    })
                    dev_id += 1
        self.device_load_history: deque = deque(maxlen=300)

        # ━━ Events ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.events: deque = deque(maxlen=500)
        self._event_counter: int = 0
        self._add_event("system", "info", "Grid Entropy Sentinel started", "System")

        # ━━ Analytics ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.total_energy_saved_kwh: float = 0.0
        self.avg_response_latency_ms: float = 120.0
        self.attacks_defended: int = 0
        self.avg_freq_deviation: float = 0.0
        self.hourly_energy_savings: deque = deque(maxlen=168)
        self.attack_frequency_data: deque = deque(maxlen=30)
        self.performance_history: deque = deque(maxlen=500)

        # ━━ Simulation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.simulation_running: bool = False
        self.simulation_scenario: Optional[str] = None
        self.simulation_intensity: float = 0.5
        self.simulation_duration: int = 30
        self.simulation_tick: int = 0
        self.simulation_baseline: deque = deque(maxlen=300)
        self.simulation_sentinel: deque = deque(maxlen=300)
        self.simulation_history: deque = deque(maxlen=50)

        # ━━ Weather (simulated — feeds into ML drop predictor) ━━━━
        self.weather: Dict[str, float] = {
            "temperature": round(random.uniform(15, 35), 1),
            "humidity": round(random.uniform(30, 80), 1),
            "cloud_cover": round(random.uniform(0, 60), 1),
            "shortwave_radiation": round(random.uniform(200, 800), 1),
            "wind_speed": round(random.uniform(1, 15), 1),
            "wind_gust": round(random.uniform(3, 25), 1),
            "wind_direction_deg": round(random.uniform(0, 360), 1),
        }
        self.power_history: deque = deque(maxlen=50)  # recent solar power readings
        for _ in range(5):
            self.power_history.append(round(random.uniform(1500, 4000), 1))

        # ━━ Auth ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        self.users: Dict[str, Dict] = {
            "admin": {"password": "admin123", "role": "admin", "name": "Administrator"},
            "operator": {"password": "operator123", "role": "operator", "name": "Grid Operator"},
            "viewer": {"password": "viewer123", "role": "viewer", "name": "Read-Only Viewer"},
        }

    # ── Config ────────────────────────────────────────────────────────

    def _load_config(self) -> Dict:
        try:
            with open(CONFIG_PATH) as f:
                return json.load(f)
        except Exception:
            return {
                "frequency": {"warning_threshold": 49.8, "critical_threshold": 49.5},
                "attack": {"coherence_trigger": 2.0},
                "forecast": {"uncertainty_escalation_pct": 15.0},
                "system": {"mode": "simulation"},
            }

    def save_config(self) -> None:
        with open(CONFIG_PATH, "w") as f:
            json.dump(self.config, f, indent=2)

    # ── Event logging ─────────────────────────────────────────────────

    def _add_event(self, etype: str, severity: str, message: str, zone: str = "Global") -> None:
        self._event_counter += 1
        self.events.appendleft({
            "id": f"EVT-{self._event_counter:06d}",
            "time": _iso(),
            "time_display": _ts(),
            "type": etype,
            "severity": severity,
            "zone": zone,
            "message": message,
            "status": "active",
        })

    # ── Tick engine ───────────────────────────────────────────────────

    def tick(self) -> None:
        """Advance simulation by one step (~1 second)."""
        self.tick_count += 1
        self._update_frequency()
        self._update_solar()
        self._update_agents()
        self._update_defense()
        self._update_vpp()
        self._update_devices()
        self._update_analytics()
        self._update_weather()
        if self.simulation_running:
            self._update_simulation()

    # ────────── Frequency ─────────────────────────────────────────────

    def _update_frequency(self) -> None:
        self.prev_frequency = self.frequency

        # Mean-reverting random walk
        noise = random.gauss(0, 0.03)
        reversion = (50.0 - self.frequency) * 0.05
        perturbation = 0.0

        # Occasional larger excursion (~2 % chance per tick)
        if random.random() < 0.02:
            perturbation = random.choice([-1, 1]) * random.uniform(0.1, 0.3)

        # Attack effect: when active, pull frequency down
        if self.attack_active:
            perturbation -= self.attack_intensity * 0.08

        # Simulation scenario effects
        if self.simulation_running:
            if self.simulation_scenario == "cloud_shading":
                perturbation -= 0.05 * self.simulation_intensity
            elif self.simulation_scenario == "mass_ev":
                perturbation -= 0.1 * self.simulation_intensity
            elif self.simulation_scenario == "attack":
                perturbation -= 0.15 * self.simulation_intensity
            elif self.simulation_scenario == "high_renewable":
                perturbation += 0.04 * self.simulation_intensity

        self.frequency = _clamp(
            self.frequency + noise + reversion + perturbation, 48.5, 51.5
        )
        self.dfdt = round(self.frequency - self.prev_frequency, 4)

        # Status determination
        warn = self.config["frequency"]["warning_threshold"]
        crit = self.config["frequency"]["critical_threshold"]
        if self.frequency < crit or self.frequency > (100 - crit):
            self.freq_status = "critical"
        elif self.frequency < warn or self.frequency > (100 - warn):
            self.freq_status = "warning"
        else:
            self.freq_status = "stable"

        # Per-transformer
        for t in self.transformers:
            t["hz"] = round(self.frequency + t["offset"] + random.gauss(0, 0.01), 3)
            if t["hz"] < crit:
                t["status"] = "critical"
            elif t["hz"] < warn:
                t["status"] = "warning"
            else:
                t["status"] = "stable"
            # Slight load drift
            t["load_pct"] = _clamp(t["load_pct"] + random.gauss(0, 0.5), 20, 95)

        # History
        entry = {"time": _ts(), "hz": round(self.frequency, 3), "dfdt": self.dfdt}
        self.freq_history.append(entry)

        # Events for big deviations
        if abs(self.dfdt) > 0.15:
            self._add_event("frequency", "warning",
                            f"Rapid frequency change: df/dt={self.dfdt:.3f} Hz/s")
        if self.freq_status == "critical":
            self._add_event("frequency", "critical",
                            f"Critical frequency: {self.frequency:.2f} Hz")

    # ────────── Solar ─────────────────────────────────────────────────

    def _update_solar(self) -> None:
        # Simulate daily cycle with noise
        hour_angle = (self.tick_count % 86400) / 86400 * 2 * math.pi
        base_irr = 50 + 40 * math.sin(hour_angle - math.pi / 2)  # peaks around 25% of cycle

        # Cloud events (random onset, lasts 10-40 ticks)
        if not self.cloud_event_active and random.random() < 0.01:
            self.cloud_event_active = True
            self._cloud_timer = random.randint(10, 40)
            self._cloud_drop = random.uniform(15, 40)
            self._add_event("solar", "warning",
                            f"Cloud event started — irradiance dropping {self._cloud_drop:.0f}%")

        if self.cloud_event_active:
            self._cloud_timer -= 1
            if self._cloud_timer <= 0:
                self.cloud_event_active = False
                self._cloud_drop = 0
                self._add_event("solar", "info", "Cloud event ended — irradiance recovering")

        actual = _clamp(base_irr - self._cloud_drop + random.gauss(0, 2), 0, 100)
        self.solar_irradiance = round(actual, 1)

        # Forecast: actual + noise + bias
        pred_error = random.gauss(0, 3) + (2 if self.cloud_event_active else 0)
        self.predicted_irradiance = round(_clamp(actual + pred_error, 0, 100), 1)

        # Confidence & uncertainty
        base_conf = 92 if not self.cloud_event_active else 68
        self.forecast_confidence = round(
            _clamp(base_conf + random.gauss(0, 3), 40, 99), 1
        )
        self.forecast_uncertainty = round(100 - self.forecast_confidence, 1)

        # False calm detection
        self._irr_variance_window.append(actual)
        if len(self._irr_variance_window) >= 10:
            recent = list(self._irr_variance_window)[-10:]
            variance = sum((x - sum(recent) / len(recent)) ** 2 for x in recent) / len(recent)
            mean_level = sum(recent) / len(recent)
            self.false_calm = (variance < 2.0 and mean_level > 50 and
                               self.cloud_event_active and self._cloud_timer > 5)
        else:
            self.false_calm = False

        if self.false_calm:
            self._add_event("solar", "attack",
                            "⚠️ False Calm Detected — Irradiance stable but collapse imminent")

        # Shadow velocity drift
        self.shadow_direction = (self.shadow_direction + random.gauss(0, 2)) % 360
        self.shadow_speed = _clamp(self.shadow_speed + random.gauss(0, 0.1), 0.1, 10)

        # History
        self.solar_history.append({
            "time": _ts(),
            "actual": self.solar_irradiance,
            "predicted": self.predicted_irradiance,
            "confidence": self.forecast_confidence,
        })

        # Accuracy tracking
        error = abs(self.solar_irradiance - self.predicted_irradiance)
        mae = round(error, 2)
        self.forecast_accuracy_history.append({
            "time": _ts(), "mae": mae, "accuracy": round(100 - mae, 1)
        })

    # ────────── MARL Agents ───────────────────────────────────────────

    def _update_agents(self) -> None:
        freq = self.frequency
        warn = self.config["frequency"]["warning_threshold"]
        crit = self.config["frequency"]["critical_threshold"]
        under_stress = freq < warn

        total_responding = 0
        for cluster in self.agent_clusters:
            total = cluster["total"]
            if under_stress:
                # More agents respond when frequency is worse
                stress_factor = min(1.0, (warn - freq) / (warn - crit + 0.01))
                target_responding = int(total * (0.3 + 0.7 * stress_factor))
                cluster["responding"] = _clamp(
                    cluster["responding"] + random.randint(0, 5),
                    0, target_responding
                )
                cluster["status"] = "responding"
            elif self.attack_active:
                cluster["responding"] = random.randint(int(total * 0.2), int(total * 0.5))
                cluster["status"] = "responding"
            else:
                cluster["responding"] = max(0, cluster["responding"] - random.randint(0, 3))
                if cluster["responding"] == 0:
                    cluster["status"] = "idle"

            # Active agents fluctuate
            cluster["active"] = _clamp(
                cluster["active"] + random.randint(-2, 2),
                cluster["responding"], total
            )
            cluster["idle"] = total - cluster["active"]
            total_responding += cluster["responding"]

        self.active_agents = sum(c["active"] for c in self.agent_clusters)

        # Virtual inertia
        total_agents = sum(c["total"] for c in self.agent_clusters)
        if total_agents > 0:
            self.virtual_inertia = round(
                (total_responding / total_agents) * 100 * (0.8 + random.gauss(0, 0.05)),
                1,
            )
        self.virtual_inertia = _clamp(self.virtual_inertia, 0, 100)

        # Reward mode follows attack state
        self.reward_mode = "attack" if self.attack_active else "normal"
        if self.reward_mode == "attack":
            self.reward_weights = {"stability": 0.8, "comfort": 0.1, "efficiency": 0.1}
        else:
            self.reward_weights = {"stability": 0.5, "comfort": 0.3, "efficiency": 0.2}

        # Cumulative reward
        step_reward = (50.0 - abs(self.frequency - 50.0)) * self.reward_weights["stability"]
        self.marl_cumulative_reward += step_reward
        self.marl_reward_history.append({
            "episode": self.tick_count,
            "reward": round(self.marl_cumulative_reward, 2),
        })

        # Response timeline
        if under_stress or self.attack_active:
            latency = max(20, random.gauss(120, 30))
            self.agent_response_timeline.append({
                "time": _ts(),
                "response_ms": round(latency, 1),
                "clusters_responding": sum(
                    1 for c in self.agent_clusters if c["status"] == "responding"
                ),
            })

    # ────────── Defense ───────────────────────────────────────────────

    def _update_defense(self) -> None:
        trigger = self.config["attack"]["coherence_trigger"]

        if self.attack_active:
            # Coherence rises during attack
            self.coherence_score = _clamp(
                self.coherence_score + random.uniform(0.05, 0.15), 0, 3.0
            )
            # Some appliances synchronize
            sync_prob = self.coherence_score / 3.0
            self.appliance_sync = [random.random() < sync_prob for _ in range(9)]
            self.nodes_at_risk = sum(1 for t in self.transformers
                                     if t["load_pct"] > 75)

            # Defense activates when coherence exceeds trigger
            if self.coherence_score >= trigger and not self.defense_active:
                self.defense_active = True
                self._add_event("defense", "critical",
                                f"Defense activated — coherence {self.coherence_score:.2f}")
                self.defense_log.appendleft({
                    "time": _ts(), "action": "Defense activated",
                    "target": "All zones", "severity": "critical"
                })

            if self.defense_active:
                self.desync_strength = _clamp(
                    self.desync_strength + random.uniform(2, 8), 0, 100
                )
                self.recovery_progress = _clamp(
                    self.recovery_progress + random.uniform(1, 4), 0, 100
                )
                if self.recovery_progress >= 100:
                    self.attack_active = False
                    self.defense_active = False
                    self.attacks_mitigated += 1
                    self.attacks_defended += 1
                    self._add_event("defense", "info",
                                    "Attack mitigated — system recovered")
                    self.defense_log.appendleft({
                        "time": _ts(), "action": "Attack mitigated",
                        "target": "All zones", "severity": "info"
                    })
        else:
            # Coherence decays
            self.coherence_score = _clamp(
                self.coherence_score - random.uniform(0.05, 0.2), 0, 3.0
            )
            self.desync_strength = max(0, self.desync_strength - random.uniform(1, 5))
            self.recovery_progress = 0
            self.nodes_at_risk = 0
            self.appliance_sync = [False] * 9

            # Random attack onset (~0.3% per tick)
            if random.random() < 0.003:
                self.attack_active = True
                self.attack_intensity = random.randint(1, 3)
                self._add_event("defense", "attack",
                                f"🚨 Attack detected — intensity {self.attack_intensity}/3")

        self.coherence_history.append({
            "time": _ts(),
            "coherence": round(self.coherence_score, 3),
            "attack": self.attack_active,
        })

        # Detection metrics drift
        self.avg_detection_time_ms = _clamp(
            self.avg_detection_time_ms + random.gauss(0, 2), 50, 500
        )
        self.false_positive_rate = _clamp(
            self.false_positive_rate + random.gauss(0, 0.1), 0.5, 10
        )
        self.recovery_efficiency = _clamp(
            self.recovery_efficiency + random.gauss(0, 0.5), 80, 99.5
        )

    # ────────── VPP ───────────────────────────────────────────────────

    def _update_vpp(self) -> None:
        for vc in self.vpp_clusters:
            # Member count drifts
            vc["members"] = _clamp(vc["members"] + random.randint(-1, 1), 10, 150)
            vc["capacity_kw"] = round(
                _clamp(vc["capacity_kw"] + random.gauss(0, 2), 50, 800), 1
            )
            vc["v2g_contribution_kw"] = round(
                _clamp(vc["v2g_contribution_kw"] + random.gauss(0, 1), 0, 200), 1
            )
            # Status toggle occasionally
            if random.random() < 0.02:
                vc["status"] = "active" if vc["status"] == "idle" else "idle"

        self.total_vpp_capacity = round(
            sum(c["capacity_kw"] for c in self.vpp_clusters), 1
        )
        self.reserved_buffer_kw = round(self.total_vpp_capacity * 0.1, 1)

        # Capacity history
        dispatched = sum(
            c["v2g_contribution_kw"] for c in self.vpp_clusters if c["status"] == "active"
        )
        self.vpp_capacity_history.append({
            "time": _ts(),
            "capacity": self.total_vpp_capacity,
            "dispatched": round(dispatched, 1),
        })

        # Formation log
        if random.random() < 0.02:
            zone = random.choice(self.vpp_clusters)
            self.vpp_formation_log.appendleft({
                "time": _ts(),
                "action": random.choice(["Cluster formed", "Cluster expanded", "Members joined"]),
                "cluster": zone["name"],
                "members": zone["members"],
            })

    # ────────── Devices ───────────────────────────────────────────────

    def _update_devices(self) -> None:
        ev_load = 0.0
        hvac_load = 0.0
        battery_load = 0.0
        online = 0
        offline = 0

        for dev in self.devices:
            # Load drift
            dev["load_w"] = round(dev["load_w"] + random.gauss(0, 20), 1)
            if dev["type"] == "battery":
                dev["load_w"] = _clamp(dev["load_w"], -3000, 3000)
            else:
                dev["load_w"] = _clamp(dev["load_w"], 100, 8000)

            # Status changes
            if random.random() < 0.005:
                dev["status"] = random.choice(["online", "offline", "standby"])
            if dev["status"] == "online":
                dev["last_seen"] = _iso()

            # Tally
            if dev["status"] in ("online", "standby"):
                online += 1
                if dev["type"] == "ev":
                    ev_load += dev["load_w"]
                elif dev["type"] == "hvac":
                    hvac_load += dev["load_w"]
                else:
                    battery_load += dev["load_w"]
            else:
                offline += 1

        total_load = ev_load + hvac_load + abs(battery_load)
        self.device_load_history.append({
            "time": _ts(),
            "ev": round(ev_load / 1000, 2),
            "hvac": round(hvac_load / 1000, 2),
            "battery": round(battery_load / 1000, 2),
            "total": round(total_load / 1000, 2),
        })

    # ────────── Analytics ─────────────────────────────────────────────

    def _update_analytics(self) -> None:
        # Energy saved per tick (simulated)
        saved = random.uniform(0.1, 0.5) if self.freq_status != "critical" else 0
        self.total_energy_saved_kwh += saved

        # Response latency drift
        self.avg_response_latency_ms = round(
            _clamp(self.avg_response_latency_ms + random.gauss(0, 3), 30, 500), 1
        )

        # Frequency deviation
        self.avg_freq_deviation = round(abs(self.frequency - 50.0), 3)

        # Hourly energy savings (every 60 ticks ≈ 1 min in demo, stands for 1 hour)
        if self.tick_count % 60 == 0:
            self.hourly_energy_savings.append({
                "hour": _ts(),
                "kwh": round(saved * 60, 2),
            })

        # Attack frequency per-day (every 300 ticks ≈ 5 min, stands for 1 day)
        if self.tick_count % 300 == 0:
            self.attack_frequency_data.append({
                "day": f"Day {len(self.attack_frequency_data) + 1}",
                "attacks": self.attacks_defended,
            })

        # Performance history
        self.performance_history.append({
            "time": _ts(),
            "freq_deviation": self.avg_freq_deviation,
            "latency_ms": self.avg_response_latency_ms,
            "energy_saved": round(self.total_energy_saved_kwh, 2),
        })

    # ────────── Simulation ────────────────────────────────────────────

    def start_simulation(self, scenario: str, intensity: float = 0.5,
                         duration: int = 30) -> None:
        self.simulation_running = True
        self.simulation_scenario = scenario
        self.simulation_intensity = _clamp(intensity, 0, 1)
        self.simulation_duration = duration
        self.simulation_tick = 0
        self.simulation_baseline.clear()
        self.simulation_sentinel.clear()
        self._add_event("simulation", "info",
                        f"Simulation started: {scenario} @ {intensity * 100:.0f}%")

    def _update_simulation(self) -> None:
        self.simulation_tick += 1

        # Baseline: what would happen without the system
        baseline_hz = 50.0 - self.simulation_intensity * 0.5 + random.gauss(0, 0.1)
        # Sentinel: actual system frequency (with MARL defense)
        sentinel_hz = self.frequency

        self.simulation_baseline.append({
            "tick": self.simulation_tick,
            "hz": round(baseline_hz, 3),
        })
        self.simulation_sentinel.append({
            "tick": self.simulation_tick,
            "hz": round(sentinel_hz, 3),
        })

        if self.simulation_tick >= self.simulation_duration:
            self._complete_simulation()

    def _complete_simulation(self) -> None:
        baseline_vals = [p["hz"] for p in self.simulation_baseline]
        sentinel_vals = [p["hz"] for p in self.simulation_sentinel]

        baseline_dev = max(abs(v - 50.0) for v in baseline_vals) if baseline_vals else 0
        sentinel_dev = max(abs(v - 50.0) for v in sentinel_vals) if sentinel_vals else 0

        result = {
            "id": f"SIM-{len(self.simulation_history) + 1:04d}",
            "scenario": self.simulation_scenario,
            "intensity": self.simulation_intensity,
            "duration": self.simulation_duration,
            "baseline_max_deviation": round(baseline_dev, 3),
            "sentinel_max_deviation": round(sentinel_dev, 3),
            "response_latency_ms": round(self.avg_response_latency_ms, 1),
            "energy_saved_kwh": round(random.uniform(5, 30), 2),
            "recovery_time_s": random.randint(3, 15),
            "baseline_data": list(self.simulation_baseline),
            "sentinel_data": list(self.simulation_sentinel),
            "completed_at": _iso(),
        }
        self.simulation_history.appendleft(result)
        self.simulation_running = False
        self.simulation_scenario = None
        self._add_event("simulation", "info",
                        f"Simulation complete — sentinel deviation {sentinel_dev:.3f} Hz "
                        f"vs baseline {baseline_dev:.3f} Hz")

    # ────────── Attack simulation (manual trigger) ────────────────────

    def trigger_attack(self, intensity: int = 2) -> Dict:
        self.attack_active = True
        self.attack_intensity = _clamp(intensity, 1, 3)
        self.recovery_progress = 0
        self.desync_strength = 0
        self._add_event("defense", "attack",
                        f"Manual attack triggered — intensity {intensity}/3")
        return {"status": "attack_started", "intensity": intensity}

    # ── Full state snapshot (for WebSocket) ───────────────────────────

    def get_state(self) -> Dict[str, Any]:
        """Return complete state snapshot for WebSocket streaming."""
        online_devs = [d for d in self.devices if d["status"] in ("online", "standby")]
        offline_devs = [d for d in self.devices if d["status"] == "offline"]
        ev_devs = [d for d in self.devices if d["type"] == "ev"]
        hvac_devs = [d for d in self.devices if d["type"] == "hvac"]
        bat_devs = [d for d in self.devices if d["type"] == "battery"]
        total_devs = len(self.devices)

        return {
            "tick": self.tick_count,
            "timestamp": _iso(),

            # Frequency
            "frequency": round(self.frequency, 3),
            "dfdt": self.dfdt,
            "freq_status": self.freq_status,
            "frequency_history": list(self.freq_history)[-60:],
            "transformers": self.transformers,

            # Solar
            "solar_irradiance": self.solar_irradiance,
            "predicted_irradiance": self.predicted_irradiance,
            "forecast_confidence": self.forecast_confidence,
            "forecast_uncertainty": self.forecast_uncertainty,
            "false_calm": self.false_calm,
            "shadow_direction": round(self.shadow_direction, 1),
            "shadow_speed": round(self.shadow_speed, 2),
            "solar_history": list(self.solar_history)[-60:],
            "forecast_accuracy_history": list(self.forecast_accuracy_history)[-60:],

            # Agents
            "agent_clusters": self.agent_clusters,
            "active_agents": self.active_agents,
            "virtual_inertia": self.virtual_inertia,
            "reward_mode": self.reward_mode,
            "reward_weights": self.reward_weights,
            "agent_response_timeline": list(self.agent_response_timeline)[-30:],
            "marl_reward_history": list(self.marl_reward_history)[-60:],
            "marl_cumulative_reward": round(self.marl_cumulative_reward, 2),

            # Defense
            "attack_active": self.attack_active,
            "coherence_score": round(self.coherence_score, 3),
            "defense_active": self.defense_active,
            "desync_strength": round(self.desync_strength, 1),
            "attack_intensity": self.attack_intensity,
            "appliance_sync": self.appliance_sync,
            "coherence_history": list(self.coherence_history)[-60:],
            "defense_log": list(self.defense_log)[:20],
            "attacks_mitigated": self.attacks_mitigated,
            "recovery_progress": round(self.recovery_progress, 1),
            "nodes_at_risk": self.nodes_at_risk,
            "avg_detection_time_ms": round(self.avg_detection_time_ms, 1),
            "false_positive_rate": round(self.false_positive_rate, 2),
            "recovery_efficiency": round(self.recovery_efficiency, 1),

            # VPP
            "vpp_clusters": self.vpp_clusters,
            "total_vpp_capacity": self.total_vpp_capacity,
            "reserved_buffer_kw": self.reserved_buffer_kw,
            "vpp_formation_log": list(self.vpp_formation_log)[:20],
            "vpp_capacity_history": list(self.vpp_capacity_history)[-60:],

            # Devices
            "device_count": total_devs,
            "online_devices": len(online_devs),
            "offline_devices": len(offline_devs),
            "device_mix": {
                "ev_pct": round(len(ev_devs) / total_devs * 100, 1),
                "hvac_pct": round(len(hvac_devs) / total_devs * 100, 1),
                "battery_pct": round(len(bat_devs) / total_devs * 100, 1),
            },
            "device_load_history": list(self.device_load_history)[-60:],

            # Events
            "recent_events": list(self.events)[:20],

            # Analytics
            "total_energy_saved_kwh": round(self.total_energy_saved_kwh, 2),
            "avg_response_latency_ms": self.avg_response_latency_ms,
            "attacks_defended": self.attacks_defended,
            "avg_freq_deviation": self.avg_freq_deviation,
            "hourly_energy_savings": list(self.hourly_energy_savings)[-24:],
            "attack_frequency_data": list(self.attack_frequency_data),
            "performance_history": list(self.performance_history)[-60:],

            # Simulation
            "simulation_running": self.simulation_running,
            "simulation_scenario": self.simulation_scenario,
            "simulation_tick": self.simulation_tick,
            "simulation_baseline": list(self.simulation_baseline),
            "simulation_sentinel": list(self.simulation_sentinel),
            "simulation_history": list(self.simulation_history)[:10],

            # Config
            "config": self.config,
        }

    # ── Subset snapshots for specific WebSocket channels ──────────────

    def get_weather_snapshot(self) -> Dict:
        return {
            "weather": dict(self.weather),
            "power_history": list(self.power_history),
            "timestamp": _ts(),
        }

    def get_frequency_snapshot(self) -> Dict:
        return {
            "hz": round(self.frequency, 3),
            "dfdt": self.dfdt,
            "status": self.freq_status,
            "timestamp": _ts(),
        }

    def get_solar_snapshot(self) -> Dict:
        return {
            "actual_irr": self.solar_irradiance,
            "predicted_irr": self.predicted_irradiance,
            "confidence": self.forecast_confidence,
            "uncertainty": self.forecast_uncertainty,
            "false_calm": self.false_calm,
            "timestamp": _ts(),
        }

    def get_coherence_snapshot(self) -> Dict:
        return {
            "coherence": round(self.coherence_score, 3),
            "attack": self.attack_active,
            "defense": self.defense_active,
            "btn1": self.appliance_sync[0] if len(self.appliance_sync) > 0 else False,
            "btn2": self.appliance_sync[1] if len(self.appliance_sync) > 1 else False,
            "btn3": self.appliance_sync[2] if len(self.appliance_sync) > 2 else False,
            "timestamp": _ts(),
        }

    # ── Async runner ──────────────────────────────────────────────────

    # ────────── Weather (simulated) ────────────────────────────────

    def _update_weather(self) -> None:
        """Drift simulated weather values each tick for ML model input."""
        w = self.weather
        w["temperature"] = round(_clamp(w["temperature"] + random.gauss(0, 0.3), -5, 45), 1)
        w["humidity"] = round(_clamp(w["humidity"] + random.gauss(0, 1), 10, 100), 1)

        # Cloud cover linked to solar irradiance events
        if self.cloud_event_active:
            w["cloud_cover"] = round(_clamp(w["cloud_cover"] + random.uniform(1, 3), 0, 100), 1)
        else:
            w["cloud_cover"] = round(_clamp(w["cloud_cover"] + random.gauss(0, 1.5), 0, 100), 1)

        # Shortwave radiation inversely related to cloud cover
        clear_sky_rad = 800 - (w["cloud_cover"] / 100) * 600
        w["shortwave_radiation"] = round(
            _clamp(clear_sky_rad + random.gauss(0, 20), 20, 900), 1
        )
        w["wind_speed"] = round(_clamp(w["wind_speed"] + random.gauss(0, 0.3), 0, 30), 1)
        w["wind_gust"] = round(
            _clamp(w["wind_speed"] + random.uniform(1, 8), w["wind_speed"], 40), 1
        )
        w["wind_direction_deg"] = round((w["wind_direction_deg"] + random.gauss(0, 3)) % 360, 1)

        # Track solar power as a derived metric
        # power ≈ solar_irradiance * scaling factor + noise
        solar_power = self.solar_irradiance * 40 + random.gauss(0, 50)
        self.power_history.append(round(max(0, solar_power), 1))

    async def run(self) -> None:
        """Background tick loop — call from FastAPI lifespan."""
        while True:
            self.tick()
            await asyncio.sleep(self.TICK_INTERVAL)


# ──────────────────────────────────────────────────────────────────────
# Singleton
# ──────────────────────────────────────────────────────────────────────

simulator = GridSimulator()
