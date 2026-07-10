# Portfolio Visualization

## Overview

The Portfolio Visualization is the primary user-facing interface for Fin. It renders an ocean-themed scene using Three.js (WebGL particle ocean) and D3.js (force-directed memory graph), with animated agent fins circling the user's portfolio like marine life. The design follows the "Ocean" metaphor from `docs/Frontend_Architecture.md`: calm, deep, alive. Agents are fins — each with distinct motion character — moving through a data ocean that pulses with portfolio activity.

---

## Design Philosophy

### Physical Scene

A user checks their portfolio at 9pm on a MacBook in a dim home office after the kids are asleep. The screen glows with deep navy and teal, not harsh white. Three fins circle at different depths — Investment Agent (dorsal, confident arcs), Debt Agent (pectoral, slow methodical sweeps), Retirement Agent (caudal, long horizon drifts). Small fish (individual holdings) school near the fins. The memory graph shimmers below like bioluminescent connections. Nothing is frantic. Everything breathes.

### Visual Metaphor

| Element | Ocean Metaphor | Data Representation |
|---------|---------------|---------------------|
| Ocean background | Deep sea gradient (navy → teal → abyss) | Overall portfolio health |
| Agent fins | Marine life (dorsal/pectoral/caudal) | Active agent status + specialty |
| Fish particles | Schooling fish | Individual stock holdings |
| Coral structures | Reef formations | Asset allocation clusters |
| Bioluminescent nodes | Deep-sea light points | Memory graph connections |
| Currents/particles | Ocean drift | Market trend direction |
| Sonar pulse rings | Echolocation waves | Data refresh heartbeat |
| Depth layers | Bathymetric zones | Risk tiers (safe near surface, speculative in deep) |

---

## 1. Three.js Ocean Scene

### Scene Composition

```
Ocean Scene (Three.js WebGLRenderer, WebGL 2.0 required)
├── Skybox: Gradient shader (navy zenith → dark teal horizon → abyss nadir)
├── Ocean Surface: Animated vertex-displacement plane
│   ├── Wave simulation via Gerstner waves (4 octaves)
│   ├── Foam crests (whitecaps at wave peaks)
│   └── Caustic light rays (underwater god rays)
├── Particle System: 500–2000 ambient particles (bubbles/detritus)
│   ├── Count scaled by GPU tier on load
│   └── Drift animation: sinusoidal + noise
├── Agent Fins: 3 animated fin meshes
│   ├── Investment Agent: Dorsal fin (sharp, fast arcs)
│   ├── Debt Agent: Pectoral fin (wide, methodical sweeps)
│   └── Retirement Agent: Caudal fin (long, slow drifts)
├── Holding Fish: N small fish meshes (1 per stock holding)
│   ├── School near their sector's fin agent
│   ├── Bob and weave with Perlin noise
│   └── Color = sector (tech=cyan, finance=gold, energy=amber, etc.)
├── Depth Zones: Semi-transparent gradient planes at depth intervals
│   ├── Euphotic (0–30m): Safe assets (bonds, cash) — bright teal
│   ├── Mesopelagic (30–200m): Balanced holdings — muted blue
│   ├── Bathypelagic (200–1000m): Growth stocks — deep navy
│   └── Abyssopelagic (1000m+): Speculative — near-black with glints
└── Sonar Pulse: Expanding ring every 15 min (refresh heartbeat)
    └── Opacity fades with distance, color = data freshness (green→yellow→red)
```

### WebGL 2.0 Requirements & Fallback

**Detection**:
```typescript
function detectWebGL2Support(): 'full' | 'degraded' | 'none' {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return 'none';
  // Safari Metal backend: check for missing extensions
  const hasFloatBuffer = gl.getExtension('EXT_color_buffer_float');
  const hasHalfFloat = gl.getExtension('EXT_color_buffer_half_float');
  if (!hasFloatBuffer || !hasHalfFloat) return 'degraded'; // Safari
  return 'full';
}
```

**Tiered Rendering**:

