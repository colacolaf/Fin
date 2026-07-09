# FIN SETUP WIZARD — FRONTEND SPECIFICATION
**Version**: 1.1 | **Purpose**: UI/UX specification for implementing the Setup Wizard | **Last Updated**: July 2026

---

## OVERVIEW

This document describes what the user sees, how they interact with each step, and the visual/interaction patterns for the Fin Setup Wizard. It is a companion to `Setup_wizard_full_flow.md` — that document defines the content and flow; this document defines the look, feel, and behavior.

**Core visual philosophy:** Calm ocean aesthetic. The wizard should feel like gliding across still water — spacious, gentle, unobtrusive. No jarring transitions, no aggressive colors, no information overload. Every interaction should feel deliberate and smooth.

**Key constraints:**
- No specific color hex codes mandated (the Frontend Recommendations doc is a rough draft)
- Simplicity is paramount — clean layouts, clear hierarchy, minimal ornamentation
- Ocean theme is felt through spacing, motion, and metaphor — not literal water graphics everywhere
- Mobile-first responsive design (wizard works on desktop, tablet, phone)

**Updates in v1.1:**
- Added Step 4: Choose Your AI Models (re-numbered former Step 4 → Step 5, Step 5 → Step 6)
- Total steps: 6 (plus intro/outro)

---

## GLOBAL WIZARD STRUCTURE

### Layout Skeleton
```
┌─────────────────────────────────────────────────────┐
│  [Back ←]                    Step 2 of 6            │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │         Step Content Area                    │   │
│  │         (scrollable if needed)               │   │
│  │                                              │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│              [Skip (optional)]  [Continue →]         │
└─────────────────────────────────────────────────────┘
```

### Persistent Elements (every step except Welcome)

| Element | Position | Behavior |
|---------|----------|----------|
| **Back button (←)** | Top-left | Returns to previous step. Styled as a subtle text link or icon, not a heavy button. |
| **Progress indicator** | Top-center | "Step X of 6" with visual dots or a thin progress bar underneath. Fills left-to-right as user advances. |
| **Step title + subheader** | Top of content area | Clear, friendly header. Subheader is one line, muted tone. |
| **CTA Button** | Bottom-right | Primary action. Warm but not aggressive color. Says "Continue →" or context-specific text. |
| **Skip link (conditional)** | Below CTA or bottom-left | Only on optional steps (Goals, Connectors, Models). Styled as a subtle text link. |

### Transitions Between Steps
- **Direction:** Steps slide in from the right (user is moving forward). Going back slides in from the left.
- **Duration:** ~300ms, ease-out curve. Not snappy, not sluggish — feels like a gentle current carrying you forward.
- **No page reloads:** All steps are client-side transitions within the same view.
- **Scroll position:** Resets to top on each step transition.

---

## STEP-BY-STEP UI BREAKDOWN

---

### STEP 0: WELCOME

**Visual priority:** Establish the ocean calm. This is the first thing the user sees — it should feel like arriving at a quiet shoreline.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│                                                      │
│              Welcome to Fin                         │
│     Your private financial intelligence,            │
│     running locally on your machine.                │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Card 1  │  │  Card 2  │  │  Card 3  │         │
│  │ What Fin │  │How Agents│  │ Your Data│         │
│  │   Does   │  │   Work   │  │Stays Pvt │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
│     Let's get your financial world in order.         │
│         This takes about 7–10 minutes.               │
│                                                      │
│               [ Get Started → ]                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### Interaction Details
- **Three cards:** Equal width on desktop, stacked on mobile. Subtle elevation (shadow) to distinguish from background. On hover, card lifts slightly (~4px) — a gentle float, not a pop.
- **Card content:** Icon at top (simple line-art style), title, 3–4 bullet points. No walls of text.
- **No carousel/pagination dots for the cards:** All three are visible at once. This is not a slideshow — user should absorb all three at a glance.
- **"Get Started" button:** Larger than typical CTA. Rounded corners. Sits centered below the cards with generous whitespace above and below.
- **Background:** Very subtle gradient or soft texture suggesting ocean depth — nothing literal, just atmospheric. Should feel like looking at water from above.

#### Mobile Adaptation
- Cards stack vertically
- Button remains full-width, sticky at bottom
- Header text shrinks slightly

---

### STEP 1: YOUR PROFILE

