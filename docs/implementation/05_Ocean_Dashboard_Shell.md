# 05 — Ocean Dashboard Shell

## What & Why
Main dashboard with Three.js ocean canvas, 3 animated SVG fins (one per agent), collapsible sidebar (Claude.ai-style), top bar with sync status. Per Portfolio_visualization.md. Use `impeccable` for design, `ui-animation` for fin motion.

## Files to Create / Modify
```
frontend/
├── src/
│   ├── pages/
│   │   └── Dashboard.tsx
│   ├── components/
│   │   ├── ocean/
│   │   │   ├── OceanCanvas.tsx
│   │   │   ├── FinModel.tsx
│   │   │   └── Bioluminescence.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── AgentPanel.tsx
│   │   └── status/
│   │       └── SyncIndicator.tsx
│   ├── hooks/
│   │   ├── useOceanScene.ts
│   │   └── useAgentState.ts
│   └── styles/
│       └── ocean.css
```

## Steps
1. `OceanCanvas.tsx` — Three.js Canvas with WebGL2. Ocean gradient (deep blue → lighter). Gentle wave animation (vertex displacement shader). Responsive resize. Fallback to CSS gradient if no WebGL.
2. `FinModel.tsx` — 3 SVG fins as Three.js textures or CSS overlays:
   - Investment fin (dorsal/shark): triangular, sharp, upward. Fast flick when "thinking".
   - Debt fin (pectoral/manta): wide, sweeping, horizontal. Slow glide.
   - Retirement fin (caudal/whale): large, slow sweep. Gradual.
   - States: idle=gentle bob, thinking=rapid flick, done=smooth return.
3. `Bioluminescence.tsx` — 50-100 small glowing dots drifting upward. Low opacity always.
4. `useOceanScene.ts` — Three.js scene lifecycle, resize observer, animation frame loop. Dispose on unmount.
5. `useAgentState.ts` — agent status polling (idle/thinking/done). Updates fin animations.
6. `Sidebar.tsx` — collapsible (48px → 280px). Claude.ai-style: icons collapsed, labels + icons expanded. Sections: Dashboard, Portfolio, Recommendations, Debt, Retirement, Memory, Settings.
7. `TopBar.tsx` — sync status dot, last sync time, user avatar/menu.
8. `SyncIndicator.tsx` — Green=recent (<5min), Yellow=stale (5-30min), Red=error/never.
9. `AgentPanel.tsx` — expandable card per agent. Collapsed: icon + name. Expanded: recent recommendation, status.
10. `Dashboard.tsx` — compose: Sidebar | [TopBar + OceanCanvas + AgentPanel area].
11. CSS: dark theme (ocean palette). Sidebar transition (200ms ease). CSS keyframe fallback for fins.
12. Playwright: load dashboard, verify ocean renders, fins animate, sidebar collapses/expands, sync dot visible.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (sidebar design, ocean palette, spacing, typography)
- `ui-animation` (fin motion, sidebar transitions, bioluminescence)

## GitHub Repos Needed
- `mrdoob/three.js` (Three.js for ocean canvas)

## Edge Cases & Risks
- WebGL not supported → CSS-only ocean gradient + static fin images
- Mobile performance → reduce particle count (<20), lower wave mesh resolution
- Three.js memory leak → dispose geometries, materials, renderer on unmount
- Sidebar state persistence → localStorage for collapsed/expanded preference
- First load jank → lazy-load Three.js, show gradient placeholder while loading

## Done When
- [ ] Ocean canvas renders with wave animation at 60fps (desktop)
- [ ] All 3 fins with correct shapes and idle animations
- [ ] Fins respond to state changes (idle → thinking → done)
- [ ] Sidebar collapses/expands smoothly (200ms transition)
- [ ] Sync indicator shows correct color states
- [ ] Layout responsive (sidebar auto-collapses <768px)
- [ ] No Three.js console warnings or WebGL errors
- [ ] Playwright: ocean renders, fins visible, sidebar functional
- [ ] Git: review diff, squash merge to main with `[05] Ocean dashboard shell`