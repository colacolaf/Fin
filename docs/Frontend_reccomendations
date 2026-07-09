FIN Frontend Roadmap & Architecture
Privacy-First, Multi-Agent Financial AI Assistant

DESIGN PHILOSOPHY: "THE OCEAN"
Subject: A calm, private ocean where financial agents (fins) swim around autonomously, offering guidance. Users can dive into any agent's workspace to explore recommendations, ask questions, and track decisions.
Visual Thesis: Instead of overwhelming dashboards or chaotic feeds, Fin presents a serene, alive space. Agents are visualized as animated fins circling in an ocean—each with its own intelligence, moving independently but visible at all times. Clicking a fin opens that agent's full workspace (like entering a submarine cabin).
Design Principles Applied:

Subject-grounded: The ocean is the literal metaphor. We use actual water physics, light refraction, gentle motion to evoke calm, not chaos.
Motion as narrative: Fins circling = agents working autonomously. When a recommendation arrives, it appears as a disturbance on the surface. When you vote, the fin "reacts."
One signature element: The animated ocean with circling fins. Everything else (settings sidebar, chat, buttons) is quiet and disciplined.
Typography intentional: Clean, data-forward fonts (Inter, Geist) that feel trustworthy and calm—no decorative serif display faces.
Color restraint: Deep ocean blue (#1a3a52) as primary. Whites (#e8f4f8) for foam/highlights. Functional colors only (green=positive, orange=warning, red=loss). No per-agent color-coding.


VISUAL ARCHITECTURE
Layout Structure
┌──────────────────────────────────────────────────────────────┐
│                          FIN HEADER                          │
│  Logo | Welcome, [User] | Last Sync: 2 min ago | Logout     │
├──────────────────────────────────────────────────────────────┤
│  │                                                            │
│  │  [≡] Sidebar                   OCEAN CANVAS              │
│  │  (collapsed)                    (main interactive area)   │
│  │  ─────────────────              ──────────────────────   │
│  │  📊 Dashboard                                             │
│  │  💰 Portfolio                    ~~~ Investment Fin ~~~   │
│  │  💳 Debt                          (animated, hovering)   │
│  │  🏦 Retirement                                           │
│  │  ❓ Questions                   ~~ Debt Fin ~~           │
│  │  🔬 Research                      (animated, moving)      │
│  │  ────────────────────            ~~ Retirement Fin ~~   │
│  │  ⚙️  Settings                     (animated, circling)   │
│  │                                                          │
│  │                                                          │
│  │                   [+] Refresh Portfolio                 │
│  │                                                          │
│  └──────────────────────────────────────────────────────────┘
│                                                               │
│  [Click sidebar toggle to open/close]                        │
└──────────────────────────────────────────────────────────────┘
Sidebar (Claude.ai-style):

Starts collapsed (narrow, icons only)
Click hamburger (≡) or hover → slides open, reveals full labels
When open, occupies ~280px on desktop, full-width on mobile
Tabs: Dashboard | Portfolio | Debt | Retirement | Questions | Research
Bottom section: Settings, Memory, Chat History, Trade History, Analytics
Smooth slide animation (no jank)

Main Canvas (Center):

Ocean visualization with animated fins
Background: subtle gradient (deep blue → slightly lighter blue toward bottom)
Water effect: subtle waves, light refraction (using D3.js or Three.js)
Fins: simple SVG shapes, smoothly animated in circular/wandering paths
Each fin labeled (Investment, Debt, Retirement) when hovering

Top Bar:

FIN logo (left)
Welcome message + username (center)
Last sync timestamp + manual refresh button (right)
Logout button (far right)


COLOR PALETTE
RoleHexUsagePrimary (Ocean)#1a3a52Background, headings, deep accentsSecondary (Foam)#e8f4f8Card backgrounds, highlights, text areasTertiary (Dark Ocean)#0f1f2eSidebar, footers, text (dark mode-like)Success (Green)#10b981Positive outcomes, executed recommendations, gainsWarning (Orange)#f59e0bAlerts, high concentration, risky movesError (Red)#ef4444Losses, failed actions, debt urgencyNeutral (Light Gray)#f5f5f5Section dividers, disabled statesText Primary#1f2937Body text (high contrast)Text Muted#6b7280Captions, secondary text
Notes:

Avoid color-coding by agent (no "investment=blue, debt=green" schemes)
Use grayscale + functional colors only
Dark mode: invert the palette slightly (lighter ocean becomes darker, foam becomes text)


TYPOGRAPHY
Use CaseFontWeightSizeLine HeightDisplay / HeadingsInter Bold70032px1.2Section TitlesInter SemiBold60024px1.3Body TextInter Regular40016px1.6UI Labels / ButtonsInter Medium50014px1.4Data / NumbersGeist Mono50014px1.5CaptionsInter Regular40012px1.4
Rationale:

Inter: Clean, modern, highly readable at all sizes. No serifs = feels trustworthy and contemporary.
Geist Mono: For numbers, prices, tickers—monospace feels "real data" vs. proportional.
Generous line-height (1.6 body) = calm, readable. Finance data can be dense; breathing room helps.


COMPONENT BREAKDOWN
1. OCEAN VISUALIZATION (Signature Element)
Tech Stack: React + D3.js + Three.js (Opus 4.6 generates the complex animation logic)
What it displays:

Background gradient (deep ocean blue fading to lighter blue)
Water surface with subtle wave animation (using D3 or Canvas)
Three animated "fins" (SVG or 3D shapes):

Investment Fin (blue-tinted)
Debt Fin (orange-tinted)
Retirement Fin (green-tinted)


Gentle circular motion: fins swim in slow circles, occasionally cross paths
Light refraction effect (optional, adds depth): rays of light filtering from top

Interaction:

Hover: Fin highlights slightly, label appears ("Investment Agent")
Click: Fin enlarges briefly, then screen transitions to Agent Context View
Recommendation arrives: Fin "pulses" or briefly changes color, notification bubble appears above it

Performance Considerations:

Use requestAnimationFrame for smooth 60fps animation
Throttle wave calculations (update every 50ms, not every frame)
Lazy-load Three.js if using 3D (code-split)
Canvas fallback if WebGL unavailable

Responsive:

Desktop (1024px+): Ocean takes full center area, fins are large and prominent
Tablet (768px-1023px): Ocean scaled down but still visible, fins responsive to touch
Mobile (<768px): Ocean simplified (2D, no wave effects), fins enlarged for tapping, takes full screen

2. SIDEBAR (Collapsible, Claude.ai-style)
Layout:
┌─────────────────────────┐
│ ☰ (hamburger)  Settings │  ← header, always visible when open
├─────────────────────────┤
│ [≡] Dashboard          │  ← nav tabs (icons when collapsed, labels when open)
│ [💰] Portfolio         │
│ [💳] Debt              │
│ [🏦] Retirement        │
│ [❓] Questions         │
│ [🔬] Research          │
├─────────────────────────┤
│                         │
│ [⚙️] Settings       │  ← secondary tabs (always at bottom)
│ [💭] Memory         │
│ [💬] Chat History   │
│ [📋] Trade History  │
│ [📊] Analytics      │
│                         │
└─────────────────────────┘
Behavior:

Default state: Collapsed (width ~60px, icons only)
On hover or click ≡: Slides open to 280px, reveals labels
On click nav item: Highlights current section, loads that view
On click secondary tab: Opens drawer/modal with that content (Settings, Memory, Chat History, etc.)
Close: Click ≡ again, click outside (when on mobile), or click a nav item to navigate away

Components:

SidebarToggle: Hamburger icon button
NavItem: Icon + label (label hidden when collapsed, shown when open)
SecondaryTab: Settings, Memory, Chat History, Trade History, Analytics
SidebarDrawer: Slides in from left, overlays content on mobile

Styling:

Background: #0f1f2e (dark ocean)
Text: #e8f4f8 (foam white)
Active nav item: #1a3a52 (primary blue) background
Transition: smooth slide (300ms), no jank

3. AGENT CONTEXT VIEW (Full Workspace)
What appears when clicking a fin:
┌──────────────────────────────────────────────┐
│ < Back | Investment Agent | 1 / 3 (Recs)     │  ← header
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Memory Panel    │    Recommendation       │
│  (Left Sidebar)  │    & Chat               │
│  ────────────    │    (Center)              │
│                  │                          │
│  📝 Agent Info   │  ┌────────────────────┐ │
│  - Role:         │  │ Recommendation 1/3 │ │
│    Portfolio     │  │                    │ │
│    Advisor       │  │ Your tech           │ │
│  - Goals:        │  │ allocation is 35%  │ │
│    Balanced      │  │ (target 25%)        │ │
│    growth        │  │                    │ │
│  - Memory:       │  │ Confidence: 85%    │ │
│    12 past       │  │                    │ │
│    decisions     │  │ [Details ▼]        │ │
│                  │  │ [Simulate]         │ │
│  💬 Chat:        │  │                    │ │
│  "Why not VTI?"  │  │ [Accept] [Later]   │ │
│  "NVDA has..."   │  │                    │ │
│                  │  └────────────────────┘ │
│  📊 History:     │                         │
│  - 5 accepted    │  Chat Area:             │
│  - 2 rejected    │  ┌────────────────────┐ │
│  - 3 executed    │  │ AI: Why not VTI... │ │
│                  │  │                    │ │
│  🎯 Trades:      │  │ You: Too volatile  │ │
│  - Executed      │  │                    │ │
│  - Pending       │  │ AI: Actually, VTI  │ │
│  - History       │  │ has 1.1 beta vs... │ │
│                  │  │                    │ │
│                  │  │ [Type message...]  │ │
│                  │  └────────────────────┘ │
│                  │                         │
└──────────────────┴──────────────────────────┘
Left Panel (Memory Sidebar):

Agent Info: Role, current goals, key metrics
Chat History: Past conversations with this agent (collapsible threads)
Decision History: Past recommendations (accepted, rejected, executed)
Trade History: Executed actions and their outcomes

Center Panel (Recommendation + Chat):

Top: Recommendation card (#1 of #3)

Title: Clear, one-sentence recommendation
Reasoning: Expanded explanation (collapsible)
Confidence: Percentage badge (0-100%)
Impact section: Before/after metrics (allocation change, fees, tax impact, etc.)
[Simulate] button: Show what happens if executed (dry-run)
Vote buttons: [Accept] [Later] (inline, sticky at bottom of card)


Middle: Chat area

Previous messages with agent
Input box at bottom: "Ask a follow-up question..."
Send button (or Enter key)



Interaction Flow:

User clicks fin in ocean → Agent Context View opens
User sees Recommendation #1 with confidence, reasoning, impact
User can:

Vote Accept/Later (recommendation saved)
Ask follow-up question in chat
Navigate to next recommendation (arrow or "1/3" counter)
Click "Details" to expand reasoning
Click "Simulate" to see impact before voting


User clicks "< Back" → returns to ocean view, fin still highlighted briefly

4. DASHBOARD / PORTFOLIO OVERVIEW
Appears when user first logs in or clicks "Dashboard" in sidebar:
┌─────────────────────────────────────────────────┐
│ Portfolio Overview                    [Refresh] │
├─────────────────────────────────────────────────┤
│                                                 │
│ Total Value: $150,432  | YTD Gain: +$12,340    │
│ Daily Change: +$245 (+0.16%)                   │
│                                                 │
│ ┌──────────────────┐  ┌───────────────────────┐│
│ │ Asset Allocation │  │ Top 5 Holdings       ││
│ │ (Pie Chart)      │  │                      ││
│ │                  │  │ 1. VTI   $45k  (30%) ││
│ │ 60% Stocks  ━━━  │  │ 2. AAPL  $32k  (21%) ││
│ │ 30% Bonds   ───  │  │ 3. NVDA  $28k  (19%) ││
│ │ 10% Cash   ┈┈┈   │  │ 4. BND   $22k  (15%) ││
│ │                  │  │ 5. MSFT  $18k  (12%) ││
│ │                  │  │                      ││
│ └──────────────────┘  └───────────────────────┘│
│                                                 │
│ Diversification Status:                         │
│ ✓ Sector spread is healthy                     │
│ ⚠ Tech concentration: 35% (target: 25%)       │
│ ✓ Geographic spread: 95% US, 5% International │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ Next Steps (from agents):                   ││
│ │ 💡 Investment Agent: 1 new recommendation   ││
│ │ 💡 Debt Agent: Portfolio looks healthy      ││
│ │ 💡 Retirement Agent: On track for goal      ││
│ └─────────────────────────────────────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
Components:

Header: Total value, YTD gain, daily change
Asset Allocation pie chart (Recharts)
Top 5 holdings table (ticker, value, %)
Diversification status indicators (checkmarks for good, warnings for issues)
"Next Steps" section showing summaries from each agent
[Refresh] button (rate-limited to prevent API hammering)

5. RECOMMENDATION CARDS (Reusable)
Used in Agent Context View and History:
┌──────────────────────────────────────────┐
│ 🎯 Rebalance Tech Overweight             │ ← title
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                          │
│ Confidence: ████████░ 82%                │ ← confidence bar
│                                          │
│ Summary:                                 │
│ Your tech allocation is 35% (target 25% │
│ ), driven by NVDA concentration. This   │
│ increases portfolio volatility. Selling  │
│ 5% of NVDA and buying 5% VTI would      │
│ reduce concentration risk while          │
│ maintaining growth exposure.             │
│                                          │
│ [Show Details ▼]                        │ ← collapsible details
│                                          │
│ Impact Summary:                          │
│ • Diversification: +8%                  │
│ • Volatility: -1.2%                     │
│ • Tax impact: ~$340 (short-term gains)  │
│ • Annual fees saved: $12                │
│                                          │
│ [Simulate] [Vote: Accept / Later]       │ ← actions
│                                          │
└──────────────────────────────────────────┘
Props:

title: Recommendation headline
confidence: 0-100 percentage
summary: Brief explanation
details: Expanded reasoning (optional, collapsible)
impact: Before/after metrics
onVote: Callback for Accept/Later
onSimulate: Callback for dry-run

Styling:

Border: subtle (#e8f4f8 border, #f5f5f5 background)
Confidence bar: gradient green (high) to yellow (medium) to orange (low)
Text: dark gray on light foam background

6. SETTINGS SIDEBAR (Secondary Tab)
Appears when user clicks "Settings" tab in sidebar:
┌─────────────────────────────────────┐
│ ⚙️ Settings                          │
├─────────────────────────────────────┤
│                                     │
│ Account                             │
│ ─────────────────────────           │
│ Username: john_doe                  │
│ Email: john@example.com             │
│ [Change Password]                   │
│                                     │
│ API Connections                     │
│ ─────────────────────────           │
│ ✓ Alpaca (connected, 2 days ago)   │
│   [Reconnect] [Disconnect]         │
│                                     │
│ ⊘ Plaid (not connected)            │
│   [Connect to bank data]           │
│                                     │
│ ⊘ Finnhub (not connected)          │
│   [Set API Key]                    │
│                                     │
│ Agent Preferences (per-agent)       │
│ ─────────────────────────           │
│ Investment Agent                    │
│ • Risk Tolerance: [█████░░░] Balanced
│ • Recommendation Frequency: Monthly │
│ • Min Confidence: 70%               │
│                                     │
│ Debt Agent                          │
│ • Recommendation Frequency: Monthly │
│ • Alert on high APR: [ON]          │
│                                     │
│ Retirement Agent                    │
│ • Target Retirement Age: 65         │
│ • Contribution Mode: Conservative  │
│                                     │
│ Global Settings                     │
│ ─────────────────────────           │
│ • Data Refresh: Hourly              │
│ • Notifications: [ON]               │
│ • Theme: Light                      │
│ • Reduced Motion: [OFF]             │
│                                     │
│ [Save Changes] [Reset to Defaults]  │
│                                     │
└─────────────────────────────────────┘
Sections:

Account: username, email, password management
API Connections: show connected/disconnected services, connect/reconnect buttons
Agent Preferences (per-agent):

Investment: risk tolerance slider, recommendation frequency, confidence threshold
Debt: payoff strategy preference, alert settings
Retirement: target age, contribution goals


Global Settings: data refresh frequency, notifications, theme, accessibility
[Save Changes] button (auto-saves on change, but provides explicit save button)

7. MEMORY SIDEBAR (Secondary Tab)
Shows agent's memory of past decisions, goals, patterns:
┌──────────────────────────────────────┐
│ 💭 Memory                             │
├──────────────────────────────────────┤
│                                      │
│ Investment Agent Memory              │
│ ─────────────────────────            │
│ Role: Portfolio Optimizer            │
│ Specialization: Risk & Diversification
│                                      │
│ Your Stated Goals:                   │
│ • Retire by 65 with $1.5M           │
│ • Minimize volatility                │
│ • Tax-efficient growth               │
│                                      │
│ Your Patterns:                       │
│ • Accepts conservative recommendations
│   (rejects >50% allocation shifts)   │
│ • Executes 65% of accepted rec's     │
│ • Prefers dividend stocks over growth
│                                      │
│ Recent Context:                      │
│ • Last recommendation: Rebalance     │
│   NVDA, you rejected (too aggressive)│
│ • You asked: "Why not VTI?"          │
│ • Agent learned: explain alt options │
│                                      │
│ Trust Score: ██████░░ 72% (avg user) │
│ "Your feedback helps me improve"     │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Clear Memory [⚠️ This resets     │ │
│ │ agent learning from your history] │ │
│ └──────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
Sections:

Agent role and specialization
Stated goals (input by user in settings)
Learned patterns (inferred from past behavior)
Recent context (last few interactions)
Trust score (how well agent understands user)
[Clear Memory] button (dangerous, warns user)

8. TRADE HISTORY (Secondary Tab)
Logs all executed recommendations:
┌──────────────────────────────────────┐
│ 📋 Trade History                      │
├──────────────────────────────────────┤
│                                      │
│ Filter: [All] [Executed] [Pending]  │
│ Sort: [Most Recent] [By Agent]      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Jun 15, 2026 | Investment Agent  │ │
│ │ Rebalance: Sell NVDA, Buy VTI     │ │
│ │ Status: ✓ Executed (Jun 16)       │ │
│ │ Impact: Diversification +8%       │ │
│ │                                  │ │
│ │ Voted: Jun 15 | Executed: Jun 16 │ │
│ │ [View Details]                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Jun 10, 2026 | Debt Agent        │ │
│ │ Increase CC payment to $500/mo    │ │
│ │ Status: ✓ Executed (Jun 12)       │ │
│ │ Impact: CC paid off 6 mo earlier  │ │
│ │                                  │ │
│ │ Voted: Jun 10 | Executed: Jun 12 │ │
│ │ [View Details]                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ May 20, 2026 | Retirement Agent  │ │
│ │ Increase 401k contribution 5%     │ │
│ │ Status: ⏳ Pending (awaiting ACH) │ │
│ │                                  │ │
│ │ Voted: May 20 | Due: Jun 1       │ │
│ │ [View Details] [Mark Executed]   │ │
│ └──────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
Columns:

Date voted / date executed
Agent type
Recommendation summary
Status (Executed, Pending, Abandoned)
Impact (if executed): actual outcome
Actions: [View Details], [Mark Executed]

9. ANALYTICS (Secondary Tab)
Shows user's engagement and recommendation accuracy:
┌─────────────────────────────────────┐
│ 📊 Analytics                         │
├─────────────────────────────────────┤
│                                     │
│ This Month:                         │
│ • Recommendations received: 12      │
│ • Acceptance rate: 58%              │
│ • Execution rate: 75%               │
│ • Avg decision time: 4 days         │
│                                     │
│ Recommendation Accuracy:            │
│ (Did recommendations achieve        │
│  their intended outcome?)           │
│                                     │
│ Investment Agent:                   │
│ • Diversification recs: 80% hit     │
│ • Tax-loss harvesting: 90% saved    │
│ • Fee optimization: 100% beat target│
│ Trust Score: ██████████ 95%         │
│                                     │
│ Debt Agent:                         │
│ • Payoff strategy: 100% on track    │
│ • Interest saved: $1,240            │
│ Trust Score: ██████████ 98%         │
│                                     │
│ Retirement Agent:                   │
│ • Contribution recs: 67% adopted    │
│ • Funding progress: +5% YoY         │
│ Trust Score: ████████░░ 78%         │
│                                     │
│ Your Patterns:                      │
│ • Most likely to execute: Debt pay  │
│ • Least likely to execute: Risky    │
│ • Average decision time: 3-5 days   │
│                                     │
│ [Download Report (PDF)]             │
│                                     │
└─────────────────────────────────────┘
Sections:

Monthly stats: recommendations received, acceptance/execution rates, decision time
Per-agent accuracy: hit rate for intended outcomes, trust score
User patterns: which types of recommendations user tends to act on
[Download Report] button for tax/planning purposes


INTERACTION PATTERNS
Authentication Flow
Landing Page
│
├─ New User → Create Account
│  └─ Set username, password, email
│  └─ Accept terms & disclaimers
│  └─ → Dashboard
│
└─ Existing User → Login
   └─ Enter username, password
   └─ → Dashboard (or last viewed section)
Key UX:

Prominent disclaimer on login: "Fin is an analysis tool, not financial advice."
Password strength feedback (NIST guidance: 16+ chars or passphrase)
Option for passkey/biometric (future)

Recommendation Voting Flow
1. User clicks fin in ocean
   ↓
2. Agent Context View opens
   ↓
3. User sees Recommendation #1 with:
   - Title, confidence, reasoning
   - Impact metrics
   ↓
4. User can:
   a) [Accept] → Recommendation logged, user sees "Checklist to execute"
   b) [Later] → Bookmark, comes back later
   c) [Details ▼] → Expand reasoning
   d) [Simulate] → See impact before voting
   e) Chat input → Ask follow-up question
   ↓
