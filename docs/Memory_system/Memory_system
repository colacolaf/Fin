FIN Memory System Specification
Agent-Specific Chat Organization, Visualization & Learning

OVERVIEW
The Memory System is a per-agent interface that allows users to organize, visualize, and learn from all past conversations with a specific agent (Investment, Debt, or Retirement). Each agent maintains its own isolated memory while sharing critical user context through a unified User Context File that informs all agent decisions.
Key Philosophy:

Agents learn from user behavior patterns captured in categorized chats
Users can visualize their decision history as an interactive graph
Categorization is hybrid (agent-suggested + user-confirmed)
Agents reference past chat categories to improve recommendations


ARCHITECTURE
1. MEMORY LAYERS
Layer 1: Agent-Specific Memory (Private)
Each agent (Investment, Debt, Retirement) has its own memory database:
Investment Agent Memory
├── Chat History (timestamped conversations)
├── User Categories (custom-created by user)
├── System Categories (predefined: Portfolio, Risk, Taxes, Fees, etc.)
├── Tags/Labels (applied to each chat for organization)
└── Bookmarked Chats (important conversations user flagged)

Debt Agent Memory
├── Chat History
├── User Categories
├── System Categories (Payoff Strategy, CC vs Loans, Consolidation, etc.)
├── Tags/Labels
└── Bookmarked Chats

Retirement Agent Memory
├── Chat History
├── User Categories
├── System Categories (401k, IRA, Contributions, Social Security, etc.)
├── Tags/Labels
└── Bookmarked Chats
Layer 2: Shared User Context File (Collaboration Layer)
A unified file accessible by ALL agents before each conversation:
json{
  "user_context": {
    "age": 42,
    "financial_status": "Moderate income, $500k invested, $50k debt",
    "risk_tolerance": "Balanced (60% stocks, 40% bonds)",
    "active_goals": [
      "Retire by 65 with $1.5M",
      "Pay off credit card by Q4 2026",
      "Save $50k for house down payment"
    ],
    "recent_decisions": [
      "Rejected aggressive rebalancing (prefers stability)",
      "Accepted tax-loss harvesting recommendation",
      "Executed debt payoff plan - accelerated CC payments"
    ],
    "behavioral_patterns": {
      "decision_speed": "3-5 days average",
      "acceptance_rate": "60%",
      "execution_rate": "75% of accepted",
      "risk_preference": "Conservative with calculated moves"
    },
    "agent_insights": {
      "investment_agent_notes": "User values diversification, dislikes concentration risk",
      "debt_agent_notes": "User prioritizes CC elimination, willing to sacrifice some investment growth",
      "retirement_agent_notes": "User concerned about retirement timing, interested in early planning"
    },
    "last_updated": "2026-06-24T14:32:00Z"
  }
}
Who Updates This?

User actions (when accepting recommendations, voting, providing feedback)
Agents (after each conversation, agents append learned insights)
System (automatic behavioral pattern calculations)

Who Reads This?

All agents before starting a new conversation
Used to personalize next recommendation tone and confidence threshold


MEMORY PANEL: TWO STATES
STATE 1: MINI MEMORY PANEL (Agent Context View, Collapsed)
Location: Top-left corner of Agent Context View
Size: ~280px width (collapsible sidebar)
What's Visible:
┌─────────────────────────────┐
│ 💭 Memory                    │ ← header
├─────────────────────────────┤
│                             │
│  [Interactive Mini Graph]   │ ← graph thumbnail
│  (hover effect only,        │
│   no click until fullscreen) │
│                             │
│  ┌───────────────────────┐  │
│  │ 📊 Quick Stats:       │  │
│  │ • 47 total chats      │  │
│  │ • Last chat: 2h ago   │  │
│  │ • Most active cat:    │  │
│  │   Portfolio (18%)     │  │
│  └───────────────────────┘  │
│                             │
│  [🔍 Fullscreen] [⚙️]       │ ← buttons
│                             │
└─────────────────────────────┘
Graph Thumbnail:

