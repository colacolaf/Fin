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
5. `frontend/src/components/layout/ChromeShell.tsx` (or App.tsx's `AppBody`) — the right place to mount a `<a className="skip-to-content">`
6. `frontend/src/hooks/useGlobalHotkeys.ts` — combo parsing must accept screen-reader-friendly labels
7. `frontend/src/components/ui/forms/Toggle.tsx`, `Slider.tsx`, `SegmentedControl.tsx` — verify ARIA roles/values
8. `package.json` — `@axe-core/playwright ^4.12.1` is already a devDep; use it
9. `.codebuff/prompts/{fin-app-shell-keyboard-and-recovery,fin-keyboard-shortcuts-overlay}.md` — visual language + verification patterns
10. `.codebuff/prompts/fin-accessibility-audit-pass.md` (this file)

---

## User's report
> A blind friend asked me to demo Fin. VoiceOver on macOS reads the sidebar items but skips the active route state — they couldn't tell which page they were on. Focus rings are usually visible, but `<input type="range">` sliders on Settings → Agent Preferences → Risk tolerance don't announce "Aggressive" — they just read "7 of 10". Toasts sometimes appear silently because `role="status"` lives on the alert wrapper but not the live-region. Skip-to-content link isn't there. The colored dot in the TopBar sync pill has no textual alternative for SR users (the text label is fine, but the dot color's meaning isn't reachable without seeing colors). I want a measurable accessibility score: zero axe-core violations on every route, and a manual pass on the flows focus-trapped in Popovers + CommandPalette + KeyboardShortcuts overlay.

## What "good" looks like (per spec)

- **axe-core sweep: zero violations of WCAG 2.2 AA on every route** — `/`, `/portfolio`, `/debt`, `/retirement`, `/memory`, `/orchestrate`, `/recommendations`, `/execution`, `/community`, `/backtest`, `/settings`, `/offline`. The Playwright executor with `@axe-core/playwright` runs on each route and fails the build on any violation. Color contrast: text contrast ≥ 4.5:1, large text/ui ≥ 3:1. (Auto-corrected violations block CI.)
- **`aria-current="page"` on the active sidebar item** — sidebar items currently use only `.active` className; add `aria-current="page"` when `pathname` matches the item's route.
- **Skip-to-content link** — `<a href="#main-content" className="skip-to-content">Skip to main content</a>` mounted first in `<AppBody>` (before TopBar / Sidebar). Hidden visually but focusable; visible on `:focus-visible` with OKLCH-tinted outline. `Tab` once = skip the entire chrome.
- **Live-region for toasts** — separate `<div role="status" aria-live="polite">` (success/info) and `<div role="alert" aria-live="assertive">` (error/warn) containers that receive toasts. VoiceOver/SR announces insertion. The viewport itself stays `aria-live="off"`.
- **Slider `aria-valuetext`** — every slider reads semantic label via `aria-valuetext` (already on Slider.tsx — verify the formatter is wired: `risk` → `"7/10, Aggressive"`, `confidence` → `"75%, Moderate"`).
- **Color is never the sole indicator** — the TopBar freshness pip has an SR-only visual alternative. Add `<span className="visually-hidden">{label}</span>` already there for the text, but the pip color must be encoded in the text label, not just color. Verify label says "Synced" / "5 minutes ago" / "30 minutes ago" — humans can tell by reading without seeing colors.
- **Focus skipping mobile breakpoints** — `.sidebar` is `tabIndex={-1}` on desktop (Tab moves past sidebar), but on mobile when sidebar is overlay, focus must NOT skip into it when closed. Verify the existing focus-trap behavior.
- **Reduced-motion final sweep** — every animation we ship must have a `@media (prefers-reduced-motion: reduce) { ... transition: none !important; animation: none !important; }` rule in `ocean.css`. Verify Toast, CommandPalette open/close, Popover enter/exit, BottomSheet slide (Phase 36), skeleton shimmer.
- **Touch targets ≥ 44px** on mobile — sidebar items, TopBar pills, settings-row controls. Verify.
- **Form-field labels always wired** — `<Field label="Theme">` renders `<label htmlFor=…>` if the child has `id`. Verify the auto-derive from id-aware primitives (Input/Select/Toggle/Slider/SegmentedControl).
- **No `prefers-color-scheme` mismatch** — currently no "system" theme actually responds to OS preference. Wire `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)` and apply to `document.documentElement.dataset.theme` when theme preference is "system" (existing `fin.theme` localStorage key).

**Scope of THIS pass:** `frontend/src/components/a11y/SkipToContent.tsx` (NEW), `frontend/src/components/ui/Toast.tsx` (extend with separate live-regions per tone + aria-levels), `frontend/src/components/layout/Sidebar.tsx` (add `aria-current="page"` on active), `frontend/src/components/ui/forms/Slider.tsx` (verify valuetext wiring), `frontend/src/App.tsx` (mount SkipToContent + listen to prefers-color-scheme changes), `frontend/src/utils/audit.ts` (axe-core helper for tests), `frontend/src/styles/ocean.css` (add reduced-motion overrides for any missing anim transitions), `frontend/e2e/specs/37-accessibility.spec.ts` (NEW), `frontend/src/hooks/useTheme.ts` (NEW lightweight) or extend existing pattern. **Frontend only.**

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

### 4 · Slider `aria-valuetext` is semantic
**Bug:** When user tabs to the risk slider, VoiceOver reads "7" or "70 percent" — not "7 of 10, Aggressive".

**Do:**
- In `frontend/src/components/ui/forms/Slider.tsx`, ensure the `aria-valuetext` prop is wired and the App.tsx/Settings.tsx callers pass a function `(v) => \`${v}/10, \${riskLabel(v)}\``. Create `frontend/src/utils/riskLabels.ts` with:
  ```ts
  export const RISK_LABELS = ['Conservative','Moderate','Balanced','Growth','Aggressive'];
  export function riskLabel(v: number): string {
    if (v <= 2) return 'Very Conservative';
    if (v <= 4) return 'Conservative';
    if (v <= 6) return 'Balanced';
    if (v <= 8) return 'Growth';
    return 'Aggressive';
  }
  ```
- Confidence slider: `aria-valuetext={v => \`${v}%, ${actionLevel(v)}\`}` with a similar `confidenceLabels`.
- Verify in `<Settings />` flows.

### 5 · Wire `prefers-color-scheme: dark|light` + `prefers-reduced-motion` final pass
**Bug:** "system" theme doesn't follow OS preference; reduced-motion overrides missing in 4 places.

**Do:**
- Extend `frontend/src/App.tsx` (or `frontend/src/hooks/useTheme.ts` NEW lightweight):
  - On mount + on `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)`, if `localStorage['fin.theme'] === 'system'`, set `document.documentElement.dataset.theme = matches ? 'dark' : 'light'`.
  - On every other theme choice, write the literal to localStorage and stop listening (or set a noop addEventListener for system mode).
- Reduce motion: when `localStorage['fin.reducedMotion'] === 'true'`, attach `html[data-reduced-motion='true']` and ensure every CSS rule using transitions/animations uses `html[data-reduced-motion='true'] * { animation: none !important; transition: none !important; }` blanket override. Audit ocean.css for: fade-in keyframes in CommandPalette, BottomSheet (Phase 36), onboarding-card-rise, coach-marks-tooltip-rise, etc.

### 6 · axe-core sweep + integration test
**Bug:** No measurable accessibility baseline. CI doesn't enforce.

**Do:**
- Create `frontend/e2e/specs/37-accessibility.spec.ts`:
  ```ts
  import { test, expect } from '@playwright/test';
  import AxeBuilder from '@axe-core/playwright';

  const ROUTES = ['/', '/portfolio', '/debt', '/retirement', '/memory', '/orchestrate', '/recommendations', '/execution', '/community', '/backtest', '/settings'];

  test.describe('axe-core accessibility', () => {
    for (const route of ROUTES) {
      test(`${route} has zero WCAG2AA violations`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])
          .analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
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

1. **OKLCH palette only** — extend `ocean.css` with `--skip-bg`/`--skip-fg` if needed. NO hex. Verify every text color passes `>=4.5:1` against its background with `LeaVerou/contrast-ratio` math (or visual check at 100/200/400/600/900 zoom).
2. **Accessibility** — every fix listed above is non-negotiable. No "we'll do it later". The Playwright test runs on every CI commit; any violation fails the build.
3. **No new backend routes.** No new deps except for `@axe-core/playwright` (already in devDeps).
4. **No new heavy deps.** No `react-axe` runtime; `axe-core` is test-only.
5. **Performance** — accessibility add-ons (`<a className="skip-to-content">`) add < 100 bytes of HTML. Live-region roles cost nothing render-wise.
6. **Micro-interactions < 300ms** per Emil Kowalski. Skip-link reveal 150ms ease-out; reduced-motion → instant.
7. **Ponytail principle** — drop any redundant `<div aria-hidden>` wrappers. **One** `data-testid` per a11y surface (`skip-to-content`, `aria-current`).
8. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4 → 5 → 6 (Playwright last because failures block 5's results). Ship ≤10 files.

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

## Verification before declaring done

1. `npm run e2e` (Playwright test 37-accessibility) — all routes report zero violations.
2. VoiceOver on macOS: open `/portfolio` → first Tab focuses `.skip-to-content` → "Skip to main content, link" announced; Enter skips past sidebar/topbar.
3. VoiceOver on macOS: open `/settings` → navigate to Risk slider → arrow-up moves + reads "8 of 10, Growth".
4. macOS Settings → set OS to light mode, Fin's `theme: 'system'` follows automatically within 100ms.
5. Chromium DevTools: `prefers-reduced-motion: reduce` → no animation calls in Performance trace, no slide-up transitions visible.
6. Tab through CommandPalette: cycles within results, never escapes.
7. Lighthouse a11y = 100 on all routes.
8. Playwright e2e 37-accessibility passes.
9. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** the skip-to-content link in the same glassmorphic language. `aria-current` doesn't visually change anything — `.active` already conveys state. Reduced-motion audit: every new animation must include the override. Re-read `frontend/src/styles/ocean.css`.

<task>Now go.</task>
