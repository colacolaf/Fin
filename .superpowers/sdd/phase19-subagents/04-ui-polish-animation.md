# Subagent 4: UI Polish & Animation Pass

## Scope
Execute the full `impeccable` + `ui-animation` polish pass on all UI surfaces: Ocean Dashboard, portfolio views, recommendation cards, debt payoff, retirement projections, execution tracking, community/leaderboards, backtesting, settings, and shared components.

## Skills to Use
- **`impeccable`**: Design polish, visual hierarchy, cognitive load reduction, spacing/typography/color audit, empty states, error states
- **`ui-animation`**: Motion design — page transitions, card hover effects, count-up numbers, typewriter text, toast notifications, score ring animation
- **`emil-design-eng`**: The invisible details that make software feel great — micro-interactions, subtle transitions, polish details

## MCP Servers
- **playwright** (`@playwright/mcp`): Visual inspection of each page, screenshot comparison
- **exa** (`https://mcp.exa.ai/mcp`): Reference for animation patterns, CSS techniques

## GitHub References
- **Framer Motion**: https://www.framer.com/motion/ — React animation library
- **D3.js transitions**: https://d3js.org/d3-transition
- **CSS animations**: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
- **React Spring** (alternative): https://www.react-spring.dev/

## Tasks

### 1. Global Design System Audit
- [ ] Audit typography: verify 4px grid spacing baseline across all components
- [ ] Audit color palette: ensure consistent token usage, no hardcoded colors
- [ ] Verify CSS custom properties in `index.css` cover all design tokens
- [ ] Check responsive breakpoints: 320, 768, 1024, 1440 — no layout breaks
- [ ] Verify dark mode support across all components (if implemented)

### 2. Ocean Dashboard Polish
- [ ] Ocean fin animation: smooth, continuous swimming motion (Three.js/D3)
- [ ] Fin glow/shine effect on hover
- [ ] Dashboard cards: consistent card design (border-radius, shadow, padding)
- [ ] Loading skeleton: wave animation on placeholder cards
- [ ] Empty state: helpful illustration + CTA for new users
- [ ] Net worth counter: count-up animation from 0 to actual value

### 3. Portfolio Views
- [ ] Holdings table: row hover highlight, smooth sort transitions
- [ ] Allocation pie chart: animated segment entry, hover tooltip with smooth fade
- [ ] Performance line chart: animated path drawing, gradient fill
- [ ] Gain/loss color transitions (green ↔ red with smooth color interpolation)
- [ ] Concentration meter: animated fill from 0 to actual %

### 4. Recommendation Cards
- [ ] Card entry animation: staggered fade-in + slide-up
- [ ] Confidence ScoreRing: circular progress animation (SVG stroke-dashoffset)
- [ ] Accept/Reject/Snooze: button press feedback (scale bounce)
- [ ] Card removal animation on action (slide-out + fade)
- [ ] Filter/sort controls: smooth list reordering

### 5. Debt Payoff Dashboard
- [ ] Debt snowball/avalanche toggle: smooth switch animation
- [ ] Payoff timeline chart: animated path
- [ ] Extra payment slider: animated fill track, debounced recalculation
- [ ] Debt card: progress bar with animated fill
- [ ] Payoff celebration: confetti or particle effect on debt-zero event

### 6. Retirement Projections
- [ ] Monte Carlo chart: animated simulation paths (staggered fade-in)
- [ ] Income replacement gauge: needle animation to target
- [ ] Scenario comparison: smooth transition between optimistic/baseline/pessimistic
- [ ] Retirement age slider: animated projection update

### 7. Execution & Check-Ins
- [ ] CheckInBanner: slide-down entrance, pulse animation for urgency
- [ ] BeforeAfter comparison: slider drag to reveal (before/after image compare)
- [ ] Progress tracker: step completion animation (checkmark draw + fill)
- [ ] Check-in rating: star/emoji tap animation

### 8. Community & Leaderboards
- [ ] Leaderboard: row entry animation, position change indicators
- [ ] VoteWidget: upvote/downvote button press feedback
- [ ] BenchmarkComparison: animated bar chart race

### 9. Backtesting & Data Refresh
- [ ] StrategyBuilder: form step transitions
- [ ] ResultTransition: morph animation from strategy → results
- [ ] HistoricalReplay: timeline scrubber animation
- [ ] Refresh indicator: spinning icon during refresh, success pulse

### 10. Shared Components
- [ ] Toast notifications: slide-in from top-right, auto-dismiss with progress bar
- [ ] Modal: scale + fade entrance, backdrop blur
- [ ] Tabs: underline slide animation
- [ ] Page transitions: route change fade/slide (optional, keep subtle)
- [ ] Button: hover scale (1.02), active press (0.98), focus ring pulse

### 11. Micro-interactions (Emil-level polish)
- [ ] Input focus: smooth border color transition
- [ ] Checkbox/radio: custom animated checkmark
- [ ] Dropdown: expand animation with option stagger
- [ ] Tooltip: fade-in with arrow
- [ ] Drag handles: subtle wiggle on hover
- [ ] Copy-to-clipboard: brief checkmark confirmation

## Output Requirements
- All animations use `prefers-reduced-motion` media query to disable for accessibility
- Performance: animations use `transform` and `opacity` only (GPU-composited, no layout thrashing)
- Use Framer Motion `AnimatePresence` for enter/exit animations
- Consistent easing curves across all animations (use CSS variables or shared tokens)
- No animation exceeds 300ms for micro-interactions (feel snappy, not sluggish)

## Done Criteria
- Visual audit: every page inspected at 320, 768, 1024, 1440 — no layout breaks, no jank
- All loading states have skeleton/spinner (no flash of empty)
- All empty states have helpful illustration + CTA
- All error states have retry + human-readable message
- `prefers-reduced-motion: reduce` disables all non-essential animations
- No `console.error` from animation libraries
- Framer Motion (or CSS) animations hit 60fps on mid-range device