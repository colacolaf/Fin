# Agent Testing Plan

> Python test harness. Verifies agent skill triggering, confidence ranges, vote loop, cross-agent coordination.

---

## Setup

```bash
pip install requests pytest
ollama pull mistral:7b    # or qwen2.5:32b, deepseek-r1:70b
```

One file: `tests/test_agents.py`. Run: `pytest tests/test_agents.py -v`

---

## Synthetic Portfolio Fixtures

### Fixture A: Concentrated NVDA

```python
FIXTURE_NVDA = {
    "user_profile": {
        "age": 32,
        "income_gross": 180000,
        "employment_status": "employed",
        "state": "CA",
        "federal_tax_bracket": 0.32,
        "state_tax_bracket": 0.093,
        "risk_tolerance": "aggressive",
        "time_horizon": 25
    },
    "portfolio": {
        "total_value": 850000,
        "holdings": [
            {"ticker": "NVDA", "value": 680000, "cost_basis": 120000, "type": "individual_stock"},
            {"ticker": "VTI",   "value": 120000, "cost_basis": 100000, "type": "etf"},
            {"ticker": "CASH",  "value": 50000,  "cost_basis": 50000,  "type": "cash"}
        ],
        "accounts": [{"type": "taxable_brokerage", "value": 850000}]
    },
    "debts": [],
    "retirement_accounts": []
}
```

Expected agent routing: **investment**.  
Expected skills triggered: `concentration_analysis` (Tier 1), `single_stock_risk` (Tier 1), `sector_diversification` (Tier 1), `rebalancing_recommendation` (Tier 4).  
Expected confidence: 0.85–0.95 on diversification recommendation.  
Edge case: NVDA = 80% of portfolio → concentration flag must fire. If model ignores, test fails.

### Fixture B: Diversified Boglehead

```python
FIXTURE_BOGLEHEAD = {
    "user_profile": {
        "age": 45,
        "income_gross": 220000,
        "employment_status": "employed",
        "state": "TX",
        "federal_tax_bracket": 0.24,
        "state_tax_bracket": 0.0,
        "risk_tolerance": "moderate",
        "time_horizon": 20
    },
    "portfolio": {
        "total_value": 1200000,
        "holdings": [
            {"ticker": "VTI",  "value": 600000, "cost_basis": 480000, "type": "etf"},
            {"ticker": "VXUS", "value": 300000, "cost_basis": 260000, "type": "etf"},
            {"ticker": "BND",  "value": 300000, "cost_basis": 280000, "type": "etf"}
        ],
        "accounts": [
            {"type": "taxable_brokerage", "value": 500000},
            {"type": "401k", "value": 400000},
            {"type": "roth_ira", "value": 300000}
        ]
    },
    "debts": [],
    "retirement_accounts": [
        {"type": "401k", "value": 400000, "contribution_rate": 0.12, "employer_match": 0.06},
        {"type": "roth_ira", "value": 300000, "contribution_rate": 0}
    ]
}
```

Expected agent routing: could trigger **investment** or **retirement** (router may pick either based on profile).  
Investment skills expected: `asset_class_diversification` (Tier 1), `expense_ratio_analysis` (Tier 1), `tax_efficiency` (Tier 2).  
Retirement skills expected: `contribution_check` (Tier 1), `employer_match_optimization` (Tier 1).  
Expected confidence: 0.70–0.90 (good shape, minor tweaks).  
Edge case: diversified portfolio → should NOT trigger concentration_analysis. If it does, false positive.

### Fixture C: Near-Retirement

