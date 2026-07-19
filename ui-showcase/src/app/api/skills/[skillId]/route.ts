import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { availableSkills } from "@/lib/agents"

/**
 * API route: GET /api/skills/:skillId
 *
 * Reads the rich skill document from docs/Skills/ on the filesystem
 * and returns it as plain text. The client uses this to inject skill
 * knowledge into the agent's context when a skill is activated.
 *
 * Path resolution:
 *   - In dev: process.cwd() = ui-showcase/, docs live at ../docs/Skills/
 *   - In production: docs base path can be set via DOCS_BASE_PATH env var
 *   - Falls back to trying multiple common paths
 */

/* ------------------------------------------------------------------ */
/*  Skill ID → file path — derived from availableSkills (single source) */
/* ------------------------------------------------------------------ */

function buildSkillDocMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const skill of availableSkills) {
    map[skill.id] = skill.docPath
  }
  return map
}

const SKILL_DOC_MAP = buildSkillDocMap()

/* Agent-level docs (read when an agent session starts) */
const AGENT_DOC_MAP: Record<string, string> = {
  portfolio: "docs/Skills/portfolio/Portfolio_Agent.md",
  debt: "docs/Skills/debt/Debt_Agent.md",
  retirement: "docs/Skills/retirement/Retirement_Agent.md",
}

/* ------------------------------------------------------------------ */
/*  Path resolution — tries multiple base paths for robustness          */
/* ------------------------------------------------------------------ */

function resolveDocPath(relativePath: string): string {
  // Configurable base path (for production deployments)
  const envBase = process.env.DOCS_BASE_PATH
  if (envBase) {
    return path.join(envBase, relativePath)
  }

  // Try: cwd is ui-showcase/, docs are at ../docs/Skills/
  const cwd = process.cwd()
  const candidates = [
    path.resolve(cwd, "..", relativePath),   // cwd = ui-showcase/
    path.resolve(cwd, relativePath),          // cwd = project root (monorepo)
    path.resolve(cwd, "..", "..", relativePath), // cwd = ui-showcase/.next/ (build)
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  // Default to the first candidate — it'll fail with a clear error
  return candidates[0]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params

  // Resolve the file path
  const relativePath = SKILL_DOC_MAP[skillId] ?? AGENT_DOC_MAP[skillId]
  if (!relativePath) {
    return NextResponse.json(
      { error: `Skill "${skillId}" not found in registry` },
      { status: 404 }
    )
  }

  const absolutePath = resolveDocPath(relativePath)

  try {
    const content = fs.readFileSync(absolutePath, "utf-8")

    // Strip YAML-style frontmatter header lines (the `> **Skill ID:**...` line)
    // We keep the full markdown — the agent can parse what it needs.

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // 1 hour — skills don't change often
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to read skill doc: ${message}`, path: absolutePath },
      { status: 500 }
    )
  }
}