| GPU Tier | Particles | Fins | Ocean | Post-Processing |
|----------|-----------|------|-------|-----------------|
| Full (M1+, discrete GPU) | 2000 particles, full caustics | 3D fin meshes with fin ray animation | 4-octave Gerstner waves + foam | God rays, bloom, depth fog |
| Degraded (Safari, integrated GPU) | 800 particles, no caustics | 3D fin meshes (simplified) | 2-octave waves, no foam | Depth fog only |
| None (< WebGL 2.0) | 2D canvas ocean (CSS gradient animation) | CSS-animated SVG fins | Static gradient + CSS wave keyframes | None |

### Performance Budget

- **Target**: 30fps minimum on all tiers, 60fps on Full tier
- **Budget**: ≤8ms frame budget for JS (leaves 8ms for GPU on 60fps target)
- **Particle limit**: 2000 max (Full), 800 max (Degraded)
- **Draw calls**: ≤50 per frame total
- **Texture memory**: ≤64MB total (ocean normal map 1024x1024 + fin textures 512x512)
- **Adaptive quality**: FPS monitor reduces particle count by 25% if <30fps sustained for 3 seconds
- **Background throttling**: `requestAnimationFrame` paused when tab is hidden (Page Visibility API)
- **Browser**: Last 2 versions of Chrome, Firefox, Safari. WebGL 2.0 required for Full/Degraded tiers.

---

## 2. Fin Animation System

### Agent Fin Characters

Each of the three agents has a distinct fin shape and motion personality derived from its system prompt role.

#### Investment Agent — Dorsal Fin (The Shark)

- **Shape**: Tall, sharp triangular dorsal fin slicing through water surface
- **Motion**: Fast, confident arcs. Circles the portfolio cluster in tight orbits.
  - Speed: 0.8–1.2 rad/s orbit
  - Turn radius: Small, agile
  - Vertical oscillation: ±0.3 units (breaching surface occasionally)
- **Personality**: Predator. Always moving. When market is volatile, speed increases.
- **State mapping**:
  - Idle: Smooth figure-8 patrol
  - Analyzing: Rapid direction changes, fin twitch (micro-rotation)
  - Recommending: Slow approach toward a holding fish, then quick dart away
  - Executing trade: Breach surface (fin exits water, splash particles)

#### Debt Agent — Pectoral Fin (The Manta)

- **Shape**: Wide, flat pectoral fins like a manta ray, gliding along the seafloor
- **Motion**: Slow, methodical sweeps. Wide arcs at consistent depth.
  - Speed: 0.3–0.5 rad/s orbit
  - Turn radius: Wide, graceful
  - Vertical: Stays in mesopelagic zone (debt = weight, pulls downward)
- **Personality**: Grounded. Steady. Undulating fin edges ripple like a manta's wingtips.
- **State mapping**:
  - Idle: Slow cruise along seafloor with wing ripple
  - Analyzing debt: Descends slightly (deeper = heavier debt burden)
  - Recommending payoff: Ascends toward euphotic zone (relief)
  - Debt paid off: Bioluminescent burst, rapid ascent, particle celebration

#### Retirement Agent — Caudal Fin (The Whale)

- **Shape**: Broad caudal (tail) fluke, slow deliberate strokes
- **Motion**: Long, deep arcs. Largest orbit radius of all three.
  - Speed: 0.15–0.3 rad/s orbit
  - Turn radius: Very wide, horizon-spanning
  - Vertical: Spans all depth zones — surfaces for breath, dives deep for long view
- **Personality**: Patient. Vast. The fluke pushes enormous water volume with each stroke.
- **State mapping**:
  - Idle: Slow migration across the scene, deep breathing rhythm (ascent/descent cycle)
  - Projecting: Circles widen (long-term horizon expanding)
  - Milestone hit: Breach + tail slap (splash particles, surface rings)
  - Warning: Rapid dive (descending fast = underfunded alert)

### Fin Mesh Construction

Each fin is a custom Three.js `BufferGeometry` with vertex shader animation for fin rays:

```typescript
// fins/fin-geometry.ts
interface FinConfig {
  type: 'dorsal' | 'pectoral' | 'caudal';
  height: number;
  width: number;
  rayCount: number;       // Number of fin ray bones for animation
  membraneColor: string;  // Translucent webbing
  rayColor: string;       // Bone lines
}

const INVESTMENT_FIN: FinConfig = {
  type: 'dorsal',
  height: 3.0,
  width: 1.2,
  rayCount: 7,
  membraneColor: '#14b8a6', // teal-500
  rayColor: '#0d9488',       // teal-600
};

const DEBT_FIN: FinConfig = {
  type: 'pectoral',
  height: 1.5,
  width: 4.0,
  rayCount: 12,
  membraneColor: '#a855f7', // purple-500
  rayColor: '#9333ea',       // purple-600
};

const RETIREMENT_FIN: FinConfig = {
  type: 'caudal',
  height: 2.5,
  width: 5.0,
  rayCount: 9,
  membraneColor: '#f59e0b', // amber-500
  rayColor: '#d97706',       // amber-600
};
```