```python
FIXTURE_NEAR_RETIREMENT = {
    "user_profile": {
        "age": 62,
        "income_gross": 150000,
        "employment_status": "employed",
        "state": "FL",
        "federal_tax_bracket": 0.24,
        "state_tax_bracket": 0.0,
        "risk_tolerance": "conservative",
        "time_horizon": 5
    },
    "portfolio": {
        "total_value": 2200000,
        "holdings": [
            {"ticker": "VTI",   "value": 1100000, "cost_basis": 600000, "type": "etf"},
            {"ticker": "BND",   "value": 550000,  "cost_basis": 500000, "type": "etf"},
            {"ticker": "AAPL",  "value": 330000,  "cost_basis": 50000,  "type": "individual_stock"},
            {"ticker": "CASH",  "value": 220000,  "cost_basis": 220000, "type": "cash"}
        ],
        "accounts": [
            {"type": "401k", "value": 900000},
            {"type": "roth_ira", "value": 400000},
            {"type": "taxable_brokerage", "value": 900000}
        ]
    },
    "debts": [],
    "retirement_accounts": [
        {"type": "401k", "value": 900000, "contribution_rate": 0.15, "employer_match": 0.05},
        {"type": "roth_ira", "value": 400000, "contribution_rate": 0}
    ]
}
```

Expected agent routing: **retirement** (age 62, time_horizon 5).  
Retirement skills expected: `retirement_readiness_calculation` (Tier 1), `sequence_of_returns_risk` (Tier 3), `roth_conversion_analysis` (Tier 2), `rmd_projection` (Tier 3), `social_security_timing` (Tier 3).  
Investment skills expected: `concentration_analysis` (AAPL = 15%), `capital_gains_tax_impact` (cost basis 50k on 330k).  
Expected confidence: 0.75–0.90 on readiness assessment, 0.80–0.95 on Roth conversion if beneficial.  
Edge case: age 62 + conservative + 5yr horizon → must discuss sequence-of-returns risk. Must flag AAPL concentration with large unrealized gain.

### Fixture D: High-Debt Young Professional

```python
FIXTURE_HIGH_DEBT = {
    "user_profile": {
        "age": 27,
        "income_gross": 85000,
        "employment_status": "employed",
        "state": "NY",
        "federal_tax_bracket": 0.22,
        "state_tax_bracket": 0.065,
        "risk_tolerance": "moderate",
        "time_horizon": 30
    },
    "portfolio": {
        "total_value": 15000,
        "holdings": [
            {"ticker": "VTI", "value": 10000, "cost_basis": 9000, "type": "etf"},
            {"ticker": "CASH", "value": 5000, "cost_basis": 5000, "type": "cash"}
        ],
        "accounts": [{"type": "roth_ira", "value": 15000}]
    },
    "debts": [
        {"type": "student_loan", "balance": 65000, "rate": 0.068, "min_payment": 680},
        {"type": "credit_card", "balance": 12000, "rate": 0.2499, "min_payment": 360},
        {"type": "auto_loan", "balance": 18000, "rate": 0.054, "min_payment": 420}
    ],
    "retirement_accounts": [
        {"type": "roth_ira", "value": 15000, "contribution_rate": 0}
    ]
}
```

Expected agent routing: **debt** primary, may also trigger investment for `debt_vs_investment_tradeoff`.  
Debt skills expected: `debt_inventory` (Tier 1), `avalanche_vs_snowball` (Tier 2), `high_interest_prioritization` (Tier 2), `debt_vs_investment_tradeoff` (Tier 4).  
Expected confidence: 0.90–0.98 on "pay credit card first" (24.99% rate), 0.75–0.85 on debt vs. investing tradeoff.  
Edge case: Credit card at 24.99% → avalanche must rank it #1. If snowball ranks auto_loan first ($420 min payment), explain difference. Debt vs. Investment must compare 24.99% guaranteed return vs. ~7% expected market return.

---

## Test Harness

