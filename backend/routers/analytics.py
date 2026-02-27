"""Analytics & reports endpoints."""

from fastapi import APIRouter, Query
from ..services.grid_simulator import simulator

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/kpis")
async def kpis(range: str = Query("24h")):
    return {
        "avg_freq_deviation": simulator.avg_freq_deviation,
        "avg_response_latency_ms": simulator.avg_response_latency_ms,
        "total_energy_saved_kwh": round(simulator.total_energy_saved_kwh, 2),
        "attacks_defended": simulator.attacks_defended,
        "range": range,
    }


@router.get("/frequency-trend")
async def frequency_trend():
    return list(simulator.performance_history)[-200:]


@router.get("/energy-savings")
async def energy_savings():
    return list(simulator.hourly_energy_savings)[-168:]


@router.get("/attack-frequency")
async def attack_frequency():
    return list(simulator.attack_frequency_data)


@router.get("/forecast-accuracy")
async def forecast_accuracy():
    return list(simulator.forecast_accuracy_history)[-200:]


@router.get("/marl-rewards")
async def marl_rewards():
    return list(simulator.marl_reward_history)[-200:]


@router.get("/report")
async def report():
    """Full analytics report data."""
    return {
        "kpis": {
            "avg_freq_deviation": simulator.avg_freq_deviation,
            "avg_response_latency_ms": simulator.avg_response_latency_ms,
            "total_energy_saved_kwh": round(simulator.total_energy_saved_kwh, 2),
            "attacks_defended": simulator.attacks_defended,
        },
        "hourly_energy": list(simulator.hourly_energy_savings)[-24:],
        "attack_data": list(simulator.attack_frequency_data),
        "forecast_accuracy": list(simulator.forecast_accuracy_history)[-48:],
        "marl_rewards": list(simulator.marl_reward_history)[-48:],
        "performance": list(simulator.performance_history)[-48:],
    }
