# Fin Dashboard Design — Wave-Riding Agent Overview

**Version:** 1.0  
**Updated:** July 2026  
**Status:** Design spec ready for implementation

---

## 1. Overview

The Fin Dashboard is the first screen a user sees after onboarding. It visualizes the three Fin agents — Investment, Debt, and Retirement — as shark fins riding a shared ocean wave. Each fin shows the agent’s current confidence/status, can be tapped for more info, and navigates to the agent’s chat/context view.

The design reinforces Fin’s ocean/fin identity: calm, trustworthy, and always moving forward.

---

## 2. Visual Language

### Color Palette

| Element | Color | Hex | Usage |
|--------|-------|-----|-------|
| Background | Deep ocean navy | `#0B1B2B` | Main dashboard background |
| Wave back | Darker blue | `#143A5C` | Rear wave layer |
| Wave front | Light blue | `#4A9FD4` | Front wave layer |
| Wave highlight | Cyan/foam | `#7FD8F7` | Wave crest accent |
| Investment fin | Aqua green | `#2FE0A8` | Investment agent marker |
| Debt fin | Coral | `#FF6B6B` | Debt agent marker |
| Retirement fin | Gold | `#FFD166` | Retirement agent marker |
| Text primary | Off-white | `#F0F4F8` | Headings, labels |
| Text secondary | Muted blue | `#8BAAC6` | Subtitles, metadata |
| Status good | Green dot | `#2FE0A8` | Healthy confidence/data |
| Status warning | Amber dot | `#FFD166` | Needs attention |
| Status missing | Red dot | `#FF6B6B` | No data / error |

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

Each agent is represented by a stylized shark fin icon that rides on the wave.

- **Shape:** Simple, rounded shark-fin silhouette (SVG)
- **Color:** Unique per agent (Investment = aqua, Debt = coral, Retirement = gold)
- **Position:** Placed at different heights on the wave to avoid overlap
- **Animation:** Subtle bobbing motion synchronized with the wave

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

### 4.4 Side Panel

Swiping from the left edge or tapping the hamburger menu opens a side panel:

```
┌──────────────┐
│  Fin         │
│              │
│  Dashboard   │
│  Portfolio   │
│  Analytics   │
│  Settings    │
│              │
│  Agents      │
│  ─────────   │
│  Investment  │
│  Debt        │
│  Retirement  │
└──────────────┘
```

Items:
- Dashboard
- Portfolio
- Analytics
- Settings
- Agent shortcuts (Investment, Debt, Retirement)

Each agent item navigates to the agent’s chat/context view as a fallback if the fin tap is missed.

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Tap fin | Navigate to agent chat/context view |
| Tap ℹ icon | Open info popup for that agent |
| Tap hamburger / swipe left-to-right | Open side panel |
| Tap side panel item | Navigate to selected section |
| Pull down | Refresh agent statuses |

---

## 6. Responsive Behavior

- **Desktop:** Dashboard centered with max-width 1200px; side panel overlays from left
- **Tablet:** Same as desktop, larger touch targets
- **Mobile:** Full-width wave; side panel becomes full-screen drawer

---

## 7. Assets

- `docs/Design/dashboard_mockup.svg` — visual reference
- Agent fin SVGs should be created as reusable components in `frontend/src/components/dashboard/AgentFin.tsx`

---

## 8. Open Questions

1. Should the wave animation be CSS-only or use a canvas/WebGL library?
2. Should the fin positions be fixed or dynamically arranged based on confidence?
3. Should tapping a fin show a preview card before navigating?

---

## 9. Related Files

- `docs/SystemPrompts/00_universal_system_prompt.md`
- `docs/Skills_Connectors_Models/01_Skills_Registry.md`
- `docs/Design/dashboard_mockup.svg`