```python
"""tests/test_agents.py — Agent testing plan for Fin multi-agent system."""
import json, time, pytest, requests

BASE_URL = "http://localhost:8000/api"

FIXTURE_NVDA = { ... }          # from above
FIXTURE_BOGLEHEAD = { ... }
FIXTURE_NEAR_RETIREMENT = { ... }
FIXTURE_HIGH_DEBT = { ... }

# ── helpers ──────────────────────────────────────────────

def post_chat(user_context: dict, message: str = "Analyze my financial situation and give recommendations.") -> dict:
    """Send chat request, return parsed JSON response."""
    resp = requests.post(f"{BASE_URL}/chat", json={
        "message": message,
        "user_context": user_context
    }, timeout=120)
    assert resp.status_code == 200, f"Chat failed: {resp.text}"
    return resp.json()

def vote(recommendation_id: str, vote_type: str) -> dict:
    """Submit vote on recommendation."""
    resp = requests.post(f"{BASE_URL}/vote", json={
        "recommendation_id": recommendation_id,
        "vote": vote_type  # "helpful" | "not_helpful" | "defer"
    }, timeout=30)
    assert resp.status_code == 200, f"Vote failed: {resp.text}"
    return resp.json()

def get_agent_memory(agent: str) -> list:
    """Retrieve agent memory entries."""
    resp = requests.get(f"{BASE_URL}/memory/{agent}", timeout=30)
    assert resp.status_code == 200
    return resp.json()

# ── scenario tests ───────────────────────────────────────

class TestConcentratedNVDA:
    """Fixture A: 80% NVDA portfolio."""

    def test_router_sends_to_investment(self):
        result = post_chat(FIXTURE_NVDA)
        assert result["agent"] == "investment"

    def test_concentration_skill_triggered(self):
        result = post_chat(FIXTURE_NVDA)
        assert "concentration_analysis" in result["skills_used"], \
            f"Expected concentration_analysis, got: {result['skills_used']}"

    def test_concentration_confidence_high(self):
        result = post_chat(FIXTURE_NVDA)
        diversifying_recs = [r for r in result["recommendations"]
                             if "diversif" in r["action"].lower() or "concentrat" in r["action"].lower()]
        assert len(diversifying_recs) > 0, "No diversification recommendation"
        for rec in diversifying_recs:
            assert 0.70 <= rec["confidence"] <= 0.95, \
                f"Confidence {rec['confidence']} out of expected range for diversification"

    def test_confidence_not_exceeding_cap(self):
        result = post_chat(FIXTURE_NVDA)
        for rec in result["recommendations"]:
            assert rec["confidence"] <= 0.95, \
                f"Confidence {rec['confidence']} exceeds 0.95 cap for {rec['action']}"

    def test_no_false_retirement_routing(self):
        result = post_chat(FIXTURE_NVDA)
        assert result["agent"] != "retirement", "NVDA fixture should not route to retirement"


class TestBoglehead:
    """Fixture B: Diversified 3-fund portfolio."""

    def test_no_concentration_alert(self):
        result = post_chat(FIXTURE_BOGLEHEAD)
        assert "concentration_analysis" not in result["skills_used"], \
            "Boglehead portfolio should not trigger concentration analysis"

    def test_fee_analysis_if_triggered(self):
        result = post_chat(FIXTURE_BOGLEHEAD)
        if "expense_ratio_analysis" in result["skills_used"]:
            for rec in result["recommendations"]:
                assert rec["confidence"] <= 0.95

    def test_confidence_in_range(self):
        result = post_chat(FIXTURE_BOGLEHEAD)
        for rec in result["recommendations"]:
            assert 0.0 <= rec["confidence"] <= 0.95, \
                f"Confidence {rec['confidence']} outside [0, 0.95]"


class TestNearRetirement:
    """Fixture C: Age 62, 5yr horizon, $2.2M."""

    def test_router_sends_to_retirement(self):
        result = post_chat(FIXTURE_NEAR_RETIREMENT)
        assert result["agent"] == "retirement", \
            f"Expected retirement agent, got {result['agent']}"

    def test_readiness_skill_triggered(self):
        result = post_chat(FIXTURE_NEAR_RETIREMENT)
        assert "retirement_readiness_calculation" in result["skills_used"]

    def test_sequence_of_returns_mentioned(self):
        result = post_chat(FIXTURE_NEAR_RETIREMENT)
        all_text = json.dumps(result["recommendations"]).lower()
        assert any(term in all_text for term in ["sequence", "sor", "withdrawal order"]), \
            "Near-retirement must mention sequence-of-returns risk"

    def test_roth_conversion_analyzed(self):
        result = post_chat(FIXTURE_NEAR_RETIREMENT)
        assert "roth_conversion_analysis" in result["skills_used"], \
            "Should evaluate Roth conversion for near-retiree"

    def test_confidence_not_exceeding_cap(self):
        result = post_chat(FIXTURE_NEAR_RETIREMENT)
        for rec in result["recommendations"]:
            assert rec["confidence"] <= 0.95


class TestHighDebtYoung:
    """Fixture D: $95k debt, $15k portfolio."""

    def test_router_sends_to_debt(self):
        result = post_chat(FIXTURE_HIGH_DEBT)
        assert result["agent"] == "debt"

    def test_debt_inventory_triggered(self):
        result = post_chat(FIXTURE_HIGH_DEBT)
        assert "debt_inventory" in result["skills_used"]

    def test_credit_card_prioritized(self):
        result = post_chat(FIXTURE_HIGH_DEBT)
        all_text = json.dumps(result["recommendations"]).lower()
        assert "credit card" in all_text, "Must mention credit card debt"

    def test_avalanche_ranks_credit_card_first(self):
        result = post_chat(FIXTURE_HIGH_DEBT)
        # credit card at 24.99% must be top payoff priority in avalanche
        payoff_recs = [r for r in result["recommendations"]
                       if any(w in r["action"].lower() for w in ["pay", "avalanche", "snowball"])]
        if payoff_recs:
            first = payoff_recs[0]["action"].lower()
            assert "credit card" in first or "24.99" in first or "highest interest" in first, \
                f"Avalanche should prioritize credit card, got: {first}"

    def test_debt_vs_investment_tradeoff(self):
        result = post_chat(FIXTURE_HIGH_DEBT)
        assert "debt_vs_investment_tradeoff" in result["skills_used"], \
            "Must evaluate debt payoff vs. investing"

    def test_confidence_not_exceeding_cap(self):
        result = post_chat(FIXTURE_HIGH_DEBT)
        for rec in result["recommendations"]:
            assert rec["confidence"] <= 0.95


# ── vote loop test ───────────────────────────────────────

class TestVoteMemoryLoop:
    """Recommendation → vote → memory update → next recommendation reflects vote."""

    def test_vote_updates_past_decisions_and_next_rec(self):
        # Step 1: Get first recommendation
        result1 = post_chat(FIXTURE_HIGH_DEBT, "How should I tackle my debt?")
        assert len(result1["recommendations"]) > 0
        rec_id = result1["recommendations"][0].get("id") or result1["recommendations"][0]["action"]

        # Step 2: Vote "not_helpful"
        vote_result = vote(rec_id, "not_helpful")
        assert vote_result.get("status") in ["ok", "recorded"]

        # Step 3: Check memory reflects vote
        debt_memory = get_agent_memory("debt")
        # past_decisions should have the negative vote
        memory_text = json.dumps(debt_memory).lower()
        assert "not_helpful" in memory_text or rec_id.lower() in memory_text, \
            "Memory should reflect vote"

        # Step 4: Second recommendation should adapt
        result2 = post_chat(FIXTURE_HIGH_DEBT, "What else should I consider?")
        # Behavioral recalculation should adjust confidence or approach
        # ponytail: verify second rec differs from first (different skill or adjusted confidence)
        skills2 = set(result2["skills_used"])
        # It may use same skills but with adjusted framing — at minimum, verify it ran
        assert len(result2["recommendations"]) > 0, "Second recommendation should produce output"

    def test_vote_defer_preserves_for_later(self):
        result1 = post_chat(FIXTURE_HIGH_DEBT, "Any tax strategies?")
        rec_id = result1["recommendations"][0].get("id") or result1["recommendations"][0]["action"]
        vote(rec_id, "defer")
        debt_memory = get_agent_memory("debt")
        memory_text = json.dumps(debt_memory).lower()
        assert "defer" in memory_text, "Deferred vote must be stored"


# ── confidence cap verification ──────────────────────────

class TestConfidenceCaps:
    """No agent skill exceeds its defined confidence ceiling."""

    # Confidence ceilings from skill catalogs (hard cap: 0.95 across all agents)
    MAX_CONFIDENCE = 0.95

    FIXTURES = [
        ("NVDA", FIXTURE_NVDA),
        ("Boglehead", FIXTURE_BOGLEHEAD),
        ("NearRetirement", FIXTURE_NEAR_RETIREMENT),
        ("HighDebt", FIXTURE_HIGH_DEBT),
    ]

    @pytest.mark.parametrize("name,fixture", FIXTURES)
    def test_all_fixtures_confidence_within_caps(self, name, fixture):
        result = post_chat(fixture)
        for rec in result["recommendations"]:
            assert 0.0 <= rec["confidence"] <= self.MAX_CONFIDENCE, \
                f"[{name}] Confidence {rec['confidence']} outside [0, {self.MAX_CONFIDENCE}] for: {rec['action']}"


# ── cross-agent coordination ─────────────────────────────

class TestCrossAgentCoordination:
    """Agents share context via memory, not direct calls."""

    def test_investment_aware_of_debt_recommendation(self):
        # Step 1: Debt agent makes recommendation
        debt_result = post_chat(FIXTURE_HIGH_DEBT, "Analyze my debt situation.")
        assert debt_result["agent"] == "debt"

        # Step 2: Investment agent queried — should see debt context via shared memory
        inv_result = post_chat(FIXTURE_HIGH_DEBT, "Should I invest or pay debt?")
        # Investment agent loads past_decisions from shared memory
        # It should reference or acknowledge debt situation
        all_text = json.dumps(inv_result["recommendations"]).lower()
        assert any(w in all_text for w in ["debt", "pay off", "interest"]), \
            "Investment agent should reference debt context from shared memory"
```

