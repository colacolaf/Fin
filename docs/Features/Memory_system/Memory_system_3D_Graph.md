# MEMORY SYSTEM — 3D GRAPH SPECIFICATION

**Version**: 3.0 | **Status**: Replaces prior MemoryExplorer 3-tab approach. Extends `Memory_system.md` v2.1. | **Last Updated**: July 2026

> **Reading order for implementers**: This file is self-contained. Read `§2 Replicability Problem` first, then `§3 Visual Tokens`, then `§4 The Reference Image`, then `§5 Mini 2D Graph` and `§6 Fullscreen 3D Graph`. Skip to `§9 Data Model` and `§10 Self-Curating Colorway` for the agent integration. `§15 Phased Implementation` is the build order.

---

## 1. WHY THIS FILE EXISTS

The previous memory spec (`Memory_system.md` v2.1) and prior implementation brief (`fin-memory-obsidian.md`) were **functionally complete but visually vague**. Multiple AI attempts to reproduce the look failed because:

- No exact color tokens were specified (only "ocean palette" and "functional colors only").
- The 3D reference image was not described in text — only shown.
- Typography was inherited from `Frontend_Architecture.md` but not restated.
- 3D scene parameters (camera FOV, force strengths, fog distances, node sizing function) were never written.
- The graph data model was tied to `[[wikilinks]]` in note bodies, which doesn't match the user's mental model of "chat-lineage" edges.
- The "color = category" mapping was static, not the **agent-curated** colorway the user wants.

This spec fixes all of that. It is **VISUAL-FIRST**: an AI reading this file alone can produce a pixel-faithful replica of the reference image.

---

## 2. REPLICABILITY PROBLEM & SOLUTION

### 2.1 What broke before

| Spec said | What AI produced | Why |
|---|---|---|
| "D3 force-directed graph" | A flat 2D graph with default Cytoscape styling | No library was specified; no scene parameters given |
| "No per-agent colors" | All nodes same gray | Contradicted the user's request for category colors |
| "Mini panel + fullscreen view" | A small icon in the corner that did nothing | No behavior was defined for the mini view |
| "[[wikilinks]] = edges" | A web of unrelated notes | User wanted chat-lineage edges, not note body links |
| "OKLCH palette" | Random blue tints | No specific OKLCH values were given |

### 2.2 Replicability checklist — items an AI MUST have to reproduce the look

A new spec passes the replicability test if and only if it includes **all** of the following:

- [x] Exact hex (or OKLCH) values for every visible color (background, nodes, edges, text, glass, focus ring).
- [x] Exact typography: font family, weight, size, line-height, letter-spacing for every text style.
- [x] Exact node sizing function (radius as a function of degree, weight, or age).
- [x] Exact edge styling (stroke width, opacity, color, curve vs straight).
- [x] Exact 3D scene params: camera type, FOV, position, near/far, fog start/end, background color.
- [x] Exact force simulation params: charge strength, link distance, center force, collision radius, alpha decay.
- [x] Exact interaction states: hover (scale, glow, ring), focus (ring), selected (highlight), disabled (opacity).
- [x] Exact timing: animation durations, easing curves, transition delays.
- [x] Exact layout: pixel dimensions of the mini graph, the rails, the button, the bottom-right dimensions label.
- [x] Exact data model: node fields, edge fields, colorway structure, provenance structure.
- [x] Exact agent contract: what the agent must output at end of chat to feed the colorway.
- [x] Explicit "do NOT include" list (e.g., no camera/snapshot button — see §3.5).

Every section of this spec maps to one or more items above. **If you remove a section, you lose the replicability guarantee for that surface.**

---

## 3. VISUAL TOKENS

All tokens are OKLCH-first. Hex equivalents given for tools that don't yet support OKLCH.

### 3.1 Color tokens

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--bg-void` | `oklch(8% 0.02 270)` | `#070713` | 3D scene background (deepest) |
| `--bg-graph` | `oklch(12% 0.025 265)` | `#0c0d1c` | Fullscreen graph pane background |
| `--bg-rail` | `oklch(10% 0.02 268)` | `#0a0b18` | Left/right rail background |
| `--bg-glass` | `oklch(15% 0.02 266 / 0.65)` | `#13142a` at 65% | Glassmorphic panels (backdrop-blur 16px) |
| `--text-primary` | `oklch(95% 0.01 250)` | `#f1f2f6` | Body text, labels |
| `--text-muted` | `oklch(70% 0.015 250)` | `#a8acba` | Captions, secondary text, dimensions label |
| `--text-dim` | `oklch(45% 0.015 250)` | `#5b6070` | Disabled, hint text |
| `--border-subtle` | `oklch(25% 0.02 265)` | `#22243b` | 1px dividers |
| `--focus-ring` | `oklch(75% 0.15 220)` | `#7cd3ff` | Focus ring (4:1 contrast on bg-void) |
| `--edge-default` | `oklch(50% 0.04 265)` | `#5a607a` | Default edge stroke (opacity 0.35 applied separately) |
| `--edge-active` | `oklch(80% 0.10 220)` | `#a8d8e8` | Edge of selected/hovered node (opacity 0.7) |

### 3.2 Node category palette (THE COLORS THE USER ASKED FOR)

Each agent has its own **sub-domain palette**, assigned by the agent at end-of-chat. The token table below is the **default seed palette**; the agent can override per node. User can also override in left rail.

