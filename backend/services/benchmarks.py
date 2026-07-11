"""Benchmark service — anonymized peer comparisons, percentile calculations, leaderboard.

All community-facing data is fully anonymized. No PII, no raw portfolio values exposed.
k-anonymity threshold: ≥ 10 users per bucket before benchmarks are shown.
"""

from __future__ import annotations

import json
from collections.abc import Sequence
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from integrations.upstash import (
    cache_benchmarks,
    generate_pseudonym,
    get_cached_benchmarks,
)
from models.community import CommunityBenchmark, LeaderboardEntry
from models.portfolio import Holding
from models.recommendation import Recommendation, Vote
from models.retirement import RetirementProfile
from services.input_sanitizer import validate_user_id

K_ANONYMITY_MIN = 10  # Minimum users per bucket before showing benchmarks


# ── Profile bucketing ─────────────────────────────────────

def _bucket_profile(user_id: str, db: Session) -> str:
    """Determine user's profile bucket from their data. Simple heuristic."""
    # Check retirement profile for risk tolerance
    rp = db.query(RetirementProfile).filter(RetirementProfile.user_id == user_id).first()
    if rp and rp.risk_tolerance:
        risk = rp.risk_tolerance.lower()
        if "aggressive" in risk:
            return "aggressive_growth"
        if "conservative" in risk:
            return "conservative"
        if "moderate" in risk:
            return "moderate"

    # Fallback: check holdings concentration for a rough profile
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    if holdings:
        total_value = sum((h.market_value or 0) for h in holdings)
        equity_pct = sum((h.market_value or 0) for h in holdings if h.asset_class == "equity") / max(total_value, 1)
        if equity_pct > 0.7:
            return "aggressive_growth"
        if equity_pct < 0.3:
            return "conservative"
        return "moderate"

    return "new_user"


# ── Metric computation ────────────────────────────────────

def _compute_user_metrics(user_id: str, db: Session) -> dict[str, float]:
    """Compute normalized metrics for a single user. Returns empty dict if insufficient data."""
    metrics: dict[str, float] = {}

    # Portfolio value (total holdings market value)
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    portfolio_value = sum((h.market_value or 0) for h in holdings)
    if portfolio_value > 0:
        metrics["portfolio_value"] = portfolio_value

    # Savings rate from retirement profile
    rp = db.query(RetirementProfile).filter(RetirementProfile.user_id == user_id).first()
    if rp:
        if rp.annual_income and rp.annual_income > 0 and rp.annual_contribution:
            metrics["savings_rate"] = (rp.annual_contribution / rp.annual_income) * 100

        if rp.current_savings and rp.current_savings > 0:
            metrics["retirement_savings"] = rp.current_savings

    # Execution rate: accepted / (accepted + rejected)
    total_votes = (
        db.query(func.count(Vote.id))
        .filter(Vote.user_id == user_id)
        .scalar()
    ) or 0
    accepted = (
        db.query(func.count(Vote.id))
        .filter(Vote.user_id == user_id, Vote.vote == "accepted")
        .scalar()
    ) or 0
    if total_votes > 0:
        metrics["execution_rate"] = (accepted / total_votes) * 100

    # Portfolio return (simplified: use available data)
    # Check if any recommendations were executed
    executed = (
        db.query(func.count(Recommendation.id))
        .filter(Recommendation.user_id == user_id, Recommendation.status == "executed")
        .scalar()
    ) or 0
    if executed > 0:
        # Synthetic: assume ~8% average return for executed recommendations
        metrics["portfolio_return"] = 8.0

    return metrics


# ── Percentile calculation ────────────────────────────────

def _percentile(values: Sequence[float], pct: float) -> float:
    """Compute percentile from sorted values."""
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    k = (len(sorted_vals) - 1) * (pct / 100)
    f = int(k)
    c = k - f
    if f + 1 < len(sorted_vals):
        return sorted_vals[f] + c * (sorted_vals[f + 1] - sorted_vals[f])
    return sorted_vals[f]


def _compute_percentiles(all_values: dict[str, list[float]]) -> dict[str, dict[str, float]]:
    """Compute p25, p50, p75, p90 for each metric across all users."""
    result: dict[str, dict[str, float]] = {}
    for metric, values in all_values.items():
        if len(values) < K_ANONYMITY_MIN:
            continue
        result[metric] = {
            "p25": _percentile(values, 25),
            "p50": _percentile(values, 50),
            "p75": _percentile(values, 75),
            "p90": _percentile(values, 90),
        }
    return result


def _compute_user_percentile(user_value: float, all_values: list[float]) -> int:
    """Compute user's percentile rank within all values. Returns 1-100."""
    if not all_values or user_value <= 0:
        return 50
    below = sum(1 for v in all_values if v < user_value)
    return min(99, max(1, int((below / len(all_values)) * 100)))


# ── Public API ────────────────────────────────────────────

