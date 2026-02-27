"""
Solar Forecast Service — irradiance prediction, uncertainty, false-calm
detection, shadow velocity tracking.
"""

from typing import Any, Dict, List
from .grid_simulator import simulator


def get_live_solar() -> Dict[str, Any]:
    return {
        "actual_irr": simulator.solar_irradiance,
        "predicted_irr": simulator.predicted_irradiance,
        "confidence": simulator.forecast_confidence,
        "uncertainty": simulator.forecast_uncertainty,
        "false_calm": simulator.false_calm,
        "timestamp": simulator.solar_history[-1]["time"] if simulator.solar_history else "",
    }


def get_shadow_velocity() -> Dict[str, Any]:
    return {
        "direction_deg": round(simulator.shadow_direction, 1),
        "speed_pct_per_sec": round(simulator.shadow_speed, 2),
    }


def get_transformer_risk() -> List[Dict[str, Any]]:
    """Per-transformer solar risk assessment."""
    results = []
    for t in simulator.transformers:
        # Simulate per-zone irradiance offset
        zone_irr = max(0, simulator.solar_irradiance + (hash(t["id"]) % 10 - 5))
        pred_drop = max(0, simulator.solar_irradiance - simulator.predicted_irradiance)
        risk = "low"
        if pred_drop > 15:
            risk = "high"
        elif pred_drop > 5:
            risk = "medium"
        results.append({
            "transformer_id": t["id"],
            "name": t["name"],
            "irradiance_pct": round(zone_irr, 1),
            "predicted_drop": round(pred_drop, 1),
            "risk": risk,
        })
    return results


def get_accuracy_history() -> List[Dict]:
    return list(simulator.forecast_accuracy_history)[-100:]


def get_solar_history() -> List[Dict]:
    return list(simulator.solar_history)[-200:]