Simplified force-directed graph with colored nodes (dots)
Each dot = one chat conversation
Colors = user-assigned categories (muted when many dots to avoid visual clutter)
Hover: Shows thin connecting lines to similar/related chats (but NOT clickable)
No text labels to keep compact
Background: Light (#e8f4f8 or user's theme)

Quick Stats Shown:

Total number of chats
Last chat date/time
Most frequently discussed category (%)

Buttons:

[🔍 Fullscreen] - Opens full Memory System view
[⚙️] - Opens quick settings for this memory (optional)


STATE 2: FULLSCREEN MEMORY VIEW
Layout: Split-screen (75-85% graph on right, 15-25% control panel on left)
┌──────────────────────────────────────────────────────────────┐
│ < Back | Investment Agent Memory                        | X   │
├─────────────────┬──────────────────────────────────────────┤
│                 │                                          │
│  LEFT PANEL     │          MAIN GRAPH VIEW                │
│  (Control)      │          (Force-Directed)               │
│                 │                                          │
│ ┌─────────────┐ │  ╔═══════════════════════════════════╗ │
│ │ 🔍 Search   │ │  ║                                   ║ │
│ │ ____________│ │  ║                                   ║ │
│ │ by keyword/ │ │  ║      [Interactive Graph]         ║ │
│ │ date/cat    │ │  ║      • Colored dots (chats)      ║ │
│ │             │ │  ║      • Lines (connections)       ║ │
│ ├─────────────┤ │  ║      • Hover: shows relations    ║ │
│ │             │ │  ║      • Click: opens chat detail  ║ │
│ │ CATEGORIES  │ │  ║                                   ║ │
│ │ ─────────   │ │  ╚═══════════════════════════════════╝ │
│ │             │ │                                          │
│ │ ✓ Portfolio │ │  Analytics Popup (Attached to Graph)   │
│ │   (18 chats)│ │  ┌──────────────────────────────┐     │
│ │ ✓ Risk      │ │  │ 📊 Analytics                │     │
│ │   (12 chats)│ │  │                              │     │
│ │ ✓ Taxes     │ │  │ Category Breakdown:         │     │
│ │   (8 chats) │ │  │ • Portfolio: 38%            │     │
│ │ + Custom 1  │ │  │ • Risk: 26%                 │     │
│ │   (6 chats) │ │  │ • Custom: 21%               │     │
│ │ + Custom 2  │ │  │ • Taxes: 15%                │     │
│ │   (3 chats) │ │  │                              │     │
│ │             │ │  │ Timeline:                   │     │
│ │ [Filter ▼]  │ │  │ • Last updated: 2h ago      │     │
│ │ [Sort ▼]    │ │  │ • Frequency: 8 chats/week   │     │
│ │             │ │  │                              │     │
│ │ BOOKMARKED  │ │  │ Trust Score:                │     │
│ │ ─────────   │ │  │ ████████░ 82%              │     │
│ │ ⭐ Tax Loss │ │  │ (agent understanding)       │     │
│ │   Harvest   │ │  │                              │     │
│ │ ⭐ Rebal    │ │  │ Decision Speed:             │     │
│ │   Strategy  │ │  │ Avg 4 days to execute       │     │
│ │             │ │  │                              │     │
│ │ [☰ Export   │ │  │ Execution Rate:             │     │
│ │  PDF]       │ │  │ 73% of accepted chats       │     │
│ │             │ │  │                              │     │
│ │ [🔒 Clear   │ │  │ Top Outcomes:               │     │
│ │  Memory]    │ │  │ • Diversification: +12%     │     │
│ │             │ │  │ • Tax savings: $2,400       │     │
│ │             │ │  │ • Portfolio volatility: -3% │     │
│ │             │ │  └──────────────────────────────┘     │
│ │             │ │                                          │
└─────────────────┴──────────────────────────────────────────┘

LEFT PANEL: CONTROL & FILTERING
Organization Options (Toggleable)
Users can organize the graph by clicking filter buttons:
1. By Category (Default)

Shows all categories (system + custom)
Nodes cluster by category color
Edges connect related chats across categories
Each category shows chat count

Categories View:
├─ Portfolio (18 chats) [✓]
│  └─ Rebalancing, allocation, diversification
├─ Risk (12 chats) [✓]
│  └─ Volatility, concentration, tolerance
├─ Taxes (8 chats) [✓]
│  └─ Tax-loss harvesting, capital gains
└─ Custom: "Emergency Fund Plan" (6 chats) [✓]
   └─ Savings goals, liquidity strategy
2. By Outcome (Filter Toggle)

Executed (green nodes)
Rejected (red nodes)
Pending (yellow nodes)
Bookmarked (starred nodes)

3. By Confidence Level (Filter Toggle)

High confidence (bright, large nodes)
Medium confidence (medium size)
Low confidence (faint, small nodes)

4. By Date Range (Search + Filter)

Last 7 days
Last month
Last 3 months
All time
Custom date range picker

Search Functionality
Search Bar at top of left panel:

Search by keyword (chat content)
Search by date (e.g., "June 2026")
Search by category name
Search by outcome status
Real-time filtering as user types

Example:
User types "tax" → 
Graph updates to show only chats tagged with "Taxes" category
Graph updates to show only chats containing "tax" in content
Bookmarked Section

Pinned at top of left panel
Shows starred chats with ⭐ icon
Quick access to important conversations
Can drag-and-drop to reorder

Management Buttons
[Filter ▼] - Dropdown to toggle multiple filters
☐ Only Executed
☐ Only Rejected
☐ Only Pending
☐ Only Bookmarked
☐ High Confidence Only
☐ Last 7 days
[Sort ▼] - Change sort order
○ Most Recent
○ Oldest First
○ Most Bookmarked
○ Highest Confidence
○ By Category Name
[☰ Export PDF] - Generate PDF report with:

Timeline of all chats
Category breakdown (percentages)
Analytics summary
Bookmarked highlights
Key decisions made

[🔒 Clear Memory] - Dangerous action

Confirmation dialog: "This will delete all memory entries. This cannot be undone."
Only clears chat data, preserves learned patterns in User Context File
Use case: User wants fresh start with agent


MAIN GRAPH VISUALIZATION
Graph Structure
Nodes (Dots):

Each dot = one conversation/chat
Size: Relative to length/importance of chat (longer chat = larger node)
Color: User-assigned category color
Glow effect on hover: Shows connections to similar chats

Edges (Lines):

Thin connecting lines between related chats
Thicker lines = stronger relationship (similar topics, consecutive decisions)
Directed edges show conversation flow over time

Force-Directed Layout:

Nodes repel each other (avoid overlap)
Edges attract connected nodes (clusters form)
When user changes organization, graph recalculates instantly
Animation: Smooth transition as nodes move to new positions

Interaction: Hover
When user hovers over a dot:
Visual Effect:
├─ Dot enlarges slightly (1.5x)
├─ Shows thin lines connecting to similar chats
├─ Related dots highlight (become more visible)
└─ Tooltip appears: "[Chat Date] - Category Name"

Example:
Hover over "Rebalancing Conversation" from June 15
→ Shows connections to:
   - "Tech Concentration Risk" (June 10)
   - "Diversification Strategy" (May 28)
   - "Fee Optimization" (May 15)
Interaction: Click
When user clicks a dot:
Action:
├─ Chat detail drawer opens (right side or modal)
├─ Full conversation displayed
├─ User can scroll through entire chat
└─ Options:
   ├─ [Bookmark] - Star this chat
   ├─ [Share/Export] - Export just this chat
   ├─ [Retag] - Change category/tag
   └─ [X Close] - Close drawer

Chat Drawer Contents:
┌──────────────────────────────┐
│ Rebalancing Conversation     │
│ June 15, 2026 | Portfolio    │ ← date, category
├──────────────────────────────┤
│                              │
│ [Full Chat History]          │
│                              │
│ User: "Why is my tech..."   │
│ Agent: "Your allocation...   │
│ User: "What should I do?"    │
│ Agent: "Consider selling..." │
│                              │
│ ────────────────────────────│
│ [Tag: Portfolio]             │ ← current tags
│ [Change Category ▼]          │
│                              │
│ [⭐ Bookmark]                │
│ [⬇️ Export]                 │
│ [X Close]                    │
│                              │
└──────────────────────────────┘

ANALYTICS POPUP (Top-Right of Graph)
Small floating panel showing real-time statistics. Can be moved/hidden.
Metrics Displayed
1. Category Breakdown (Pie Chart or Bar)
Category Distribution:
- Portfolio:        38% (18 chats)
- Risk:             26% (12 chats)  
- Custom (Savings): 21% (10 chats)
- Taxes:            15% (7 chats)
2. Timeline
Timeline Metrics:
- Oldest chat:      March 2026
- Most recent:      June 24, 2026 (2h ago)
- Average gap:      3.2 days between chats
- Frequency:        8 chats per week
3. Trust Score (Agent Understanding)
Agent Trust Score: ████████░ 82%
"Agent understands your preferences well"
(Based on accuracy of past suggestions + your acceptance rate)
4. Decision Metrics
Decision Speed:
Avg time to execute: 4 days
Fastest decision: 1 day
Slowest decision: 14 days

Execution Rate: 73%
(Of accepted chats, user actually executed recommendations in 73%)

Acceptance Rate: 58%
(User accepts 58% of agent's suggestions)
5. Outcome Summary (Key Wins)
Top Outcomes from Executed Chats:
✓ Diversification: +12% improvement
✓ Tax Savings: $2,400 captured
✓ Portfolio Volatility: -3%
✓ Fees Eliminated: $45/year

CATEGORIZATION & TAGGING FLOW
Recommended Tagging Architecture
System Categories (Predefined per Agent):
Investment Agent System Categories:
├─ Portfolio (general holdings, allocation)
├─ Risk (volatility, concentration, tolerance)
├─ Diversification (sector spread, asset classes)
├─ Taxes (capital gains, losses, efficiency)
├─ Fees (expense ratios, trading costs)
├─ Individual Stocks (specific ticker analysis)
└─ Market Research (news, fundamentals, sentiment)

Debt Agent System Categories:
├─ Payoff Strategy (avalanche vs snowball)
├─ High-Interest Debt (CC, personal loans)
├─ Student Loans (federal vs private)
├─ Consolidation (refinancing opportunities)
├─ Credit Score (impact of moves)
└─ Debt vs Investment (prioritization)

Retirement Agent System Categories:
├─ 401k (contributions, matching, vesting)
├─ IRA (Traditional vs Roth strategies)
├─ Social Security (claiming age, benefits)
├─ Required Minimum Distributions (RMD)
├─ Contribution Strategy (how much, when)
└─ Retirement Readiness (on track analysis)
User Custom Categories:

User can create unlimited custom categories
Examples: "Emergency Fund Plan", "Home Purchase Goal", "College Savings", etc.
Custom categories use user-selected colors
Mix with system categories in graph view

Tagging Flow
FLOW 1: During Chat
┌─────────────────────────────────────────┐
│ Chat in progress with agent             │
│                                         │
│ User message: "What about tech stocks?" │
│ Agent response: "Your tech is 35%..."   │
│                                         │
│ At end of chat:                         │
│ ┌─────────────────────────────────────┐ │
│ │ Agent suggests category:            │ │
│ │ "This seems like a Risk discussion" │ │
│ │ ☐ Risk (suggested)                  │ │
│ │ ☐ Portfolio                         │ │
│ │ ☐ Diversification                   │ │
│ │ ☐ Custom: [Create new]              │ │
│ │                                     │ │
│ │ User selects: "Diversification"    │ │
│ │                                     │ │
│ │ [Save Chat] → Chat logged with tag  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
FLOW 2: After Chat (Retag Later)
User opens Memory fullscreen
│ Clicks a chat from the graph
│ Chat drawer opens
│ User clicks [Change Category ▼]
│ Dropdown shows system + custom categories
│ User selects new category (or adds custom)
│ Category updated in database
│ Graph re-renders with new organization
FLOW 3: Agent Learning from Tags
New chat starts with agent
│ Agent queries User Context File
│ Sees recent tags: "Diversification, Risk, Portfolio"
│ Agent says: "Based on your recent focus on diversification,
│  I notice your Small Cap exposure is low (5% target: 8%).
│  Should we explore that?"
│ User can accept/reject
│ If accepted, chat gets tagged as continuation of previous theme
│ Agent confidence increases for future similar recommendations

AGENT LEARNING MECHANISM
How Agents Use Memory
Before Each Conversation:
1. Agent loads User Context File
   ├─ Reads user's age, goals, risk tolerance
   ├─ Reads behavioral patterns (acceptance rate, speed, preferences)
   ├─ Reads recent decisions (what user accepted/rejected)
   └─ Reads other agents' notes (debt progress affecting investment moves?)

2. Agent reviews its own chat history
   ├─ Pulls chats from same category user is likely asking about
   ├─ Looks at tags to understand recent focus areas
   ├─ Checks bookmarked chats (user-signaled important conversations)
   └─ Notes execution patterns (did user act on past advice?)

3. Agent constructs context window
   ├─ Includes relevant past chats (prompt engineering)
   ├─ Personalizes tone based on user patterns
   ├─ Adjusts confidence threshold (if user accepts 60%, suggest 65%+ confidence recs)
   └─ Avoids re-hashing rejected topics (learns from feedback)

4. Agent generates response with personalization
   Example:
   "You typically prefer conservative moves (3% shifts vs 5%).
    Based on your recent 'Diversification' focus and the fact
    you executed the last rebalancing, I'm suggesting a 4% shift
    with 78% confidence."
Agent Updates to Shared Context
After Each Conversation:
Agent sends update to User Context File:

{
  "agent_type": "investment",
  "timestamp": "2026-06-24T15:30:00Z",
  "update": {
    "chat_id": "conv_12345",
    "category": "Diversification",
    "user_action": "accepted",
    "insight": "User strongly values sector diversification; rejected concentrated positions in past 3 chats",
    "recommendation_made": "Increase Small Cap from 5% to 8%",
    "confidence_score": 78,
    "execution_expectation": "User likely to execute in 4-5 days based on historical patterns"
  }
}
Result: Next time Debt Agent starts a conversation, it sees:
"Investment agent notes: User is actively rebalancing for diversification.
This might affect their debt payoff timeline (may want to maintain
contributions to capture full employer match while paying debt)."

MINI PANEL: DETAILED BEHAVIOR
Mini Graph Thumbnail
Size: 240px wide × 180px tall
Background: Light (#e8f4f8) with subtle gradient
Nodes: Colored dots (same colors as full graph)
Edges: Very faint lines connecting nodes (low opacity)
Hover Behavior:
User hovers over mini graph
│ Tooltip appears showing total chat count
│ Dots slightly enlarge on hover
│ But NOT clickable (stays interactive preview only)
│ Lines remain faint (not emphasized)
└─ Can still see relative positions of chats
When Graph Has Many Chats (50+):
Colors are muted/desaturated slightly so dots blend better
Opacity of edges reduced further
Nodes auto-scale to fit within 240px width
Most recent chats (larger nodes) still visible in foreground
Quick Stats Card
Shows 3-4 most relevant statistics:
Quick Stats:
├─ 47 total chats
├─ Most active: Portfolio (38%)
├─ Last chat: 2h ago
└─ Execution rate: 73%

DATABASE SCHEMA: MEMORY TABLES
Table: agent_chats
sqlCREATE TABLE agent_chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_type ENUM('investment', 'debt', 'retirement'),
  chat_title TEXT,
  chat_content JSONB,  -- full conversation
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  category TEXT,  -- system or custom category name
  tags JSONB,  -- array of tags
  is_bookmarked BOOLEAN DEFAULT FALSE,
  execution_outcome TEXT,  -- 'executed', 'rejected', 'pending'
  notes TEXT,  -- user's own notes on this chat
  FOREIGN KEY (user_id) REFERENCES users(id)
);
Table: agent_categories
sqlCREATE TABLE agent_categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_type ENUM('investment', 'debt', 'retirement'),
  category_name TEXT,
  color_hex TEXT,  -- user-chosen color (e.g., #3b82f6)
  is_system BOOLEAN,  -- TRUE for predefined, FALSE for custom
  chat_count INT DEFAULT 0,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, agent_type, category_name)
);
Table: user_context
sqlCREATE TABLE user_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  context_data JSONB,  -- full context file (age, goals, patterns, etc.)
  last_updated TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id)
);