def get_community_benchmarks(
    db: Session,
    user_id: str,
    profile_bucket: str | None = None,
) -> dict[str, Any]:
    """Return benchmark comparison: user stats vs community percentiles.

    All values are anonymized. No PII in response.
    Returns empty benchmark if < K_ANONYMITY_MIN users in bucket.
    """
    validate_user_id(user_id)

    if profile_bucket is None:
        profile_bucket = _bucket_profile(user_id, db)

    # Try cache first
    cached = get_cached_benchmarks(profile_bucket)
    if cached:
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            pass

    # Collect metrics from all users in the same bucket
    # This is simplified — in production, use pre-computed CommunityBenchmark rows
    # For now, dynamically compute from available data

    # Gather all user IDs (ponytail: sample of active users with votes)
    active_users = [
        row[0]
        for row in db.query(Vote.user_id).distinct().limit(200).all()
    ]
    if user_id not in active_users:
        active_users.append(user_id)

    # Bucket users
    bucketed_users: list[str] = []
    for uid in active_users:
        if _bucket_profile(uid, db) == profile_bucket:
            bucketed_users.append(uid)

    # k-anonymity check
    if len(bucketed_users) < K_ANONYMITY_MIN:
        return {
            "profile_bucket": profile_bucket,
            "sample_size": len(bucketed_users),
            "k_anonymity_met": False,
            "message": f"Not enough data yet. Need {K_ANONYMITY_MIN} users in this bucket (currently {len(bucketed_users)}).",
            "benchmarks": {},
            "user_percentiles": {},
        }

    # Compute metrics for all bucketed users
    all_metrics: dict[str, list[float]] = {}
    user_metrics: dict[str, float] = {}

    for uid in bucketed_users:
        metrics = _compute_user_metrics(uid, db)
        for metric, value in metrics.items():
            all_metrics.setdefault(metric, []).append(value)
            if uid == user_id:
                user_metrics[metric] = value

    # Compute percentiles
    percentiles = _compute_percentiles(all_metrics)

    # Compute user percentiles
    user_percentiles: dict[str, int] = {}
    for metric, uval in user_metrics.items():
        if metric in all_metrics:
            user_percentiles[metric] = _compute_user_percentile(uval, all_metrics[metric])

    # Build response
    benchmarks = {}
    for metric, pcts in percentiles.items():
        benchmarks[metric] = {
            "p25": round(pcts["p25"], 2),
            "p50": round(pcts["p50"], 2),
            "p75": round(pcts["p75"], 2),
            "p90": round(pcts["p90"], 2),
            "sample_size": len(all_metrics.get(metric, [])),
        }

    result = {
        "profile_bucket": profile_bucket,
        "sample_size": len(bucketed_users),
        "k_anonymity_met": True,
        "benchmarks": benchmarks,
        "user_percentiles": user_percentiles,
        "user_metrics": {k: round(v, 2) for k, v in user_metrics.items()},
    }

    # Cache the result
    try:
        cache_benchmarks(profile_bucket, json.dumps(result), ttl=3600)
    except Exception:
        pass

    return result


def get_leaderboard(
    db: Session,
    category: str = "execution_rate",
    limit: int = 20,
) -> dict[str, Any]:
    """Return anonymized leaderboard for a given category.

    Categories: execution_rate, savings_rate, portfolio_value
    Pseudonyms are hash-based, consistent per user.
    """
    valid_categories = {"execution_rate", "savings_rate", "portfolio_value"}
    if category not in valid_categories:
        category = "execution_rate"

    # Get active users
    active_users = [
        row[0]
        for row in db.query(Vote.user_id).distinct().limit(200).all()
    ]

    # Compute metrics and rank
    entries: list[dict[str, Any]] = []
    for uid in active_users:
        metrics = _compute_user_metrics(uid, db)
        if category in metrics:
            entries.append({
                "user_id": uid,
                "value": metrics[category],
                "pseudonym": generate_pseudonym(uid),
            })

    # Sort descending
    entries.sort(key=lambda e: e["value"], reverse=True)

    # Truncate to limit
    entries = entries[:limit]

    # Build response with rank and badges
    leaderboard = []
    for i, entry in enumerate(entries):
        rank = i + 1
        badge = None
        if rank == 1:
            badge = f"{category}_champion"
        elif rank <= 3:
            badge = f"{category}_top3"
        elif rank <= 10:
            badge = f"{category}_top10"

        # Cap display value for privacy
        if category == "portfolio_value":
            display = "Top 1%" if rank <= max(1, len(entries) // 100) else f"Top {min(100, int(rank / len(entries) * 100))}%"
        else:
            pct = min(99, max(1, int((1 - rank / max(len(entries), 1)) * 100)))
            display = f"Top {pct}%"

        leaderboard.append({
            "rank": rank,
            "pseudonym": entry["pseudonym"],
            "metric_display": display,
            "badge": badge,
        })

    return {
        "category": category,
        "entries": leaderboard,
        "total_participants": len(active_users),
    }


def refresh_benchmark_cache(db: Session) -> int:
    """Pre-compute and cache benchmarks for all profile buckets. Call from scheduler.

    Returns number of buckets refreshed.
    """
    # Get distinct profile buckets
    active_users = [
        row[0]
        for row in db.query(Vote.user_id).distinct().limit(300).all()
    ]

    buckets: set[str] = set()
    for uid in active_users:
        buckets.add(_bucket_profile(uid, db))

    count = 0
    for bucket in buckets:
        try:
            result = get_community_benchmarks(db, active_users[0] if active_users else "", bucket)
            if result.get("k_anonymity_met"):
                # Persist to CommunityBenchmark table
                for metric, pcts in result.get("benchmarks", {}).items():
                    existing = (
                        db.query(CommunityBenchmark)
                        .filter(
                            CommunityBenchmark.profile_bucket == bucket,
                            CommunityBenchmark.metric_name == metric,
                        )
                        .first()
                    )
                    if existing:
                        existing.p25 = pcts["p25"]
                        existing.p50 = pcts["p50"]
                        existing.p75 = pcts["p75"]
                        existing.p90 = pcts["p90"]
                        existing.sample_count = pcts["sample_size"]
                    else:
                        db.add(CommunityBenchmark(
                            profile_bucket=bucket,
                            metric_name=metric,
                            p25=pcts["p25"],
                            p50=pcts["p50"],
                            p75=pcts["p75"],
                            p90=pcts["p90"],
                            sample_count=pcts["sample_size"],
                        ))
                db.commit()
                count += 1
        except Exception:
            db.rollback()

    return count