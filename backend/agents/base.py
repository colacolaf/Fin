"""BaseAgent — shared Instructor + Ollama agent foundation.

All three agents (Investment, Debt, Retirement) inherit from this.
Handles:
- Ollama client lifecycle
- Instructor constrained-generation wrapper (via OpenAI-compat Ollama endpoint)
- Prompt assembly with XML-delimited system/user/context
- Structured output validation
- Token accounting
- Sanitized input/output
"""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from typing import Any

import ollama
from openai import OpenAI
from instructor import from_openai, Mode
from pydantic import BaseModel, ValidationError

from config import settings
from services.input_sanitizer import sanitize_agent_output, sanitize_user_input


# ── Ollama configuration ───────────────────────────────────
OLLAMA_HOST = settings.ollama_host
DEFAULT_MODEL = settings.ollama_agent_model or settings.ollama_model
INSTRUCTOR_MODE = Mode.JSON
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
        # Use instructor.from_openai with an OpenAI client pointed at Ollama's
        # OpenAI-compatible API endpoint (default: http://localhost:11434/v1).
        openai_client = OpenAI(base_url=f"{OLLAMA_HOST}/v1", api_key="ollama")
        self._instructor = from_openai(openai_client, mode=INSTRUCTOR_MODE)

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

    # ── Memory recording ────────────────────────────────────
    def _record_run(
        self,
        user_input: str,
        context: dict[str, Any],
        result: dict[str, Any],
    ) -> None:
        """Persist agent run as a memory note in the vault."""
        try:
            from services.memory_bridge import save_recommendation_note

            structured = result.get("structured", {})
            summary_parts: list[str] = []

            # Extract key recommendations / findings from structured output
            if isinstance(structured, dict):
                recs = structured.get("recommendations") or structured.get("recommendation")
                if recs:
                    summary_parts.append("## Recommendations")
                    if isinstance(recs, list):
                        for i, r in enumerate(recs, 1):
                            if isinstance(r, dict):
                                summary_parts.append(
                                    f"{i}. **{r.get('title', r.get('action', 'Recommendation'))}**: "
                                    f"{r.get('description', r.get('rationale', ''))}"
                                )
                            elif isinstance(r, str):
                                summary_parts.append(f"{i}. {r}")
                    elif isinstance(recs, str):
                        summary_parts.append(recs)
                    elif isinstance(recs, dict):
                        for k, v in recs.items():
                            summary_parts.append(f"- **{k}**: {v}")

                # Include key metrics if present
                for key in ("score", "confidence", "summary", "analysis"):
                    val = structured.get(key)
                    if val and isinstance(val, (str, int, float)):
                        summary_parts.insert(0, f"**{key.title()}:** {val}")

            summary = "\n\n".join(summary_parts) if summary_parts else "Agent run completed."
            save_recommendation_note(
                agent_type=self.agent_type,
                summary=summary,
                details={
                    "user_input": user_input[:500],
                    "tokens_used": result.get("tokens_used", 0),
                    "model": result.get("model_used", ""),
                },
            )
        except Exception:
            pass  # Memory recording is best-effort, never blocks the agent

    def _load_history(self, limit: int = 5) -> list[dict[str, Any]]:
        """Load recent recommendation notes for this agent type."""
        try:
            from services.memory_bridge import search_notes

            notes = search_notes(self.agent_type, limit=limit)
            return [
                {
                    "title": n.title,
                    "summary": n.content[:500],
                    "date": n.updated_at or n.created_at,
                    "tags": n.tags,
                }
                for n in notes
            ]
        except Exception:
            return []

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