5. If [Accept]:
   - "You accepted this recommendation"
   - "To execute in your broker:"
   - [Step-by-step guide or link to broker]
   - [Mark as Executed] button
   ↓
6. If user marks as [Executed]:
   - Date logged
   - Recommendation moves to "Trade History"
   - 30 days later: agent evaluates if outcome matched prediction
   - Confidence score for that agent updated
Settings Update Flow
User clicks Settings tab
   ↓
Settings panel opens
   ↓
User modifies a setting (e.g., risk tolerance slider)
   ↓
[onChange] event fires → settings auto-save to backend
   ↓
Toast notification: "Preference updated"
   ↓
(Optional) Agent is notified of change
   → Next recommendation from that agent factors in new preference
Chat with Agent Flow
User asks question in chat input: "Why not VTI instead of VOO?"
   ↓
[Send] button clicked
   ↓
Message sent to backend via WebSocket
   ↓
Backend routes to appropriate agent with context:
   - Previous recommendation
   - User's portfolio
   - Past decisions
   ↓
Agent (Ollama LLM) generates response
   ↓
Response streamed back via WebSocket
   ↓
Message appears in chat with agent avatar
   ↓
User can continue conversation

STATE MANAGEMENT (Zustand)
Store Structure
javascript// src/store/useFinStore.ts
import { create } from 'zustand';

