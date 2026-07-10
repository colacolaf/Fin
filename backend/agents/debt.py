"""Debt Agent — payoff strategy optimization, refinancing analysis.

Inherits BaseAgent, uses Instructor + Ollama for structured output
conforming to DebtRecommendation schema.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from backend.agents.base import BaseAgent
from backend.agents.prompts import DEBT_PROMPT, DEBT_SKILLS
from backend.services.structured_output import DebtRecommendation


class DebtAgent(BaseAgent):
    """Debt elimination strategist (C.O.R.E. — Context, Observe, Reason, Execute)."""

    agent_type = "debt"

    @property
    def output_schema(self) -> type[BaseModel]:
        return DebtRecommendation

    def build_system_prompt(self) -> str:
        prompt = DEBT_PROMPT
        skills_text = "\n".join(f"  • {k}: {v}" for k, v in DEBT_SKILLS.items())
        prompt += f"\n\nAVAILABLE SKILLS:\n{skills_text}"
        return prompt

    # ── Skill methods ──────────────────────────────────────
    async def avalanche_analysis(self, context: dict[str, Any]) -> dict[str, Any]:
        """Calculate payoff timelines using avalanche method."""
        return await self.generate(
            user_input="Calculate the avalanche payoff timeline. Sort debts by "
            "interest rate (highest first), allocate all extra cash flow to "
            "the highest-rate debt. Show monthly breakdown and total interest saved.",
            context=context,
        )

    async def snowball_analysis(self, context: dict[str, Any]) -> dict[str, Any]:
        """Calculate payoff timelines using snowball method."""
        return await self.generate(
            user_input="Calculate the snowball payoff timeline. Sort debts by "
            "balance (smallest first), pay minimums on all others, allocate "
            "extra cash flow to the smallest. Show monthly breakdown and "
            "total interest cost compared to avalanche.",
            context=context,
        )

    async def refinance_check(self, context: dict[str, Any]) -> dict[str, Any]:
        """Analyze refinancing or consolidation opportunities."""
        return await self.generate(
            user_input="Analyze whether refinancing or debt consolidation would "
            "save money. Consider current interest rates, fees, and credit score "
            "impact. Calculate breakeven point for each option.",
            context=context,
        )

    async def dti_analysis(self, context: dict[str, Any]) -> dict[str, Any]:
        """Compute debt-to-income ratio and assess impact."""
        return await self.generate(
            user_input="Compute debt-to-income ratio from the provided debts "
            "and income. Assess impact on credit score and borrowing capacity. "
            "Recommend target DTI to aim for.",
            context=context,
        )