**Visual priority:** Clean form. Don't overwhelm with 8 fields at once — group logically and use progressive disclosure where helpful.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│ [←]                           Step 1 of 6           │
│                                                      │
│  Tell us about yourself                             │
│  This helps agents understand your financial         │
│  situation. Everything stays private.               │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Age            [___]                        │    │
│  │  Annual Income  [$______]                    │    │
│  │  Employment     [▼ W-2 Employee  ]           │    │
│  │  State          [▼ California    ] (opt)     │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ Tax Info (optional) ───────────────────────┐    │
│  │  Federal Bracket  [●●●○○○○○○○] 24%          │    │
│  │  State Bracket    [●●○○○○○○○○○] 9.3%         │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ Risk Tolerance ────────────────────────────┐    │
│  │  ○ Conservative   ● Balanced                │    │
│  │  ○ Growth         ○ Aggressive              │    │
│  │                                              │    │
│  │  [Visual scale: bonds ←――→ stocks]          │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Time Horizon  [________________________]            │
│                                                      │
│                      [ Continue → ]                  │
└─────────────────────────────────────────────────────┘
```

#### Interaction Details

**Form Fields:**
- Labels above inputs (not placeholder-text — accessibility best practice)
- Inputs are generously sized (minimum 48px tap target on mobile)
- Focus state: subtle glow or border highlight, ocean-toned
- Validation: inline, after field loses focus. Red outline + helper text for errors (e.g., "Age must be 18+")
- Required fields marked with a small asterisk or "(required)" in muted text

**Tax Bracket Sliders:**
- Horizontal slider bar with discrete stops at each bracket percentage (10%, 12%, 22%, 24%, 32%, 35%, 37%)
- Current selection shows the percentage number above the slider handle
- Smooth drag with snap-to-stop behavior
- Below the slider: a one-line explanation of what that bracket means in plain English ("You keep about 76¢ of each additional dollar earned")

**Risk Tolerance Selector:**
- Four large tappable cards (not a dropdown) arranged in a row
- Each card has:
  - Radio-style indicator (selected = filled, unselected = outline)
  - Label (Conservative / Balanced / Growth / Aggressive)
  - One-line description underneath ("Steady, lower volatility" / "Mix of growth and stability" / etc.)
  - A small visual bar showing approximate stock/bond split (e.g., Balanced = 60% stocks / 40% bonds bar)
- Selecting one highlights it with a gentle border color and subtle background fill
- Smart default: based on age (pre-selected before user arrives). User can tap to change.

**Smart Default Behavior:**
- Risk tolerance pre-selected based on age (shown as already highlighted)
- Below the selector: small text — "Based on your age, we suggest Balanced. Feel free to change it."
- After-tax income estimate appears inline below gross income input once both income and tax bracket are set: "Estimated take-home: ~$XX,XXX/year"

#### Mobile Adaptation
- Risk tolerance cards stack 2×2 instead of 4-across
- Sliders get wider touch handles
- Form fields go full-width

---

### STEP 2: YOUR FINANCIAL GOALS

**Visual priority:** Lightweight, card-based. Adding goals should feel satisfying, not like filling out paperwork. Empty state should be inviting.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│ [←]                           Step 2 of 6           │
│                                                      │
│  What are you working toward?                       │
│  Add up to 5 goals. Agents use these               │
│  to tailor every recommendation.                    │
│                                                      │
│  Quick-add:                                         │
│  [🏠 House] [💼 Retire] [🚗 Pay Debt] [📚 Emergency]│
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🏠  Buy a house                              │    │
│  │     Target: [$ 50,000  ]  By: [📅 2029]      │    │
│  │     Priority: ● High  ○ Medium  ○ Low       │    │
│  │     Status: Not started                      │    │
│  │                                    [✕ Remove]│    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ 💼  Retire comfortably                        │    │
│  │     Target: [$ 1,500,000]  By: [📅 2041]     │    │
│  │     Priority: ○ High  ● Medium  ○ Low       │    │
│  │     Status: Not started                      │    │
│  │                                    [✕ Remove]│    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  [+ Add another goal]                               │
│                                                      │
│           [I'll add goals later]  [Continue →]      │
└─────────────────────────────────────────────────────┘
```

#### Interaction Details

**Quick-Add Buttons:**
- Four pill-shaped buttons in a row
- Each has an emoji + short label
- Clicking one instantly creates a goal card below with sensible defaults filled in
- Buttons remain visible even after goals are added (user can add more)
- Disabled/greyed out when 5 goals reached

**Goal Cards:**
- Each goal is an expandable card
- Default state: collapsed — shows goal name, target amount (if set), priority
- Expanded state (tap to expand): shows all fields for editing
- Priority selector: three toggle buttons (High / Medium / Low). Selected one is filled, others are outline.
- Target amount: currency input with $ prefix
- Target date: date picker (native browser picker or custom calendar dropdown)
- Status: read-only badge, auto-set to "Not started" until agents update it
- Remove button (✕): top-right of card. With a confirmation — "Remove this goal?" (to prevent accidental deletion)

**Add Goal Button:**
- Below all existing goal cards
- Dashed border (like an empty slot waiting to be filled)
- "+" icon + "Add another goal" text
- Clicking opens a blank goal card

**Empty State (no goals yet):**
- Center of content area: a gentle illustration or icon
- "No goals yet — what are you working toward?"
- Quick-add buttons directly below
- Subtle encouragement: "Goals help agents give you better, more focused recommendations."

#### Mobile Adaptation
- Quick-add buttons wrap to 2×2 grid
- Goal cards go full-width
- Expand/collapse via tap on card header

---

### STEP 3: CONNECT YOUR ACCOUNTS

