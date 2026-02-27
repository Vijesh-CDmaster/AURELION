"""Virtual Power Plant endpoints."""

from fastapi import APIRouter
from ..services.grid_simulator import simulator

router = APIRouter(prefix="/api/vpp", tags=["vpp"])


@router.get("/transformer-map")
async def transformer_map():
    return simulator.transformers


@router.get("/clusters")
async def clusters():
    return simulator.vpp_clusters


@router.get("/formation-log")
async def formation_log():
    return list(simulator.vpp_formation_log)[:30]


@router.get("/capacity")
async def capacity():
    return {
        "total_capacity_kw": simulator.total_vpp_capacity,
        "reserved_buffer_kw": simulator.reserved_buffer_kw,
        "clusters": [
            {"zone": c["zone_id"], "name": c["name"], "capacity_kw": c["capacity_kw"],
             "v2g_kw": c["v2g_contribution_kw"], "status": c["status"]}
            for c in simulator.vpp_clusters
        ],
    }


@router.get("/capacity-history")
async def capacity_history():
    return list(simulator.vpp_capacity_history)[-100:]
