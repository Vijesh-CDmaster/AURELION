"""Quick stats / summary endpoint."""

from fastapi import APIRouter
from ..services.grid_simulator import simulator

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/summary")
async def summary():
    return {
        "response_latency_ms": simulator.avg_response_latency_ms,
        "energy_saved_kwh": round(simulator.total_energy_saved_kwh, 2),
        "agents_active": simulator.active_agents,
        "attack_status": "active" if simulator.attack_active else "none",
        "frequency": round(simulator.frequency, 3),
        "dfdt": simulator.dfdt,
        "freq_status": simulator.freq_status,
        "solar_irradiance": simulator.solar_irradiance,
        "virtual_inertia": simulator.virtual_inertia,
        "online_devices": sum(1 for d in simulator.devices if d["status"] in ("online", "standby")),
        "device_count": len(simulator.devices),
        "vpp_capacity_kw": simulator.total_vpp_capacity,
    }
