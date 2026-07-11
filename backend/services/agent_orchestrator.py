"""Multi-agent orchestrator — runs Investment, Debt, Retirement concurrently.

Phase 13: Agent Orchestration & Multi-Agent Mode.
"""

import asyncio
import inspect
import logging

from agents import InvestmentAgent, DebtAgent, RetirementAgent

logger = logging.getLogger(__name__)

AGENT_TIMEOUT = 120  # seconds per agent
MAX_CONCURRENT = 3


class AgentRunResult:
    """Single agent run result."""

    def __init__(self, agent_type: str, success: bool, result: dict | None = None, error: str | None = None):
        self.agent_type = agent_type
        self.success = success
        self.result = result or {}
        self.error = error


class AgentOrchestrator:
    """Run all 3 agents concurrently with crash isolation, timeout, cross-agent resolution."""

    def __init__(self):
        self.investment_agent = InvestmentAgent()
        self.debt_agent = DebtAgent()
        self.retirement_agent = RetirementAgent()

    async def _run_agent(self, agent_type: str, user_id: str, context: dict, skill: str = "portfolio_review") -> AgentRunResult:
        """Run one agent with crash isolation."""
        try:
            agent = getattr(self, f"{agent_type}_agent")
            skill_method = getattr(agent, skill, None)
            if skill_method is None:
                skill_method = agent.generate

            result = await asyncio.wait_for(
                skill_method(user_id=user_id, context=context),
                timeout=AGENT_TIMEOUT,
            )
            return AgentRunResult(agent_type=agent_type, success=True, result=result)
        except asyncio.TimeoutError:
            logger.warning("Agent %s timed out after %ds", agent_type, AGENT_TIMEOUT)
            return AgentRunResult(agent_type=agent_type, success=False, error=f"Timeout after {AGENT_TIMEOUT}s")
        except Exception as exc:
            logger.exception("Agent %s crashed", agent_type)
            return AgentRunResult(agent_type=agent_type, success=False, error=str(exc))

    async def run_all(self, user_id: str, context: dict) -> dict:
        """Run all agents concurrently. Returns aggregated results."""
        tasks = []
        agent_types = ["investment", "debt", "retirement"]

        skill_map = {
            "investment": "portfolio_review",
            "debt": "avalanche_analysis",
            "retirement": "calculate_readiness",
        }

        for at in agent_types:
            tasks.append(self._run_agent(at, user_id, context, skill_map.get(at, "generate")))

        results: list[AgentRunResult] = await asyncio.gather(*tasks, return_exceptions=False)

        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        cross_agent = self._resolve_cross_agent(results, context)

        return {
            "results": {r.agent_type: r.result for r in successful},
            "failed": [{"agent_type": f.agent_type, "error": f.error} for f in failed],
            "cross_agent": cross_agent,
            "summary": {
                "total_agents": len(agent_types),
                "succeeded": len(successful),
                "failed": len(failed),
            },
        }

    def _resolve_cross_agent(self, results: list[AgentRunResult], context: dict) -> dict | None:
        """Resolve debt-vs-invest dilemma. Ponytail: one simple rule, no ML."""
        inv = next((r for r in results if r.agent_type == "investment" and r.success), None)
        debt = next((r for r in results if r.agent_type == "debt" and r.success), None)
        if not inv or not debt:
            return None

        inv_result = inv.result
        debt_result = debt.result
        cross_resolutions = []

        # Rule: if debt_interest > expected_return + 2%, pay debt first
        debt_interest = debt_result.get("highest_interest_rate", 0)
        expected_return = inv_result.get("expected_return", 0.07)

        if debt_interest > expected_return + 0.02:
            resolution = "pay_debt"
            recommendation = f"High-interest debt ({debt_interest:.0%}) exceeds expected market return ({expected_return:.0%}). Prioritize debt payoff."
        elif debt_interest > expected_return:
            resolution = "split"
            recommendation = f"Debt interest ({debt_interest:.0%}) near expected return ({expected_return:.0%}). Split surplus: half to debt, half to investing."
        else:
            resolution = "invest"
            recommendation = f"Expected market return ({expected_return:.0%}) exceeds debt interest ({debt_interest:.0%}). Prioritize investing."

        cross_resolutions.append({
            "category": "debt_vs_invest",
            "resolution": resolution,
            "recommendation": recommendation,
        })

        return {"conflicts": cross_resolutions}

    async def health_check(self) -> dict:
        """Check all agents are healthy."""
        checks = {}
        for at in ["investment", "debt", "retirement"]:
            agent = getattr(self, f"{at}_agent")
            try:
                if inspect.iscoroutinefunction(agent.health_check):
                    checks[at] = await agent.health_check()
                else:
                    checks[at] = agent.health_check()
            except Exception as exc:
                checks[at] = {"ok": False, "error": str(exc)}
        return checks