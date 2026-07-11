"""Investment Agent — portfolio analysis, rebalancing, tax optimization.

Inherits BaseAgent, uses Instructor + Ollama for structured output
conforming to InvestmentRecommendation schema.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from agents.base import BaseAgent
from agents.prompts import INVESTMENT_PROMPT, INVESTMENT_SKILLS
from services.structured_output import InvestmentRecommendation


class InvestmentAgent(BaseAgent):
    """Portfolio strategist agent (C.O.R.E. — Context, Observe, Reason, Execute)."""

    agent_type = "investment"

    @property
    def output_schema(self) -> type[BaseModel]:
        return InvestmentRecommendation

    def build_system_prompt(self) -> str:
        prompt = INVESTMENT_PROMPT
        # Append available skills
        skills_text = "\n".join(f"  • {k}: {v}" for k, v in INVESTMENT_SKILLS.items())
        prompt += f"\n\nAVAILABLE SKILLS:\n{skills_text}"
        return prompt

    def build_user_message(self, user_input: str, context: dict[str, Any]) -> str:
        """Add portfolio-specific context for investment agent."""
        base = super().build_user_message(user_input, context)

        # Add schema hint for instructor
        schema_hint = (
            "\n\n<schema_instructions>\n"
            "Output a JSON object with fields: title, ticker, action, quantity, rationale, "
            "confidence (with overall, math_certainty, market_assumptions, user_goal_alignment, "
            "execution_likelihood, explanation), impact (with financial_impact, "
            "projected_portfolio_change, timeline), risks (array of {risk, severity, mitigation}), "
            "alternatives (array of {title, description, tradeoff}), before_state, after_state.\n"
            "</schema_instructions>"
        )
        return base + schema_hint

    # ── Skill methods ──────────────────────────────────────
    async def portfolio_review(self, context: dict[str, Any]) -> dict[str, Any]:
        """Run a full portfolio review."""
        return await self.generate(
            user_input="Perform a comprehensive portfolio review. Analyze allocation, "
            "concentration risk, tax efficiency, and diversification.",
            context=context,
        )

    async def rebalance_plan(self, context: dict[str, Any]) -> dict[str, Any]:
        """Generate a rebalancing plan."""
        return await self.generate(
            user_input="Generate a specific rebalancing plan. Include exact moves "
            "with tickers, quantities, and tax considerations.",
            context=context,
        )

    async def tax_loss_harvest(self, context: dict[str, Any]) -> dict[str, Any]:
        """Identify tax-loss harvesting opportunities."""
        return await self.generate(
            user_input="Identify tax-loss harvesting opportunities. Find positions "
            "with unrealized losses and suggest which to harvest now.",
            context=context,
        )

    async def diversification_audit(self, context: dict[str, Any]) -> dict[str, Any]:
        """Check for concentration risks."""
        return await self.generate(
            user_input="Audit portfolio diversification. Flag any sector, "
            "asset class, or single-stock concentration exceeding 20%.",
            context=context,
        )

    async def new_investment_plan(self, context: dict[str, Any]) -> dict[str, Any]:
        """Create initial portfolio plan for new investors."""
        return await self.generate(
            user_input="Create an initial portfolio allocation for a new investor. "
            "Recommend broad-market ETFs with appropriate asset allocation "
            "based on risk tolerance and time horizon.",
            context=context,
        )