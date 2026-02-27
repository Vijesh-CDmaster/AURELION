"""Frequency monitoring endpoints."""

from fastapi import APIRouter
from ..services.grid_simulator import simulator

router = APIRouter(prefix="/api/frequency", tags=["frequency"])


@router.get("/live")
async def live():
    return simulator.get_frequency_snapshot()


@router.get("/per-transformer")
async def per_transformer():
    return simulator.transformers


@router.get("/history")
async def history(limit: int = 200):
    return list(simulator.freq_history)[-limit:]


@router.get("/detail")
async def detail():
    """Full frequency detail for the monitor page."""
    return {
        "hz": round(simulator.frequency, 3),
        "dfdt": simulator.dfdt,
        "status": simulator.freq_status,
        "history": list(simulator.freq_history)[-60:],
        "transformers": simulator.transformers,
    }
