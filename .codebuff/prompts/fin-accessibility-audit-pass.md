# Phase 37 — Accessibility Audit Pass (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship **a measurable accessibility baseline**: axe-core sweep on every route, manual screen-reader pass on the high-frequency flows, and a final reduced-motion + contrast verification on the Ocean palette. The product has paper-thin a11y already (focus rings, ARIA, labels on key flows) but no automated proof and several known gaps (no live `aria-current` on active sidebar items, no descriptive screen-reader announcement on toast insertion, no skip-to-content link, no `prefers-reduced-motion` final sweep, color contrast on `--toast-success` against the toast bg not measured). **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@web-design-guidelines` `@owasp-security-check` `@vercel-react-best-practices`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md` — `WCAG 2.2 AA` is the design floor
2. `frontend/src/styles/ocean.css` — every OKLCH color has to pass `>=4.5:1` contrast for body text against its bg; large text `>=3:1`; interactive elements `>=3:1`
3. `frontend/src/components/layout/Sidebar.tsx` — currently no `aria-current="page"` on the active route (Phase 21 polish short-cut)
4. `frontend/src/components/ui/Skeleton.tsx`, `Toast.tsx`, `CommandPalette.tsx`, `KeyboardShortcuts.tsx` — verify aria-live / aria-busy / aria-modal patterns
5. `frontend/src/App.tsx` — its `AppBody` mounts Sidebar + TopBar; this is the right place to mount `<a className="skip-to-content">`
6. `frontend/src/hooks/useGlobalHotkeys.ts` — combo parsing must accept screen-reader-friendly labels
7. `frontend/src/components/ui/forms/{Toggle,Slider,SegmentedControl}.tsx` — verify ARIA roles/values (read but **DO NOT EDIT** — form primitives are Phase 32's territory)
8. `package.json` — `@axe-core/playwright ^4.12.1` is already a devDep (line 43); use it; do NOT add `react-axe` runtime
9. `.codebuff/prompts/{fin-app-shell-keyboard-and-recovery,fin-keyboard-shortcuts-overlay}.md` — visual language + verification patterns
10. `.codebuff/prompts/fin-accessibility-audit-pass.md` (this file)

---

## User's report
> A blind friend asked me to demo Fin. VoiceOver on macOS reads the sidebar items but skips the active route state — they couldn't tell which page they were on. Focus rings are usually visible, but `<input type="range">` sliders on Settings → Agent Preferences → Risk tolerance don't announce "Aggressive" — they just read "7 of 10". Toasts sometimes appear silently because `role="status"` lives on the alert wrapper but not the live-region. Skip-to-content link isn't there. The colored dot in the TopBar sync pill has no textual alternative for SR users (the text label is fine, but the dot color's meaning isn't reachable without seeing colors). I want a measurable accessibility score: zero axe-core violations on every route, and a manual pass on the flows focus-trapped in Popovers + CommandPalette + KeyboardShortcuts overlay.

## What "good" looks like (per spec)

- **axe-core sweep: zero violations of WCAG 2.2 AA on every route** — `/`, `/portfolio`, `/debt`, `/retirement`, `/memory`, `/orchestrate`, `/recommendations`, `/execution`, `/community`, `/backtest`, `/settings`, `/offline`. The Playwright executor with `@axe-core/playwright` (already in devDeps) runs on each route and fails the build on any violation. Color contrast: text contrast ≥ 4.5:1, large text/ui ≥ 3:1. (Auto-corrected violations block CI.)
- **`aria-current="page"` on the active sidebar item** — sidebar items currently use only `.active` className; add `aria-current="page"` when `pathname` matches the item's route.
- **Skip-to-content link** — `<a href="#main-content" className="skip-to-content">Skip to main content</a>` mounted first in `<AppBody>` (before TopBar / Sidebar). Hidden visually but focusable; visible on `:focus-visible` with OKLCH-tinted outline. `Tab` once = skip the entire chrome.
- **Live-region for toasts** — separate `<div role="status" aria-live="polite">` (success/info) and `<div role="alert" aria-live="assertive">` (error/warn) containers that receive toasts. VoiceOver/SR announces insertion. The viewport itself stays `aria-live="off"`.
- **Slider `aria-valuetext`** — every slider reads semantic label via `aria-valuetext` (already on Slider.tsx — verify the formatter is wired: `risk` → `"7/10, Aggressive"`, `confidence` → `"75%, Moderate"`).
- **Color is never the sole indicator** — the TopBar freshness pip has an SR-only visual alternative. Add `<span className="visually-hidden">{label}</span>` already there for the text, but the pip color must be encoded in the text label, not just color. Verify label says "Synced" / "5 minutes ago" / "30 minutes ago" — humans can tell by reading without seeing colors.
- **Focus skipping mobile breakpoints** — `.sidebar` is `tabIndex={-1}` on desktop (Tab moves past sidebar), but on mobile when sidebar is overlay, focus must NOT skip into it when closed. Verify the existing focus-trap behavior.
- **Reduced-motion final sweep** — every animation we ship must have a `@media (prefers-reduced-motion: reduce) { ... transition: none !important; animation: none !important; }` rule in `ocean.css`. Verify Toast, CommandPalette open/close, Popover enter/exit, BottomSheet slide (Phase 36), skeleton shimmer.
- **Touch targets ≥ 44px** on mobile — sidebar items, TopBar pills, settings-row controls. Verify.
- **Form-field labels always wired** — `<Field label="Theme">` renders `<label htmlFor=…>` if the child has `id`. Verify the auto-derive from id-aware primitives (Input/Select/Toggle/Slider/SegmentedControl) — do NOT modify these primitives; they ship from Phase 32.
- **No `prefers-color-scheme` mismatch** — currently no "system" theme actually responds to OS preference. Wire `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)` and apply to `document.documentElement.dataset.theme` when theme preference is "system" (existing `fin.theme` localStorage key).

**Scope of THIS pass (≤10 files — counted & verified):**

> **File-budget arithmetic:** `5 NEW + 5 EDIT = 10 files`. Exactly at budget. **No drive-by edits.**

- `frontend/src/components/a11y/SkipToContent.tsx` (NEW)
- `frontend/src/utils/riskLabels.ts` (NEW — `RISK_LABELS` + `riskLabel(v)` + `confidenceLabel(v)`; ~30 LOC)
- `frontend/src/hooks/useTheme.ts` (NEW **unless a code-search for `useTheme` finds it already** — if it exists, this becomes EDIT; verify with `rg "useTheme" frontend/src` before declaring NEW)
- `frontend/src/utils/audit.ts` (NEW — `runAxeCheck(page)` helper for tests)
- `frontend/e2e/specs/37-accessibility.spec.ts` (NEW)
- `frontend/src/components/ui/Toast.tsx` (EDIT — separate live-regions per tone + aria-levels)
- `frontend/src/components/layout/Sidebar.tsx` (EDIT — add `aria-current="page"` on active)
- `frontend/src/App.tsx` (EDIT — mount SkipToContent + listen to prefers-color-scheme changes)
- `frontend/src/styles/ocean.css` (EDIT — add reduced-motion overrides for any missing anim transitions)
- `frontend/src/components/ui/forms/Slider.tsx` (EDIT — verify valuetext wiring; minimum-diff changes only)

> **HARD GUARD — Form-primitive freeze (NON-NEGOTIABLE):** Phase 32 owns `Field.tsx` / `Input.tsx` / `Select.tsx` / `Toggle.tsx` / `Slider.tsx` / `SegmentedControl.tsx` / `InlineError.tsx`. Phase 37 may **only edit `Slider.tsx`** and only to **wire `aria-valuetext`** (if it's missing on this build) — DO NOT:
> - Add new props that didn't exist before (label logic is Phase 32's)
> - Refactor the underlying `<input type="range">` (that's Phase 32)
> - Touch `Field.tsx` / `Input.tsx` / `Select.tsx` / `Toggle.tsx` / `SegmentedControl.tsx` at all
> - Touch `Settings.tsx` (Phase 21 owns it; Phase 37 only tests it via e2e)
>
> If a fix in Fix 4 needs to change a label format, do it via the new `riskLabels.ts` / `confidenceLabels.ts` helpers (consumed by Settings.tsx in a later phase), not by editing the primitives themselves.

> **Visibility rule (NON-NEGOTIABLE):** OKLCH-only. `ocean.css` may only add OKLCH tokens. **No hex. No `rgb()`. No `hsl()`.** axe-core must continue to scan `ocean.css`-derived styles; if a hex slips in, axe-core 4.12 will catch it via color-contrast rules and CI fails.

## GitHub repos referenced

### Accessibility
- [WE-1] `dequelabs/axe-core` — WCAG 2.2 AA rule set, Playwright integration
- [WE-2] `w3c/WAI` — ARIA Authoring Practices for menu/listbox/slider/dialog
- [WE-3] `scottaohara/a11y-tom` — mentally associating ARIA verbs with role
- [WE-4] `marcysutton/aria-mf2d-react` — focus-trap patterns without libraries
- [WE-5] `ffoodd/a11y_html` — `aria-current` semantic conventions
- [WE-6] `tinkertoe/screen-reader-emoji` — screen-reader-first visual replacements
- [WE-7] `google/WebFundamentals` — `prefers-reduced-motion` patterns

### Color & contrast
- [WE-8] `LeaVerou/contrast-ratio` — OKLCH-friendly contrast math (works on `oklab` color space)

### Skills
- [WE-9] `@web-design-guidelines` (this pass's domain skill)
- [WE-10] `@owasp-security-check` (overlay: keyboard-injection XSS via aria-controls; ARIA injection not security)

---

## The 6 fixes (execute in order)

### 1 · Skip-to-content link
**Bug:** No way to skip past TopBar/Sidebar/Sidebar-Footer for keyboard users. Every Tab starts on the brand link.

**Do:**
- Create `frontend/src/components/a11y/SkipToContent.tsx`. Renders `<a href="#main-content" className="skip-to-content">Skip to main content</a>`.
- The first focusable element inside `<AppBody>`. `id="main-content"` should live on the `<main>` element in App.tsx (or be added if missing).
- CSS in `ocean.css`:
  ```css
  .skip-to-content {
    position: absolute; top: -100px; left: 0;
    background: var(--bio-glow); color: var(--ocean-abyss);
    padding: 8px 14px; border-radius: 6px;
    font-weight: 700; z-index: 200;
    transition: top 150ms ease-out;
  }
  .skip-to-content:focus-visible { top: 8px; }
  @media (prefers-reduced-motion: reduce) { .skip-to-content { transition: none !important; } }
  ```
- The link exists on every page.

### 2 · `aria-current="page"` on active sidebar item
**Bug:** VoiceOver/narrator skip telling the user which sidebar item is the current page.

**Do:**
- In `frontend/src/components/layout/Sidebar.tsx`, propagate `useLocation().pathname` and compute which item matches. Pass `aria-current="page"` on the matching `<Link>` or `<button>`.
- Compare against each item's `pathKey` (e.g. `'/portfolio'`). Use `startsWith(item.pathKey)` to handle `/portfolio/holdings/NVDA` style deep links correctly (`path === '/portfolio'` OR `path.startsWith('/portfolio/')`).

### 3 · Toast separate live-regions by tone
**Bug:** Toasts sometimes silent in screen readers because `role="status"` on each toast is masked by the parent.

**Do:**
- In `frontend/src/components/ui/Toast.tsx`, the viewport renders two `<div>` containers: one `role="status" aria-live="polite"` and one `role="alert" aria-live="assertive"`. Toasts route: success/info → status, error/warn → alert. The viewport itself: `role="presentation"` so SR doesn't see "list of 4 items".
- Each individual toast keeps its internal role only as a label anchor (`aria-labelledby`) pointing to the toast title content.

### 4 · Slider `aria-valuetext` is semantic + `riskLabels.ts` provides format
**Bug:** When user tabs to the risk slider, VoiceOver reads "7" or "70 percent" — not "7 of 10, Aggressive".

**Do:**
- Create `frontend/src/utils/riskLabels.ts`:
  ```ts
  export const RISK_LABELS = ['Conservative','Moderate','Balanced','Growth','Aggressive'];
  export function riskLabel(v: number): string {
    if (v <= 2) return 'Very Conservative';
    if (v <= 4) return 'Conservative';
    if (v <= 6) return 'Balanced';
    if (v <= 8) return 'Growth';
    return 'Aggressive';
  }
  export const CONFIDENCE_LABELS = ['Low','Low-Mod','Moderate','Mod-High','High'];
  export function confidenceLabel(v: number): string {
    if (v <= 2) return `${v}%, Low confidence`;
    if (v <= 4) return `${v}%, Low-Moderate confidence`;
    if (v <= 6) return `${v}%, Moderate confidence`;
    if (v <= 8) return `${v}%, Moderately-High confidence`;
    return `${v}%, High confidence`;
  }
  ```
- In `Slider.tsx` EDIT only (HARD GUARD applies — do NOT touch `Input`/`Select`/`Toggle`/`SegmentedControl`/`Field`/`InlineError`):
  - Forward `aria-valuetext` from props (ensure the prop is wired through `<input type="range">`).
  - Add `aria-orientation="horizontal"` default.
- Settings.tsx is NOT edited here (Phase 21 owns it) — but a later phase (or e2e test) verifies Slider's `aria-valuetext` produces `"7/10, Aggressive"` for `v=7` once Settings wires in `riskLabel`.

### 5 · Wire `prefers-color-scheme: dark|light` + `prefers-reduced-motion` final pass
**Bug:** "system" theme doesn't follow OS preference; reduced-motion overrides missing in 4 places.

**Do:**
- **Search-first:** before creating `frontend/src/hooks/useTheme.ts`, run `rg "useTheme" frontend/src` — if a hook is already exporting `{ theme, effectiveTheme, setTheme }`, EDIT that file instead of creating a parallel one. (Search confirmed no existing `useTheme` in the codebase, so this is NEW.)
- Create `frontend/src/hooks/useTheme.ts`:
  - On mount + on `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)`, if `localStorage['fin.theme'] === 'system'`, set `document.documentElement.dataset.theme = matches ? 'dark' : 'light'`.
  - On every other theme choice, write the literal to localStorage and stop listening (or set a noop addEventListener for system mode).
  - Export `useTheme(): { theme, effectiveTheme, setTheme }`.
- Reduced-motion: when `localStorage['fin.reducedMotion'] === 'true'`, attach `html[data-reduced-motion='true']` and ensure every CSS rule using transitions/animations uses `html[data-reduced-motion='true'] * { animation: none !important; transition: none !important; }` blanket override. Audit ocean.css for: fade-in keyframes in CommandPalette, BottomSheet (Phase 36), onboarding-card-rise, coach-marks-tooltip-rise, etc.

### 6 · axe-core sweep + integration test
**Bug:** No measurable accessibility baseline. CI doesn't enforce.

**Do:**
- Create `frontend/src/utils/audit.ts`:
  ```ts
  import AxeBuilder from '@axe-core/playwright';
  import type { Page } from '@playwright/test';
  export async function runAxeCheck(page: Page, opts?: { tags?: string[] }): Promise<void> {
    const tags = opts?.tags ?? ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
    const result = await new AxeBuilder({ page }).withTags(tags).analyze();
    if (result.violations.length > 0) {
      throw new Error(`axe-core violations:\n${JSON.stringify(result.violations.map(v => ({ id: v.id, impact: v.impact, desc: v.description, nodes: v.nodes.length })), null, 2)}`);
    }
  }
  ```
- Create `frontend/e2e/specs/37-accessibility.spec.ts`:
  ```ts
  import { test, expect } from '@playwright/test';
  import { runAxeCheck } from '../utils/audit';

  const ROUTES = ['/', '/portfolio', '/debt', '/retirement', '/memory', '/orchestrate', '/recommendations', '/execution', '/community', '/backtest', '/settings'];

  test.describe('axe-core accessibility', () => {
    for (const route of ROUTES) {
      test(`${route} has zero WCAG2AA violations`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await runAxeCheck(page);
      });
    }
  });

  test('Skip-to-content visible on Tab', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-to-content');
    await expect(skip).toBeFocused();
  });
  ```
- Add to `frontend/playwright.config.ts` (already configured for Chromium/iPhone/Mobile Chrome).
- The first failed violation = CI fail. The test runs as part of `npm run e2e`.
- (Optional, optional) Run the same in a Lighthouse CI step using `@axe-core/playwright` and `lhci/cli` (already in deps).

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only — VISIBLE RULE:** extend `ocean.css` with `--skip-bg`/`--skip-fg` if needed. **NO hex. NO `rgb()`. NO `hsl()`.** Every text color must pass `>=4.5:1` against its background with `LeaVerou/contrast-ratio` math (or visual check at 100/200/400/600/900 zoom).
2. **Form-primitive freeze (HARD GUARD):** see Scope block. Phase 32 owns `Field/Input/Select/Toggle/Slider/SegmentedControl/InlineError`. Only `Slider.tsx` is editable, only for `aria-valuetext`. **No drive-by refactors.**
3. **Phase 21 freeze (HARD GUARD):** Phase 21 owns `Settings.tsx`. Phase 37 does NOT edit it — e2e tests cover the Settings page's accessible behavior.
4. **Accessibility** — every fix listed above is non-negotiable. No "we'll do it later". The Playwright test runs on every CI commit; any violation fails the build.
5. **No new backend routes.** No new deps except `@axe-core/playwright` (already in devDeps at `frontend/package.json:43`); do **not** add `react-axe` runtime.
6. **No new heavy deps.** No `react-axe`.
7. **Performance** — accessibility add-ons (`<a className="skip-to-content">`) add < 100 bytes of HTML. Live-region roles cost nothing render-wise.
8. **Micro-interactions < 300ms** per Emil Kowalski. Skip-link reveal 150ms ease-out; reduced-motion → instant.
9. **Ponytail principle** — drop any redundant `<div aria-hidden>` wrappers. **One** `data-testid` per a11y surface (`skip-to-content`, `aria-current`, etc.).
10. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4 → 5 → 6 (Playwright last because failures block 5's results). Ship exactly 10 files.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/a11y src/components/ui/Toast.tsx src/components/layout/Sidebar.tsx src/App.tsx src/hooks/useTheme.ts src/utils/riskLabels.ts src/utils/audit.ts src/components/ui/forms/Slider.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/37-accessibility.spec.ts` (described in Fix 6). Run:

```bash
cd frontend && npx playwright test e2e/specs/37-accessibility.spec.ts --reporter=line
```

---

## Verification before declaring done (concrete, not vague)

1. `npm run e2e` (Playwright test 37-accessibility) — all routes report zero violations. **Assert: `runAxeCheck(page)` returns no thrown error for each of the 11 ROUTES.**
2. VoiceOver on macOS: open `/portfolio` → first Tab focuses `.skip-to-content` → "Skip to main content, link" announced; Enter skips past sidebar/topbar. **Assert: `getByRole('link', { name: 'Skip to main content' }).first()` is the first focusable element on `/`.**
3. VoiceOver on macOS: open `/settings` → Tab to any range input → arrow-up moves + reads "8 of 10, Growth" or similar semantic label. **Assert: the focused `<input type="range">` has `aria-valuetext` matching `/^\d+\/10, (Very Conservative|Conservative|Balanced|Growth|Aggressive)$/` (Phase 21's `Settings.tsx` rewires the consumer; Phase 37 only validates the primitive-surface behavior — do NOT pin to an unverified testId).**
4. macOS Settings → set OS to light mode, Fin's `theme: 'system'` follows automatically within 100ms. **Assert: `localStorage['fin.theme'] === 'system'` AND `document.documentElement.dataset.theme === 'light'`.**
5. Chromium DevTools: `prefers-reduced-motion: reduce` → no animation calls in Performance trace, no slide-up transitions visible. **Assert: trace records 0 entries with `name === 'Animation'`.**
6. Tab through CommandPalette: cycles within results, never escapes. **Assert: focus moves through search input → first result → last result → search input (focus trap cycle).**
7. Lighthouse a11y = 100 on all routes.
8. Playwright e2e 37-accessibility passes.
9. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files (counted: 5 NEW + 5 EDIT = 10; no extras). Search the diff for forbidden strings: any edit to `Input.tsx` / `Select.tsx` / `Toggle.tsx` / `SegmentedControl.tsx` / `Field.tsx` / `InlineError.tsx` / `Settings.tsx` → revert. Any hex literal in `ocean.css` additions → revert.

---

## Deliverable format

Reply with: bullet list of files changed (must be exactly 10), anything skipped (with reason — e.g. "Settings.tsx wiring deferred to a later phase because of the Phase 21 freeze"), and any new tech debt. **Strict ≤10 files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** the skip-to-content link in the same glassmorphic language. `aria-current` doesn't visually change anything — `.active` already conveys state. Reduced-motion audit: every new animation must include the override. Re-read `frontend/src/styles/ocean.css`.

<task>Now go.</task>
