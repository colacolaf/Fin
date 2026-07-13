# Design Principles

## Product Identity

A locally hosted desktop operating system for personal finance. The experience should feel like a native Apple app: calm, precise, and trustworthy.

## Visual Style

- **Minimalism**: Every element earns its place. No clutter, no decorative flourishes.
- **Light mode only**: No dark mode. Clean whites, soft grays, and one accent color.
- **Typography**: System fonts or Inter/Geist. Clear hierarchy.
- **Color palette**: Neutral and calm. One primary accent for actions. Functional colors for gains/losses.
- **Rounded corners, subtle shadows**: Native desktop feel.

## Layout

- **Dashboard-first**: The main screen is always the dashboard.
- **Agent corner**: A small, persistent area in the top-right corner shows the three agent buttons.
- **Chat as overlay**: Opening an agent slides in a chat panel from the right.
- **Settings as modal**: Account setup and preferences open in focused modals.
- **Loading screen**: On app open, an interactive loading screen syncs data. It is not skippable. The final loading screen implementation will be provided by the user.
- **Setup wizard**: First-run onboarding requires completing necessary tasks before the dashboard is accessible: set authorization key, set encryption key, connect portfolio, connect bank, connect debt, select local LLM model.

## Animations

- Subtle and purposeful. No ocean waves, no fins, no gimmicks.
- Use motion to indicate state changes, not to entertain.
- Respect `prefers-reduced-motion`.

## Dashboard Widgets

*Dashboard design will be defined in a later phase. Initial widgets may include:*

1. Portfolio value and allocation chart
2. Debt payoff trajectory chart
3. Retirement readiness timeline
4. Asset/property summary
5. Recent agent recommendations
6. Agent corner (Portfolio, Debt, Retirement)

## Interactions

- Click agent button → open chat panel
- Click dashboard widget → expand detailed view
- Right-click context menus for quick actions
- Keyboard shortcuts for power users

## Notifications

- Desktop native notifications for:
  - Agent finishes a task
  - Debt paid off
  - Debt milestone hit

## Platform

- Desktop only (cross-platform)
- Bundled app, single executable
- No browser, no mobile