### Motion Curves (CSS Transition & WAAPI for Fin Orbits)

Per the ui-animation skill defaults:

- **Fin orbit transitions**: `cubic-bezier(0.25, 1, 0.5, 1)` (Move curve), 200–300ms
- **Fin state changes** (analyzing → recommending): `cubic-bezier(0.22, 1, 0.36, 1)` (Enter curve), 200–350ms
- **Sonar pulse**: `ease-out` opacity fade, 2000ms
- **Particle drift**: Continuous sinusoidal, no easing (constant velocity)
- **Fin ray undulation**: Continuous sine wave on vertex shader, frequency varies by agent

All fin movement uses `transform` (translate3d + rotate) and `opacity` only. No layout-triggering properties.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .fin-orbit,
  .fin-ray-undulation,
  .particle-drift,
  .ocean-wave {
    animation: none !important;
    transition: none !important;
  }
  .fin {
    /* Stationary fins with subtle opacity pulse instead of orbit */
    animation: fin-breath 4s ease-in-out infinite;
  }
  @keyframes fin-breath {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; }
  }
}
```

---

## 3. Force-Directed Memory Graph

### Integration with Memory System

From `docs/Features/Memory_system/Memory_system.md`, each agent maintains a per-agent memory store with:
- **Context nodes**: Past decisions, user preferences, learned behaviors
- **Edges**: Relationships (causal, temporal, similarity) between nodes
- **Node strength**: Reinforcement score from repeated successful patterns

The force-directed graph visualizes this as a bioluminescent deep-sea network below the ocean surface.

### D3.js Force Simulation

```typescript
// memory-graph/graph.ts
interface MemoryNode extends d3.SimulationNodeDatum {
  id: string;
  agent: 'investment' | 'debt' | 'retirement';
  type: 'decision' | 'preference' | 'behavior' | 'outcome';
  strength: number;      // 0–1 reinforcement score
  glowIntensity: number; // Derived from strength
  label: string;
  createdAt: ISO8601;
}

interface MemoryEdge extends d3.SimulationLinkDatum<MemoryNode> {
  type: 'causal' | 'temporal' | 'similarity' | 'contradiction';
  weight: number; // 0–1
}

// Force configuration
const simulation = d3.forceSimulation<MemoryNode>(nodes)
  .force('link', d3.forceLink<MemoryNode, MemoryEdge>(edges)
    .distance(d => 80 * (1 - d.weight)) // Stronger = closer
    .strength(d => d.weight * 0.5)
  )
  .force('charge', d3.forceManyBody<MemoryNode>()
    .strength(d => -150 * d.strength) // Strong nodes repel more
  )
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide<MemoryNode>(12))
  .force('agentCluster', clusterByAgent()); // Group nodes by agent
```

### Visual Encoding

| Property | Encoding |
|----------|----------|
| Node color | Agent color (teal/purple/amber) |
| Node size | 6–20px radius, scaled by `strength` |
| Node glow | `filter: drop-shadow()` with CSS custom property, intensity = `glowIntensity` |
| Edge opacity | `weight` value (0.15–0.9) |
| Edge stroke | Agent color, dashed for contradiction edges |
| Node pulse | CSS animation on newly created/accessed nodes (pulse once on update) |
| Depth position | Y-offset: investment nodes near surface, debt nodes deeper, retirement spanning |

### Bioluminescent Effect

```css
.memory-node {
  fill: var(--agent-color);
  filter: drop-shadow(0 0 calc(var(--glow-intensity) * 8px) var(--agent-color));
  transition: filter 300ms ease-out;
}

.memory-node--active {
  filter: drop-shadow(0 0 16px var(--agent-color))
          drop-shadow(0 0 32px var(--agent-color));
}

