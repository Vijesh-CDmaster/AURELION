"""Adversarial defense endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from ..services import defense_service

router = APIRouter(prefix="/api/defense", tags=["defense"])


class AttackRequest(BaseModel):
    intensity: int = 2


@router.get("/status")
async def status():
    return defense_service.get_status()


@router.get("/coherence-history")
async def coherence_history():
    return defense_service.get_coherence_history()


@router.get("/appliance-sync")
async def appliance_sync():
    return defense_service.get_appliance_sync()


@router.get("/action-log")
async def action_log():
    return defense_service.get_action_log()


@router.get("/desync-strength")
async def desync_strength():
    return defense_service.get_desync_strength()


@router.post("/simulate-attack")
async def simulate_attack(req: AttackRequest):
    return defense_service.simulate_attack(req.intensity)