| Default category | Token | OKLCH | Hex | When used |
|---|---|---|---|---|
| Investment — concentration | `--cat-orange` | `oklch(72% 0.18 60)` | `#f5a623` | Single-holding overweight |
| Investment — sector | `--cat-blue` | `oklch(62% 0.18 260)` | `#4a7bd9` | Sector drift, rebalancing |
| Investment — fees | `--cat-cyan` | `oklch(75% 0.13 200)` | `#5fc7d8` | High expense ratio, fee reduction |
| Investment — tax | `--cat-purple` | `oklch(58% 0.20 295)` | `#7e54c4` | Tax-loss harvesting, Roth conversion |
| Debt — credit-card | `--cat-red` | `oklch(60% 0.22 25)` | `#dc4747` | High-APR credit card debt |
| Debt — car | `--cat-amber` | `oklch(70% 0.18 70)` | `#e0a92e` | Auto loan |
| Debt — student | `--cat-indigo` | `oklch(50% 0.18 280)` | `#5a4ec4` | Student loan |
| Debt — mortgage | `--cat-teal` | `oklch(65% 0.12 180)` | `#52a99b` | Mortgage |
| Retirement — contribution | `--cat-green` | `oklch(70% 0.17 145)` | `#3eb873` | 401k match, contribution increase |
| Retirement — allocation | `--cat-emerald` | `oklch(60% 0.15 155)` | `#2f9d6e` | Asset allocation shift |
| Retirement — withdrawal | `--cat-slate` | `oklch(55% 0.04 250)` | `#6b7080` | RMD, Social Security |
| General — preference | `--cat-violet` | `oklch(55% 0.20 310)` | `#8846c4` | User-stated preferences |
| General — pattern | `--cat-pink` | `oklch(65% 0.18 350)` | `#cc4d8c` | Auto-detected behavioral patterns |
| General — meta | `--cat-gray` | `oklch(60% 0.01 250)` | `#7a7e8c` | User-context, daily note, system |

**Important**: these are the *defaults*. The actual color for each new node is decided by the agent at end-of-chat (see `§10 Self-Curating Colorway`). The seed palette is only used when the agent has no prior colorway for that category.

### 3.3 Functional accents

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--accent-success` | `oklch(68% 0.17 145)` | `#3eb873` | "Accepted" status, positive deltas |
| `--accent-warning` | `oklch(78% 0.16 75)` | `#e8b73a` | "Pending", caution |
| `--accent-danger` | `oklch(60% 0.22 25)` | `#dc4747` | "Rejected", negative deltas |

### 3.4 Typography

| Style | Font | Weight | Size | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Graph node label (hover) | Inter | 500 | 11px | 1.0 | 0.01em |
| Graph node label (selected) | Inter | 600 | 12px | 1.0 | 0.01em |
| Rail icon | lucide-react (`Search`, `FileText`, `Settings`, `LocateFixed`) | n/a | 18px | n/a | n/a |
| Rail label | Inter | 500 | 12px | 1.0 | 0.02em |
| Button (mini open / chat) | Inter | 500 | 12px | 1.0 | 0.01em |
| Button primary | Inter | 600 | 14px | 1.0 | 0.01em |
| Right panel heading | Inter | 600 | 14px | 1.3 | 0 |
| Right panel body | Inter | 400 | 13px | 1.5 | 0 |
| Right panel caption | Inter | 400 | 11px | 1.4 | 0.01em |
| Dimensions label (bottom-right) | Geist Mono | 500 | 11px | 1.0 | 0.02em |
| Settings header | Inter | 700 | 18px | 1.2 | 0 |
| Color picker swatch label | Geist Mono | 500 | 10px | 1.0 | 0.04em uppercase |

Inter is loaded via `@fontsource/inter`. Geist Mono via `@fontsource/geist-mono`. No other webfonts.

### 3.5 Items NOT in the design (explicit exclusion)

The user clarified the following items in the reference image are **NOT** part of this design:

- **Camera/snapshot button** (bottom-left of the reference image): This is a Google Image Search UI artifact overlaid on the original screenshot. Do NOT add a camera icon or any "save snapshot" feature.
- **"3,200 × 2,000" dimensions text** (bottom-right): This is a viewport-resize indicator visible because the user took the screenshot from a resizable panel. It is NOT a feature. However, the design DOES include a small `graph: N nodes · M edges` counter in the same position, formatted in Geist Mono 11px `--text-muted`, see `§6.5`.

---

## 4. THE REFERENCE IMAGE (described in text)

A faithful reproduction has these properties:

