"""
Claude AI Service — Wrapper for Anthropic Claude API.
All AI-powered features across every page call through this service.
"""

import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
_client = None


def _get_client():
    global _client
    if _client is None:
        try:
            import anthropic
            _client = anthropic.AsyncAnthropic(api_key=_api_key)
        except Exception:
            _client = None
    return _client


async def ask_claude(system_prompt: str, user_message: str,
                     max_tokens: int = 1024) -> str:
    """Send a prompt to Claude and return the text response.
    Uses AsyncAnthropic to avoid blocking the event loop.
    Gracefully returns a fallback message if the API key is missing or the
    call fails."""
    if not _api_key or _api_key.startswith("your_"):
        return ("[AI Unavailable] Set ANTHROPIC_API_KEY in backend/.env "
                "to enable Claude-powered insights.")

    client = _get_client()
    if client is None:
        return "[AI Error] Could not initialise Anthropic client."

    try:
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return message.content[0].text
    except Exception as exc:
        return f"[AI Error] {exc}"


# ── Pre-built prompt templates for every page ─────────────────────────

SYSTEM_DASHBOARD = (
    "You are a grid stability AI. Analyse sensor data and give a 2-sentence "
    "operational summary for a grid engineer. Be concise and actionable."
)

SYSTEM_FREQUENCY = (
    "You are a grid frequency analyst. Given df/dt data interpret the rate "
    "of change and recommend whether MARL agents should activate. One sentence."
)

SYSTEM_AGENTS = (
    "You are a MARL coordinator for a virtual power plant. Given grid state, "
    "recommend which transformer clusters should respond and at what intensity. "
    "Be concise — one sentence per cluster recommendation."
)

SYSTEM_SOLAR = (
    "You are a solar forecast uncertainty analyst. When forecast uncertainty is "
    "high, explain what defensive grid action should be taken in the next 30 "
    "seconds. Be specific and concise."
)

SYSTEM_DEFENSE = (
    "You are a grid cybersecurity AI. Analyse demand-side synchronisation "
    "attacks and explain what is happening and what defense has been deployed. "
    "Summarise in 3 sentences."
)

SYSTEM_VPP = (
    "You are a virtual power plant optimiser. Given transformer loads, suggest "
    "which clusters should merge or split to optimise response time. "
    "One sentence per suggestion."
)

SYSTEM_SIMULATION = (
    "You are a grid stability evaluator. Analyse simulation results and assess "
    "whether the system response was adequate, and what could be improved. "
    "3 sentences maximum."
)

SYSTEM_ANALYTICS = (
    "You are a grid analytics AI. Write a 4-sentence executive summary covering "
    "stability performance, energy savings, security events, and one "
    "recommendation for improvement."
)

SYSTEM_EVENT = (
    "You are a grid event explainer. Given a grid event record, explain what "
    "happened in plain English suitable for an engineering report. 2 sentences."
)
