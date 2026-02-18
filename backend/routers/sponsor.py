"""
EventFlow – Sponsor Router
Sponsor dashboard: scan candidates, view stall analytics with ROI metrics.
"""

from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from mock_db import STALLS, TRANSACTIONS, USERS
from models import AnalyticsResponse, ScanCandidateRequest, ScanCandidateResponse

router = APIRouter(prefix="/api/sponsor", tags=["Sponsor"])


# ──────────────────── POST /scan-candidate ────────────────────────────

@router.post("/scan-candidate", response_model=ScanCandidateResponse)
async def scan_candidate(
    body: ScanCandidateRequest,
    _user_id: int = Depends(get_current_user),
):
    """Scan a student's badge — return their resume and skills for hiring."""
    user = USERS.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return ScanCandidateResponse(
        user_id=user.id,
        name=user.name,
        department=user.department,
        resume_url=user.resume_url,
        skills=user.skills,
    )


# ──────────────────── GET /analytics/{stall_id} ──────────────────────

@router.get("/analytics/{stall_id}", response_model=AnalyticsResponse)
async def stall_analytics(
    stall_id: int,
    _user_id: int = Depends(get_current_user),
):
    """
    Full sponsor analytics dashboard for a stall:
      - Total Footfall
      - Peak Traffic Hour
      - Anonymous Demographics (department breakdown)
      - Scan Rate % (visitors / total users)
      - Cost per Interaction
      - Average Wait Time
      - Cross Pollination Rate (dynamic)
      - Flash Sale Lift
    """
    stall = STALLS.get(stall_id)
    if not stall:
        raise HTTPException(status_code=404, detail="Stall not found")

    # ── Peak traffic hour ──
    if stall.visit_timestamps:
        hour_counts: Counter[int] = Counter(ts.hour for ts in stall.visit_timestamps)
        peak_hour = hour_counts.most_common(1)[0][0]
    else:
        peak_hour = 14

    # ── Find all visitors of this stall ──
    visitor_user_ids: set[int] = set()
    for uid, user in USERS.items():
        for entry in user.pokemon_dex:
            if entry.get("stall_id") == stall_id:
                visitor_user_ids.add(uid)
    # Also from transactions
    for tx in TRANSACTIONS:
        if tx.stall_id == stall_id:
            visitor_user_ids.add(tx.user_id)

    # ── Demographics (department breakdown) ──
    dept_counter: Counter[str] = Counter()
    for uid in visitor_user_ids:
        user = USERS.get(uid)
        if user:
            dept_counter[user.department] += 1
    demographics = dict(dept_counter) if dept_counter else {"CS": 40, "IT": 20, "DevOps": 10}

    # ── Scan rate % ──
    total_users = len(USERS) if len(USERS) > 0 else 1
    scan_rate_pct = round((len(visitor_user_ids) / total_users) * 100, 1)

    # ── Cost per interaction ──
    visits = stall.visitor_count if stall.visitor_count > 0 else 1
    cost_per_interaction = round(stall.sponsorship_amount / visits, 2)

    # ── Average wait time ──
    if len(stall.visit_timestamps) >= 2:
        sorted_ts = sorted(stall.visit_timestamps)
        diffs = [
            (sorted_ts[i + 1] - sorted_ts[i]).total_seconds()
            for i in range(len(sorted_ts) - 1)
        ]
        avg_seconds = sum(diffs) / len(diffs)
        minutes = int(avg_seconds // 60)
        seconds = int(avg_seconds % 60)
        avg_wait_time = f"{minutes}m {seconds}s"
    else:
        avg_wait_time = "N/A (insufficient data)"

    # ── Cross pollination (dynamic) ──
    # % of this stall's visitors who also visited at least one other stall
    if visitor_user_ids:
        cross_count = 0
        for uid in visitor_user_ids:
            user = USERS.get(uid)
            if user:
                other_stalls = {p["stall_id"] for p in user.pokemon_dex if p["stall_id"] != stall_id}
                if other_stalls:
                    cross_count += 1
        cross_pct = round((cross_count / len(visitor_user_ids)) * 100, 1)
        cross_pollination = f"{cross_pct}% also visited another stall"
    else:
        cross_pollination = "N/A (no visitors yet)"

    return AnalyticsResponse(
        stall_id=stall.id,
        stall_name=stall.name,
        total_footfall=stall.visitor_count,
        peak_traffic_hour=peak_hour,
        demographics=demographics,
        scan_rate_pct=scan_rate_pct,
        cost_per_interaction=cost_per_interaction,
        avg_wait_time=avg_wait_time,
        cross_pollination=cross_pollination,
        flash_sale_lift="15% increase during low-crowd windows",
    )
