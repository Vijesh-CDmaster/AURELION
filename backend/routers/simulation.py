"""Simulation & testing endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from ..services import simulation_service

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class StartRequest(BaseModel):
    scenario: str
    intensity: float = 0.5
    duration: int = 30


@router.get("/scenarios")
async def scenarios():
    return simulation_service.list_scenarios()


@router.post("/start")
async def start(req: StartRequest):
    return simulation_service.start_scenario(req.scenario, req.intensity, req.duration)


@router.get("/state")
async def state():
    return simulation_service.get_simulation_state()


@router.get("/history")
async def history():
    return simulation_service.get_history()


@router.get("/result/{run_id}")
async def result(run_id: str):
    return simulation_service.get_result(run_id)