**Visual priority:** Three distinct cards, clearly showing value props. The optional nature must be obvious — no pressure, but clear benefits if connected.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│ [←]                           Step 3 of 6           │
│                                                      │
│  Connect your financial accounts                    │
│  Optional — but highly recommended. Connected       │
│  accounts let agents see real data.                 │
│                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────┐│
│  │    🏦 Alpaca    │ │   💳 Plaid      │ │📈 Finn ││
│  │                 │ │                 │ │  hub   ││
│  │ Pulls your real │ │ Links bank      │ │Live    ││
│  │ stock holdings  │ │ accounts &      │ │market  ││
│  │ & portfolio     │ │ credit cards    │ │data &  ││
│  │                 │ │                 │ │news    ││
│  │ Used by:        │ │ Used by:        │ │Used by:││
│  │ Investment      │ │ Debt Agent      │ │Research││
│  │ Agent           │ │                 │ │Agent   ││
│  │                 │ │                 │ │        ││
│  │ [Connect →]     │ │ [Connect →]     │ │[Conn..]││
│  └─────────────────┘ └─────────────────┘ └────────┘│
│                                                      │
│  Summary: 0 of 3 connected                          │
│  Agents will work with what you tell them manually. │
│                                                      │
│      [Skip for now]              [Continue →]       │
└─────────────────────────────────────────────────────┘
```

#### Interaction Details

**Connector Cards (unconnected state):**
- Three equal-width cards
- Each shows:
  - Service icon/logo at top
  - 2–3 lines describing what it provides
  - "Used by:" label with agent name(s)
  - A "Connect" button
- Cards have subtle elevation. On hover, lift slightly.
- Entire card is not clickable — only the "Connect" button triggers action.

**Connection Flow (when user clicks "Connect"):**

**Alpaca:**
1. Card expands downward (inline, not a modal)
2. Two fields appear: API Key (masked) + Secret Key (masked)
3. "Test Connection" button below fields
4. On success: card collapses back, now shows "✅ Connected — Found X holdings worth $XXX,XXX" with a green checkmark
5. On failure: error message inline ("Invalid API key. Please check and try again.") — red text, retry button
6. "Disconnect" link appears small below the card

**Plaid:**
1. Clicking "Connect" opens Plaid's OAuth flow in a new window/tab (or embedded iframe if Plaid supports it)
2. User selects their bank, authenticates with Plaid
3. On return: card updates to "✅ Connected — Found X accounts, $XX,XXX total debt"
4. Note: Fin never sees bank credentials — Plaid handles all auth. This should be clearly stated near the button: "🔒 Your bank login is handled by Plaid, not Fin."

**Finnhub:**
1. Card expands downward (inline)
2. One field: API Key (masked)
3. "Test Connection" button
4. Success: "✅ Connected — Live market data active"
5. Failure: inline error with retry

**Connected State (after successful connection):**
- Card gets a subtle green-tinted border or badge
- "Connect" button changes to "Reconnect" (smaller, secondary style)
- Status summary at bottom updates in real-time

**Connection Status Summary:**
- Positioned below the three cards
- Updates dynamically as connections change
- Shows count: "2 of 3 connected"
- Contextual message:
  - 0/3: "Agents will work with what you tell them manually."
  - 1–2/3: "Investment and Debt agents have live data. Research will use web estimates."
  - 3/3: "All agents operating with live financial data. 🎉"

**Skip Behavior:**
- "Skip for now" link below the CTA
- Dismisses gracefully — no guilt-trip messaging. "You can connect accounts anytime from Settings → Connectors."

#### Mobile Adaptation
- Cards stack vertically full-width
- Connection forms expand full-width below their card
- OAuth flows may need to handle mobile browser tab switching

---

### STEP 4: CHOOSE YOUR AI MODELS

**Visual priority:** A critical decision presented clearly. Three distinct paths the user can understand at a glance. The UI should guide without overwhelming — this step decides cost, speed, and privacy for the entire system.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│ [←]                           Step 4 of 6           │
│                                                      │
│  Choose your AI models                              │
│  Pick where and how your agents think.              │
│  You can change models anytime from Settings.       │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  ☁️  Cloud Excellence                        │    │
│  │  Best quality. Easiest setup.                │    │
│  │  Claude Sonnet 5 or GPT-5.5                  │    │
│  │  ~$50–200/month · 2–3s · API key only        │    │
│  │  Privacy: Medium (cloud)                     │    │
│  │                                    [Select]  │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  💰  Cloud Frugality                    ← SELECTED│
│  │  Frontier capability at bargain pricing.    │    │
│  │  DeepSeek V4 Pro or Gemini 3.5 Flash        │    │
│  │  ~$10–30/month · 1–3s · API key only        │    │
│  │  Privacy: Medium (cloud)                     │    │
│  │  ┌──────────────────────────────────────┐    │    │
│  │  │ Per-agent models:                    │    │    │
│  │  │ 🏦 Investment → [▼ DeepSeek V4 Pro]  │    │    │
│  │  │ 💳 Debt       → [▼ Gemini 3.5 Flash] │    │    │
│  │  │ 📅 Retirement → [▼ DeepSeek V4 Pro]  │    │    │
│  │  │                                      │    │    │
│  │  │ API Keys:                            │    │    │
│  │  │ ☑ DeepSeek  [••••••••••••••] [Test] │    │    │
│  │  │ ☐ Google    [                  ]     │    │    │
│  │  │                                      │    │    │
│  │  │ Est. monthly cost: ~$15–25           │    │    │
│  │  └──────────────────────────────────────┘    │    │
│  │                                    [Select]  │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  🔒  Local Privacy                           │    │
│  │  Everything runs on your machine. $0/month.  │    │
│  │  Qwen 3.6 35B or Mistral 7B                  │    │
│  │  $0/month · 1–5s (GPU) · Install Ollama      │    │
│  │  Privacy: Maximum (local)                     │    │
│  │                                    [Select]  │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ Advanced: Hybrid Mode (collapsed) ──────────┐   │
│  │  [Tap to expand ▼]                            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Summary:                                            │
│  🏦 Investment → DeepSeek V4 Pro (Cloud, ~$10/mo)   │
│  💳 Debt       → Gemini 3.5 Flash (Cloud, ~$5/mo)   │
│  📅 Retirement → DeepSeek V4 Pro (Cloud, ~$10/mo)   │
│  Est. total: ~$25/month                             │
│                                                      │
│     [Use recommended defaults]    [Continue →]      │
└─────────────────────────────────────────────────────┘
```

#### Interaction Details

**Three-Path Selector Cards:**
- Three large cards, vertically stacked, equal prominence
- Only ONE path can be selected at a time (radio-button behavior)
- Unselected cards: subtle border, normal elevation, collapsed state showing summary info
- Selected card: highlighted border (ocean-toned accent), slightly elevated, expands to show per-agent customization

**Card Content (collapsed state):**
- Path icon (☁️ / 💰 / 🔒) + name
- One-line tagline
- Primary model names
- Key stats: cost range, speed, setup requirement, privacy level
- A "Select" button on the right

**Card Content (expanded state — when selected):**
- Same header info
- Additional section slides down (animated, ~250ms):
  - **Per-agent model dropdowns:** Three rows, one per agent. Each row shows: agent emoji + name, a dropdown select with the recommended default pre-selected, and a small label showing cost/speed.
    - Cloud paths: dropdown contains the cloud model options (Claude Sonnet 5, GPT-5.5, Claude Opus 4.7, etc.)
    - Local path: dropdown contains local model options (Mistral 7B, Phi-4, Qwen 3.6 35B, DeepSeek-R1, Gemma 4 27B)
  - **Per-model info:** Below each dropdown, a small line showing: download size + VRAM needed + quality rating (for local models) or cost/speed (for cloud models)
  - **API Key field (Cloud paths only):** Masked input field per selected provider. "Test Connection" button beside each. Green checkmark or red X inline after test.
    - Cloud Excellence: provider checkboxes (Anthropic / OpenAI / Both), with key fields appearing for each checked provider
    - Cloud Frugality: provider checkboxes (DeepSeek / Google / Both)
  - **Ollama status (Local path only):** See "Ollama Detection" section below
  - **Estimated monthly cost:** Calculated dynamically based on selected models and providers (Cloud paths only)

**Ollama Detection (for Local Privacy path):**

**State A: Ollama not detected**
```
⚠️ Ollama is not running.

Setup instructions:
  1. Install: brew install ollama && ollama serve
  2. Pull models: ollama pull qwen3:35b
  3. Verify: ollama list

[Test Ollama Connection] [Copy install commands]
```
- Code blocks with copy buttons for each command
- "Test Ollama Connection" button that pings localhost:11434

**State B: Ollama detected ✅**
```
✅ Ollama is running (v0.x.x)

Installed models:
  ✅ qwen3:35b (20 GB)
  ⚠️ deepseek-r1:32b — not pulled yet
  ✅ mistral:7b (4 GB)

[Pull Missing Models] [Refresh]
```
- Model list shows installed models with checkmarks
- "Pull Missing Models" button triggers `ollama pull` for each unchecked model, with progress feedback