interface FinState {
  // User
  user: { id: string; username: string; email: string } | null;
  isAuthenticated: boolean;
  setUser: (user: FinState['user']) => void;
  logout: () => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeFin: 'investment' | 'debt' | 'retirement' | null;
  setActiveFin: (fin: FinState['activeFin']) => void;

  // Agent Data (cached)
  agents: {
    investment: { recommendations: Recommendation[]; memory: AgentMemory };
    debt: { recommendations: Recommendation[]; memory: AgentMemory };
    retirement: { recommendations: Recommendation[]; memory: AgentMemory };
  };
  setAgentData: (agent: string, data: any) => void;

  // Recommendations
  recommendations: Recommendation[];
  addRecommendation: (rec: Recommendation) => void;
  voteRecommendation: (recId: string, vote: 'accept' | 'reject' | 'later') => void;

  // Settings (per-agent + global)
  settings: {
    global: GlobalSettings;
    investment: InvestmentAgentSettings;
    debt: DebtAgentSettings;
    retirement: RetirementAgentSettings;
  };
  updateSetting: (category: string, key: string, value: any) => void;

  // WebSocket
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const useFinStore = create<FinState>((set) => ({
  // ... implementation
}));
Why Zustand?

Lightweight, minimal boilerplate
Per-agent state isolation
Easy persistence (localStorage integration)
Clean devtools integration

Data Caching Strategy

Recommendations: Cached per agent, invalidate hourly or on manual refresh
Portfolio data: Cached with timestamp, refresh on [Refresh] click (rate-limited to 1 per minute)
Settings: Cached locally, synced to backend on change
Chat history: Stored in WebSocket-connected backend, synced on page load


RESPONSIVE DESIGN STRATEGY
Breakpoints
DeviceWidthLayoutMobile<768pxFull-width, bottom nav for agents, ocean simplified (2D)Tablet768px - 1023pxSidebar collapses, ocean scaled, touch-friendlyDesktop1024px+Full layout, ocean full-size, animations enhanced
Mobile-Specific Changes

Sidebar: collapses to icons, slides from left (full-screen overlay on mobile)
Ocean: simplified (2D, no wave effects, smaller fins)
Recommendation cards: full-width, stacked vertically
Chat: full-width input, scrollable message area
Settings: modal or full-screen slide-up

Touch Interactions

Fins: tap to open agent context
Sidebar: swipe left to close, swipe right to open
Buttons: 48px minimum tap target (accessible)
Cards: swipe to navigate recommendations


PERFORMANCE OPTIMIZATIONS
Code Splitting
javascript// src/pages/AgentContext.tsx
const AgentContext = lazy(() => import('./AgentContext'));
const SettingsPanel = lazy(() => import('./panels/SettingsPanel'));

// Load on-demand, not on app init
Animation Performance

Use requestAnimationFrame for fin movement (60fps target)
Debounce WebSocket updates (batch per 100ms)
Lazy-load Three.js only when ocean visualization mounts
Use transform and opacity for CSS animations (GPU-accelerated)

Data Fetching

React Query (TanStack Query) for server state:

Automatic caching and invalidation
Background refetching
Optimistic updates for voting


WebSocket for real-time recommendation updates

Image & Asset Optimization

SVG fins (vector, scalable, small file size)
D3.js for data visualization (no large image assets)
Fonts: system stack + Inter/Geist via CDN (or self-hosted)


ACCESSIBILITY (WCAG 2.1 AA)
Color Contrast

All text: min 4.5:1 ratio (tested with Lighthouse)
Charts: use patterns + colors (not color-only differentiation)
Example: "Tech: 35% (striped)" vs. "Tech: 35% (blue)"

Keyboard Navigation

Sidebar toggles with Tab, activates with Enter
Fins are tabbable, can be activated with Enter
All buttons accessible via keyboard
Focus indicators: blue outline (#1a3a52)

Screen Readers

ARIA labels: <button aria-label="Open Investment Agent">
Semantic HTML: <main>, <nav>, <section>
Charts: <title> and <desc> for SVGs
Data tables: <thead>, <tbody>, proper header associations

Reduced Motion

Respect prefers-reduced-motion media query
Disable ocean wave animation if user prefers
Keep fins, but remove motion blur/easing

css@media (prefers-reduced-motion: reduce) {
  .fin { animation: none; }
  .wave { animation: none; }
  * { transition: none !important; }
}

DEVELOPMENT WORKFLOW
Project Structure
fin-frontend/
├── src/
│   ├── components/
│   │   ├── Ocean.tsx (signature element, D3/Three.js)
│   │   ├── Sidebar.tsx
│   │   ├── AgentContext.tsx
│   │   ├── RecommendationCard.tsx
│   │   ├── Dashboard.tsx
│   │   └── Settings/
│   │       ├── SettingsPanel.tsx
│   │       ├── MemoryPanel.tsx
│   │       ├── ChatHistory.tsx
│   │       ├── TradeHistory.tsx
│   │       └── Analytics.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── AgentContext.tsx
│   │   └── 404.tsx
│   ├── store/
│   │   ├── useFinStore.ts (Zustand)
│   │   └── types.ts
│   ├── api/
│   │   ├── auth.ts
│   │   ├── recommendations.ts
│   │   ├── portfolio.ts
│   │   └── websocket.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── ocean.css
│   │   └── components.css
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRecommendations.ts
│   │   └── useWebSocket.ts
│   └── App.tsx
├── public/
│   └── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
Build & Deployment

Dev server: Vite (instant HMR)
Build: vite build → optimized bundle
Production: Served by nginx (Docker Compose)
Environment:

REACT_APP_API_URL (backend, e.g., http://localhost:8000)
REACT_APP_WS_URL (WebSocket, e.g., ws://localhost:8000/ws)



Git Workflow
bash# Feature branch
git checkout -b feature/ocean-visualization

# Commit early and often
git commit -m "feat: add fin animation logic"

# Push and PR
git push origin feature/ocean-visualization

TESTING STRATEGY
Unit Tests (Vitest + React Testing Library)
typescript// src/components/__tests__/RecommendationCard.test.tsx
import { render, screen } from '@testing-library/react';
import RecommendationCard from '../RecommendationCard';

describe('RecommendationCard', () => {
  it('renders recommendation with confidence score', () => {
    const rec = {
      id: '1',
      title: 'Rebalance',
      confidence: 85,
      summary: 'Test summary',
    };
    render(<RecommendationCard recommendation={rec} onVote={() => {}} />);
    expect(screen.getByText('Rebalance')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('calls onVote with accept when Accept button clicked', () => {
    const onVote = vi.fn();
    render(<RecommendationCard recommendation={rec} onVote={onVote} />);
    screen.getByText('Accept').click();
    expect(onVote).toHaveBeenCalledWith('accept');
  });
});
Integration Tests

WebSocket connection and message flow
Recommendation voting flow (vote → update UI → log to backend)
Agent context navigation (click fin → open → chat → back)

E2E Tests (Cypress/Playwright)

Full user journey: login → view portfolio → click fin → vote on recommendation → verify in history
Settings update flow
Mobile responsiveness


DEPLOYMENT CHECKLIST

 All tests passing (unit, integration, E2E)
 No console errors in production build
 Accessibility audit passing (Lighthouse 90+)
 Performance audit passing (Lighthouse 80+)
 Load testing: 10 concurrent users, under 2s response time
 Security audit: no exposed API keys, CORS configured
 Docker image builds and runs locally
 Documentation complete (README, deployment guide)
 Disclaimers prominently displayed on login & dashboard


PHASING STRATEGY (MVP → Phase 2)
MVP (Phase 1): Ocean + Investment Agent
Scope:

Ocean visualization with animated fins
Investment Agent context view (memory, recommendations, chat)
Portfolio dashboard
Settings panel (Investment Agent only)
Voting + execution tracking

Excludes:

Debt Agent (skeleton UI only)
Retirement Agent (skeleton UI only)
Trade History, Analytics tabs (Phase 2)
Community voting hub (Phase 3+)

Phase 2: Full Agent Suite

Debt Agent fully functional
Retirement Agent fully functional
Trade History, Analytics tabs
Per-agent analytics and accuracy tracking

Phase 3: Community & Advanced

Public recommendation voting
Trending strategies
Advanced market research integration


KEY DESIGN DECISIONS & RATIONALE
DecisionRationaleOcean metaphorCalm, non-overwhelming. Agents as autonomous entities. Reflects privacy-first philosophy.Sidebar over top navClaude.ai pattern, familiar to power users. Easy to hide on mobile.No per-agent colorsAvoid visual overload. Functional colors only (green, orange, red).WebSocket, not pollingReal-time recommendations without user refresh. Smoother UX.Zustand, not ReduxLess boilerplate, faster to build. Still scales to Phase 2+.Auto-save settingsReduces friction. User doesn't think about "saving."One recommendation at a timePrevents analysis paralysis. Users commit to decisions sequentially.

SUCCESS METRICS

Usability: First-time user can complete login → view portfolio → vote on recommendation in <5 min
Performance: Ocean animation smooth at 60fps on desktop, 30fps on mobile
Trust: Users report understanding why agents recommend moves (survey question)
Engagement: 50%+ of users vote on at least 1 recommendation in first week
Retention: 40%+ of users return after 1 month


NEXT STEPS

Design finalization (1-2 days):

Create Figma mockups of ocean visualization
Validate color palette and typography with accessibility tools
Get feedback on sidebar layout


Ocean visualization prototype (3-5 days):

Build D3.js + Three.js ocean with animated fins
Test performance on desktop and mobile
Integrate click handlers


Core components (1 week):

Sidebar (collapsible, tab navigation)
Agent Context View (layout, chat input)
Recommendation Card (voting, simulation button)
Settings Panel


Integration (1 week):

Connect to backend API (auth, recommendations, portfolio)
Implement WebSocket for real-time updates
Integrate Zustand store


Polish & Testing (1 week):

Mobile responsiveness
Accessibility audit
Performance optimization
User testing with beta testers




Document Version: 1.0
Last Updated: June 2026
Status: Ready for development