FRONTEND COMPONENTS: MEMORY SYSTEM
Component Structure
<AgentContextView>
  ├─ <MiniMemoryPanel>  ← Top-left, collapsed view
  │  ├─ <MiniGraph>
  │  └─ <QuickStats>
  │
  ├─ <FullscreenMemory>  ← When user clicks "Fullscreen"
  │  ├─ <LeftControlPanel>
  │  │  ├─ <SearchBar>
  │  │  ├─ <CategoryList>
  │  │  ├─ <BookmarkedSection>
  │  │  ├─ <FilterButtons>
  │  │  └─ <UtilityButtons> (Export, Clear)
  │  │
  │  ├─ <MainGraphView>
  │  │  ├─ <ForceDirectedGraph>  (D3.js or Three.js)
  │  │  └─ <ChatDetailDrawer>  (when dot clicked)
  │  │
  │  └─ <AnalyticsPopup>
  │     ├─ <CategoryBreakdown>
  │     ├─ <TimelineMetrics>
  │     ├─ <TrustScore>
  │     ├─ <DecisionMetrics>
  │     └─ <OutcomeSummary>
  │
  └─ <ChatDetailModal>  ← Full chat view when dot clicked
     ├─ <ChatContent>
     ├─ <CategorySelector>
     └─ <ActionButtons> (Bookmark, Export, Retag)
