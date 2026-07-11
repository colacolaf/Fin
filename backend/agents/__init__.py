"""Agent module — C.O.R.E. agents with Instructor + Ollama."""

from agents.base import BaseAgent, AgentError
from agents.investment import InvestmentAgent
from agents.debt import DebtAgent
from agents.retirement import RetirementAgent

__all__ = [
    "BaseAgent",
    "AgentError",
    "InvestmentAgent",
    "DebtAgent",
    "RetirementAgent",
]