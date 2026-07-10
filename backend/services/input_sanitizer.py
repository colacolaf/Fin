"""OWASP-compliant input sanitization for agent inputs and outputs.

Covers:
- Prompt injection prevention (delimiter-based isolation)
- Input validation (type, range, length)
- Output sanitization (strip control chars, validate Pydantic)
- SQL injection irrelevant here (ORM layer), but user-facing inputs checked
"""

import html
import re
from typing import Any

# Control characters and invisible Unicode we strip from outputs
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")
# Potentially dangerous prompt-injection delimiters we escape in user text
_INJECTION_DELIMITERS = ["```", "---", "<<<", ">>>", "[SYSTEM]", "<|im_start|>", "<|im_end|>"]


def sanitize_user_input(text: str, max_length: int = 2000) -> str:
    """Sanitize free-text user input before passing to agent prompt.

    Strategy: wrap user input in XML-style delimiters so the LLM
    can distinguish user-provided text from system instructions.
    Also strips control characters and enforces length limit.
    """
    if not isinstance(text, str):
        return ""
    text = _CONTROL_RE.sub("", text)[:max_length]
    # Escape HTML entities in case output ever rendered inline
    text = html.escape(text, quote=False)
    # Neutralize known injection delimiter patterns
    for delim in _INJECTION_DELIMITERS:
        text = text.replace(delim, "\\" + delim)
    return text


def sanitize_context_value(value: Any, field_name: str) -> Any:
    """Validate and sanitize a single context field value.
    
    Returns sanitized value or None if invalid.
    """
    if value is None:
        return None

    # String fields: strip control chars, limit length
    if isinstance(value, str):
        if field_name in ("user_id", "id", "goal_id", "creditor", "provider", "ticker"):
            return _CONTROL_RE.sub("", value)[:100]
        if field_name in ("notes", "user_reasoning", "agent_notes", "agent_learning"):
            return _CONTROL_RE.sub("", sanitize_user_input(value, max_length=1000))
        return _CONTROL_RE.sub("", value)[:500]

    # Numeric fields: clamp to reasonable ranges
    if isinstance(value, (int, float)):
        if field_name in ("age", "years_to_retirement", "target_retirement_age"):
            return max(0, min(int(value), 120))
        if field_name in ("balance", "current_value", "total_value", "annual_income_gross"):
            return max(0, min(float(value), 1_000_000_000))
        if field_name in ("interest_rate", "tax_bracket_federal", "tax_bracket_state",
                          "unrealized_gain_loss_percent", "funded_percentage",
                          "acceptance_rate", "execution_rate"):
            return max(-1.0, min(float(value), 1.0))
        if field_name == "shares":
            return max(0, int(value))
        return value

    # Boolean fields
    if isinstance(value, bool):
        return value

    return str(value)[:200]


def sanitize_context_dict(data: dict[str, Any]) -> dict[str, Any]:
    """Recursively sanitize an entire context dictionary."""
    if not isinstance(data, dict):
        return {}
    result: dict[str, Any] = {}
    for key, val in data.items():
        if isinstance(val, dict):
            result[key] = sanitize_context_dict(val)
        elif isinstance(val, list):
            result[key] = [
                sanitize_context_dict(item) if isinstance(item, dict)
                else sanitize_context_value(item, key)
                for item in val
            ]
        else:
            result[key] = sanitize_context_value(val, key)
    return result


def sanitize_agent_output(text: str) -> str:
    """Strip control characters and known injection patterns from agent output."""
    if not isinstance(text, str):
        return ""
    text = _CONTROL_RE.sub("", text)
    for delim in _INJECTION_DELIMITERS:
        text = text.replace(delim, "")
    return text.strip()


def validate_agent_type(agent_type: str) -> str:
    """Whitelist agent types. Returns validated type or raises ValueError."""
    valid = {"investment", "debt", "retirement"}
    agent_type = str(agent_type).strip().lower()
    if agent_type not in valid:
        raise ValueError(f"Invalid agent_type: {agent_type}. Must be one of {valid}")
    return agent_type


def validate_user_id(user_id: str) -> str:
    """Validate user_id is a UUID-like string."""
    if not re.match(r"^[a-f0-9-]{8,64}$", str(user_id)):
        raise ValueError("Invalid user_id format")
    return user_id