**CPU-Only Warning (Local path only):**
- If no GPU detected, show a yellow warning banner within the expanded card:
  > "⚠️ No GPU detected. Models will run on CPU only — expect 5–30 seconds per response. A GPU with 12+ GB VRAM (RTX 4090) is recommended for the best experience."

**Hybrid Mode (Advanced) — Collapsible Section:**
- Below the three main path cards
- Collapsed by default: "Advanced: Hybrid Mode ▼"
- Expanded: allows per-agent mixing of cloud and local models
- Three rows (one per agent), each with a dropdown containing ALL models (cloud + local)
- Dropdown items show provider badge + model name + cost indicator
- Example: "☁️ Claude Sonnet 5 ($15/M output)" or "🔒 Qwen 3.6 35B (Local, $0)"
- When mixing cloud + local, API key fields AND Ollama status section both appear

**Model Selection Summary:**
- Sticky section at the bottom of the step (always visible even when scrolling)
- Shows each agent's chosen model with provider badge + estimated cost
- Total estimated monthly cost (for cloud models)
- Setup requirements line: "2 API keys needed" or "1 local model to pull" or "2 API keys + 1 local model"

**Default Model Behavior:**
- On first visit to this step, Cloud Frugality (DeepSeek V4 Pro) is pre-selected as the sensible default
- User can change by tapping any other card
- "Use recommended defaults" skip link at bottom: selects Cloud Frugality, DeepSeek V4 Pro for all agents, skips API key entry (prompted later)

#### Mobile Adaptation
- Three path cards stack vertically full-width
- Expanded content scrolls within the card
- Per-agent dropdowns go full-width
- Ollama code blocks scroll horizontally
- Summary section becomes sticky at bottom

---

### STEP 5: AGENT MODES & PERMISSIONS

**Visual priority:** This is a complex step. Needs clear organization so user doesn't feel overwhelmed. Accordion or tab-based layout for the three agent configs.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│ [←]                           Step 5 of 6           │
│                                                      │
│  How should your agents behave?                     │
│  Set thinking depth, permissions, and data          │
│  access. Change anytime from Settings.              │
│                                                      │
│  ┌─ 🏦 Investment Agent ───────────────────────┐   │
│  │                                              │   │
│  │  Thinking Depth                              │   │
│  │  Low  [●――――○]  High     Medium             │   │
│  │                                              │   │
│  │  Recommendation Autonomy                     │   │
│  │  ○ Suggest only  ● Suggest + Notify         │   │
│  │  ○ Suggest + Simulate                       │   │
│  │                                              │   │
│  │  Trading Permissions                         │   │
│  │  [▼ View-only (no trading)         ]        │   │
│  │                                              │   │
│  │  Data Access                                 │   │
│  │  ☑ Portfolio holdings  ☑ Cost basis         │   │
│  │  ☑ Transaction history  ☐ Order placement   │   │
│  │                                              │   │
│  │  Web Search   [―――● ON ―――]                 │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 💳 Debt Agent ────── (collapsed) ──────────┐   │
│  │  Thinking: Medium | Autonomy: Notify | ...   │   │
│  │  [Tap to expand ▼]                            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 📅 Retirement Agent ── (collapsed) ────────┐   │
│  │  Thinking: Medium | Proj: Moderate | ...     │   │
│  │  [Tap to expand ▼]                            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Global Settings ───────────────────────────┐   │
│  │  Cross-Agent Learning  [―――● ON ―――]        │   │
│  │  Notifications  [▼ In-app only ]            │   │
│  │  Auto-Logout     [▼ 30 minutes   ]          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│                      [ Continue → ]                  │
└─────────────────────────────────────────────────────┘
```

#### Interaction Details

**Agent Config Accordions:**
- Three collapsible sections, one per agent
- First agent (Investment) starts expanded; other two start collapsed
- Collapsed state shows a summary row: key settings at a glance (Thinking: Medium | Autonomy: Notify | etc.)
- Tap header to expand/collapse
- Smooth height animation on expand/collapse (~250ms)
- Only one agent can be expanded at a time (accordion behavior) to keep the page manageable

**Thinking Depth Slider:**
- Horizontal track with 4 labeled stops: Low | Medium | High | Extreme
- Draggable handle or tappable stops
- Below the slider: a one-line description that changes based on selection:
  - Low: "Quick surface analysis. Fast responses."
  - Medium: "Balanced reasoning. Good for most situations."
  - High: "Deep multi-angle analysis. More thorough."
  - Extreme: "Exhaustive Monte Carlo + web research. Slowest, most thorough."

**Recommendation Autonomy (Radio Group):**
- Three radio buttons with labels and descriptions
- Description appears below each option in smaller, muted text
- e.g., "Suggest + Notify" subtitle: "Agent alerts you when it detects opportunities"

**Trading Permissions:**
- Simple dropdown/select
- Only safe options shown (View-only, Paper trading, Read-only API)
- Note: "Fin never auto-executes real trades" is displayed nearby in small text

**Data Access (Checkboxes):**
- Vertical checkbox list
- Some checkboxes may be disabled (greyed out) if no corresponding API is connected (e.g., "Portfolio holdings" disabled if Alpaca not connected)
- Disabled items show tooltip on hover: "Connect Alpaca to enable this"
- Pre-checked defaults where appropriate

**Toggles (Web Search, Consolidation, Spending, etc.):**
- Pill-shaped toggle switch
- Animated on/off transition (smooth slide, ~200ms)
- Label on the active side
- Default: ON for most toggles, OFF for privacy-sensitive ones (Spending Analysis)

**Global Settings:**
- Separated from agent configs by a subtle divider or different background tint
- Cross-Agent Learning toggle with description: "When on, agents share insights. Debt Agent learns from Investment Agent's decisions."
- Notification preference: dropdown (In-app only / In-app + Email / None)
- Auto-logout: dropdown (15 min / 30 min / 1 hour / Never)

#### Mobile Adaptation
- Accordion sections go full-width
- Sliders get wider touch handles
- Radio buttons stack vertically with larger tap targets
- Global settings collapse into a scrollable section

---

### STEP 6: REVIEW & LAUNCH

**Visual priority:** Clean summary, celebration-adjacent but not over-the-top. This is the moment of completion — should feel satisfying and reassuring.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│ [←]                           Step 6 of 6           │
│                                                      │
│  You're all set. Ready to dive in? 🌊               │
│  Review your setup below. You can change            │
│  anything later from Settings.                      │
│                                                      │
│  ┌─ 📋 Profile ──────────────────── [Edit] ────┐   │
│  │  Age: 42  |  Income: $95,000                 │   │
│  │  Employment: W-2  |  Risk: Balanced          │   │
│  │  Tax: 24% Federal / 9.3% State               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 🎯 Goals ────────────────────── [Edit] ────┐   │
│  │  🏠 Buy a house — $50k by 2029 (High)       │   │
│  │  💼 Retire — $1.5M by 2041 (Medium)         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 🔌 Connected ─────────────────── [Edit] ───┐   │
│  │  🏦 Alpaca   ✅ Connected (6 holdings)       │   │
│  │  💳 Plaid    ⬜ Not connected                │   │
│  │  📈 Finnhub  ⬜ Not connected                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 🧠 AI Models ──────────────────── [Edit] ───┐   │
│  │  🏦 Investment → DeepSeek V4 Pro (Cloud)     │   │
│  │  💳 Debt       → Gemini 3.5 Flash (Cloud)    │   │
│  │  📅 Retirement → DeepSeek V4 Pro (Cloud)     │   │
│  │  Est. monthly cost: ~$25/month               │   │
│  │  Ollama: ⬜ Not used (cloud path selected)   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ ⚙️ Agents ───────────────────── [Edit] ───┐   │
│  │  🏦 Investment: Medium, Suggest only         │   │
│  │  💳 Debt: Medium, Suggest + Notify           │   │
│  │  📅 Retirement: Medium, Suggest + Notify    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  🌊 What happens next:                        │   │
│  │  1. User Context File is created              │   │
│  │  2. API keys encrypted & stored (AES-256)     │   │
│  │  3. Local models pulled (if selected)          │   │
│  │  4. Agents pull live data (if connected)       │   │
│  │  5. Homepage loads with your 3 agent fins      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│               [ Launch Fin 🌊 ]                      │
└─────────────────────────────────────────────────────┘
```

