# Phase 22 — Cinematic Ocean Dashboard (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate the Ocean scene from "the fins move" to "the dashboard feels cinematic". **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified** — enforced.

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@threejs-expert` (domain)

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent; sequence only the physics-dependent ones (1→2).
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md` — visual thesis (THE OCEAN metaphor + OKLCH)
2. `frontend/src/styles/ocean.css` — OKLCH tokens (do not reinvent)
3. `frontend/src/pages/Dashboard.tsx` — current shell
4. `frontend/src/components/ocean/OceanCanvas.tsx` + `FinModel.tsx` + `Bioluminescence.tsx`
5. `frontend/src/hooks/useOceanScene.ts` — physics
6. `.codebuff/prompts/fin-memory-obsidian.md` (Phase 20)
7. `.codebuff/prompts/fin-settings-pro.md` (Phase 21) — visual language is the established truth
8. `.codebuff/prompts/fin-cinematic-ocean-dashboard.md` (this file) — re-read before commits

---

## User's report
> The Ocean scene works but feels static. Fins bob in fixed spots. Sidebar chrome (Phase 21) is polished but the Dashboard placeholder feels empty when no agent is active. Cinematic = the canvas has presence, not just "decorative animation".

## What "good" looks like

- **Parallax depth layers** — three translucent haze planes between camera and ocean floor that shift with mouse/tilt. Breathing room, not noise.
- **Synchronized fin orbit** — fins rotate around a common center, not just bob in place. Their motion is choreographed.
- **Idle-Dashboard onboarding hint cards** — three glassmorphic cards (Run your first agent · Connect a broker · Read the docs) when no agent is active.
- **Onboarding coach-marks** — first-visit overlay highlighting the most important 3 features, dismissable.
- **Bioluminescence ambient bleed** — particles that occasionally pop near the fins, suggesting lived-in motion.

## GitHub repos referenced

### Visualization
- [WE-1] `pmndrs/drei` — react-three-fiber helpers; we use a custom shell of Three.js, not R3F, but `drei`'s `ScrollControls` + `MeshDistortMaterial` are inspiration for non-essential noise.
- [WE-2] `pmndrs/postprocessing` — the standard for selective bloom + vignette + chromatic aberration in WebGL.
- [WE-3] `mrdoob/three.js` examples + `examples/jsm/postprocessing` — we use the same pipeline.
- [WE-4] `luma.gl` / `kepler.gl` examples — depth-fog shaders, transparency stacks.

### MCP / connectors
- [MDC-1] `modelcontextprotocol/servers` — our integration source of truth.

