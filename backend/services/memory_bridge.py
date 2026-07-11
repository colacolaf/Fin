"""Memory bridge: read/write Obsidian-compatible markdown notes in the memory vault.

Provides the same API shape as basic-memory MCP (create_note, read_note,
search_notes, list_notes, update_note, delete_note) but implemented directly
against the filesystem. No external MCP server needed.
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import settings

VAULT_PATH = Path(settings.memory_vault_path).expanduser().resolve()

# Subdirectories
SUBDIRS = ["recommendations", "decisions", "preferences", "patterns"]


@dataclass
class MemoryNote:
    permalink: str
    title: str
    content: str
    folder: str
    tags: list[str] = field(default_factory=list)
    frontmatter: dict[str, Any] = field(default_factory=dict)
    created_at: str = ""
    updated_at: str = ""
    file_path: str = ""


def _ensure_vault() -> None:
    """Create vault directory structure if not exists."""
    VAULT_PATH.mkdir(parents=True, exist_ok=True)
    for sub in SUBDIRS:
        (VAULT_PATH / sub).mkdir(exist_ok=True)
    # Seed user-context.md if missing
    ctx = VAULT_PATH / "user-context.md"
    if not ctx.exists():
        ctx.write_text(
            "---\n"
            "title: User Context\n"
            "type: user-context\n"
            "updated: auto\n"
            "---\n\n"
            "# User Context\n\n"
            "## Financial Profile\n\n"
            "*No data yet.*\n\n"
            "## Recent Decisions\n\n"
            "*None recorded.*\n\n"
            "## Preferences\n\n"
            "*None recorded.*\n\n"
            "## Patterns\n\n"
            "*No patterns detected.*\n"
        )


def _slugify(title: str) -> str:
    """Convert a title to a filename-safe slug."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
    return slug or "untitled"


def _parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    """Parse YAML-ish frontmatter from markdown text."""
    fm: dict[str, Any] = {}
    body = text
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if m:
        body = text[m.end():]
        for line in m.group(1).split("\n"):
            line = line.strip()
            if ":" in line:
                key, _, val = line.partition(":")
                key = key.strip()
                val = val.strip().strip("\"'")
                # Parse list values like [tag1, tag2]
                if val.startswith("[") and val.endswith("]"):
                    val = [v.strip().strip("\"'") for v in val[1:-1].split(",") if v.strip()]
                fm[key] = val
    return fm, body.strip()


def _make_frontmatter(fm: dict[str, Any]) -> str:
    """Build YAML frontmatter block."""
    lines = ["---"]
    for key, val in fm.items():
        if isinstance(val, list):
            lines.append(f"{key}: [{', '.join(repr(v) if isinstance(v, str) else str(v) for v in val)}]")
        elif isinstance(val, str) and (" " in val or ":" in val):
            lines.append(f'{key}: "{val}"')
        else:
            lines.append(f"{key}: {val}")
    lines.append("---")
    return "\n".join(lines)


def _path_for(title: str, folder: str) -> Path:
    folder = folder or "recommendations"
    if folder not in SUBDIRS:
        folder = "recommendations"
    return VAULT_PATH / folder / f"{_slugify(title)}.md"


def create_note(
    title: str,
    content: str,
    folder: str = "",
    tags: list[str] | None = None,
    frontmatter: dict[str, Any] | None = None,
) -> MemoryNote:
    """Create a new markdown note in the vault."""
    _ensure_vault()
    folder = folder or "recommendations"
    tags = tags or []
    fm = frontmatter or {}

    now = datetime.now(timezone.utc).isoformat()
    fm["title"] = title
    fm["type"] = folder.rstrip("s")  # recommendations -> recommendation
    fm["created"] = now
    fm["updated"] = now
    if tags:
        fm["tags"] = tags

    filepath = _path_for(title, folder)
    full = f"{_make_frontmatter(fm)}\n\n{content}\n"
    filepath.write_text(full)

    return MemoryNote(
        permalink=f"{folder}/{_slugify(title)}",
        title=title,
        content=content,
        folder=folder,
        tags=tags,
        frontmatter=fm,
        created_at=now,
        updated_at=now,
        file_path=str(filepath),
    )