#### Interaction Details

**Summary Sections:**
- Five collapsible/expandable summary cards (Profile, Goals, Connected, AI Models, Agents)
- All start expanded so user can scan everything
- Each has an "[Edit]" link on the right side of the header
- Clicking "Edit" navigates directly to the corresponding wizard step (preserving current form state)
- If user edits and returns, the summary updates

**AI Models Summary (new section):**
- Shows per-agent model assignment with provider badge (☁️ Cloud or 🔒 Local)
- Shows estimated monthly cost for cloud models; "$0/month" for local
- Shows Ollama status if local models selected: "✅ Running — qwen3:35b, mistral:7b" or "⚠️ Not running"
- Shows API key status per provider: "✅ Anthropic key set" / "⚠️ DeepSeek key needed"

**What Happens Next Box:**
- Distinct visual treatment (subtle border, slight background tint)
- Five numbered items, concise
- Reassuring tone — "you're in good hands"

**Launch Button:**
- Largest button in the entire wizard
- Wave emoji 🌊
- On hover: gentle pulse or glow animation
- On click: brief loading state (~1–2 seconds while context file is created, keys encrypted, models pulled, APIs called)
- Loading state shows a subtle water-ripple animation or progress indicator

**Transition to Homepage:**
- After launch, the wizard view fades or slides away
- Homepage fades in
- A subtle "welcome" animation on the three agent fin cards (e.g., they rise up from below like fins breaching the surface)
- Post-launch health check banner appears at top (see below)
- No tour/overlay immediately — let user explore. Tooltips can appear on first visit to key areas but should not block the view.

#### Mobile Adaptation
- Summary cards stack vertically
- "Edit" links remain tappable
- Launch button full-width, sticky at bottom

---

## POST-WIZARD HOMEPAGE

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [☰]  Home    Analytics  Settings  Connectors  Help  │ ← Left Sidebar
│                                                      │
│  ┌─ Post-Launch Health Check (dismissible) ─────┐   │
│  │  ✅ Ollama running (qwen3:35b, mistral:7b)    │   │
│  │  ✅ Anthropic API key valid                   │   │
│  │  ✅ Alpaca connected (6 holdings)              │   │
│  │  ⚠️ Plaid not connected (add in Connectors)   │   │
│  │  [Dismiss]                                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│          ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│          │ 🏦       │  │ 💳       │  │ 📅       │  │
│          │Investmnt │  │  Debt    │  │Retirement│  │
│          │  Agent   │  │  Agent   │  │  Agent   │  │
│          │          │  │          │  │          │  │
│          │ Ready ●  │  │3 pending │  │ Ready ●  │  │
│          │Claude S5 │  │Gem 3.5 F │  │Qwen 3.6  │  │
│          └──────────┘  └──────────┘  └──────────┘  │
│                                                      │
│          [Ocean-inspired calm background]           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Post-Launch Health Check Banner
- Appears at top of homepage on first load after wizard completion
- Dismissible (×) but reappears on next page load if issues persist
- Shows status for each configured system:
  - ✅ Ollama reachable + models installed (only if local models selected)
  - ✅ / ❌ API keys valid per cloud provider
  - ✅ / ❌ Alpaca/Plaid/Finnhub connected
- Yellow ⚠️ for optional items not configured (not errors, just reminders)

### Left Sidebar
- **Persistent, collapsible** — like ChatGPT, Codex, Cursor
- Collapse toggle: hamburger icon (☰) or chevron at top
- Collapsed state: icons only (🏠 📊 ⚙️ 🔌 📚)
- Expanded state: icons + labels
- Items:
  - 🏠 **Home** — agent fin cards dashboard
  - 📊 **Analytics** — overall analytics view (see below)
  - ⚙️ **Settings** — edit profile, goals, agent configs, models, modes
  - 🔌 **Connectors** — manage API connections (add, remove, test)
  - 📚 **Help** — documentation, FAQ, glossary
- Active item has subtle highlight
- Bottom of sidebar: user avatar/initials, logout link
- Width: ~240px expanded, ~56px collapsed
- Slide animation on expand/collapse (~200ms)

