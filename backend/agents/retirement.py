"""Retirement Agent — savings projections, withdrawal strategies, account optimization.

Inherits BaseAgent, uses Instructor + Ollama for structured output
conforming to RetirementRecommendation schema.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from backend.agents.base import BaseAgent
from backend.agents.prompts import RETIREMENT_PROMPT, RETIREMENT_SKILLS
from backend.services.structured_output import RetirementRecommendation


class RetirementAgent(BaseAgent):
    """Retirement planning strategist (C.O.R.E. — Context, Observe, Reason, Execute)."""

    agent_type = "retirement"

    @property
    def output_schema(self) -> type[BaseModel]:
        return RetirementRecommendation

    def build_system_prompt(self) -> str:
        prompt = RETIREMENT_PROMPT
        skills_text = "\n".join(f"  • {k}: {v}" for k, v in RETIREMENT_SKILLS.items())
        prompt += f"\n\nAVAILABLE SKILLS:\n{skills_text}"
        return prompt

    # ── Skill methods ──────────────────────────────────────
    async def projection(self, context: dict[str, Any]) -> dict[str, Any]:
        """Run retirement savings projection."""
        return await self.generate(
            user_input="Run a retirement savings projection using the provided "
            "financial data. Assume 7% nominal annual returns, 3% inflation. "
            "Project savings growth, estimate needed savings for desired retirement "
            "spending, and calculate the funding gap.",
            context=context,
        )

    async def catch_up_plan(self, context: dict[str, Any]) -> dict[str, Any]:
        """Generate catch-up contribution strategy for late starters."""
        return await self.generate(
            user_input="Generate a catch-up contribution strategy. Calculate how "
            "much additional monthly savings are needed to close the retirement gap. "
            "Include 401k catch-up limits for age 50+ if applicable.",
            context=context,
        )

    async def withdrawal_strategy(self, context: dict[str, Any]) -> dict[str, Any]:
        """Recommend safe withdrawal rate and account drawdown order."""
        return await self.generate(
            user_input="Recommend a safe withdrawal strategy. Determine optimal "
            "withdrawal rate (consider 4% rule and dynamic alternatives), "
            "suggest account drawdown order (taxable → tax-deferred → tax-free), "
            "and project portfolio longevity.",
            context=context,
        )

    async def social_security(self, context: dict[str, Any]) -> dict[str, Any]:
        """Analyze optimal Social Security claiming age."""
        return await self.generate(
            user_input="Analyze the optimal Social Security claiming age. Compare "
            "claiming at 62, full retirement age, and 70. Calculate breakeven age "
            "and recommend strategy based on health, life expectancy, and other assets.",
            context=context,
        )

    async def account_optimization(self, context: dict[str, Any]) -> dict[str, Any]:
        """Recommend 401k/IRA contribution allocations."""
        return await self.generate(
            user_input="Optimize retirement account contributions. Recommend "
            "Roth vs Traditional split based on current and projected tax brackets, "
            "prioritize accounts (401k match → IRA → 401k remainder), and calculate "
            "optimal contribution amounts.",
            context=context,
        )