Key React Hooks
typescript// Manage fullscreen state
const [isFullscreen, setIsFullscreen] = useState(false);

// Track selected chat in graph
const [selectedChatId, setSelectedChatId] = useState(null);

// Filter/search state
const [searchQuery, setSearchQuery] = useState('');
const [activeFilters, setActiveFilters] = useState({
  categoryFilter: [],
  dateRange: 'all',
  outcomeFilter: []
});

// Graph organization
const [organizationMode, setOrganizationMode] = useState('by_category');

// Analytics popup visibility
const [showAnalytics, setShowAnalytics] = useState(true);

USER EXPERIENCE FLOW: COMPLETE JOURNEY
Scenario: User Wants to Review Past Diversification Discussions
1. User opens Investment Agent
   └─ Sees mini memory panel (top-left)
   
2. Hovers over mini graph
   └─ Sees colored dots, gets tooltip "47 total chats"
   
3. Clicks [🔍 Fullscreen]
   └─ Full memory view opens
   
4. Left panel shows categories
   └─ Sees "Diversification (18 chats)" category
   
5. Clicks on "Diversification" category
   └─ Graph redraws, filters to show only diversification chats
   └─ Edges show how these conversations relate
   
6. Hovers over a dot from June 15
   └─ Tooltip: "June 15 - Rebalancing Discussion"
   └─ Connecting lines show related chats
   
