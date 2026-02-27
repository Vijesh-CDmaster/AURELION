"""
Grid-Entropy Sentinel — FastAPI Backend
========================================
Central API server with REST endpoints, WebSocket real-time streams,
and Claude AI integration.

Run:  uvicorn backend.main:app --reload --port 8000
"""

import asyncio
import json
from contextlib import asynccontextmanager
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .services.grid_simulator import simulator
from .routers import (
    frequency,
    forecast,
    defense,
    agents,
    vpp,
    devices,
    simulation,
    analytics,
    config_router,
    events,
    auth,
    ai_insights,
    stats,
    prediction,
)

# ──────────────────────────────────────────────────────────────────────
# Lifespan — start simulator background loop
# ──────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the grid simulator tick loop on startup, cancel on shutdown."""
    task = asyncio.create_task(simulator.run())
    # Also start a broadcast loop
    broadcast_task = asyncio.create_task(_broadcast_loop())
    print("✅ Grid simulator started — ticking every 1s")
    yield
    task.cancel()
    broadcast_task.cancel()
    print("🛑 Grid simulator stopped")


app = FastAPI(
    title="Grid-Entropy Sentinel API",
    version="2.0.0",
    description="FastAPI backend for Grid-Entropy Sentinel smart grid dashboard",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────────────────────────────
# CORS — allow Next.js frontend
# ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9002", "http://localhost:3000", "http://127.0.0.1:9002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────
# Mount routers
# ──────────────────────────────────────────────────────────────────────

app.include_router(frequency.router)
app.include_router(forecast.router)
app.include_router(defense.router)
app.include_router(agents.router)
app.include_router(vpp.router)
app.include_router(devices.router)
app.include_router(simulation.router)
app.include_router(analytics.router)
app.include_router(config_router.router)
app.include_router(events.router)
app.include_router(auth.router)
app.include_router(ai_insights.router)
app.include_router(stats.router)
app.include_router(prediction.router)

# ──────────────────────────────────────────────────────────────────────
# WebSocket management
# ──────────────────────────────────────────────────────────────────────

# Channel → set of connected WebSocket clients
_ws_clients: dict[str, Set[WebSocket]] = {
    "grid": set(),
    "frequency": set(),
    "solar": set(),
    "coherence": set(),
    "simulation": set(),
}


async def _broadcast_loop():
    """Push data to all connected WebSocket clients every tick."""
    while True:
        await asyncio.sleep(simulator.TICK_INTERVAL)
        try:
            # Full state to /ws/grid subscribers
            if _ws_clients["grid"]:
                state = simulator.get_state()
                payload = json.dumps(state, default=str)
                dead = set()
                for ws in _ws_clients["grid"]:
                    try:
                        await ws.send_text(payload)
                    except Exception:
                        dead.add(ws)
                _ws_clients["grid"] -= dead

            # Frequency channel
            if _ws_clients["frequency"]:
                data = json.dumps(simulator.get_frequency_snapshot())
                dead = set()
                for ws in _ws_clients["frequency"]:
                    try:
                        await ws.send_text(data)
                    except Exception:
                        dead.add(ws)
                _ws_clients["frequency"] -= dead

            # Solar channel
            if _ws_clients["solar"]:
                data = json.dumps(simulator.get_solar_snapshot())
                dead = set()
                for ws in _ws_clients["solar"]:
                    try:
                        await ws.send_text(data)
                    except Exception:
                        dead.add(ws)
                _ws_clients["solar"] -= dead

            # Coherence channel
            if _ws_clients["coherence"]:
                data = json.dumps(simulator.get_coherence_snapshot())
                dead = set()
                for ws in _ws_clients["coherence"]:
                    try:
                        await ws.send_text(data)
                    except Exception:
                        dead.add(ws)
                _ws_clients["coherence"] -= dead

            # Simulation channel
            if _ws_clients["simulation"] and simulator.simulation_running:
                data = json.dumps({
                    "running": True,
                    "tick": simulator.simulation_tick,
                    "baseline": list(simulator.simulation_baseline)[-1:],
                    "sentinel": list(simulator.simulation_sentinel)[-1:],
                })
                dead = set()
                for ws in _ws_clients["simulation"]:
                    try:
                        await ws.send_text(data)
                    except Exception:
                        dead.add(ws)
                _ws_clients["simulation"] -= dead
        except Exception as e:
            print(f"Broadcast error: {e}")


# ──────────────────────────────────────────────────────────────────────
# WebSocket endpoints
# ──────────────────────────────────────────────────────────────────────

@app.websocket("/ws/grid")
async def ws_grid(ws: WebSocket):
    await ws.accept()
    _ws_clients["grid"].add(ws)
    try:
        while True:
            await ws.receive_text()  # keep-alive; ignore client messages
    except WebSocketDisconnect:
        _ws_clients["grid"].discard(ws)


@app.websocket("/ws/frequency")
async def ws_frequency(ws: WebSocket):
    await ws.accept()
    _ws_clients["frequency"].add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        _ws_clients["frequency"].discard(ws)


@app.websocket("/ws/solar")
async def ws_solar(ws: WebSocket):
    await ws.accept()
    _ws_clients["solar"].add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        _ws_clients["solar"].discard(ws)


@app.websocket("/ws/coherence")
async def ws_coherence(ws: WebSocket):
    await ws.accept()
    _ws_clients["coherence"].add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        _ws_clients["coherence"].discard(ws)


@app.websocket("/ws/simulation")
async def ws_simulation(ws: WebSocket):
    await ws.accept()
    _ws_clients["simulation"].add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        _ws_clients["simulation"].discard(ws)


# ──────────────────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "Grid-Entropy Sentinel API",
        "version": "2.0.0",
        "status": "running",
        "tick": simulator.tick_count,
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "tick": simulator.tick_count}
