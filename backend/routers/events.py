"""Event log endpoints."""

from fastapi import APIRouter, Query
from typing import Optional
from ..services.grid_simulator import simulator

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("")
async def list_events(
    type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    limit: int = Query(50, le=500),
):
    events = list(simulator.events)
    if type:
        events = [e for e in events if e["type"] == type]
    if severity:
        events = [e for e in events if e["severity"] == severity]
    if zone:
        events = [e for e in events if e.get("zone") == zone]
    return events[:limit]


@router.get("/recent")
async def recent(limit: int = 10):
    return list(simulator.events)[:limit]


@router.get("/{event_id}")
async def get_event(event_id: str):
    for e in simulator.events:
        if e["id"] == event_id:
            return e
    return {"error": "Event not found"}


@router.post("/{event_id}/resolve")
async def resolve_event(event_id: str):
    for e in simulator.events:
        if e["id"] == event_id:
            e["status"] = "resolved"
            return {"ok": True, "id": event_id}
    return {"ok": False, "error": "Event not found"}
