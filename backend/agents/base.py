"""BaseAgent — shared Instructor + Ollama agent foundation.

All three agents (Investment, Debt, Retirement) inherit from this.
Handles:
- Ollama client lifecycle
- Instructor constrained-generation wrapper
- Prompt assembly with XML-delimited system/user/context
- Structured output validation
- Token accounting
- Sanitized input/output
"""

from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from typing import Any

import ollama
from instructor import from_ollama
from pydantic import BaseModel, ValidationError

from backend.config import settings
from backend.services.input_sanitizer import sanitize_agent_output, sanitize_user_input


# ── Ollama configuration ───────────────────────────────────
OLLAMA_HOST = settings.ollama_host
DEFAULT_MODEL = settings.ollama_agent_model or settings.ollama_model
INSTRUCTOR_MODE = getattr(settings, "INSTRUCTOR_MODE", "JSON")
MAX_RETRIES = settings.agent_max_retries
TIMEOUT_SECONDS = settings.agent_timeout_seconds


class AgentError(Exception):
    """Raised when agent generation fails (validation, timeout, etc.)."""


class BaseAgent(ABC):
    """Abstract base for structured-recommendation agents."""

    agent_type: str = ""  # investment, debt, retirement
    model_name: str = DEFAULT_MODEL
    temperature: float = settings.agent_temperature
    max_tokens: int = settings.agent_max_tokens

    def __init__(self) -> None:
        self._client = ollama.Client(host=OLLAMA_HOST)
        self._instructor = from_ollama(self._client, mode=INSTRUCTOR_MODE)

    # ── Subclass must implement ────────────────────────────
    @property
    @abstractmethod
    def output_schema(self) -> type[BaseModel]:
        """Pydantic model for structured output (e.g., InvestmentRecommendation)."""
        ...

    @abstractmethod
    def build_system_prompt(self) -> str:
        """Return the system prompt (C.O.R.E. personality + domain expertise)."""
        ...

    def build_user_message(self, user_input: str, context: dict[str, Any]) -> str:
        """Default user message with XML-delimited user input + context."""
        sb = []
        if user_input.strip():
            safe_input = sanitize_user_input(user_input, max_length=2000)
            sb.append(f"<user_message>{safe_input}</user_message>\n")
        sb.append(f"<user_context>\n{json.dumps(context, indent=2, default=str)}\n</user_context>")
        return "\n".join(sb)

    # ── Core generation ────────────────────────────────────
    async def generate(
        self,
        *,
        user_input: str = "",
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Run the agent: prompt → Ollama → instructor → validated Pydantic.

        Returns dict with:
            - structured: validated Pydantic model as dict
            - raw_text: raw LLM output
            - tokens_used: token count
            - model_used: model name
        """
        context = context or {}
        system_prompt = self.build_system_prompt()
        user_message = self.build_user_message(user_input, context)
        schema_model = self.output_schema

        full_prompt = f"{system_prompt}\n\n{user_message}"

        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                # Instructor does: prompt → Ollama → validate → Pydantic object
                result = self._instructor.chat.completions.create(
                    model=self.model_name,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    messages=[{"role": "user", "content": full_prompt}],
                    response_model=schema_model,
                )
                break  # success, exit retry loop
            except ValidationError as e:
                last_error = AgentError(f"Agent output validation failed: {e}")
                if attempt == MAX_RETRIES - 1:
                    raise last_error from e
            except Exception as e:
                last_error = AgentError(f"Ollama generation failed: {e}")
                if attempt == MAX_RETRIES - 1:
                    raise last_error from e
        else:
            raise last_error or AgentError("Agent generation failed after retries")

        # Extract the validated Pydantic object
        structured = result

        # Get raw text if available
        raw_text = ""
        tokens_used = 0
        if hasattr(result, "_raw_response"):
            raw = getattr(result, "_raw_response", "")
            if hasattr(raw, "message") and hasattr(raw.message, "content"):
                raw_text = sanitize_agent_output(str(raw.message.content))
            if hasattr(raw, "usage"):
                tokens_used = getattr(raw.usage, "total_tokens", 0) or 0

        return {
            "structured": structured.model_dump() if hasattr(structured, "model_dump") else {},
            "raw_text": raw_text,
            "tokens_used": tokens_used,
            "model_used": self.model_name,
        }

    # ── Health check ───────────────────────────────────────
    def health_check(self) -> dict[str, Any]:
        """Check if Ollama is reachable and model is available."""
        try:
            models = self._client.list()
            model_names = [m.model for m in models.models] if hasattr(models, "models") else []
            return {
                "ok": self.model_name in model_names or len(model_names) > 0,
                "model": self.model_name,
                "available_models": model_names,
                "ollama_host": OLLAMA_HOST,
            }
        except Exception as e:
            return {"ok": False, "error": str(e), "ollama_host": OLLAMA_HOST}