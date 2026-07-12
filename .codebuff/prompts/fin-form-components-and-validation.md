# Phase 33 — Form Components & Validation Layer (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to replace the proliferation of raw `<input>`s and inconsistent validation with a small primitives library (`Field`, `Input`, `Select`, `Slider`, `Toggle`, `RadioGroup`, `NumberInput`, `InlineError`, `FormSection`) that all conform to the Ocean visual language. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@web-design-guidelines` `@vercel-react-best-practices`

**Hard gates:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead of integrating."
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features/Mobile_and_offline_support.md` (mobile form ergonomics)
2. `frontend/src/styles/ocean.css` — OKLCH tokens (Settings use `oklch(0.18/0.015/205)` blur; reuse)
3. `frontend/src/pages/Settings.tsx` — 4 form surfaces: Account email, connector keys (Alpaca API key/secret), agent prefs (risk slider / cadence seg / min-confidence slider)
4. `frontend/src/components/StrategyBuilder.tsx` — name / category / description / code area
5. `frontend/src/components/BacktestDashboard.tsx` — backtest form inputs
6. `frontend/src/components/SetupWizard.tsx` (if present) — onboarding forms
7. `frontend/src/api/integrations.ts` — connector validation expectations
8. `shared/src/types.ts` & `shared/src/constants.ts` — existing model types
9. `backend/routers/settings.py`, `routers/integrations.py` — validation surface (Zod-equivalent on frontend must mirror or document divergence)
10. `.codebuff/prompts/{fin-settings-pro,fin-portfolio-cockpit,fin-toast-notification-surface}.md`
11. `.codebuff/prompts/fin-form-components-and-validation.md` (this file)

---

## User's report
> Settings has 12+ raw `<input>`s and `<select>`s with no consistent focus ring, no error states, no help text, mixed required / not-required handling. The Alpaca API key field shows placeholder `AKXXXXXXXXXXXXXXXXXX` and accepts literally anything (no key length / character validation). The risk-tolerance slider shows a number next to it but never tells the user what 7/10 means. Forms feel like a developer demo, not a professional product. I want one primitives library that all forms use — and per-field validation that calls out a problem inline before the user submits.

## What "good" looks like (per spec)

- **One primitives library** at `frontend/src/components/ui/forms/` with: `Field` (label/help/error wrapper), `Input` (text/email/password/number variants), `Select`, `MultiSelect`, `Slider`, `Toggle`, `RadioGroup`, `Checkbox`, `NumberInput` (with increment/decrement buttons), `TextArea`, `InlineError`, `FormSection`.
- **Validation surface**: every primitive accepts `error?: string` and renders an `InlineError` below. The wrapper `<Field>` surfaces `required`, `description`, `error`. Validation runs via `validate()` callback supplied by the page (return a string error or undefined). Submit-time + onBlur validation both work.
- **Visual continuity** — primitives ARE the Ocean glassmorphic surface, not "Material-on-Ocean" or "plain HTML in a glassmorphic pane". Focus ring is `--bio-glow`, error color is `--status-error` (existing tokens). The Alpaca placeholder string `AKXXXXXXXXXXXXXXXXXX` becomes a short description "Starts with AK, 20 chars" with mask-toggle for the secret.
- **Help text + required + counts** — every primitive has a slot for `description` (small muted text below the label) and `required` indicator (`*` after the label). Selects and TextAreas support `showCount` (character counter).
- **Keyboard-first** — `Tab` traverses primitives in DOM order; `Shift+Tab` reverse; `Enter` on text inputs moves to submit (default browser); `Escape` clears the field if its `(onEscapeClear)` is set; arrow keys adjust sliders/number inputs; space toggles the `Toggle`.
- **Accessibility** — labels associated with `for=id`/`id=` pairs by `<Field>` automatically (props `id`/`htmlFor` derived). Error state gets `aria-invalid="true"` + `aria-describedby` pointing to `<InlineError id>`. Reduced-motion respected on toggle thumb.

**Scope of THIS pass:** 8 NEW files in `frontend/src/components/ui/forms/`, replace raw inputs in `Settings.tsx` and `StrategyBuilder.tsx`, extend `ocean.css` with form tokens. **Frontend only.** Validation is local + Zod-mirror of backend if convenient (Zod is already in deps).

## GitHub repos referenced

### Form library inspiration
- [WE-1] `shadcn/ui` — primitives mirror this API surface (`<FormField>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>` — we use shorter Field/Input names)
- [WE-2] `radix-ui/primitives` — accessibility primitives for Toggle/RadioGroup/Slider
- [WE-3] `react-hook-form` — we use `react-hook-form` + `@hookform/resolvers` which are **already in deps**; integrate but keep things zero-config for consumers
- [WE-4] `zod` — already in deps; primitives accept a `schema?: z.ZodTypeAny` prop and infer error messages via `safeParse`

### Validation patterns
- [WE-5] `vercel/next.js` — server-action validation patterns; we mirror the UX (validate on the way out, surface errors inline)
- [WE-6] `linear/linear-app` settings form patterns (label + description + error, never surprise-required)

### Skills
- [WE-7] `@web-design-guidelines` (this pass's domain skill)
- [WE-8] `@vercel-react-best-practices` (this pass's domain skill)

---

## The 6 fixes (execute in order)

### 1 · `<Field>` (label/help/error wrapper) + `<InlineError>` + `<FormSection>`
**Bug:** Every form re-renders label + help + error markup inline. Inconsistent. Lacks accessibility wiring.

**Do:**
- Create `frontend/src/components/ui/forms/Field.tsx`:
  ```tsx
  Field.propTypes = {
    label: string,                 // string for static, function(children) for compound slot
    description?: string,
    required?: boolean,
    error?: string,
    children: ReactNode,           // the actual input
    htmlFor?: string,              // auto-derived from children id
    className?: string,
    inline?: boolean,
  }
  ```
  Renders: optional `<span className="field-label">label</span>` + `<span className="field-required">*</span>` (if required) + `<div className="field-children">{children}</div>` + `<span className="field-description">{description}</span>` (if present) + `<InlineError message={error} />`. aria-wires labels via `htmlFor`.
- `<InlineError>` is just `<span role="alert" aria-live="polite" className="field-error" data-testid="field-error">{message}</span>`. Color via `--status-error`. Reduced-motion respected (no shake animation; we just render).
- `<FormSection>` is a vertical stack with optional title/eyebrow — basically `<form><h3>...</h3><Field /><Field /></form>` flattened. Reuse SettingsSection when possible.

### 2 · `<Input>` (text/email/password/number/textarea) with mask toggle + character counter
**Bug:** Settings uses `<input>` directly. No focus ring consistency. Alpaca secret shows friction on every focus because of re-renders. No length counter on connector keys.

**Do:**
- `frontend/src/components/ui/forms/Input.tsx`. Variants: `text`, `email`, `password`, `number`, `search`, `url`. Internal wrappers around raw `<input>` with our focus ring + glassmorphic bg.
- Props: `value`, `onChange`, `placeholder?`, `disabled?`, `readOnly?`, `invalid?`, `showCount?` (textarea only), `maxLength?`, `autoComplete?`, `prefix?`, `suffix?`, `maskToggle?` (password only — renders an eye icon).
- `maskToggle` prop: when type=password, renders an `IconEye`/`IconEyeOff` suffix button that toggles `type=password` ↔ `type=text`. Click should NOT trigger blur on the input (use `mousedown.preventDefault()` style — or wrap in a span and use pointer-events carefully).
- `<TextArea>` lives in the same file as `<Input>` (separate export), with optional `rows`, `showCount`, `maxLength`, monospace-like or normal font variants.

### 3 · `<Select>` + `<MultiSelect>` with searchable variant
**Bug:** Settings uses raw `<select>` with no styling. Category dropdown in StrategyBuilder similarly.

**Do:**
- `frontend/src/components/ui/forms/Select.tsx`. Native `<select>` underneath (best a11y on macOS / mobile), wrapped with our `.field-select` class so it visually matches Input. `prefix`/`suffix` slots optional.
- Variants:
  - `default` — `<select>` rendered as-is with custom styling
  - `searchable` — wraps native and adds a custom dropdown (uses `Popover`-style from Phase 26 if exists; else new)
- `<MultiSelect>` — searchable variant of Select with chips for selections. Keep under 200 LOC. Items: `{ value: string; label: string }[]`.
- Common props: `value`, `onChange`, `options`, `placeholder`, `disabled`, `invalid`, `error`.

### 4 · `<Slider>` with floating value tooltip, `<NumberInput>` with stepper buttons
**Bug:** Risk-tolerance + min-confidence sliders in Settings show a value next to them but the value can't be entered directly. Slider thumb has no tooltip on drag.

**Do:**
- `frontend/src/components/ui/forms/Slider.tsx`. Wraps `<input type="range">` with `min`, `max`, `step`, `value`, `onChange`. Adds:
  - A floating value chip ABOVE the thumb on `:focus`/`:active` — uses CSS `::after` with the live value (read via `data-value` attr or a parallel `<output>` element).
  - An optional `labelFormatter?: (v: number) => string` — for example risk slider returns `"7/10 — Aggressive"`, min-confidence returns `"75%"`.
  - `aria-valuetext` updated to formatted label so screen readers hear semantic meaning, not just the number.
- `frontend/src/components/ui/forms/NumberInput.tsx`. Wraps `<Input type="number">` with increment/decrement buttons. Keyboard: arrow up/down adjust by step. Min/max enforced.

### 5 · `<Toggle>`, `<RadioGroup>`, `<Checkbox>`
**Bug:** Settings already has `.toggle` CSS but the React class binding is raw. No `<RadioGroup>` exists. Checkbox everywhere uses raw HTML.

**Do:**
- `<Toggle>` (rewrite). Controlled: `checked`, `onChange`. Includes `aria-checked`, `role="switch"`, focus ring on the thumb. Reduced-motion neuters the thumb slide (instant). Re-use Settings' existing `.toggle` CSS.
- `<RadioGroup>` — accessible radio group with arrow-key navigation. Props: `name`, `value`, `onChange`, `options`, `legend?`. Single source of truth for the env selector (Paper/Live) and theme selector.
- `<Checkbox>` — `<input type="checkbox">` styled to match. `indeterminate` supported (for "select all" inside Tables — Phase 23 follow-up).
- All three share `<Field>` integration: `<Field label="Environment"><Toggle /></Field>` works because `<Field>` listens for `id`/`htmlFor` or just wraps.

### 6 · Wire `Settings.tsx` + `StrategyBuilder.tsx` to the primitives library
**Bug:** Even with new primitives, if Settings keeps its raw inputs, nothing improves. We must migrate.

**Do:**
- Replace `<input className="settings-input">` in Settings with `<Input>` primitive (one-to-one mapping). Replace `<select className="settings-select">` with `<Select>`. Replace `<input type="range">` with `<Slider>`. Replace `<div className="toggle">` with `<Toggle>`. Replace the env Paper/Live `seg` block with `<RadioGroup>`.
- Replace StrategyBuilder's `inputStyle` raw `<input>`s with `<Input>` + `<Select>` primitives. Replace the `<textarea>` with `<TextArea>` primitive.
- Don't replace the Theme `seg` block (`dark/light/system`) just yet — that's a `<RadioGroup>` with custom pill styling. Optional, defer to Phase 34 or keep piecewise in Settings.
- Files counted toward the 10-file budget: `Settings.tsx`, `StrategyBuilder.tsx`, `ocean.css` (extensions), 8 new primitive files.
- Validation wiring: Settings' email field validates `z.string().email()`; Alpaca key validates `z.string().startsWith('AK').length(20)` (if you can; otherwise length ≥ 16); Alpaca secret validates `z.string().min(16)`. Display inline errors via `<InlineError>`.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend `ocean.css` with `--field-bg`, `--field-border`, `--field-focus-ring`, `--field-label-color`, `--field-required-color`, `--field-error-color` (mirror existing `--status-error`). **NO hex.**
2. **Accessibility** — every primitive has `aria-invalid` wired to its `<Field>` error. Labels via `htmlFor`/`id`. Sliders announce semantic value via `aria-valuetext`. Required asterisk alternative text via `aria-label="required"`. Touch targets ≥ 36px (≥ 44px for primary inputs).
3. **No new backend routes** — Zod schemas are local mirrors of backend validation. Divergences must be documented inline (`// TODO: backend requires minLength=10, frontend allows 8 — see Backend_Architecture.md § Routing`).
4. **No new heavy deps** — `react-hook-form` + `@hookform/resolvers` + `zod` already in `package.json`. Integrate but DO NOT make `useForm()` mandatory; calling primitives without a form context must work.
5. **Performance** — primitives are stateless where possible. Each renders in 1 frame; no re-render storms. Field's `htmlFor` derivation is `useMemo`'d on prop identity.
6. **Micro-interactions < 300ms** per Emil Kowalski. Focus ring fade-in 150ms ease-out; toggle thumb slide 180ms ease-out; slider value chip pop-in 120ms ease-out; mask toggle instant.
7. **Ponytail principle** — delete before adding. Drop redundant `<input className="settings-input">`-style raw inputs in favor of `<Input>`. **One** `data-testid` per primitive (`data-testid={\`field-\${id}\`}`). No new icon deps. Reuse existing `Icons.tsx` for `IconEye`, `IconEyeOff`, `IconPlus`, `IconMinus`.
8. **`@subagent-driven-development` mandatory** — spawn one subagent per fix where independent. Sequence 1 → 2 (Field before Inputs) → 3-5 in parallel → 6 (consumer wiring last).

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui/forms src/pages/Settings.tsx src/components/StrategyBuilder.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/33-forms.spec.ts`:
- Settings email field validates invalid email → inline error appears
- Alpaca key field accepts too-short input → inline error
- Password mask toggle works, focus preserved
- Risk slider arrow keys adjust by 1, displays formatted label
- Toggle keyboard: Space toggles
- RadioGroup keyboard: arrow keys move selection
- Reduced motion: toggle thumb slides in instantly

```bash
cd frontend && npx playwright test e2e/specs/33-forms.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173/settings`:
   - Account email field → invalid email inline error
   - Connections tab → Alpaca key with `maskToggle` on secret reveals/hides
   - Agent Preferences → risk slider value chip pops in on focus; arrow keys adjust; formatted label visible
   - Toggle reduced-motion respects the toggle thumb
   - Tab order: Account email → Theme segmented → Currency select → Reduced-motion toggle → (Connections tab) → API Key → Secret → Environment radio
2. Open `/backtest` → StrategyBuilder inputs render with consistent focus rings.
3. DevTools → Lighthouse → 100 a11y on `/settings`.
4. Lighthouse a11y ≥ 100, perf ≥ 90.
5. Playwright e2e 33-forms passes.
6. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors, no new deps.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** match Phases 19-30 visual language. Forms feel like the same glassmorphic surface but "active". Re-read `frontend/src/styles/ocean.css` for tokens.

<task>Now go.</task>
