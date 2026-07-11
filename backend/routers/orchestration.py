"""Orchestration router — HTTP + WebSocket endpoints for multi-agent mode.

Phase 13: Agent Orchestration & Multi-Agent Mode.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from auth.dependencies import get_current_user_id
from services.agent_orchestrator import AgentOrchestrator
from services.context_builder import build_context

logger = logging.getLogger(__name__)

router = APIRouter()
orchestrator = AgentOrchestrator()


class OrchestrateRequest(BaseModel):
    skill: str = "portfolio_review"


@router.post("/run-all")
async def run_all_agents(
    body: OrchestrateRequest = OrchestrateRequest(),
    user_id: str = Depends(get_current_user_id),
):
    """Run all 3 agents concurrently. Returns aggregated results."""
    context = await build_context(user_id)
    result = await orchestrator.run_all(user_id, context)
    return result


@router.get("/health")
async def orchestration_health(user_id: str = Depends(get_current_user_id)):
    """Health check for all agents."""
    return await orchestrator.health_check()


@router.websocket("/stream")
async def agent_stream(websocket: WebSocket):
    """WebSocket endpoint: stream agent progress/results as they complete.

    Client sends: {"user_id": "...", "skill": "portfolio_review"}
    Server streams: {"type": "agent_start", "agent": "investment"}, 
                    {"type": "agent_done", "agent": "investment", "result": {...}},
                    {"type": "agent_error", "agent": "debt", "error": "..."},
                    {"type": "cross_agent", "data": {...}},
                    {"type": "done"}
    """
    await websocket.accept()

    try:
        data = await websocket.receive_json()
        user_id = data.get("user_id", "anonymous")
        skill = data.get("skill", "portfolio_review")
    except (json.JSONDecodeError, KeyError):
        await websocket.send_json({"type": "error", "message": "Invalid handshake"})
        await websocket.close()
        return

    context = await build_context(user_id)
    agent_types = ["investment", "debt", "retirement"]
    skill_map = {
        "investment": "portfolio_review",
        "debt": "avalanche_analysis",
        "retirement": "calculate_readiness",
    }

    async def run_and_stream(agent_type: str):
        await websocket.send_json({"type": "agent_start", "agent": agent_type})
        try:
            agent = getattr(orchestrator, f"{agent_type}_agent")
            skill_method = getattr(agent, skill_map.get(agent_type, "generate"), agent.generate)
            result = await asyncio.wait_for(
                skill_method(user_id=user_id, context=context),
                timeout=120,
            )
            await websocket.send_json({"type": "agent_done", "agent": agent_type, "result": result})
            return (agent_type, True, result, None)
        except asyncio.TimeoutError:
            await websocket.send_json({"type": "agent_error", "agent": agent_type, "error": "Timeout"})
            return (agent_type, False, None, "Timeout")
        except Exception as exc:
            await websocket.send_json({"type": "agent_error", "agent": agent_type, "error": str(exc)})
            return (agent_type, False, None, str(exc))

    tasks = [run_and_stream(at) for at in agent_types]
    results = await asyncio.gather(*tasks)

    # Cross-agent resolution
    inv = next((r for r in results if r[0] == "investment" and r[1]), None)
    debt = next((r for r in results if r[0] == "debt" and r[1]), None)
    if inv and debt:
        debt_interest = (debt[2] or {}).get("highest_interest_rate", 0)
        expected_return = (inv[2] or {}).get("expected_return", 0.07)
        if debt_interest > expected_return + 0.02:
            resolution = "pay_debt"
            msg = f"High-interest debt ({debt_interest:.0%}) beats expected return ({expected_return:.0%}). Pay debt first."
        elif debt_interest > expected_return:
            resolution = "split"
            msg = f"Debt interest ({debt_interest:.0%}) near expected return ({expected_return:.0%}). Split surplus."
        else:
            resolution = "invest"
            msg = f"Expected return ({expected_return:.0%}) beats debt interest ({debt_interest:.0%}). Invest."

        await websocket.send_json({
            "type": "cross_agent",
            "data": {
                "conflicts": [{
                    "category": "debt_vs_invest",
                    "resolution": resolution,
                    "recommendation": msg,
                }]
            }
        })

    await websocket.send_json({
        "type": "done",
        "summary": {
            "total": len(results),
            "succeeded": sum(1 for r in results if r[1]),
            "failed": sum(1 for r in results if not r[1]),
        }
    })

    try:
        await asyncio.sleep(0.5)
        await websocket.close()
    except Exception:
        pass