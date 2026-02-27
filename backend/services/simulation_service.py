"""
Simulation Service — scenario testing engine.
Runs controlled scenarios and captures baseline vs. sentinel comparison data.
"""

from typing import Any, Dict, List
from .grid_simulator import simulator


SCENARIOS = {
    "cloud_shading": {
        "label": "Cloud Shading",
        "description": "Sudden solar irradiance drop simulating fast-moving clouds.",
    },
    "mass_ev": {
        "label": "Mass EV Charging",
        "description": "Large-scale EV fleet starts charging simultaneously.",
    },
    "attack": {
        "label": "Adversarial Attack",
        "description": "Coordinated demand-side synchronisation attack.",
    },
    "high_renewable": {
        "label": "High Renewable Penetration",
        "description": "Excess renewable generation pushing frequency up.",
    },
}


def list_scenarios() -> List[Dict[str, Any]]:
    return [{"id": k, **v} for k, v in SCENARIOS.items()]


def start_scenario(scenario: str, intensity: float = 0.5,
                   duration: int = 30) -> Dict[str, Any]:
    if scenario not in SCENARIOS:
        return {"error": f"Unknown scenario: {scenario}"}
    simulator.start_simulation(scenario, intensity, duration)
    return {
        "status": "started",
        "scenario": scenario,
        "intensity": intensity,
        "duration": duration,
    }


def get_simulation_state() -> Dict[str, Any]:
    return {
        "running": simulator.simulation_running,
        "scenario": simulator.simulation_scenario,
        "tick": simulator.simulation_tick,
        "duration": simulator.simulation_duration,
        "baseline": list(simulator.simulation_baseline),
        "sentinel": list(simulator.simulation_sentinel),
    }


def get_history() -> List[Dict]:
    return list(simulator.simulation_history)[:20]


def get_result(run_id: str) -> Dict:
    for r in simulator.simulation_history:
        if r["id"] == run_id:
            return r
    return {"error": "Run not found"}