.memory-edge {
  stroke-opacity: var(--weight);
  transition: stroke-opacity 300ms ease-out;
}
```

### Graph States

| State | Behavior |
|-------|----------|
| **Default** | Simulation running at low alpha (0.02). Nodes drift slowly in clusters. |
| **Hover node** | Neighboring nodes highlight (opacity 1.0), non-neighbors dim (opacity 0.2). Edges to neighbor pulse. |
| **Agent filter** | Click fin → only that agent's nodes + cross-agent edges shown. Others fade to 0.05 opacity. |
| **New memory** | New node appears at center, pulses 3 times, then simulation re-settles it. |
| **Fullscreen** | Panel expands to fill viewport. Simulation re-centers. Node labels appear. |

### Interaction

- **Pan & Zoom**: D3 zoom behavior (mouse wheel, pinch)
- **Node drag**: Drag individual nodes to explore connections (releases on mouseup)
- **Click node**: Show memory detail panel (decision description, timestamp, related recommendations)
- **Double-click**: Focus on node (re-center simulation, highlight 2-hop neighborhood)

---

## 4. Agent Card Dashboard

### Layout

The dashboard overlays the ocean scene with translucent, depth-aware panels. Three agent cards arranged in a column on the right side (desktop) or as swipeable cards on mobile.

```
┌──────────────────────────────────────────────┐
│  Ocean Scene (full viewport)                  │
│                                                │
│    🌊 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~      │
│       🦈 (Investment fin circling)            │
│    ~ ~ ~ 🐟 🐟 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~        │
│         🦋 (Debt manta gliding)              │
│    ~ ~ ~ ~ ~ ~ ~ ~ ~ 🐋 (Retirement fluke)   │
│    ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~        │
│                                                │
│                              ┌──────────────┐ │
│                              │ 🦈 Investment │ │
│                              │ Portfolio     │ │
│                              │ $42,350 ▲2.1%│ │
│                              │ 3 recs pending│ │
│                              └──────────────┘ │
│                              ┌──────────────┐ │
│                              │ 🦋 Debt Agent │ │
│                              │ $12,800 debt  │ │
│                              │ Avalanche plan│ │
│                              └──────────────┘ │
│                              ┌──────────────┐ │
│                              │ 🐋 Retirement │ │
│                              │ 22 yrs to go  │ │
│                              │ $890/mo gap   │ │
│                              └──────────────┘ │
└──────────────────────────────────────────────┘
```

### Agent Card Component

Each card uses the ocean metaphor for its visual language:

```typescript
// components/AgentCard.tsx
interface AgentCardProps {
  agent: 'investment' | 'debt' | 'retirement';
  status: AgentStatus;
  metrics: AgentMetrics;
  pendingRecommendations: number;
  onExpand: () => void;
}
```

**Card Visual Design** (impeccable — product register):

- **Background**: `oklch(0.15 0.02 230)` — deep ocean glass, not pure transparency. Slight blur backdrop.
- **Border**: 1px `oklch(0.25 0.03 230)`, not side-stripe. Full border, subtle.
- **Active state**: Subtle inner glow matching agent color (`box-shadow: inset 0 0 20px rgba(agent-rgb, 0.15)`)
- **Hover**: Card lifts 2px (`translateY(-2px)`), glow intensifies. `transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease-out`
- **Typography**: Agent name in 14px/600, metric value in 24px/700 (tabular figures), metric label in 11px/400 uppercase tracking
- **No nested cards**: Agent cards are sibling panels, never nested
- **No em dashes**: Use colons or sentence breaks

**Card States**:

| State | Visual |
|-------|--------|
| Idle | Subdued glow, slow fin pulse in card icon |
| Active (agent speaking) | Brighter glow, icon fin animates faster, subtle border color shift to agent color |
| Has pending recs | Badge count on card, gentle pulse animation |
| Warning (stale data, underfunded) | Amber tint overlay on card, subtle shake on mount (once) |
| Error (connector down) | Red tint, static fin icon, error indicator |

**Metric Display** (no hero-metric template — varied layouts per agent):

- Investment: Portfolio value (large), daily change (color-coded), allocation mini-bar (horizontal stacked segments)
- Debt: Total debt (muted, not celebrated), next payoff target (prominent), freedom date projection
- Retirement: Monthly gap (the number that matters), projected age, on-track indicator (green/amber/red dot)

---

## 5. Responsive Behavior

From `docs/Features/Setup_wizard/Setup_wizard_frontend_spec` responsive breakpoints:

| Breakpoint | Width | Ocean Scene | Agent Cards | Memory Graph |
|------------|-------|-------------|-------------|--------------|
| Mobile | < 640px | 2D canvas ocean (CSS animation), fins = CSS-animated SVG icons | Swipeable card stack (1 visible, swipe to next). Cards fill 90vw. | Hidden by default, toggle button to show fullscreen |
| Tablet | 640–1024px | Three.js degraded tier, 800 particles, fins visible but simplified | 2-column card layout, side by side | Collapsible panel bottom (40vh when open) |
| Desktop | ≥ 1024px | Full Three.js scene, 2000 particles, all fin animations | 3-card vertical column, right-aligned, 320px wide | Persistent right panel below cards or expanded overlay |
| Large | ≥ 1440px | Full scene + caustics + post-processing | Cards 360px wide, more breathing room | Persistent side panel next to cards |

### Mobile Adaptations

- **Touch targets**: Cards ≥ 44px height for tap areas
- **Swipe**: Horizontal swipe between agent cards (framer-motion drag gesture)
- **Ocean**: Replace Three.js with CSS-animated gradient + SVG fins to save battery/GPU
- **Particles**: CSS `@property` animated gradient positions instead of WebGL particles
- **Memory graph**: Accessible via floating action button, opens fullscreen

---

## 6. Animation Specifications

### Ocean Wave Animation

```
Property: vertex Y-displacement
Duration: Continuous
Easing: N/A (sinusoidal)
Implementation: Vertex shader — Gerstner wave summation
Parameters:
  - Wave count: 4 octaves
  - Primary amplitude: 0.3 units
  - Primary frequency: 0.5
  - Primary speed: 0.8
  - Secondary amplitude: 0.15
  - Secondary frequency: 1.2
  - Secondary speed: 1.4
  - Choppy factor: 0.4