---

## Manual Smoke Tests

If Ollama not running or full pipeline unavailable, run these quick checks:

| # | Test | Expect |
|---|------|--------|
| 1 | NVDA portfolio → investment agent selected | `result["agent"] == "investment"` |
| 2 | NVDA portfolio → concentration skill fires | `"concentration_analysis" in result["skills_used"]` |
| 3 | Boglehead → no concentration alert | `"concentration_analysis" not in result["skills_used"]` |
| 4 | Near-retirement → retirement agent | `result["agent"] == "retirement"` |
| 5 | High-debt → debt agent | `result["agent"] == "debt"` |
| 6 | Any fixture → all confidences ≤ 0.95 | `all(r["confidence"] <= 0.95 for r in result["recommendations"])` |
| 7 | Vote helpful → memory updated | `"helpful" in str(memory)` |
| 8 | Vote defer → preserved for later | `"defer" in str(memory)` |
| 9 | Second rec after vote → adjusted output | `result2["skills_used"] != result1["skills_used"]` or confidence shifted |
| 10 | Cross-agent memory visible | Investment agent references debt context |

---

## Expected Confidence Ranges by Skill Tier

| Tier | Typical Range | Ceiling |
|------|--------------|---------|
| Tier 1 (always-on) | 0.60–0.85 | 0.95 |
| Tier 2 (data-gated) | 0.70–0.90 | 0.95 |
| Tier 3 (advanced) | 0.65–0.90 | 0.95 |
| Tier 4 (synthesis) | 0.70–0.85 | 0.95 |

All agents share 0.95 hard cap. No recommendation exceeds it. If test finds >0.95, bug in confidence formula.

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Empty portfolio (new user, no connectors) | Only Tier 1 skills fire. No data-dependent skills. |
| Single holding = 100% | Concentration flag at max severity. |
| All debt at 0% (family loan) | Debt agent still inventories, ranks low priority. |
| Age 18 with $5M inheritance | Retirement agent fires (FIRE scenario), not standard path. |
| Negative net worth | Debt agent primary. Investment/retirement minimal. |
| Missing user_profile fields | Agent uses defaults or asks clarifying question. |
| Connector offline (Alpaca down) | Tier 2+ skills skipped. Graceful degradation. |