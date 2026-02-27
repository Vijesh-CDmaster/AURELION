"""
MARL Agent Service — business logic for multi-agent reinforcement learning.
"""

from typing import Any, Dict, List
from .grid_simulator import simulator


def get_grid_status() -> List[Dict[str, Any]]:
    """Return per-cluster agent grid status (100 households represented)."""
    result = []
    for c in simulator.agent_clusters:
        result.append({
            "cluster_id": c["cluster_id"],
            "transformer_id": c["transformer_id"],
            "name": c["name"],
            "total": c["total"],
            "active": c["active"],
            "idle": c["idle"],
            "responding": c["responding"],
            "capacity_kw": c["capacity_kw"],
            "status": c["status"],
        })
    return result


def get_clusters() -> List[Dict[str, Any]]:
    """Transformer cluster view."""
    return [
        {
            "zone": t["id"],
            "name": t["name"],
            "agents": c["total"],
            "capacity_kw": c["capacity_kw"],
            "responding": c["responding"],
            "status": c["status"],
        }
        for t, c in zip(simulator.transformers, simulator.agent_clusters)
    ]


def get_inertia() -> Dict[str, Any]:
    return {
        "virtual_inertia_pct": simulator.virtual_inertia,
        "responding_total": sum(c["responding"] for c in simulator.agent_clusters),
        "agent_total": sum(c["total"] for c in simulator.agent_clusters),
    }


def get_reward_state() -> Dict[str, Any]:
    return {
        "mode": simulator.reward_mode,
        "weights": simulator.reward_weights,
        "cumulative": round(simulator.marl_cumulative_reward, 2),
    }


def get_response_log() -> List[Dict]:
    return list(simulator.agent_response_timeline)[:50]


def override_cluster(cluster_id: str, action: str) -> Dict:
    """Manual override: force_activate | force_idle | reset."""
    for c in simulator.agent_clusters:
        if c["cluster_id"] == cluster_id:
            if action == "force_activate":
                c["responding"] = c["total"]
                c["active"] = c["total"]
                c["idle"] = 0
                c["status"] = "responding"
            elif action == "force_idle":
                c["responding"] = 0
                c["active"] = 0
                c["idle"] = c["total"]
                c["status"] = "idle"
            elif action == "reset":
                c["responding"] = 0
                c["active"] = c["total"] // 2
                c["idle"] = c["total"] - c["active"]
                c["status"] = "idle"
            return {"ok": True, "cluster_id": cluster_id, "action": action}
    return {"ok": False, "error": "Cluster not found"}