Reduced motion: Flat plane at mean Y
```

### Sonar Pulse Animation

```
Purpose: Data refresh heartbeat indicator
Trigger: Every 15 minutes (on Alpaca quote refresh)
Element: Expanding ring centered on user's portfolio cluster
Duration: 2000ms per pulse
Easing: ease-out (opacity fades from 0.6 → 0, scale 0.5 → 2.0)
Properties: transform: scale(), opacity
Color: oklch(0.65 0.15 200) → transparent
Reduced motion: Static subtle ring at 0.3 opacity (no animation)
```

### Holding Fish Schooling

```
Purpose: Visualize individual stock positions as fish
Count: 1 fish per holding (max 30 fish for performance)
Behavior: Boids flocking algorithm (separation, alignment, cohesion)
  - Separation radius: 2 units
  - Alignment radius: 4 units
  - Cohesion radius: 6 units
  - Max speed: 0.5 units/s
  - Max force: 0.1 units/s²
Animation: requestAnimationFrame loop updating boid positions
Reduced motion: Fish stationary, gentle bob only (sinusoidal Y)
```

### Agent Card Entrance

```
Trigger: Card appears in viewport (IntersectionObserver)
Duration: 400ms per card, staggered by 100ms (Debt → Investment → Retirement)
Easing: cubic-bezier(0.22, 1, 0.36, 1)
Properties: opacity (0 → 1), transform: translateY(20px → 0)
Reduced motion: opacity fade only, no translation
```

### Fin State Transitions

```
Trigger: Agent state change (idle → analyzing → recommending)
Duration: 300ms
Easing: cubic-bezier(0.25, 1, 0.5, 1)
Properties: transform (orbit radius, speed), fin vertex displacement (shader uniform)
Implementation: GSAP or direct uniform interpolation
Reduced motion: Instant state change, no transition
```

---

## 7. Data Flow

```
User Context File
       │
       ├── portfolio.positions[] ──→ Holding Fish (count, sector, value → size/color)
       ├── portfolio.allocation ───→ Depth zone distribution
       ├── data_quality_flags ─────→ Sonar pulse color
       │
Agent System Prompts
       │
       ├── Agent state ────────────→ Fin motion mode (idle/analyzing/recommending)
       ├── Recent recommendations ─→ Card pending count
       │
