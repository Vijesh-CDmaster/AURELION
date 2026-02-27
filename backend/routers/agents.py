"""MARL agent endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from ..services import marl_service

router = APIRouter(prefix="/api/agents", tags=["agents"])


class OverrideRequest(BaseModel):
    cluster_id: str
    action: str  # force_activate | force_idle | reset


@router.get("/grid-status")
async def grid_status():
    return marl_service.get_grid_status()


@router.get("/clusters")
async def clusters():
    return marl_service.get_clusters()


@router.get("/inertia")
async def inertia():
    return marl_service.get_inertia()


@router.get("/reward-state")
async def reward_state():
    return marl_service.get_reward_state()


@router.get("/response-log")
async def response_log():
    return marl_service.get_response_log()


@router.post("/override")
async def override(req: OverrideRequest):
    return marl_service.override_cluster(req.cluster_id, req.action)