def read_note(permalink: str) -> MemoryNote | None:
    """Read a note by permalink (e.g., 'recommendations/my-title')."""
    _ensure_vault()
    parts = permalink.strip("/").split("/", 1)
    folder = parts[0] if len(parts) > 1 else "recommendations"
    slug = parts[1] if len(parts) > 1 else parts[0]

    # Prevent path traversal: folder must be a known subdirectory
    if folder not in SUBDIRS:
        return None

    filepath = VAULT_PATH / folder / f"{slug}.md"

    if not filepath.exists():
        return None

    try:
        raw = filepath.read_text()
    except OSError:
        return None

    fm, content = _parse_frontmatter(raw)
    title = fm.pop("title", slug.replace("-", " ").title())
    tags = fm.pop("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",")]

    return MemoryNote(
        permalink=permalink,
        title=title,
        content=content,
        folder=folder,
        tags=tags,
        frontmatter=fm,
        created_at=str(fm.pop("created", "")),
        updated_at=str(fm.pop("updated", "")),
        file_path=str(filepath),
    )


def update_note(permalink: str, content: str | None = None, frontmatter: dict[str, Any] | None = None) -> MemoryNote | None:
    """Update a note's content and/or frontmatter."""
    note = read_note(permalink)
    if note is None:
        return None

    now = datetime.now(timezone.utc).isoformat()
    fm = note.frontmatter or {}
    fm["updated"] = now
    if frontmatter:
        fm.update(frontmatter)

    new_content = content if content is not None else note.content
    fm["title"] = fm.get("title", note.title)

    filepath = Path(note.file_path)
    full = f"{_make_frontmatter(fm)}\n\n{new_content}\n"
    filepath.write_text(full)

    note.content = new_content
    note.updated_at = now
    note.frontmatter = fm
    if "tags" in fm:
        t = fm["tags"]
        note.tags = t if isinstance(t, list) else [x.strip() for x in str(t).split(",")]
    return note


def delete_note(permalink: str) -> bool:
    """Delete a note by permalink. Returns True if deleted."""
    note = read_note(permalink)
    if note is None:
        return False
    Path(note.file_path).unlink(missing_ok=True)
    return True


def search_notes(query: str, limit: int = 20) -> list[MemoryNote]:
    """Full-text search across all markdown notes. Case-insensitive."""
    _ensure_vault()
    results: list[MemoryNote] = []
    query_lower = query.lower()

    for folder in SUBDIRS:
        folder_path = VAULT_PATH / folder
        if not folder_path.exists():
            continue
        for md_file in sorted(folder_path.glob("*.md")):
            try:
                raw = md_file.read_text()
            except Exception:
                continue
            if query_lower in raw.lower():
                fm, content = _parse_frontmatter(raw)
                slug = md_file.stem
                title = fm.pop("title", slug.replace("-", " ").title())
                tags = fm.pop("tags", [])
                if isinstance(tags, str):
                    tags = [t.strip() for t in tags.split(",")]
                results.append(MemoryNote(
                    permalink=f"{folder}/{slug}",
                    title=title,
                    content=content,
                    folder=folder,
                    tags=tags,
                    frontmatter=fm,
                    created_at=str(fm.pop("created", "")),
                    updated_at=str(fm.pop("updated", "")),
                    file_path=str(md_file),
                ))
            if len(results) >= limit:
                break
        if len(results) >= limit:
            break
    return results


def list_notes(folder: str = "", limit: int = 50) -> list[MemoryNote]:
    """List notes in a folder, most recently updated first."""
    _ensure_vault()
    results: list[MemoryNote] = []

    dirs = [folder] if folder and folder in SUBDIRS else SUBDIRS
    for d in dirs:
        dir_path = VAULT_PATH / d
        if not dir_path.exists():
            continue
        for md_file in sorted(dir_path.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True):
            try:
                raw = md_file.read_text()
            except Exception:
                continue
            fm, content = _parse_frontmatter(raw)
            slug = md_file.stem
            title = fm.pop("title", slug.replace("-", " ").title())
            tags = fm.pop("tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",")]
            results.append(MemoryNote(
                permalink=f"{d}/{slug}",
                title=title,
                content=content,
                folder=d,
                tags=tags,
                frontmatter=fm,
                created_at=str(fm.pop("created", "")),
                updated_at=str(fm.pop("updated", "")),
                file_path=str(md_file),
            ))
            if len(results) >= limit:
                break
        if len(results) >= limit:
            break
    return results


def get_recent_decisions(limit: int = 10) -> list[MemoryNote]:
    """Get most recent decisions for agent context."""
    return list_notes("decisions", limit=limit)


def get_recommendations(limit: int = 20) -> list[MemoryNote]:
    """Get most recent recommendations."""
    return list_notes("recommendations", limit=limit)


def save_recommendation_note(agent_type: str, summary: str, details: dict[str, Any]) -> MemoryNote:
    """Save a recommendation as a markdown note after agent run."""
    now = datetime.now(timezone.utc)
    title = f"{agent_type.title()} — {now.strftime('%Y-%m-%d %H:%M')}"
    content_lines = [
        f"# {title}",
        "",
        f"**Agent:** {agent_type}",
        f"**Date:** {now.isoformat()}",
        "",
        summary,
    ]
    if details:
        content_lines.extend(["", "## Details", "", "```json", json.dumps(details, indent=2, default=str), "```"])
    return create_note(
        title=title,
        content="\n".join(content_lines),
        folder="recommendations",
        tags=[agent_type, "recommendation"],
        frontmatter={"agent_type": agent_type, "importance": 0.5},
    )


def save_decision_note(agent_type: str, decision: str, rationale: str) -> MemoryNote:
    """Save a user decision after voting."""
    now = datetime.now(timezone.utc)
    title = f"Decision {now.strftime('%Y-%m-%d %H:%M')}"
    content = (
        f"# Decision\n\n"
        f"**Agent:** {agent_type}\n"
        f"**Date:** {now.isoformat()}\n\n"
        f"## Decision\n{decision}\n\n"
        f"## Rationale\n{rationale}\n"
    )
    return create_note(
        title=title,
        content=content,
        folder="decisions",
        tags=[agent_type, "decision"],
        frontmatter={"agent_type": agent_type, "importance": 0.7},
    )


def parse_wikilinks(content: str) -> list[dict[str, str]]:
    """Extract wiki-style links from content. Returns [{target, label}]."""
    pattern = re.compile(r"\[\[([^\]|#]+)(?:[|#]([^\]]+))?\]\]")
    matches = pattern.findall(content)
    return [{"target": m[0].strip(), "label": (m[1] or m[0]).strip()} for m in matches]


def build_graph_data(limit: int = 100) -> dict[str, Any]:
    """Build node/edge graph data for D3 force-directed visualization."""
    notes = list_notes(limit=limit)
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    permalink_set: set[str] = {n.permalink for n in notes}

    for note in notes:
        node_type = note.frontmatter.get("type", note.folder.rstrip("s"))
        nodes.append({
            "id": note.permalink,
            "title": note.title,
            "type": node_type,
            "folder": note.folder,
            "tags": note.tags,
            "importance": note.frontmatter.get("importance", 0.5),
        })
        # Parse wikilinks for edges
        for link in parse_wikilinks(note.content):
            target = link["target"]
            # Normalize to permalink if possible
            target_permalink = target
            if "/" not in target_permalink:
                target_permalink = f"recommendations/{_slugify(target)}"
            if target_permalink in permalink_set:
                edges.append({
                    "source": note.permalink,
                    "target": target_permalink,
                    "label": link["label"],
                })

    return {"nodes": nodes, "edges": edges}


def update_user_context(
    settings_summary: str = "",
    portfolio_snapshot: dict[str, Any] | None = None,
    recent_decisions: list[str] | None = None,
    preferences: dict[str, Any] | None = None,
    patterns: list[str] | None = None,
) -> None:
    """Update user-context.md with latest financial state."""
    _ensure_vault()
    now = datetime.now(timezone.utc).isoformat()

    sections: list[str] = [
        "---",
        f"title: User Context",
        "type: user-context",
        f"updated: {now}",
        "---",
        "",
        "# User Context",
        "",
    ]
    if settings_summary:
        sections.extend(["## Financial Profile", "", settings_summary, ""])
    else:
        sections.extend(["## Financial Profile", "", "*No data yet.*", ""])

    if portfolio_snapshot:
        sections.extend([
            "## Portfolio Snapshot",
            "",
            "```json",
            json.dumps(portfolio_snapshot, indent=2, default=str),
            "```",
            "",
        ])

    if recent_decisions:
        sections.append("## Recent Decisions\n")
        for d in recent_decisions:
            sections.append(f"- {d}")
        sections.append("")
    else:
        sections.extend(["## Recent Decisions", "", "*None recorded.*", ""])

    if preferences:
        sections.append("## Preferences\n")
        for k, v in preferences.items():
            sections.append(f"- **{k}:** {v}")
        sections.append("")
    else:
        sections.extend(["## Preferences", "", "*None recorded.*", ""])

    if patterns:
        sections.append("## Patterns\n")
        for p in patterns:
            sections.append(f"- {p}")
        sections.append("")
    else:
        sections.extend(["## Patterns", "", "*No patterns detected.*", ""])

    (VAULT_PATH / "user-context.md").write_text("\n".join(sections))