"""AI Insights endpoints — Claude-powered analysis for every page."""

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.grid_simulator import simulator
from ..services.claude_service import (
    ask_claude,
    SYSTEM_DASHBOARD, SYSTEM_FREQUENCY, SYSTEM_AGENTS, SYSTEM_SOLAR,
    SYSTEM_DEFENSE, SYSTEM_VPP, SYSTEM_SIMULATION, SYSTEM_ANALYTICS,
    SYSTEM_EVENT,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ── Dashboard AI Summary ──────────────────────────────────────────────

@router.post("/dashboard-summary")
async def dashboard_summary():
    s = simulator
    user_msg = (
        f"Current frequency: {s.frequency:.2f}Hz, df/dt: {s.dfdt:.4f}, "
        f"solar irradiance: {s.solar_irradiance:.1f}%, "
        f"active agents: {s.active_agents}, "
        f"attack coherence: {s.coherence_score:.2f}. "
        f"What is the grid status?"
    )
    insight = await ask_claude(SYSTEM_DASHBOARD, user_msg)
    return {"insight": insight}


# ── Frequency df/dt Analysis ─────────────────────────────────────────

@router.post("/frequency-analysis")
async def frequency_analysis():
    s = simulator
    user_msg = (
        f"df/dt is {s.dfdt:.4f} Hz/s. Current frequency: {s.frequency:.2f} Hz. "
        f"Status: {s.freq_status}. "
        f"Should MARL agents activate? Explain in one sentence why or why not."
    )
    insight = await ask_claude(SYSTEM_FREQUENCY, user_msg)
    return {"insight": insight}


# ── Agent Recommendation ─────────────────────────────────────────────

@router.post("/agent-recommendation")
async def agent_recommendation():
    s = simulator
    cluster_data = ", ".join(
        f"{c['cluster_id']}: {c['active']}/{c['total']} active, "
        f"{c['capacity_kw']}kW, status={c['status']}"
        for c in s.agent_clusters
    )
    user_msg = (
        f"Frequency: {s.frequency:.2f}Hz, df/dt: {s.dfdt:.4f}, "
        f"cluster loads: [{cluster_data}]. "
        f"Which clusters should activate and why?"
    )
    insight = await ask_claude(SYSTEM_AGENTS, user_msg)
    return {"insight": insight}


# ── Solar Uncertainty ─────────────────────────────────────────────────

@router.post("/solar-uncertainty")
async def solar_uncertainty():
    s = simulator
    user_msg = (
        f"Solar forecast uncertainty is {s.forecast_uncertainty:.1f}%. "
        f"Current irradiance: {s.solar_irradiance:.1f}%. "
        f"Predicted: {s.predicted_irradiance:.1f}%. "
        f"False calm detected: {s.false_calm}. "
        f"What defensive grid action should be taken in the next 30 seconds?"
    )
    insight = await ask_claude(SYSTEM_SOLAR, user_msg)
    return {"insight": insight}


# ── Attack Analysis ───────────────────────────────────────────────────

@router.post("/attack-analysis")
async def attack_analysis():
    s = simulator
    affected = [t["id"] for t in s.transformers if t["load_pct"] > 75]
    user_msg = (
        f"Attack detected. Coherence score: {s.coherence_score:.2f}/3. "
        f"Affected zones: {', '.join(affected) or 'None'}. "
        f"Desync strength: {s.desync_strength:.1f}%. "
        f"Reward mutation: {'active' if s.reward_mode == 'attack' else 'inactive'}. "
        f"Summarise the attack and defense in 3 sentences."
    )
    insight = await ask_claude(SYSTEM_DEFENSE, user_msg)
    return {"insight": insight}


# ── VPP Optimisation ─────────────────────────────────────────────────

@router.post("/vpp-optimisation")
async def vpp_optimisation():
    s = simulator
    cluster_data = ", ".join(
        f"{c['zone_id']}: {c['members']} members, {c['capacity_kw']}kW, "
        f"V2G={c['v2g_contribution_kw']}kW, {c['status']}"
        for c in s.vpp_clusters
    )
    user_msg = (
        f"Given these transformer loads [{cluster_data}], "
        f"suggest which clusters should merge or split to optimise response time. "
        f"One sentence per suggestion."
    )
    insight = await ask_claude(SYSTEM_VPP, user_msg)
    return {"insight": insight}


# ── Simulation Debrief ────────────────────────────────────────────────

@router.post("/simulation-debrief")
async def simulation_debrief():
    s = simulator
    if not s.simulation_history:
        return {"insight": "No simulation runs yet."}
    last = list(s.simulation_history)[0]
    user_msg = (
        f"Scenario: {last.get('scenario')}. "
        f"Results: latency={last.get('response_latency_ms')}ms, "
        f"max_deviation={last.get('sentinel_max_deviation')}Hz, "
        f"energy_saved={last.get('energy_saved_kwh')}kWh. "
        f"Baseline deviation was {last.get('baseline_max_deviation')}Hz. "
        f"Was the system response adequate? What could be improved?"
    )
    insight = await ask_claude(SYSTEM_SIMULATION, user_msg)
    return {"insight": insight}


# ── Analytics Executive Summary ───────────────────────────────────────

@router.post("/analytics-summary")
async def analytics_summary():
    s = simulator
    user_msg = (
        f"24-hour grid data: avg frequency deviation={s.avg_freq_deviation:.3f}Hz, "
        f"avg response latency={s.avg_response_latency_ms:.1f}ms, "
        f"energy saved={s.total_energy_saved_kwh:.2f}kWh, "
        f"attacks defended={s.attacks_defended}, "
        f"forecast uncertainty={s.forecast_uncertainty:.1f}%. "
        f"Write a 4-sentence executive summary."
    )
    insight = await ask_claude(SYSTEM_ANALYTICS, user_msg)
    return {"insight": insight}


# ── Event Explanation ─────────────────────────────────────────────────

class EventExplainRequest(BaseModel):
    event_id: str


@router.post("/explain-event")
async def explain_event(req: EventExplainRequest):
    event = None
    for e in simulator.events:
        if e["id"] == req.event_id:
            event = e
            break
    if not event:
        return {"insight": "Event not found."}
    user_msg = (
        f"Grid event: ID={event['id']}, Time={event['time']}, "
        f"Type={event['type']}, Severity={event['severity']}, "
        f"Message: {event['message']}. "
        f"Explain what happened in plain English for an engineering report."
    )
    insight = await ask_claude(SYSTEM_EVENT, user_msg)
    return {"insight": insight}