Memory System (per-agent stores)
       │
       ├── Memory nodes ───────────→ Force graph nodes
       ├── Memory edges ───────────→ Force graph links
       └── Reinforcement scores ───→ Node strength → size/glow
```

---

## 8. Accessibility

- **Screen readers**: Ocean scene container has `aria-hidden="true"`. All data available in card text + a hidden data table.
- **Keyboard nav**: Tab through agent cards, Enter to expand. Memory graph nodes focusable with arrow key navigation.
- **Color independence**: Agent fins have distinct silhouettes (not color alone). Allocation uses pattern + color. Depth zones labeled with text overlays.
- **Contrast**: Card text meets WCAG AA against ocean background (≥4.5:1 for body, ≥3:1 for large text).
- **Focus indicators**: Visible outline on cards, 2px offset, agent-colored.

---

## 8. Recharts Charts (Standard Dashboard)

### 8.1 Why Recharts for Standard Charts

Recharts handles 80% of portfolio visualization. Ponytail: use Recharts where it works, D3 only where Recharts can't. Recharts is composable React, built on SVG, handles responsive + dark mode natively.

### 8.2 Allocation Pie Chart

```typescript
// Data shape
interface AllocationSlice {
  name: string;        // "US Equities", "Bonds", "Cash", etc.
  value: number;       // dollar amount
  percentage: number;  // 0–100
  color: string;       // sector color from theme
}

// Component
<PieChart width={320} height={320}>
  <Pie
    data={allocationData}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    innerRadius={60}    // donut
    outerRadius={120}
    paddingAngle={2}
    cornerRadius={4}
  >
    {allocationData.map((entry) => (
      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
    ))}
  </Pie>
  <Tooltip
    formatter={(value: number) => formatCurrency(value)}
    contentStyle={{ background: 'oklch(0.15 0.02 230)', border: '1px solid oklch(0.25 0.03 230)', borderRadius: 8 }}
  />
  <Legend />
</PieChart>
```

Dark mode: Recharts `ResponsiveContainer` inherits CSS variables. Tooltip/contentStyle uses theme tokens.

### 8.3 Performance Line Chart

```typescript
interface PerformancePoint {
  date: string;        // ISO date
  portfolioValue: number;
  benchmarkValue: number;  // S&P 500 or custom benchmark
  contributions: number;   // cumulative deposits
}

<LineChart data={performanceData}>
  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 230)" />
  <XAxis dataKey="date" stroke="oklch(0.45 0.02 230)" />
  <YAxis stroke="oklch(0.45 0.02 230)" tickFormatter={formatCurrencyShort} />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="portfolioValue"
    stroke="var(--color-investment)" // teal
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 4 }}
  />
  <Line
    type="monotone"
    dataKey="benchmarkValue"
    stroke="oklch(0.5 0.02 230)"
    strokeWidth={1.5}
    strokeDasharray="4 4"
    dot={false}
  />
  <ReferenceArea
    y1={0}
    y2={contributionsTotal}
    fill="oklch(0.2 0.02 230)"
    fillOpacity={0.15}
    label="Contributions"
  />
</LineChart>
```

### 8.4 Sector Exposure Horizontal Bar Chart

```typescript
interface SectorExposure {
  sector: string;
  portfolioWeight: number;  // 0–100
  benchmarkWeight: number;  // for comparison
  delta: number;            // over/underweight vs benchmark
}

