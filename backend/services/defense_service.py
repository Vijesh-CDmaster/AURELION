"""
Adversarial Defense Service — attack detection, coherence monitoring,
deceptive signal injection, recovery management.
"""

from typing import Any, Dict, List
from .grid_simulator import simulator


def get_status() -> Dict[str, Any]:
    return {
        "attack": simulator.attack_active,
        "coherence_score": round(simulator.coherence_score, 3),
        "defense_active": simulator.defense_active,
        "desync_strength": round(simulator.desync_strength, 1),
        "attack_intensity": simulator.attack_intensity,
        "nodes_at_risk": simulator.nodes_at_risk,
        "recovery_progress": round(simulator.recovery_progress, 1),
        "attacks_mitigated": simulator.attacks_mitigated,
        "avg_detection_time_ms": round(simulator.avg_detection_time_ms, 1),
        "false_positive_rate": round(simulator.false_positive_rate, 2),
        "recovery_efficiency": round(simulator.recovery_efficiency, 1),
    }


def get_coherence_history() -> List[Dict]:
    return list(simulator.coherence_history)[-200:]


def get_appliance_sync() -> Dict[str, Any]:
    """3×3 appliance synchronisation grid for heatmap."""
    return {
        "grid": simulator.appliance_sync,
        "coherence": round(simulator.coherence_score, 3),
    }


def get_action_log() -> List[Dict]:
    return list(simulator.defense_log)[:50]


def get_desync_strength() -> Dict[str, float]:
    return {"strength_pct": round(simulator.desync_strength, 1)}


def simulate_attack(intensity: int = 2) -> Dict:
    return simulator.trigger_attack(intensity)
