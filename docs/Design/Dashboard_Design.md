# Fin Dashboard Design — Wave-Riding Agent Overview

**Version:** 2.0  
**Updated:** July 2026  
**Status:** Design spec ready for implementation

---

## 1. Overview

The Fin Dashboard is the first screen a user sees after onboarding. It visualizes the three Fin agents — Investment, Debt, and Retirement — as detailed shark fins riding a shared ocean wave. Each fin shows the agent’s current confidence/status, can be tapped for more info, and navigates to the agent’s chat/context view.

The design reinforces Fin’s ocean/fin identity: calm, trustworthy, and always moving forward.

---

## 2. Visual Language

### Color Palette

| Element | Color | Hex | Usage |
|--------|-------|-----|-------|
| Sky | Light blue | `#C9E9F6` | Top background |
| Background | Ocean blue | `#87CEEB` | Main dashboard background |
| Wave base | Medium blue | `#4A9FD4` | Wave body |
| Wave foam | White | `#FFFFFF` | Wave crests and foam |
| Wave shadow | Darker blue | `#2E7DB3` | Wave undersides |
| Investment fin | Aqua green | `#2FE0A8` | Investment agent marker |
| Debt fin | Coral | `#FF6B6B` | Debt agent marker |
| Retirement fin | Gold | `#FFD166` | Retirement agent marker |
| Text primary | Dark navy | `#0B1B2B` | Headings, labels |
| Text secondary | Muted blue | `#5A7A96` | Subtitles, metadata |
| Status good | Green dot | `#2FE0A8` | Healthy confidence/data |
| Status warning | Amber dot | `#FFD166` | Needs attention |
| Status missing | Red dot | `#FF6B6B` | No data / error |
| Sidebar | Deep navy | `#0B1B2B` | Side panel background |

### Typography
- **Heading:** Inter 600, 28px — "Welcome back"
- **Agent label:** Inter 500, 16px
- **Confidence badge:** Inter 600, 14px
- **Info popup text:** Inter 400, 13px

---

## 3. Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ≡   Welcome back                              Last sync: 2m│
│                                                             │
│                    ☁️        ☁️                            │
│                                                             │
│          ┌─────────────────┐                                │
│          │ 82% confidence  │                                │
│          │      ℹ 🟢       │                                │
│              🦈                                             │
│           Investment                                        │
│                                                             │
│     ┌─────────────────┐                                     │
│     │ 67% confidence  │                                     │
│     │      ℹ 🟡       │                                     │
│         🦈                                                  │
│          Debt                                               │
│                                                             │
│                    ┌─────────────────┐                      │
│                    │    No data      │                      │
│                    │      ℹ 🔴       │                      │
│                        🦈                                   │
│                     Retirement                              │
│                                                             │
│  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  │
│ /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\│
│/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\│
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Components

### 4.1 Agent Fin

Each agent is represented by a detailed, stylized shark fin icon that rides on the wave.

- **Shape:** Realistic shark-fin silhouette with curved leading edge, pointed tip, and trailing edge detail
- **Color:** Unique per agent (Investment = aqua, Debt = coral, Retirement = gold)
- **Position:** Placed at different heights on the wave to avoid overlap
- **Animation:** Subtle bobbing motion synchronized with the wave, plus a small splash effect on crest

### 4.2 Confidence Badge

Floating above each fin:

```
┌────────────────────┐
│ 82% confidence  ℹ │
└────────────────────┘
```

- Shows confidence percentage or "No data"
- Status dot: 🟢 good, 🟡 warning, 🔴 missing
- The ℹ icon is tappable/clickable

### 4.3 Info Popup

Tapping the ℹ icon opens a small card next to the badge:

```
┌─────────────────────────────┐
│ Investment Agent              │
│ Last sync: 2 min ago        │
│ Data freshness: Fresh         │
│ Confidence: 82%               │
│ Status: Ready to assist       │
└─────────────────────────────┘
```

Content:
- Agent full name
- Last sync time
- Data freshness (Fresh / Stale / Missing)
- Confidence score explanation
- Short status message

### 4.4 Sidebar

A slide-in/out sidebar on the left. On desktop it can be toggled open/closed; on mobile it is a full-screen drawer.

```
Closed state:                    Open state:
┌──┐                             ┌──────────────┐
│≡ │  Welcome back                │  Fin         │
│  │                              │              │
│  │  [waves + fins]             │  Dashboard   │
│  │                              │  Portfolio   │
│  │                              │  Analytics   │
│  │                              │  Settings    │
│  │                              │              │
│  │                              │  Agents      │
│  │                              │  ─────────   │
│  │                              │  Investment  │
│  │                              │  Debt        │
│  │                              │  Retirement  │
└──┘                             └──────────────┘
```

- **Open button**: Hamburger icon in the top-left corner
- **Close button**: X icon in the top-right corner of the sidebar
- **Waves**: contained entirely within the main content area; they never extend under the sidebar
- **Items**:
  - Dashboard
  - Portfolio
  - Analytics
  - Settings
  - Agent shortcuts (Investment, Debt, Retirement)

Each agent item navigates to the agent’s chat/context view as a fallback if the fin tap is missed.

---

## 5. Wave Design

The waves should look like hand-drawn ocean waves with:
- Curved, rolling crests
- White foam at the crests
- Subtle shadow/depth on the wave underside
- Multiple overlapping wave layers for depth
- Light blue ocean surface

### Wave Layers
1. **Background wave** — darker blue, slower movement
2. **Mid wave** — medium blue, medium movement
3. **Foreground wave** — lighter blue with white foam, fastest movement

### Wave Animation
- Each layer moves horizontally in a continuous loop
- Foreground wave moves fastest, background slowest (parallax effect)
- Fins bob up and down with the foreground wave
- Foam particles appear at crests periodically

---

## 6. Animations

| Element | Animation |
|---------|-----------|
| Waves | Continuous horizontal scroll with parallax |
| Fins | Bobbing motion synced to wave crests |
| Foam | Brief splash/foam burst at wave crests |
| Badges | Fade in/out on hover |
| Info popup | Scale + fade in when ℹ tapped |
| Sidebar | Slide in from left on mobile, persistent on desktop |
| Fin hover | Slight scale up + glow |

---

## 7. Interactions

| Action | Result |
|--------|--------|
| Tap fin | Navigate to agent chat/context view |
| Tap ℹ icon | Open info popup for that agent |
| Tap hamburger / swipe left-to-right | Open side panel on mobile |
| Tap side panel item | Navigate to selected section |
| Pull down | Refresh agent statuses |
| Hover fin | Scale up + glow effect |

---

## 8. Responsive Behavior

- **Desktop:** Sidebar persistent on left; dashboard content to the right
- **Tablet:** Sidebar collapses to icons; tap to expand
- **Mobile:** Sidebar hidden; hamburger opens full-screen drawer

---

## 9. Assets

- `docs/Design/dashboard_mockup.svg` — visual reference
- Agent fin SVGs should be created as reusable components in `frontend/src/components/dashboard/AgentFin.tsx`
- Wave SVGs should be created as animated components in `frontend/src/components/dashboard/OceanWaves.tsx`

---

## 10. Open Questions

1. Should the wave animation be CSS-only or use a canvas/WebGL library?
2. Should the fin positions be fixed or dynamically arranged based on confidence?
3. Should tapping a fin show a preview card before navigating?

---

## 11. Related Files

- `docs/SystemPrompts/00_universal_system_prompt.md`
- `docs/Skills_Connectors_Models/01_Skills_Registry.md`
- `docs/Design/dashboard_mockup.svg`