<BarChart data={sectorData} layout="vertical" margin={{ left: 100 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 230)" />
  <XAxis type="number" stroke="oklch(0.45 0.02 230)" tickFormatter={pct} />
  <YAxis type="category" dataKey="sector" stroke="oklch(0.45 0.02 230)" />
  <Tooltip />
  <Bar dataKey="portfolioWeight" fill="var(--color-investment)" barSize={16} radius={[0, 4, 4, 0]} />
  <Bar dataKey="benchmarkWeight" fill="oklch(0.4 0.02 230)" barSize={16} radius={[0, 4, 4, 0]} opacity={0.5} />
</BarChart>
```

### 8.5 Responsive + Dark Mode

```typescript
// All charts wrapped in ResponsiveContainer
<ResponsiveContainer width="100%" height={320}>
  <PieChart>...</PieChart>
</ResponsiveContainer>

// Dark mode: Recharts reads CSS custom properties
// Theme file:
[data-theme="dark"] {
  --chart-grid: oklch(0.25 0.02 230);
  --chart-text: oklch(0.45 0.02 230);
  --chart-tooltip-bg: oklch(0.15 0.02 230);
}
```

---

## 9. D3.js Charts (Where Recharts Can't)

### 9.1 When D3

D3 only when Recharts composable model breaks down: correlation matrix heatmap (custom cell rendering), Monte Carlo fan chart (thousands of paths with fill-opacity bands, Recharts Area can't do percentile bands cleanly).

### 9.2 Monte Carlo Fan Chart (D3)

From Investment Agent Skill #20: 10,000 simulated return paths → percentile bands 5th–95th.

```typescript
// Data shape (from Monte Carlo simulation skill #20 output)
interface MonteCarloResult {
  paths: number[][];           // 10000 paths × N years of annual values
  percentiles: {
    p5: number[];              // 5th percentile trajectory
    p10: number[];
    p25: number[];
    p50: number[];             // median trajectory
    p75: number[];
    p90: number[];
    p95: number[];             // 95th percentile trajectory
  };
  years: number[];             // projection years [1, 2, ..., N]
  initialValue: number;
  targetValue?: number;        // retirement goal line
  probabilityOfShortfall: number; // 0–1
}

// D3 fan chart: area bands between percentile pairs
function drawMonteCarloFan(
  svg: d3.Selection<SVGSVGElement>,
  data: MonteCarloResult,
  dimensions: { width: number; height: number; margin: Margin }
) {
  const { width, height, margin } = dimensions;
  const x = d3.scaleLinear()
    .domain([0, d3.max(data.years)!])
    .range([margin.left, width - margin.right]);
  const y = d3.scaleLinear()
    .domain([
      d3.min(data.percentiles.p5)! * 0.9,
      d3.max(data.percentiles.p95)! * 1.1
    ])
    .range([height - margin.bottom, margin.top]);

  // Bands from widest (lightest) to narrowest (darkest)
  const bands: Array<{ lower: keyof MonteCarloResult['percentiles']; upper: keyof MonteCarloResult['percentiles']; opacity: number; label: string }> = [
    { lower: 'p5',  upper: 'p95', opacity: 0.08, label: '90% range' },
    { lower: 'p10', upper: 'p90', opacity: 0.10, label: '80% range' },
    { lower: 'p25', upper: 'p75', opacity: 0.15, label: '50% range' },
  ];

  const areaGenerator = d3.area<number>()
    .x((_, i) => x(data.years[i]))
    .y0((_, i) => y(data.percentiles[lower][i]))
    .y1((_, i) => y(data.percentiles[upper][i]))
    .curve(d3.curveMonotoneX);

  bands.forEach(({ lower, upper, opacity }) => {
    svg.append('path')
      .datum(data.years)
      .attr('d', areaGenerator)
      .attr('fill', 'var(--color-investment)')  // teal
      .attr('opacity', opacity)
      .attr('stroke', 'none');
  });

  // Median line (prominent)
  const medianLine = d3.line<number>()
    .x((_, i) => x(data.years[i]))
    .y((_, i) => y(data.percentiles.p50[i]))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(data.years)
    .attr('d', medianLine)
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-investment)')
    .attr('stroke-width', 2.5);

  // Target line (if retirement goal set)
  if (data.targetValue) {
    svg.append('line')
      .attr('x1', x(0))
      .attr('x2', x(d3.max(data.years)!))
      .attr('y1', y(data.targetValue))
      .attr('y2', y(data.targetValue))
      .attr('stroke', 'var(--color-retirement)')  // amber
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 4');
  }

  // Initial value dot
  svg.append('circle')
    .attr('cx', x(0))
    .attr('cy', y(data.initialValue))
    .attr('r', 5)
    .attr('fill', 'var(--color-investment)');

  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  // ... percentile band labels ...
}
```

### 9.3 Correlation Matrix Heatmap (D3)

```typescript
interface CorrelationMatrix {
  assets: string[];                    // ["AAPL", "MSFT", "BND", ...]
  matrix: number[][];                  // matrix[i][j] = correlation coefficient
}