### Skills
- [WE-5] `@threejs-expert` (this pass's domain skill).

---

## The 6 fixes (execute in order)

### 1 · Parallax depth layers (no shared geometry churn)
**Bug:** `useOceanScene.ts` uses one shared `BufferGeometry` (Phase 19 fix) but the canvas reads as a single depth. No sense of distance.

**Do:**
- Add 3 haze planes (1.0, 0.6, 0.3 opacity, two layered sheet meshes with custom shader for vertical gradient).
- Animate on mouse/tilt via `requestAnimationFrame`. Camera offset = `(mouseX - 0.5) * 4px`. NO geometry recreate — vertex positions in place.
- `prefers-reduced-motion`: zero parallax.

### 2 · Synchronized fin orbit (choreographed motion)
**Bug:** Fins float in fixed positions (`padding-top: 35%`).

**Do:**
- Each fin's `transform` is `translate(cos(t * speed + phase) * radius, sin(t * speed + phase) * radius)` wrapped around a common orbit center.
- Three phases evenly spaced (0deg / 120deg / 240deg).
- Speeds differentiate by agent domain (Investment = slow prose, Debt = assertive, Retirement = long horizon).
- `fin-drift-N` class still preserves the bob axis — composition, not replacement.

### 3 · Idle-Dashboard onboarding cards
**Bug:** When no agent is active, Dashboard shows one centered placeholder. Sparse.

**Do:**
- Three glassmorphic `.onboarding-card` items rendered in a row above the placeholder.
- Each card: icon, label (e.g. "Run Investment Agent"), 1-line description, `Try now` CTA → triggers `handleSelectAgent('investment' | 'debt' | 'retirement')`.
- Cards fade out after the user has triggered any agent at least once (`fin.dashboard.visited` localStorage flag).

### 4 · Post-processing pipeline (selective bloom + vignette + chromatic aberration)
**Bug:** No post-processing. Ocean reads flat.

**Do:**
- Use `EffectComposer` from `three/examples/jsm/postprocessing`. Hooks into `WebGLRenderer`.
- `RenderPass` → `UnrealBloomPass` (threshold 0.55, strength 0.35, radius 0.85) → `VignettePass` (darkness 0.55) → `OutputPass`.
- Selective bloom only for fins (apply `layers` on fin materials).
- Honor `prefers-reduced-motion`: skip bloom.

### 5 · Onboarding coach-marks (3-step first-visit)
**Bug:** TourGuide exists but its tour only fires once on first visit (`.firstShown`). No progressive disclosure of feature depth.

**Do:**
- Build a lightweight `CoachMarks` overlay — three sequential spotlights ("Click a fin to start", "Open Memory", "Connect a broker"). Each dismissed by click.
- Storage: `fin.dashboard.coachMarks` set, lookup before showing each step.
- Once any step completes, the next step becomes available (don't force-show all at once).

### 6 · Bioluminescence ambient bleed (presence, not noise)
**Bug:** `Bioluminescence.tsx` exists but emits far away from the fins.

**Do:**
- Particles emit from a sphere around each fin's projected position (raycast from fin world position to screen, project to bioluminescence canvas).
- Emission rate capped; particles fade softly (CSS opacity 0.0 → 0.3 → 0.0 over 2s).
- `prefers-reduced-motion`: half rate.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend `ocean.css` with `--bloom-glow-l1` etc. **NO hex.**
2. **Accessibility** — `prefers-reduced-motion: reduce` honored across parallax + bloom + fin orbit. No motion sickness guarantee.
3. **No new backend routes** — every interaction is local state + existing `/api/agents/*` (already exposed).
4. **No new heavy deps** — `three` + `framer-motion` already in `package.json`. No `@react-three/fiber`, no `@react-three/drei`, no `@luma.gl`. Ponytail: stick with raw Three.js for the chrome — the canvas is already there.
5. **Performance** — 60fps target desktop / 30fps mobile. Don't recreate BufferGeometry in animate(). Use `dispose()` only at unmount. The single `BufferGeometry` rule from Phase 19 stands.
6. **Micro-interactions < 300ms** per Emil Kowalski. Directional fades ≤180ms.
7. **Ponytail principle** — delete before adding. Drop redundant null-check branches. **≤10 files modified.**
8. **`@subagent-driven-development` mandatory** — spawn one subagent per fix where independent.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/Dashboard.tsx src/components/ocean src/components/layout src/hooks/useOceanScene.ts src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/15-ocean-dashboard.spec.ts`:
- Three onboarding cards render when no agent is active
- Fin orbit moves between renders (animation frame check)
- Bloom pipeline does not regress console errors
- Realtime test: with `prefers-reduced-motion: reduce`, parallax cancelled

```bash
cd frontend && npx playwright test e2e/specs/15-ocean-dashboard.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173`:
   - Onboarding cards visible (3 in a row); clicking one opens the relevant agent panel.
   - Fins rotate visibly around the orbit center on first load.
   - Parallax tilts subtly with mouse movement.
   - Bloom + vignette visible on fins (subtly — strength 0.35, not psychedelic).
2. DevTools → Rendering → "Emulate CSS media: `prefers-reduced-motion: reduce`" → re-check (no orbit motion, no bloom, no parallax, halve bioluminescence rate).
3. DevTools Console: zero errors / zero warnings.
4. Lighthouse mobile ≥ 80 perf, ≥ 95 a11y; desktop ≥ 95 perf, 100 a11y.
5. Playwright e2e 15-ocean passes.
6. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and reference `Icons.tsx` for any new glyphs.

<task>Now go.</task>
