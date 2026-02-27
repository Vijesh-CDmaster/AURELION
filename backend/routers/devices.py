"""Device management endpoints."""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from ..services.grid_simulator import simulator

router = APIRouter(prefix="/api/devices", tags=["devices"])


class BatchControlRequest(BaseModel):
    device_ids: List[str]
    action: str  # force_reduce | force_respond | reset


@router.get("")
async def list_devices(
    type: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
):
    devs = simulator.devices
    if type:
        devs = [d for d in devs if d["type"] == type]
    if zone:
        devs = [d for d in devs if d["zone"] == zone]
    if status:
        devs = [d for d in devs if d["status"] == status]
    # Return without load_history (too large for list)
    return [
        {k: v for k, v in d.items() if k != "load_history"}
        for d in devs[:limit]
    ]


@router.get("/breakdown")
async def breakdown():
    total = len(simulator.devices)
    by_type = {}
    for d in simulator.devices:
        by_type[d["type"]] = by_type.get(d["type"], 0) + 1
    return {k: round(v / total * 100, 1) for k, v in by_type.items()}


@router.get("/{device_id}/history")
async def device_history(device_id: str):
    return list(simulator.device_load_history)[-60:]


@router.get("/load-history")
async def load_history():
    return list(simulator.device_load_history)[-100:]


@router.post("/batch-control")
async def batch_control(req: BatchControlRequest):
    affected = 0
    for dev in simulator.devices:
        if dev["id"] in req.device_ids:
            if req.action == "force_reduce":
                dev["load_w"] = round(dev["load_w"] * 0.5, 1)
            elif req.action == "force_respond":
                dev["status"] = "online"
            elif req.action == "reset":
                dev["status"] = "standby"
            affected += 1
    return {"affected": affected, "action": req.action}