7. Clicks the dot
   └─ Chat detail drawer opens (right side)
   └─ Full conversation visible
   
8. Reads conversation, decides to bookmark it
   └─ Clicks [⭐ Bookmark]
   └─ Dot in graph now shows star icon
   └─ Chat appears in "Bookmarked" section of left panel
   
9. Clicks [Retag] to change category
   └─ Dropdown appears
   └─ User selects different tag
   └─ Graph updates in real-time
   
10. User closes drawer
    └─ Left panel now shows analytics updated
    └─ Trust score reflects conversation
    
11. User clicks [☰ Export PDF]
    └─ PDF generated with all diversification chats
    └─ Timeline, outcomes, key insights included
    └─ Downloaded to user's computer

TECHNICAL CONSIDERATIONS
Graph Rendering Performance

D3.js or Sigma.js for force-directed graphs
Lazy-load graph only when fullscreen (reduce initial load)
Virtualize chat list in left panel (render only visible items)
Debounce filter/search (wait 300ms after user stops typing before re-render)

Data Caching Strategy
Cache Layer:
├─ Chats for current agent: Cached in memory while fullscreen open
├─ Categories & tags: Cached, invalidated on new category added
├─ Analytics: Computed once on fullscreen open, cached
├─ User Context File: Synced via WebSocket (real-time updates)
└─ Graph layout: Cached, recalculate on organization change
Search Implementation
typescript// Pseudo-code for search
function searchChats(query: string, chats: Chat[]) {
  return chats.filter(chat => 
    chat.title.toLowerCase().includes(query) ||
    chat.content.toLowerCase().includes(query) ||
    chat.category.toLowerCase().includes(query) ||
    chat.tags.some(tag => tag.toLowerCase().includes(query)) ||
    chat.createdAt.toLocaleDateString().includes(query)
  );
}

