"""Solar forecast endpoints."""

from fastapi import APIRouter
from ..services import forecast_service

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/live")
async def live():
    return forecast_service.get_live_solar()


@router.get("/shadow-velocity")
async def shadow_velocity():
    return forecast_service.get_shadow_velocity()


@router.get("/transformer-risk")
async def transformer_risk():
    return forecast_service.get_transformer_risk()


@router.get("/accuracy-history")
async def accuracy_history():
    return forecast_service.get_accuracy_history()


@router.get("/history")
async def history():
    return forecast_service.get_solar_history()
