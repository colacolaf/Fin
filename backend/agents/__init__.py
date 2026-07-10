"""Agent module — C.O.R.E. agents with Instructor + Ollama."""

from backend.agents.base import BaseAgent, AgentError
from backend.agents.investment import InvestmentAgent
from backend.agents.debt import DebtAgent
from backend.agents.retirement import RetirementAgent

__all__ = [
    "BaseAgent",
    "AgentError",
    "InvestmentAgent",
    "DebtAgent",
    "RetirementAgent",
]