SECURITY & PRIVACY
Data Isolation

Each agent's memory is stored separately in database
User cannot see other users' memories (multi-tenant safety)
API endpoints validate user_id before returning memory data

Sensitive Chat Content

Chat content encrypted at rest (AES-256) if containing financial data
PDF exports encrypted with user's password (optional)
Clear Memory button requires password confirmation


FUTURE ENHANCEMENTS

Memory Sharing (Phase 2): Export memory between agents (Debt Agent references Investment Agent's diversification strategy)
AI Summary (Phase 2): Auto-generate summaries of chat clusters using LLM
Pattern Recognition (Phase 3): Agent automatically detects patterns in bookmarked chats and alerts user to blind spots
Collaborative Memory (Phase 3): If multiple users in same household, share some memory segments (not available in MVP)
Memory Retention Policies (Phase 3): User can set auto-delete for old chats (e.g., delete after 2 years)


WIREFRAME SUMMARY
Mini Panel (Sidebar, Collapsed)
┌─────────────────────────┐
│ 💭 Memory               │
├─────────────────────────┤
│  [Mini Graph, Colored]  │
│  [Quick Stats]          │
│  [Fullscreen] [⚙️]     │
└─────────────────────────┘
Fullscreen View (Split-Screen)
┌──────────────────────────────────────┐
│ < Back | Agent Memory            | X │
├──────────┬───────────────────────────┤
│          │                           │
│ LEFT:    │  CENTER: Force-Directed   │
│ Search   │  Graph (Interactive)      │
│ Categories
│ Filters  │  RIGHT: Analytics Popup   │
│ Bookmarks│  (Floating, movable)      │
│          │                           │
├──────────┼───────────────────────────┤
│[Export]  │ [Chat Detail Drawer      │
│[Clear]   │  appears on dot click]   │
└──────────┴───────────────────────────┘

SUCCESS METRICS
✅ User can find past chats within 3 clicks
✅ Graph renders 50+ nodes smoothly (60fps)
✅ Search returns relevant results in <500ms
✅ User understands how bookmarking works (no training needed)
✅ Analytics popup shows 5+ useful metrics at a glance
✅ Agent uses memory to personalize next recommendation (evident to user)
✅ PDF export captures all relevant info without data loss
✅ Users spend 10+ minutes exploring memory on first visit (engagement)

SUMMARY
The Memory System is the cognitive layer that allows each agent to learn from user behavior while giving users full visibility into their decision history. By combining visual graph exploration, category-based organization, and intelligent agent learning, Fin creates a feedback loop where users build trust in agents by seeing their reasoning grounded in past context.
Document Version: 1.0
Last Updated: June 2026
Status: Complete Specification (Ready for Development)