### Agent Fin Cards (Homepage)
- **Three cards** arranged horizontally, equal width
- Visual metaphor: fins on a calm ocean surface. Cards should feel like they're floating — subtle shadow that suggests elevation above a surface.
- Each card shows:
  - **Agent icon** (top): simple line-art or emoji-style — building/bank for Investment, credit card for Debt, calendar/umbrella for Retirement
  - **Agent name**: "Investment Agent", "Debt Agent", "Retirement Agent"
  - **Status line**: Dynamic text based on agent state:
    - "Ready" — agent is configured and idle
    - "3 pending recommendations" — recommendations awaiting user vote
    - "Connected to Alpaca" — API status
    - "Needs setup" — if agent was skipped during wizard (shows "Set up →" CTA)
  - **Model badge**: Small pill/badge showing assigned model name (e.g., "Claude Sonnet 5", "Qwen 3.6 Local"). Cloud models get ☁️ prefix, local get 🔒 prefix.
  - **Mini confidence dot**: Small colored circle in corner:
    - 🟢 Green: Data fresh, agent has high-quality inputs
    - 🟡 Yellow: Some data missing or stale
    - 🔴 Red: Critical data missing, agent has low confidence
    - ⚫ Grey: Agent not yet configured

### Agent Card Hover State
When user hovers over an agent card (desktop) or long-presses (mobile), a tooltip/popover appears:
```
┌─────────────────────────────────┐
│  🏦 Investment Agent            │
│                                 │
│  Model: Claude Sonnet 5 (☁️)    │
│  Confidence Score: 82%          │
│  Last Active: 2 hours ago       │
│  Tool Calls Today: 4            │
│  Memory: 12 past decisions      │
│  Data Freshness: Synced 1h ago  │
│  Mode: Medium Thinking          │
│  Est. monthly cost: ~$50        │
│                                 │
│  [Open Agent →]                 │
└─────────────────────────────────┘
```
- Popover appears above or beside the card (position-aware, doesn't clip viewport edges)
- Smooth fade-in (~150ms)
- "Open Agent →" link navigates into the full agent interface
- Shows model badge + estimated cost line (only for cloud models)

### Agent Card Click
- Tapping/clicking the card (not the hover popover) navigates into that agent's full view
- Full view has its own left sidebar (nested or replacing the main one) with agent-specific navigation: Recommendations, Portfolio/Debt/Retirement data, History, Settings

---

## ANALYTICS PAGE (via Sidebar)

When user clicks 📊 Analytics in the left sidebar:

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [☰]  Home  > Analytics                              │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Overall Agent Health                         │   │
│  │                                              │   │
│  │  Avg Confidence: 78%     [mini sparkline]    │   │
│  │  Acceptance Rate: 62%    [mini sparkline]    │   │
│  │  Execution Rate: 48%     [mini sparkline]    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Investment │ │   Debt     │ │ Retirement │      │
│  │  Decisions │ │  Progress  │ │  Funding   │      │
│  │    8       │ │  62% paid │ │   82%      │      │
│  │  accepted  │ │  off track│ │  funded    │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Model Performance                            │   │
│  │                                              │   │
│  │  🏦 Invest: Claude S5 · Avg 2.1s · $48/mo   │   │
│  │  💳 Debt: Gemini 3.5 F · Avg 0.8s · $6/mo   │   │
│  │  📅 Retire: DeepSeek V4 · Avg 2.4s · $12/mo │   │
│  │  Total est. cost: ~$66/month                 │   │
│  │  [View detailed token usage →]               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Data Freshness                               │   │
│  │  Portfolio: Last synced 1 hour ago     🟢    │   │
│  │  Debts: Last synced 3 hours ago        🟢    │   │
│  │  Market Data: Live (Finnhub)           🟢    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Recent Activity                              │   │
│  │  2:30 PM — Investment Agent: Recommendation  │   │
│  │  1:15 PM — Debt Agent: Payoff simulation     │   │
│  │  11:00 AM — Retirement: Contribution check   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Analytics Components

**Overall Agent Health:**
- Three metric cards in a row: Avg Confidence, Acceptance Rate, Execution Rate
- Each shows current value + mini sparkline showing 7-day or 30-day trend
- Confidence score is color-coded: <60% red, 60–80% yellow, >80% green

**Per-Agent Breakdown:**
- Three summary cards
- Investment: total recommendations, accepted count, execution rate
- Debt: debt payoff progress (%), interest saved, months to debt-free
- Retirement: funded percentage, gap amount, contribution status
- Each card clickable — navigates to that agent's detailed analytics

**Model Performance (new section):**
- One row per agent showing: model name, average response time, estimated monthly cost
- Total estimated monthly cost across all agents
- "View detailed token usage" link for power users
- Only shows for cloud models (local models show "🔒 Local — no API costs")

**Data Freshness:**
- List of connected data sources with last-sync timestamps
- Color dot: green (<1 hour), yellow (1–24 hours), red (>24 hours)
- "Refresh Now" button for manual sync (rate-limited)

**Recent Activity:**
- Chronological feed of agent actions
- Timestamp + agent name + action type
- Clickable items that navigate to the relevant recommendation or detail

---

## SETTINGS PAGE — MODELS SECTION

Post-wizard, users can access full model configuration from Settings → Models. This mirrors Step 4 of the wizard.

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [☰]  Home  > Settings > Models                      │
│                                                      │
│  Current Path: 💰 Cloud Frugality                    │
│  [Switch to Cloud Excellence] [Switch to Local]      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🏦 Investment Agent                           │   │
│  │ Model: [▼ DeepSeek V4 Pro    ☁️ $0.87/M]     │   │
│  │ Status: ✅ Active · Avg 2.1s response         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 💳 Debt Agent                                 │   │
│  │ Model: [▼ Gemini 3.5 Flash   ☁️ $0.30/M]     │   │
│  │ Status: ✅ Active · Avg 0.8s response         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📅 Retirement Agent                           │   │
│  │ Model: [▼ DeepSeek V4 Pro    ☁️ $0.87/M]     │   │
│  │ Status: ✅ Active · Avg 2.4s response         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ API Keys ───────────────────────────────────┐   │
│  │ DeepSeek:  [••••••••••••••]  ✅ Valid         │   │
│  │ Google:    [                  ]  ⬜ Not set    │   │
│  │ Anthropic: [                  ]  ⬜ Not set    │   │
│  │ OpenAI:    [                  ]  ⬜ Not set    │   │
│  │ [Test All] [Save Changes]                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Local Models (Ollama) ──────────────────────┐   │
│  │ Status: ⬜ Ollama not installed               │   │
│  │ (This section active if any agent uses local) │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## CONNECTORS PAGE (via Sidebar)

Post-wizard, users manage API connections here. Mirrors Step 3 of the wizard but in a full-page layout.

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [☰]  Home  > Connectors                             │
│                                                      │
│  Manage your financial data connections.             │
│  All credentials are encrypted at rest.              │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🏦 Alpaca                       ✅ Connected │   │
│  │ Last synced: 1 hour ago                      │   │
│  │ 6 holdings • $225,000 portfolio              │   │
│  │ [Test Connection]  [Disconnect]  [Sync Now]  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 💳 Plaid                        ⬜ Not setup │   │
│  │ Connect to pull debt and account data.        │   │
│  │ [Connect with Plaid →]                        │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📈 Finnhub                      ⬜ Not setup │   │
│  │ Connect for live market data and research.    │   │
│  │ [Connect →]                                   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## FORM MANAGEMENT: react-hook-form + zod

### Why react-hook-form

No Redux, no form state library. react-hook-form is uncontrolled by default — form state lives in the DOM, not React state. Minimal re-renders. `useForm` per wizard step. No global form store.

### Why zod

zod schemas validate each step before advancing. Schemas are co-located with step components. Validation runs on `handleSubmit` — errors display inline beneath fields.

### Step Schemas

```typescript
import { z } from 'zod';

// Step 1: Profile
const profileSchema = z.object({
  age: z.number().int().min(18, "Must be 18+").max(120),
  annualIncome: z.number().positive("Required"),
  employmentStatus: z.enum(["w2", "self_employed", "retired", "student", "other"]),
  state: z.string().optional(),
  federalTaxBracket: z.number().min(10).max(37).optional(),
  stateTaxBracket: z.number().min(0).max(15).optional(),
  riskTolerance: z.enum(["conservative", "balanced", "growth", "aggressive"]),
  timeHorizon: z.string().min(1, "Describe your timeline"),
});

// Step 2: Goals
const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive().optional(),
  targetDate: z.string().optional(),  // ISO date
  priority: z.enum(["high", "medium", "low"]),
});

const goalsSchema = z.object({
  goals: z.array(goalSchema).min(1, "Add at least one goal"),
});

// Step 3: Connections (optional — no validation, skip allowed)

// Step 4: Models
const modelSchema = z.object({
  agent: z.enum(["investment", "debt", "retirement"]),
  modelId: z.string(),
  provider: z.enum(["cloud", "local"]),
});

const modelsSchema = z.object({
  path: z.enum(["cloud_excellence", "cloud_frugality", "local_privacy", "hybrid"]),
  agents: z.array(modelSchema).min(3),
  apiKeys: z.record(z.string()).optional(),  // { provider: key }
});

// Step 5: Agent Modes
const agentModeSchema = z.object({
  thinkingDepth: z.enum(["low", "medium", "high", "extreme"]),
  autonomy: z.enum(["suggest_only", "suggest_notify", "suggest_simulate"]),
});

const modesSchema = z.object({
  investment: agentModeSchema,
  debt: agentModeSchema,
  retirement: agentModeSchema,
  crossAgentLearning: z.boolean(),
  notifications: z.enum(["in_app", "email", "none"]),
  autoLogout: z.enum(["15m", "30m", "1h", "never"]),
});
```

### Hook Pattern Per Step

```typescript
// Step1Profile.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const Step1Profile = ({ onNext, defaultValues }) => {
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = (data) => {
    saveToIDB("wizard_step1", data);  // offline cache
    onNext(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("age", { valueAsNumber: true })} />
      {form.formState.errors.age && <span>{form.formState.errors.age.message}</span>}
      {/* ... */}
      <button type="submit">Continue</button>
    </form>
  );
};
```

### Offline Persistence

Each step caches form state to IndexedDB via `idb` (tiny wrapper, 1.2KB). On mount, restore from cache. On step complete, update cache.

```typescript
import { openDB } from 'idb';

const db = await openDB('fin-wizard', 1, {
  upgrade(db) {
    db.createObjectStore('wizard-state');
  },
});

// Save
await db.put('wizard-state', formData, 'step1');

// Restore
const saved = await db.get('wizard-state', 'step1');
```

---

## GUIDED TOUR: react-joyride

### Integration Strategy

Single Joyride tour across all 6 steps. Triggered on first visit. Stored `tour_completed: true` in localStorage after dismiss/complete. Re-triggerable from Help menu.

### Tour Steps

```typescript
const tourSteps = [
  {
    target: '.welcome-header',
    content: 'Fin runs three AI agents locally on your machine. Each specializes in a financial domain.',
    placement: 'bottom',
  },
  {
    target: '.risk-tolerance-selector',
    content: 'Your risk tolerance shapes every investment recommendation. Agents default based on age but you choose.',
    placement: 'top',
  },
  {
    target: '.goal-quick-add',
    content: 'Quick-add a goal with one click. Goals help agents prioritize recommendations.',
    placement: 'bottom',
  },
  {
    target: '.connector-card-alpaca',
    content: 'Connect Alpaca for live portfolio data. Optional — agents work with manual data too.',
    placement: 'right',
  },
  {
    target: '.model-path-selector',
    content: 'Choose where your AI runs. Cloud for best quality, Local for maximum privacy.',
    placement: 'top',
  },
  {
    target: '.agent-thinking-depth',
    content: 'Higher thinking depth = more thorough analysis but slower responses.',
    placement: 'top',
  },
  {
    target: '.review-launch-btn',
    content: 'Review everything then launch. All settings editable later.',
    placement: 'top',
  },
];
```

### Joyride Config

```typescript
<Joyride
  steps={tourSteps}
  run={!tourCompleted}
  continuous
  showSkipButton
  showProgress
  styles={{
    options: {
      primaryColor: '#2563eb',  // ocean blue
      zIndex: 1000,
    },
  }}
  callback={(data) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      localStorage.setItem('fin_tour_completed', 'true');
      setTourCompleted(true);
    }
  }}
/>
```

### Offline Consideration

Tour steps are static — no network needed. Tour state (`completed` boolean) cached in localStorage, syncs to IDB same store as wizard state.

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Layout Behavior |
|-----------|----------------|
| **Desktop (≥1024px)** | Full wizard with side-by-side cards, sidebar expanded by default |
| **Tablet (768–1023px)** | Cards stack 2-across where possible. Sidebar collapses to icons. Forms remain spacious. |
| **Mobile (<768px)** | Single-column layout. Sidebar becomes bottom tab bar or hamburger drawer. Cards stack vertically. Full-width forms. Simplified hover states (long-press instead). |

### Mobile-Specific Adaptations
- **Bottom navigation** (replaces left sidebar): 5 icon tabs — Home, Analytics, Settings, Connectors, Help
- **Swipe between wizard steps** (optional enhancement): user can swipe left/right, but primary navigation is via Continue/Back buttons
- **Keyboard avoidance:** form inputs scroll into view when keyboard appears
- **Touch targets:** minimum 48×48px for all interactive elements

---

## ANIMATION & MOTION PRINCIPLES

All animations should evoke the feeling of water — smooth, continuous, unhurried.

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Step transitions | Slide + fade | 300ms | ease-out (cubic-bezier: 0.4, 0, 0.2, 1) |
| Card hover lift | TranslateY(-4px) + shadow increase | 200ms | ease-out |
| Path card expand/collapse | Height animation + content fade | 250ms | ease-in-out |
| Accordion expand/collapse | Height animation + content fade | 250ms | ease-in-out |
| Toggle switch | Handle slide + color transition | 200ms | ease-out |
| Connector status change | Green pulse + checkmark scale-in | 400ms | ease-out with bounce |
| Ollama status detection | Pulse + status update fade | 500ms | ease-out |
| Launch button | Gentle scale pulse on hover | 1500ms | ease-in-out (infinite loop) |
| Page load / wizard entry | Fade in | 400ms | ease-out |
| Popover/tooltip | Fade + slight translate | 150ms | ease-out |
| Progress bar fill | Width transition | 300ms | ease-out |

### Reduced Motion
- All animations respect `prefers-reduced-motion: reduce`
- When active: durations set to 0ms, transitions become instant, no sliding — only opacity fades
- Toggle switches still indicate state change (instant color swap)

---

## ACCESSIBILITY REQUIREMENTS

- **WCAG 2.1 AA** compliant minimum
- All form inputs have associated `<label>` elements
- Color is never the sole indicator of state (confidence dots also have text labels)
- Focus indicators visible on all interactive elements (keyboard navigation)
- Tab order follows visual order (left-to-right, top-to-bottom)
- ARIA labels on: progress indicator ("Step 4 of 6: Choose Your AI Models"), accordion headers ("Investment Agent settings, expanded"), toggle switches ("Web Search: On"), path selector cards ("Cloud Frugality path, selected")
- Screen reader announcements for: step transitions ("Loaded Step 4"), connection success ("DeepSeek API key valid"), form errors ("Age is required"), Ollama status ("Ollama detected with 3 models installed")
- Skip-to-content link at top of wizard (hidden until focused)

---

## LOADING & EMPTY STATES

### Loading States
| Context | Visual Treatment |
|---------|-----------------|
| Wizard initial load | Subtle shimmer/skeleton on content area (~500ms) |
| API connection test | Spinner on "Test Connection" button, card locked during test |
| Ollama detection check | Pulsing indicator + "Checking Ollama status..." text |
| Model pull progress | Progress bar with "Pulling qwen3:35b... 45% (9.1 GB / 20 GB)" |
| Launch Fin processing | Full-screen gentle wave animation or pulsing circle, "Setting up your financial world..." text |
| Agent card data fetch | Skeleton cards (same dimensions as real cards, subtle pulse) |
| Analytics page load | Skeleton metric cards + chart placeholders |

### Empty States
| Context | Visual Treatment |
|---------|-----------------|
| No goals (Step 2) | Centered illustration, "No goals yet — what are you working toward?" |
| No APIs connected (Step 3) | Cards show in "Not connected" state (not hidden) |
| No models selected (Step 4) | Cloud Frugality pre-selected as default |
| Ollama not installed (Step 4) | Setup instructions card with copy buttons |
| Agent card: no data | Card shows "Set up →" CTA instead of status |
| Analytics: no activity | "Agents haven't made recommendations yet. Try asking one!" |
| Connectors page: none | "No accounts connected yet. Connect one to get started." |

---

## ERROR STATES

| Error | Visual Treatment |
|-------|-----------------|
| API connection failure | Inline error message (red text, icon), retry button. Card does not collapse — stays in expanded/edit state. |
| API key rejected (Cloud models) | Inline red text: "Invalid API key. Please check and re-enter." Does not block wizard completion. |
| Form validation error | Red border on field, error text below field, field focused automatically. |
| Network timeout | Toast notification (bottom-center): "Connection timed out. Check your network and try again." Auto-dismisses after 5s. |
| Ollama not running (wizard Step 4) | Yellow warning with setup instructions. "Test Ollama Connection" button. |
| Ollama not running (post-launch) | Banner at top of homepage: "⚠️ Ollama is not running. Agents using Qwen 3.6 can't respond. Start with `ollama serve`." Dismissible, reappears on next page load if still down. |
| Model pull failed (Ollama) | Red error: "Failed to pull qwen3:35b. Check your connection and disk space. [Retry]" |
| Session expired | Modal: "Your session has ended. Please log in again." Redirect to login. |

---

## TONE & MICROCOPY GUIDELINES

- **Friendly but clear** — warm without being fluffy, direct without being cold
- Use "you" and "your" (second person)
- Agent references: "agents" not "the system" or "the AI"
- Model references: use full model names ("Claude Sonnet 5" not "Claude"), with brief cost/speed labels where helpful
- Button text: action-oriented ("Get Started", "Continue", "Launch Fin", "Test Connection", "Pull Models")
- Help text: one sentence max, plain English ("This helps agents calculate your debt-to-income ratio")
- Success messages: celebratory but restrained ("All connected! 🎉" not "CONGRATULATIONS!!!")
- Error messages: specific, actionable, blame-free ("Invalid API key. Please check and try again." not "Error 401")
- Skip links: reassuring, no guilt ("I'll add goals later" not "Skip (not recommended)")
- Model selection guidance: educates without pressuring ("Cloud Frugality gives you frontier AI at ~$25/month" not "You should pick this one")

---

*End of Setup Wizard Frontend Specification*