- **Background**: solid `--bg-void`, no gradient. There is no visible vignette or grain in the reference.
- **Composition**: the graph is roughly centered horizontally and vertically, with a slight bias toward the lower-right. The largest cluster sits in the center; a few outlier chains trail off to the upper-left and lower-left.
- **Density**: approximately 200–300 visible nodes in a 1280×800 frame, with edge count roughly 1.5–2× the node count. Sparse perimeters; dense core.
- **Depth**: 3D. Foreground nodes appear 6–10px in radius and bright; background nodes appear 1.5–2.5px and dim. The `radius_scale(z) = 4 * exp(-0.18 * z) + 1.5` formula reproduces this look.
- **Color distribution**: orange and blue dominate (~50% of nodes); purple, cyan, green, red, gray make up the rest. No single category exceeds 60% of the graph.
- **Edge style**: thin straight lines, no curves, no arrows, no thickness variation. Default stroke 0.6px, opacity 0.35, color `--edge-default`. Edges of the selected node brighten to `--edge-active` at opacity 0.7.
- **Animation**: very gentle. Nodes drift at < 5px/sec in screen space. The simulation has alpha decay such that motion dies down after ~3 seconds and is re-poked by user interaction. No pulsing or shimmering.
- **Top-left controls (mini view)**: a 22×22 rounded-square button (icon-only, with a small expand icon) per §5.3 — the "Open Memory 3D" label appears on hover as a tooltip, NOT as a permanent label on the button itself. A small "f" logo (16×16) sits in the very corner above the button.
- **Left rail**: 48px wide, full height, `--bg-rail`. Two icon buttons stacked at top: search (lucide `Search`) and file (lucide `FileText`). Icons are `--text-muted`, hover to `--text-primary`.
- **Right rail**: 48px wide, full height, `--bg-rail`. Two icon buttons stacked at top-right: settings (lucide `Settings`) and pin/locate (lucide `LocateFixed`).
- **Bottom-left**: NOTHING (the reference image's camera icon is excluded, see §3.5).
- **Bottom-right**: a 6-digit × 4-digit text in `--text-muted` displaying the current viewport dimensions OR a `graph: N nodes · M edges` counter (we ship the latter as the actual feature).

---

## 5. MINI 2D GRAPH (in-chat, top-left)

### 5.1 When it appears

The mini graph is rendered in the **top-left of the chat surface** when the user opens any chat. It is 220×140px, with 12px padding from the chat edge and 12px gap below the page header.

### 5.2 Behavior

- **Library**: `react-force-graph-2d` (allowed new dep; shared force engine with the fullscreen view).
- **Layout**: 2D force-directed. No 3D. No rotation. No perspective.
- **Background**: `--bg-graph` (no transparency, so the rail doesn't bleed through).
- **Border**: 1px `--border-subtle`, radius 8px.
- **Nodes**: small filled circles, radius 2–4px (sized by degree), color = current colorway for that node's category.
- **Edges**: 0.4px, opacity 0.25, color `--edge-default`.
- **Animation**: simulation runs continuously at 0.3× speed (vs fullscreen 1×). Settles within 2 seconds of mount.
- **Interaction**:
  - Hover a node: tooltip with title (10px Inter 500, `--text-primary` on `--bg-glass`). Node brightens 1.5×.
  - Click a node: opens the chat that created it (via `onNodeClick(node) → router.push(/chats/{node.chat_id})`).
  - Click anywhere else on the graph: open fullscreen (see `§6`).
- **Auto-update**: subscribes to WebSocket `memory:graph-updated` events. New nodes fade in (opacity 0 → 1 over 400ms ease-out).
- **Performance**: caps at 500 visible nodes (oldest non-recent fade to 0.3 opacity). Culls edges if FPS drops below 30. **Recent definition** (must be defined for the cap to make sense): a node is "recent" if `created_at` is within the last 30 days OR it is referenced (via a `chat_to_memory` edge) by a chat the user has opened in the last 7 days. The server computes this on every `/api/memory/graph` call and includes `is_recent: boolean` per node; the client uses the flag to choose which 500 nodes to keep opaque when the total exceeds the cap.

### 5.3 The "Open Memory 3D" button

A pill-shaped button overlapping the mini graph's top-right corner, **outside** the 220×140 box. Size: 22×22 (icon only) with a 2px stroke ring. On hover, the ring brightens to `--focus-ring`. On click, opens fullscreen at `§6`.

The button label "Open Memory 3D" appears on hover as a 180ms-ease-out tooltip above the button (Inter 11px medium, `--text-primary`, `--bg-glass` background, 6px radius, 4px padding).

---

## 6. FULLSCREEN 3D GRAPH

### 6.1 When it appears

Triggered by:
1. Clicking the "Open Memory 3D" button on the mini graph.
2. Keyboard shortcut: `Cmd/Ctrl + Shift + M`.
3. Navigating to `/memory/3d` directly.

The fullscreen view replaces the entire app surface (header, sidebar, chat — all hidden). It is dismissed by `Esc` (with a 200ms fade-out).

### 6.2 Scene parameters (three.js + d3-force-3d)

- **Renderer**: `WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })`.
- **Camera**: `PerspectiveCamera(50, aspect, 0.1, 2000)`. Initial position `(0, 0, 240)`, looking at origin.
- **Scene background**: `--bg-void` (clear color `0x070713`).
- **Fog**: `Fog(0x070713, 80, 480)` — linear fog matches the background to give depth.
- **Lighting**: none required (we use unlit `MeshBasicMaterial` with vertex colors). Avoids per-frame lighting cost.
- **Pixel ratio**: `min(window.devicePixelRatio, 2)`.

### 6.3 Force simulation (d3-force-3d)

- `forceLink().distance(d => 18 + d.weight * 4).strength(0.7)` — edges pull proportional to weight.
- `forceManyBody().strength(-30)` — node repulsion.
- `forceCenter(0, 0, 0)` — gentle pull to origin.
- `forceCollide().radius(d => d.radius + 1.5)` — prevents overlap.
- `forceX().strength(0.04)` + `forceY(0.04)` + `forceZ(0.04)` — keep nodes in frame.
- `alphaDecay(0.0228)` — settles in ~3s.
- `alphaTarget(0)` on idle, `0.3` on user drag (reheats simulation).

### 6.4 Node rendering

- **Geometry**: `SphereGeometry(d.radius * 0.18, 12, 12)` — small icosphere-like. The `0.18` factor converts our logical radius to scene units so a `radius=10` node is `1.8` units across.
- **Material**: `MeshBasicMaterial({ color: d.color, transparent: true, opacity: d === selected ? 1.0 : 0.95 })`.
- **radius function**: `radius = 3 + Math.log2(1 + degree) * 1.5 + (weight || 0) * 0.5`. Clamped to `[2, 12]`.
- **depth attenuation**: at runtime, multiply effective screen radius by `1 / (1 + 0.004 * z)` where `z` is camera-relative depth. This matches the "foreground bright, background dim" look in the reference.

### 6.5 Edge rendering

- A single `LineSegments` mesh built from all edges. Update only when the simulation ticks.
- Vertex colors per edge: `--edge-default` → `--edge-active` if either endpoint is selected.
- Opacity: 0.35 default, 0.7 if either endpoint is selected.
- No thickness variation. No arrows. No curves.

### 6.6 Camera controls

- **OrbitControls**: `enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.6, zoomSpeed: 0.8, panSpeed: 0.6, minDistance: 60, maxDistance: 600, autoRotate: false`.
- **AutoRotate**: when idle for 30 seconds AND not interacted with, set `autoRotate = true, autoRotateSpeed: 0.3`. Stops the instant the user interacts.
- **Reset view**: `R` key (or right-rail "Reset view" button) tweens camera back to `(0, 0, 240)` over 600ms ease-in-out.

### 6.7 Interaction states

| State | Visual treatment |
|---|---|
| Default | node at 95% opacity, color = current colorway |
| Hover | node scale 1.4×, glow ring (sprite 1.6× the node, 30% opacity, same color), floating label appears 12px above node |
| Selected | node scale 1.6×, full opacity, connected edges brighten, 1px `--focus-ring` outline |
| Dragging | node follows cursor, simulation alpha reheats |
| Filtered out | 15% opacity (still visible but de-emphasized) |
| Disabled (no chat access) | 40% opacity, no hover, no click |

The floating label on hover/select is rendered as an HTML overlay (NOT in the WebGL canvas) so it stays pixel-crisp. It contains: title (12px Inter 600), category (11px Geist Mono 500, color = node color), and 1-line preview (12px Inter 400, `--text-muted`).

**Wiring interaction states to three.js**: use `nodeThreeObject` to return a `THREE.Group` containing the sphere mesh; store each group's reference in a side-map keyed by `node.id`. `selectedNode` and `hoveredNode` React state live in the parent `<MemoryGraph3DCanvas>`. A `useEffect` watching `[selectedNode, hoveredNode]` mutates the corresponding group's `scale.set(s, s, s)` directly — `s = 1.6` for selected, `1.4` for hovered, `1.0` otherwise. Do NOT re-render the entire graph on state change; mutate the existing group refs in place to keep the simulation smooth. The `nodeThreeObjectExtend(true)` callback provides a parallel group for the hover halo (sprite 1.6× node radius, 30% opacity, same color as the node).

### 6.8 Bottom-right counter

A `<div>` in `--text-muted` Geist Mono 11px, position `absolute; right: 12px; bottom: 8px`, content: `graph: {N} nodes · {M} edges`. Updates when the graph changes.

### 6.9 Performance

- Target 60fps with 3,000 nodes / 6,000 edges on a 2019 MacBook Pro.
- If FPS < 30 for 2s, halve visible node count (drop lowest-degree until FPS recovers).
- Use `InstancedMesh` for nodes (single draw call). Update only the `instanceMatrix` per tick.
- Edges in one `LineSegments`. Rebuild only when edges change.
- Pause simulation when tab is hidden (`document.visibilityState`).

### 6.10 Accessibility

- `prefers-reduced-motion: reduce` → disable autoRotate, disable simulation drift, freeze on mount.
- Keyboard nav: `Tab` cycles nodes in degree-descending order; `Enter` selects; arrow keys pan camera.
- All node data exposed as `aria-label` on the canvas via a screen-reader-only live region that announces the currently selected node.
- Color is never the only signal: every node has a `title` rendered in the floating label; filter chips in the left rail show both color swatch AND text label.

---

## 7. UI LAYOUT (fullscreen)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [f logo]                                            [⚙] [⌖]   right rail │ 48px
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │  left rail │                                                     │   │
│ │  ────────  │                                                     │   │
│ │  [🔍 search]                                                     │   │
│ │  [📄 files]  3D GRAPH CANVAS (three.js)                          │   │
│ │             · full bleed to viewport                             │   │
│ │             · fog, depth attenuation, force sim                  │   │
│ │             ·                                                  │   │
│ │             ·                                              graph: 2378 nodes · 4192 edges │
│ └────────────────────────────────────────────────────────────────────┘   │
│  48px                                                                      48px │
└──────────────────────────────────────────────────────────────────────────┘
```

The two rails (48px each) are **always visible** in fullscreen. They collapse to 0 on viewports < 1024px (tablet) and the icons move into a top-right floater on viewports < 768px (mobile).

### 7.1 Left rail (48px, fullscreen)

- **Top icon 1**: `Search` (lucide). Opens a centered command-palette modal (Cmd+K style, see §7.3) over the canvas.
- **Top icon 2**: `FileText` (lucide). Opens a "Recent files" popover anchored under the icon. Lists the 10 most recent memory files. Click opens the chat (since each file maps to a chat).

Hover on any icon: 180ms background fade to `--bg-glass`. Click: 80ms press-down (`transform: scale(0.92)`).

### 7.2 Right rail (48px, fullscreen)

- **Top icon 1**: `Settings` (lucide). Opens the **right-side settings panel** — a 320px wide drawer that slides in from the right over 240ms. Contains:
  - **Color legend** (top): every category currently in the graph, with its color swatch, name, and node count.
  - **Settings** (middle): animation speed slider, node size slider, edge opacity slider, auto-rotate toggle, reset view button.
  - **Selected node info** (bottom): when a node is selected, shows title, category, chat_id, created_at, and a "View chat" link.

- **Top icon 2**: `LocateFixed` (lucide). Re-centers the camera on the selected node (or the most recent node if none selected). Camera tweens 600ms ease-in-out.

### 7.3 Command palette (Cmd+K)

A centered modal at viewport center, max-width 560px, max-height 60vh. Glass background (`--bg-glass` + `backdrop-filter: blur(16px)`). Single-line input (Inter 14px, `--text-primary`, transparent border). Below input, a virtualized list of up to 50 fuzzy-matched results (Fuse.js, threshold 0.4, keys: `title^3`, `category^2`, `chat_id`).

Each result row: color swatch (16×16 rounded square, color = node colorway), title (Inter 13px medium), category (Geist Mono 10px muted), date (Inter 11px muted). Hover: row background `--bg-glass`. Selected: 1px `--focus-ring`.

Up/Down/Enter navigates. Esc closes. Selecting a result opens the chat (via `router.push`).

---

## 8. COLORWAY = SELF-CURATED

This is the design's key innovation and the reason AI failed to reproduce the spec before. The colors are NOT a fixed palette assigned by the developer. Each agent CURATES its own colorway at the end of each chat, and the next chat reads the prior colorway for continuity.

### 8.1 Where the colorway lives

The current colorway is the **union** of:
1. **User overrides** (in the right rail, user can re-color any category).
2. **Agent proposals** (most recent wins per category).
3. **Seed palette** (`§3.2`) used only for categories the agent has never seen.

Storage: a single JSON file at `~/.fin/memory/colorway.json`. Schema:

```json
{
  "version": 1,
  "updated_at": "2026-07-12T18:30:00Z",
  "categories": {
    "car_debt": {
      "color": "#e0a92e",
      "label": "Car Loan",
      "agent": "debt",
      "source": "agent_proposal",
      "proposed_at": "2026-07-12T18:30:00Z",
      "proposed_by_chat": "chat_2026_07_12_debt_refi",
      "user_override": false
    },
    "credit_card_debt": {
      "color": "#dc4747",
      "label": "Credit Card Debt",
      "agent": "debt",
      "source": "user_override",
      "user_override": true,
      "user_override_at": "2026-07-10T09:15:00Z"
    }
  }
}
```

User overrides win over agent proposals. Agent proposals win over seed palette. Seed palette fills in anything not yet named.

### 8.2 When an agent proposes colors

At the **end of every chat** (just before the chat is sealed), the agent emits a `colorway_proposal` JSON in its final response. The orchestrator parses it and writes to `colorway.json`. See `§10` for the agent contract.

### 8.3 How a new memory node gets its color

When a new memory note is created:
1. Its frontmatter `category` field is set (e.g., `category: car_debt`).
2. The frontend looks up `colorway.categories[car_debt].color` to render the node.
3. If the category doesn't exist, the agent's `colorway_proposal` from the chat that created the note MUST include it. If it doesn't (orphan), the system falls back to `--cat-gray` and logs a warning.

### 8.4 How the user overrides

The right rail's settings panel lists every category in `colorway.json` with its current color and a color swatch. Click the swatch → opens a native `<input type="color">`. On change, writes `user_override: true` to the JSON. To reset, click the "×" next to the swatch.

---

## 9. CHAT-LINEAGE EDGE MODEL

### 9.1 Why not [[wikilinks]]?

`[[wikilinks]]` in note bodies are content-level references — they say "this note mentions that note". They don't capture **how a conversation evolved** over time, which is the user's mental model for "edges" (when the chat was created, the next chat, connected chats, continuation chats).

### 9.2 Edge types (replaces §5 of Memory_system.md v2.1)

| Edge | Source field (frontmatter) | Computed |
|---|---|---|
| `temporal` | `next_chat_id` (on the chat's metadata note) | chat_a → next_chat (forward in time within the same agent) |
| `continuation` | `continuation_of_chat_id` | chat_b → continuation_of (user said "continue that other chat") |
| `related` | `related_chat_ids: [...]` | chat_c ↔ chat_d (agent flagged as related by topic) |
| `chat_to_memory` | derived from `chat_id` on each memory note | each memory node → its chat (creates the "memory lives in this chat" visual) |
| `memory_to_pattern` | `[[../patterns/xyz.md]]` wikilink | kept from prior spec for content-level references |

### 9.3 Where the chat metadata lives

Each chat has a metadata note at `~/.fin/memory/chats/{YYYY-MM-DD}-{slug}.md`. Frontmatter:

```yaml
---
title: "Refinancing car loan"
type: chat
chat_id: "chat_2026_07_12_debt_refi"
agent: debt
created_at: 2026-07-12T18:30:00Z
ended_at: 2026-07-12T18:52:00Z
next_chat_id: "chat_2026_07_13_debt_followup"   # if a follow-up chat exists
continuation_of_chat_id: null                  # or "chat_2026_07_10_debt_initial"
related_chat_ids:
  - "chat_2026_07_05_debt_overview"
memory_node_ids:                                # memory nodes produced by this chat
  - "rec_2026_07_12_refi_offer"
  - "dec_2026_07_12_refi_accepted"
tags: [car, refinancing]
---
```

### 9.4 Edge computation (client-side, in the graph render)

```ts
function buildEdges(chats: ChatNote[], memoryNodes: MemoryNode[]): Edge[] {
  const edges: Edge[] = [];
  for (const chat of chats) {
    if (chat.next_chat_id) edges.push({ from: chat.chat_id, to: chat.next_chat_id, kind: 'temporal' });
    if (chat.continuation_of_chat_id) edges.push({ from: chat.chat_id, to: chat.continuation_of_chat_id, kind: 'continuation' });
    for (const related of chat.related_chat_ids || []) edges.push({ from: chat.chat_id, to: related, kind: 'related' });
    for (const memId of chat.memory_node_ids || []) edges.push({ from: chat.chat_id, to: memId, kind: 'chat_to_memory' });
  }
  return edges;
}
```

Server returns chats + memory nodes. Client computes edges. No edge storage; edges are derived.

### 9.5 What the user said about edges

From the Q&A: *"In the sorting page in the left sidebar it can show when the chat was created to the next chat, connected chats, continuation chats."* This is exactly the edge model above. The "sorting page" in the left rail is the **timeline list**: a chronological scroll of chats grouped by agent, with continuation/related markers.

### 9.6 Backward compat: [[wikilinks]] still work

Wikilinks in note bodies are parsed and create `memory_to_pattern` edges (kept from prior spec). They render in the same edge mesh but with stroke color `--cat-pink` (pattern pink) at half opacity to distinguish from chat-lineage edges.

---

## 10. AGENT CONTRACT — END-OF-CHAT COLORWAY PROPOSAL

This is what implementers MUST add to the agent system prompts. Without it, the colorway never gets populated and the graph degrades to gray nodes.

### 10.1 Addendum to each agent's system prompt

Append the following block to the end of every agent system prompt (Investment, Debt, Retirement, Questions, Research). This is added by the orchestrator at agent boot, NOT hardcoded in each prompt file:

```markdown
## END-OF-CHAT COLORWAY PROPOSAL

When the chat is being sealed (right before you say "anything else?"), emit a `colorway_proposal` JSON block in your final response. This is how the visual memory graph learns your categories.

**Rules**:
1. The proposal lists ONLY the categories that appeared in THIS chat and that are not yet in the user's colorway. Do not re-propose existing categories (they already have colors).
2. For each new category, pick a color from the seed palette OR a hex value you think fits. The user can override.
3. Use snake_case for the category key. Use a short human label.
4. If the chat touched a category the user has used before but in a NEW agent context (e.g., user asked Debt agent about retirement), re-propose it with the existing color UNLESS the semantic meaning changed.

**Format** — emit this as the LAST fenced code block in your final message (label the fence `json`), with no commentary before it. The JSON object has one top-level key, `colorway_proposal`, whose value is an object mapping each new category key (snake_case) to an object with three fields: `label` (human-readable, e.g. `"Car Loan Refinance"`), `color` (hex string like `"#e0a92e"`, or a seed-palette token name like `"seed_palette:cat_amber"`), and `rationale` (one-sentence explanation). One proposal entry per new category; emit ONLY categories that appeared in THIS chat AND are not yet in the user's colorway.

**Why this matters**: the graph at the top of the chat is colored by these proposals. Future chats that touch "car loan refinance" will use the same amber. Over time, the user's colorway becomes a self-curating map of how they think about their finances.
```

### 10.2 Orchestrator behavior

After the agent's final response, the orchestrator reconciles the proposal against `colorway.json` and the seed palette in this exact order (this implements the precedence chain `user > agent > seed` from §8.1):

1. Parse the agent's `colorway_proposal` block (regex or JSON-block extract). Get the set of proposed categories.
2. For each memory node produced by this chat:
   a. Look up its `category` in `colorway.json`.
   b. If the category exists AND `user_override: true`: keep the user's color. Do NOT touch.
   c. If the category exists AND `user_override: false`: keep the existing color. This is the "agent already proposed previously, or it was seeded" case.
   d. If the category does NOT exist in `colorway.json`:
      - If the agent's proposal from step 1 contains this category: write it to `colorway.json` with `source: "agent_proposal"`.
      - Else: look up the category in the seed palette (§3.2) and write it with `source: "seed"`.
      - If the category is missing from BOTH the agent's proposal AND the seed palette (unknown category): use `--cat-gray` and log a warning to the agent's stderr (dev mode only).
3. Trigger a `memory:graph-updated` WebSocket event so the frontend re-renders.

### 10.3 What if the agent doesn't emit a proposal?

If the chat produced no new categories (e.g., it was a Q&A about an existing topic), no proposal is needed. The system stays silent — no warning.

If the agent forgets to emit a proposal for a new category, the system falls back to the seed palette and logs a warning to the agent's stderr (visible in dev mode only).

---

## 11. PROMPT PROVENANCE

### 11.1 What gets stored

The user said: *"prompts" in this context = the exact agent context block (system prompt + user input) that produced the memory node. This is provenance, not prompt templates.*

Every memory node stores, in its frontmatter:

```yaml
prompt_provenance:
  system_prompt_hash: "sha256:abc123..."        # hash of the system prompt at time of generation
  system_prompt_version: "investment-agent@1.4.2"
  user_input_text: "Can you refinance my car loan? My current APR is 4.2% and I see offers at 3.1%."
  agent_output_text: "..."                       # the agent's response that produced the node
  model: "mistral:7b"
  model_version: "0.3"
  temperature: 0.3
  tool_calls:                                    # if the agent used tools
    - tool: "search_web"
      args: { query: "best auto refinance rates July 2026" }
      result_summary: "..."
  created_at: 2026-07-12T18:35:00Z
```

### 11.2 How the user views provenance

In the right rail's selected-node panel, a "Why did the agent create this?" link expands a drawer showing the full `prompt_provenance` block. The drawer is 480px wide, slides in from the right, contains:

- System prompt version + hash (clickable to view diff if user has previous versions)
- The exact user input text (monospace, gray background)
- The exact agent output (rendered markdown)
- Tool calls (collapsible each)
- Model + temperature

This is the "prompts" feature the user asked for: the full audit trail per memory node.

### 11.3 Storage

`prompt_provenance` is a YAML field in the memory node's frontmatter. No separate file. Keeps the node atomic. Can be stripped on export if the user wants a clean share (advanced settings).

---

## 12. FRONTEND ARCHITECTURE

### 12.1 Component tree

```
frontend/src/
├── pages/
│   └── MemoryGraph3D.tsx                  # fullscreen route /memory/3d
├── components/
│   ├── memory/
│   │   ├── MiniMemoryGraph.tsx            # 220×140 2D, in chat top-left
│   │   ├── MemoryGraph3DCanvas.tsx         # three.js + d3-force-3d fullscreen
│   │   ├── MemoryLeftRail.tsx             # 48px left rail
│   │   ├── MemoryRightRail.tsx            # 48px right rail
│   │   ├── MemorySettingsPanel.tsx        # 320px drawer
│   │   ├── MemoryCommandPalette.tsx       # Cmd+K modal
│   │   ├── MemoryNodeLabel.tsx            # HTML overlay (not WebGL)
│   │   └── MemoryProvenanceDrawer.tsx     # right-slide audit panel
│   └── graph/
│       ├── ForceEngineContext.tsx         # shared d3-force instance
│       ├── useGraphData.ts                # fetches nodes + edges from /api/memory/graph
│       └── useColorway.ts                 # fetches + updates colorway.json
└── hooks/
    └── useMemoryGraph.ts                  # WebSocket subscription to memory:graph-updated
```

### 12.2 State management

- **No new Zustand store** — extend `useFinStore` with a `memoryGraph` slice (Ponytail).
- **Reuse**: the existing `useFinStore.user.id` for colorway scoping.
- **No new API layer** — backend already exposes basic-memory MCP; we add ONE new endpoint, see §13.

### 12.3 Data flow

```
User opens chat
  → MiniMemoryGraph mounts
  → useGraphData() GET /api/memory/graph?user_id=X
  → Server returns: { nodes: [...], edges: [...], colorway: {...} }
  → ForceEngineContext holds the SHARED d3-force-3d simulation (ONE instance per session, mounted at app root)
  → MiniMemoryGraph renders 2D by reading the simulation's x/y positions via a tick subscription
  → WebSocket subscribed to memory:graph-updated
     On event: refetch graph, re-heat simulation by alpha=0.3 for 1 tick, animate new node fade-in

User clicks "Open Memory 3D"
  → router.push("/memory/3d")
  → MemoryGraph3D mounts
  → REUSES the same useGraphData() data
  → REUSES the same ForceEngineContext simulation; MemoryGraph3DCanvas reads x/y/z positions for 3D rendering
  → ESC or back button → router.pop()
  → MiniMemoryGraph is back, no remount, simulation preserved (no reflow when re-opening)

User clicks a node
  → onNodeClick(node) → router.push(`/chats/${node.chat_id}`)
```

**Important — why we manage the simulation ourselves**: `react-force-graph-2d` and `react-force-graph-3d` each instantiate their own internal force simulation. If we let them, the mini and fullscreen views would have drifting, unrelated positions (the fullscreen would re-settle every time it opened, causing a jarring reflow). To keep them in sync, we instantiate `d3-force-3d` ONCE in `ForceEngineContext` and consume its tick events to drive both views via position props. Cost: ~150 LOC of force-simulation glue. Benefit: the fullscreen view opens with the mini's already-settled layout. See §14.4 for the rejected alternatives.

### 12.4 New dependencies (allowed; keep minimal)

- `react-force-graph-2d` (2D force graph; reads positions from our shared simulation, see §12.3)
- `react-force-graph-3d` (3D force graph; reads positions from our shared simulation)
- `three` (WebGL renderer; peer of `react-force-graph-3d`; lazy-load via code-split at the page level; add EXPLICITLY to `package.json` to avoid tree-shaking issues)
- `@fontsource/inter`, `@fontsource/geist-mono` (typography tokens)
- `fuse.js` (command palette fuzzy match)
- `lucide-react` (icon library; ~30KB tree-shakeable; provides `Search`, `FileText`, `Settings`, `LocateFixed` per §3.4 and §7)

**Banned**: Slate, Lexical, TipTap, Monaco, react-markdown (no in-app editing — the file-tree editor from the prior spec is deprecated; the graph IS the surface), Cytoscape, Sigma.js.

### 12.5 Deleted from prior spec

- `MemoryExplorer.tsx` (3-tab shell)
- `MemorySearch.tsx`, `MemoryTimeline.tsx`
- `MemoryNoteEditor.tsx` (CodeMirror editor — graph replaces it)
- `MemoryTagExplorer.tsx` (file tree — graph replaces it)
- `MemoryOutlinePanel.tsx`, `MemoryCommandPalette.tsx`'s prior file-jump use (repurposed for graph search)
- `MemoryGraph.tsx` (the old 2D force graph — replaced by MiniMemoryGraph + MemoryGraph3DCanvas)

---

## 13. BACKEND SPEC

### 13.1 New endpoint

**`GET /api/memory/graph`**

Query params:
- `user_id` (from session)
- `include` (default: `nodes,edges,colorway`; pass `nodes,colorway` to skip edge computation client-side savings)

Response:

```json
{
  "nodes": [
    {
      "id": "chat_2026_07_12_debt_refi",
      "type": "chat",
      "title": "Refinancing car loan",
      "category": "car_loan_refinance",
      "color": "#e0a92e",
      "agent": "debt",
      "chat_id": "chat_2026_07_12_debt_refi",
      "created_at": "2026-07-12T18:30:00Z",
      "weight": 5,
      "radius": 5.2
    },
    {
      "id": "rec_2026_07_12_refi_offer",
      "type": "memory",
      "title": "Refi offer: 3.1% APR for 60 months",
      "category": "car_loan_refinance",
      "color": "#e0a92e",
      "agent": "debt",
      "chat_id": "chat_2026_07_12_debt_refi",
      "created_at": "2026-07-12T18:35:00Z",
      "weight": 3,
      "radius": 3.8
    }
  ],
  "edges": [
    { "from": "chat_2026_07_12_debt_refi", "to": "rec_2026_07_12_refi_offer", "kind": "chat_to_memory" },
    { "from": "chat_2026_07_12_debt_refi", "to": "chat_2026_07_13_debt_followup", "kind": "temporal" }
  ],
  "colorway": { /* see §8.1 */ },
  "stats": { "node_count": 2378, "edge_count": 4192, "generated_at": "2026-07-12T19:00:00Z" }
}
```

**`PATCH /api/memory/colorway`** (user override)

Body: `{ category: "car_loan_refinance", color: "#abc123" }` or `{ category: "car_loan_refinance", reset: true }`.

### 13.2 WebSocket events

- `memory:graph-updated` — emitted when a new chat ends (colorway + new memory node + new chat edge).
- `memory:colorway-updated` — emitted on user override.

### 13.3 Backward compatibility

`/api/memory/list`, `/api/memory/read`, `/api/memory/search` (basic-memory MCP) remain unchanged. The graph endpoint composes their results.

---

## 14. LIBRARY DECISIONS & TRADEOFFS

### 14.1 Why `react-force-graph-3d` (not raw three.js)

- Wraps `three` + `d3-force-3d` + `d3-force-2d` in one React-friendly API.
- Handles WebGL boilerplate (renderer, scene, camera, loop).
- ~5k LOC saved vs hand-rolled three.js + custom force sim.
- Tradeoff: less pixel control over node appearance (we work around with `nodeThreeObject` for custom geometry + `nodeThreeObjectExtend` for hover labels).

### 14.2 Why not Cytoscape.js

- 2.5D tricks look like 2.5D tricks. The reference image is real 3D with depth fog — Cytoscape can't do that.
- Cytoscape's force layout is also 2D-only.

### 14.3 Why not Sigma.js

- WebGL-based, very fast for 10k+ nodes. But the default look is "network map" not "cosmic web". Theming cost > `react-force-graph-3d` cost.

### 14.4 Why not D3 directly (as prior spec suggested)

- D3 force layout in 2D is great. In 3D, you would have to write your own WebGL renderer; not worth it given the 3D-library choices available.
- For the 2D mini, raw D3 would require a ~200-LOC custom Canvas renderer. `react-force-graph-2d` saves that, and we already need a shared-simulation layer (§12.3) for the 3D view — reusing it for the 2D view is straightforward.
- Plan B: if the `three` + `react-force-graph-3d` bundle fails the CI guard in Phase G, escalate to raw D3 + custom Canvas for the 2D mini ONLY (keep `react-force-graph-3d` for fullscreen). This is an out-of-spec change requiring spec revision — DO NOT do it without updating this file first.

### 14.5 When to fall back to D3 for mini

If the bundle size of `react-force-graph-3d` is unacceptable (it pulls in `three` ~600KB gzipped), the 2D mini can be done with D3 + a tiny custom Canvas renderer (~200 LOC). Keep this as Plan B; benchmark first.

---

## 15. PHASED IMPLEMENTATION

Build order. Each phase is independently shippable; later phases depend on earlier.

### Phase A — Data + API (no UI yet)

1. Add `GET /api/memory/graph` and `PATCH /api/memory/colorway` to backend.
2. Add chat metadata notes (frontmatter fields from §9.3) to chat-save flow.
3. Add `colorway.json` to the basic-memory vault root.
4. Add `prompt_provenance` field to all memory node templates.
5. Update each agent's orchestrator wrapper to extract and persist `colorway_proposal` from the final response (see §10).
6. Wire the orchestrator addendum (§10.1) into the system-prompt loader.

**Done when**: hitting `GET /api/memory/graph` returns the right shape. Colorway file updates when a chat ends.

### Phase B — Force engine + shared data layer (no rendering yet)

1. `useGraphData.ts` hook.
2. `useColorway.ts` hook.
3. `ForceEngineContext.tsx` — shared `d3-force-3d` simulation instance.
4. `useMemoryGraph.ts` WebSocket subscription.
5. Unit tests for edge computation (`buildEdges` from §9.4).

**Done when**: hooks return data, edge computation is verified, WebSocket updates propagate.

### Phase C — Mini 2D graph

1. `MiniMemoryGraph.tsx` — 220×140, `react-force-graph-2d`, in chat top-left.
2. "Open Memory 3D" button (§5.3).
3. Hover tooltip.
4. Click → `router.push(/chats/{chat_id})`.
5. WebSocket update animation.
6. Performance cap (500 nodes visible).

**Done when**: open a chat, see the mini graph, hover a node, click it, see the chat open. Performance cap works at 500+ nodes.

### Phase D — Fullscreen 3D shell

1. `MemoryGraph3D.tsx` page at `/memory/3d`.
2. `MemoryGraph3DCanvas.tsx` — `react-force-graph-3d` with all parameters from §6.
3. `MemoryLeftRail.tsx` + `MemoryRightRail.tsx` (48px each).
4. `MemoryCommandPalette.tsx` (Cmd+K).
5. ESC dismissal with 200ms fade.
6. Bottom-right counter.
7. `prefers-reduced-motion` handling.

**Done when**: open `/memory/3d`, see the 3D graph with depth fog, navigate the rails, Cmd+K search, click a node opens the chat. ESC returns.

### Phase E — Right rail panels

1. `MemorySettingsPanel.tsx` — color legend, sliders, selected node info.
2. Color override (native color picker) + reset.
3. `MemoryProvenanceDrawer.tsx` — full audit trail per node.
4. Right rail's `LocateFixed` re-centers camera.

**Done when**: open settings, change a category color, see graph update. Open provenance, see the full prompt that created the node.

### Phase F — Polish + accessibility

1. Keyboard nav (Tab cycles nodes, Enter selects, arrows pan).
2. Auto-rotate on idle (30s timeout).
3. Lighthouse 90+ perf, 100 a11y.
4. Playwright e2e (mini renders, fullscreen opens, Cmd+K searches, color override updates, provenance opens).
5. Bundle-size guard for `three` (lazy-load only when fullscreen opens).

**Done when**: lighthouse passes, e2e green, no console errors.

### Phase G — Deprecation cleanup

1. Delete `MemoryExplorer.tsx`, `MemorySearch.tsx`, `MemoryTimeline.tsx`, `MemoryNoteEditor.tsx`, `MemoryTagExplorer.tsx`, `MemoryOutlinePanel.tsx`, prior `MemoryGraph.tsx`.
2. Remove `/memory` route (replaced by `/memory/3d` and the in-chat mini).
3. Update any remaining references in `App.tsx`, `Sidebar.tsx`.

**Done when**: only the new components exist. Bundle is smaller than before.

---

## 16. RECONCILIATION WITH PRIOR SPECS

### 16.1 `Memory_system.md` v2.1

| Section | Status | Notes |
|---|---|---|
| §2 Architecture | Kept | basic-memory MCP remains the storage layer. |
| §3 Memory node types | Modified | Add `prompt_provenance` field to every template. |
| §3.1 Directory structure | Kept | `chats/` directory added at the same level as `decisions/`, `recommendations/`, etc. |
| §4 MCP tool mapping | Kept | No change. |
| §5 Edges via wikilinks | **Replaced by §9 of this spec** | Wikilinks still work for `memory_to_pattern` edges; primary edges are chat-lineage. |
| §6 Agent memory workflow | Modified | Add end-of-chat colorway proposal step (see §10). |
| §7 Frontend integration | **Replaced by §12 of this spec** | The 3-tab shell is deprecated. |
| §8 Obsidian integration | Kept | User can still open `~/.fin/memory/` in Obsidian; the chat metadata notes are valid markdown. |
| §9 Setup | Kept | |
| §10 Migration | Kept | |
| §11 TencentDB | Kept (Phase 3+) | Out of scope for this spec. |

### 16.2 `fin-memory-obsidian.md` (Phase 20 brief)

**Mostly deprecated.** The CodeMirror editor, file tree, daily note, command palette's file-jump use, and tag explorer are all gone. The only reusable concept is the Cmd+K command palette, repurposed for graph search.

### 16.3 `Recommendation_engine.md` §10 (Memory feedback loop)

**Modified**: the `agent_memory` field in the context should also include the current `colorway.json` so the agent can match prior colors when re-emitting proposals.

### 16.4 `Frontend_Architecture.md` "The Ocean" thesis

**Unchanged**: the visual thesis still applies. The 3D memory graph sits inside the ocean, not in place of it. The mini graph in the chat top-left is a small window into the deeper 3D space.

**Inline summary for implementers** (so this spec stays self-contained): "The Ocean" is the Fin front-page metaphor — a deep blue background (the prior spec uses `#1a3a52`; we use `--bg-graph` from §3.1 for visual consistency) with three animated "fin" shapes (Investment, Debt, Retirement) drifting in slow circles via D3 or Three.js. The 3D memory graph lives BEHIND the fins, accessible via a top-right "Memory" button on the ocean page. The mini graph in the chat top-left is a small viewport into that same 3D space. The fins keep their existing functional colors (no per-agent color coding on the fins); the graph nodes use the per-category colorway from §3.2.

---

## 17. OPEN DECISIONS (flagged for user confirmation before Phase A starts)

1. **Edit permissions**: the user said "Yes" to edit. Interpreted as "edit colors, tags, confidence, AND category label" — NOT create/delete nodes. **Confirm this interpretation.** If full CRUD is wanted, Phase A grows by ~3 days.
2. **Bundle size budget**: `react-force-graph-3d` pulls in `three` (~600KB gz). Acceptable, or do we lazy-load it only when fullscreen opens?
3. **Auto-rotate timeout**: 30 seconds idle. Adjustable. Default 30s, but is the OKLCH amber #e8b73a warning color good? It's used for both warnings AND the car debt seed. **Consider renaming one.**
4. **Color picker library**: native `<input type="color">` is sufficient, but lacks alpha. Use native or pull in `react-colorful` (~3KB)? Default: native.
5. **Multi-user**: `colorway.json` is per-user today (scoped by `user_id`). If a user wants a shared colorway across devices, do we sync via the existing basic-memory MCP? Default: no sync, local only.
6. **First-run experience**: when `colorway.json` doesn't exist yet, ALL nodes are gray. The first chat the user has will fill in the first colors. Acceptable, or do we pre-seed the seed palette at first run? **Default: pre-seed.**

These don't block writing the implementation brief, but they do block Phase A.

---

*Document Version: 3.0 | Last Updated: July 2026 | Status: Visual-first spec complete. Awaiting user confirmation on §17 before implementation begins.*