// D3 heatmap: rect grid with color scale
function drawCorrelationHeatmap(
  svg: d3.Selection<SVGSVGElement>,
  data: CorrelationMatrix,
  cellSize: number
) {
  const colorScale = d3.scaleSequential(d3.interpolateRdBu)
    .domain([1, -1]);  // red=positive, blue=negative, white=0

  const cells = svg.selectAll('g')
    .data(data.matrix.flatMap((row, i) =>
      row.map((value, j) => ({ i, j, value }))
    ))
    .join('g')
    .attr('transform', d => `translate(${d.j * cellSize}, ${d.i * cellSize})`);

  cells.append('rect')
    .attr('width', cellSize - 1)
    .attr('height', cellSize - 1)
    .attr('fill', d => colorScale(d.value))
    .attr('rx', 2);

  // Diagonal (self-correlation = 1.0)
  cells.filter(d => d.i === d.j)
    .select('rect')
    .attr('stroke', 'oklch(0.5 0.02 230)')
    .attr('stroke-width', 1);

  // Labels
  cells.filter(d => d.i === d.j)
    .append('text')
    .attr('x', cellSize / 2)
    .attr('y', cellSize / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', 'oklch(0.8 0.02 230)')
    .attr('font-size', 9)
    .text(d => data.assets[d.i]);
}
```

### 9.4 D3 Integration Pattern

```typescript
// D3 charts live inside React via useEffect + useRef
function MonteCarloChart({ data }: { data: MonteCarloResult }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();  // clear on re-render
    drawMonteCarloFan(svg, data, getDimensions());
  }, [data]);

  return <svg ref={svgRef} style={{ width: '100%', height: '400px' }} />;
}
```

Resize: ResizeObserver triggers redraw with debounced `getDimensions()`. Dark mode: D3 reads CSS custom properties via `getComputedStyle(document.documentElement).getPropertyValue('--color-investment')`.

---

## Implementation Phases


### Phase 1: Core Ocean + Fins
- Three.js scene setup with WebGL 2.0 detection and tiered rendering
- Gerstner wave ocean surface
- Three fin meshes with basic orbit animation
- Agent card dashboard (static cards, responsive)
- GPU tier detection and adaptive quality

### Phase 2: Fish + Memory Graph
- Holding fish boid system
- D3.js force-directed memory graph
- Graph ↔ ocean depth integration
- Bioluminescent node/edge styling

### Phase 3: Polish + Animation
- Fin state transitions (idle/analyzing/recommending)
- Sonar pulse indicator
- Fin ray vertex animation
- Caustic light rays (Full tier only)
- Entrance/exit animations for cards and graph
- Reduced motion passes for all animations

### Phase 4: Mobile + Performance
- 2D canvas fallback ocean for mobile
- CSS fin icons for < WebGL 2.0
- Swipeable card stack
- Adaptive quality FPS monitor
- Background throttling
- Memory/battery profiling

---

## Performance Budget Summary

| Metric | Desktop (Full) | Tablet (Degraded) | Mobile (2D Fallback) |
|--------|---------------|-------------------|---------------------|
| Target FPS | 60 | 30 | 30 |
| Frame budget (JS) | ≤8ms | ≤16ms | ≤16ms |
| Particles | 2000 | 800 | 0 (CSS animated) |
| Draw calls | ≤50 | ≤30 | N/A (DOM) |
| GPU memory | ≤64MB | ≤32MB | N/A |
| Fin meshes | Full 3D + animation | Full 3D, simplified | SVG icons |
| Ocean | 4-octave Gerstner | 2-octave Gerstner | CSS gradient animation |
| Post-processing | God rays + bloom + fog | Depth fog only | None |
| Browser target | Chrome/Firefox/Safari (last 2) | Chrome/Firefox/Safari (last 2) | All evergreen |

## Browser Compatibility

- **Chrome 124+**: Full tier. Best WebGL 2.0 support, ANGLE backend.
- **Firefox 125+**: Full tier. Good WebGL 2.0, different shader compilation quirks (test `mediump` precision).
- **Safari 17.4+**: Degraded tier. Metal backend lacks `EXT_color_buffer_float`; caustics and bloom disabled. Test for shader compilation timeouts on complex shaders.
- **Edge 124+**: Same as Chrome (Chromium-based).
- **< WebGL 2.0**: 2D canvas fallback. SVG fins, CSS gradient ocean, no particles. Full functionality preserved via cards + data table.