"""Configuration endpoints."""

import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ..services.grid_simulator import simulator

router = APIRouter(prefix="/api/config", tags=["config"])


class ThresholdsRequest(BaseModel):
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None


class AttackSensitivityRequest(BaseModel):
    coherence_trigger: float


class UncertaintyRequest(BaseModel):
    uncertainty_threshold_pct: float


class ModeRequest(BaseModel):
    mode: str  # live | simulation | demo


@router.get("")
async def get_config():
    return simulator.config


@router.post("/thresholds")
async def set_thresholds(req: ThresholdsRequest):
    if req.warning_threshold is not None:
        simulator.config["frequency"]["warning_threshold"] = req.warning_threshold
    if req.critical_threshold is not None:
        simulator.config["frequency"]["critical_threshold"] = req.critical_threshold
    simulator.save_config()
    return {"ok": True, "config": simulator.config["frequency"]}


@router.post("/attack-sensitivity")
async def set_attack_sensitivity(req: AttackSensitivityRequest):
    simulator.config["attack"]["coherence_trigger"] = req.coherence_trigger
    simulator.save_config()
    return {"ok": True, "trigger": req.coherence_trigger}


@router.post("/uncertainty-threshold")
async def set_uncertainty_threshold(req: UncertaintyRequest):
    simulator.config["forecast"]["uncertainty_escalation_pct"] = req.uncertainty_threshold_pct
    simulator.save_config()
    return {"ok": True, "pct": req.uncertainty_threshold_pct}


@router.post("/mode")
async def set_mode(req: ModeRequest):
    simulator.config["system"]["mode"] = req.mode
    simulator.save_config()
    return {"ok": True, "mode": req.mode}


@router.post("/save")
async def save():
    simulator.save_config()
    return {"ok": True}


@router.post("/reset")
async def reset():
    simulator.config = {
        "frequency": {"warning_threshold": 49.8, "critical_threshold": 49.5,
                       "normal_band": [49.8, 50.2]},
        "attack": {"coherence_trigger": 2.0, "sensitivity": "medium"},
        "forecast": {"uncertainty_escalation_pct": 15.0, "horizon_seconds": 30},
        "system": {"mode": "simulation", "tick_interval_ms": 1000},
        "marl": {"learning_rate": 0.001, "discount_factor": 0.95,
                 "stability_weight": 0.5, "comfort_weight": 0.3,
                 "efficiency_weight": 0.2},
    }
    simulator.save_config()
    return {"ok": True, "config": simulator.config}
