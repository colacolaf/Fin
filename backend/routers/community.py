"""Community router — benchmarks, leaderboard, vote aggregation, health.

Endpoints:
  GET  /api/community/benchmarks       — User's percentile vs peer benchmarks
  GET  /api/community/leaderboard      — Anonymized leaderboard (execution rate, savings rate)
  GET  /api/community/vote-summary/{id} — Aggregate vote counts for a recommendation
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth.dependencies import get_current_user
from database import get_db
from integrations.upstash import rate_limit, invalidate_vote_cache
from models.user import User
from services.benchmarks import get_community_benchmarks, get_leaderboard
from services.input_sanitizer import validate_user_id

router = APIRouter(prefix="/api/community", tags=["community"])

# Rate limit: 30 requests per minute for benchmark/leaderboard reads
# Vote writes use a separate tighter limit handled in recommendations router


@router.get("/benchmarks")
def benchmarks(
    profile_bucket: str | None = Query(None, description="Override profile bucket"),
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    """Get community benchmark comparison — user metrics vs peer percentiles.

    All data is anonymized. k-anonymity threshold: 10 users per bucket.
    Returns k_anonymity_met=false if insufficient data.
    """
    # Rate limit: benchmark reads
    allowed, remaining = rate_limit(f"benchmark:read:{user.id}", 30, 60)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many benchmark requests. Please wait before retrying.",
            headers={"X-RateLimit-Remaining": "0"},
        )

    validate_user_id(str(user.id))
    try:
        result = get_community_benchmarks(db, str(user.id), profile_bucket)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/leaderboard")
def leaderboard(
    category: str = Query("execution_rate", description="execution_rate | savings_rate | portfolio_value"),
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    """Get anonymized community leaderboard.

    Pseudonyms are deterministic hashes — same user always gets same pseudonym.
    No PII, no raw portfolio values exposed.
    """
    allowed, remaining = rate_limit(f"leaderboard:read:{user.id}", 20, 60)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many leaderboard requests. Please wait before retrying.",
            headers={"X-RateLimit-Remaining": "0"},
        )

    try:
        return get_leaderboard(db, category, limit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/vote-summary/{recommendation_id}")
def vote_summary(
    recommendation_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    """Get aggregated (anonymized) vote counts for a recommendation.

    Returns: { recommendation_id, accepted, rejected, deferred, total, consensus }
    Consensus is the majority vote type, or "divided" if no clear majority.
    """
    from sqlalchemy import func
    from models.recommendation import Vote

    allowed, remaining = rate_limit(f"vote:summary:{user.id}", 60, 60)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before retrying.",
            headers={"X-RateLimit-Remaining": "0"},
        )

    # Count votes by type
    counts = (
        db.query(Vote.vote, func.count(Vote.id))
        .filter(Vote.recommendation_id == recommendation_id)
        .group_by(Vote.vote)
        .all()
    )

    accepted = 0
    rejected = 0
    deferred = 0
    for vote_type, count in counts:
        if vote_type == "accepted":
            accepted = count
        elif vote_type == "rejected":
            rejected = count
        elif vote_type == "deferred":
            deferred = count

    total = accepted + rejected + deferred

    # Determine consensus
    if total == 0:
        consensus = "none"
    else:
        max_count = max(accepted, rejected, deferred)
        if max_count / total >= 0.5:
            if accepted == max_count:
                consensus = "accepted"
            elif rejected == max_count:
                consensus = "rejected"
            else:
                consensus = "deferred"
        else:
            consensus = "divided"

    return {
        "recommendation_id": recommendation_id,
        "accepted": accepted,
        "rejected": rejected,
        "deferred": deferred,
        "total": total,
        "consensus": consensus,
    }


# ── Admin: refresh benchmark cache ────────────────────────

@router.post("/admin/refresh-benchmarks", status_code=status.HTTP_202_ACCEPTED)
def refresh_benchmarks(
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    """Admin: trigger benchmark cache refresh. Requires admin role."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    from services.benchmarks import refresh_benchmark_cache

    buckets_refreshed = refresh_benchmark_cache(db)
    return {"ok": True, "buckets_refreshed": buckets_refreshed}
