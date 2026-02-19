"""
EventFlow – Sponsor Router
Sponsor dashboard: scan candidates, view stall analytics with ROI metrics.
All data sourced from MongoDB via async Motor.
"""

from __future__ import annotations

import random

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_db
from models import (
    AnalyticsResponse,
    HourlyTrafficEntry,
    ScanCandidateRequest,
    ScanCandidateResponse,
)
from utils.analytics import (
    calculate_avg_wait_time,
    calculate_cpi,
    calculate_cross_pollination,
    calculate_flash_sale_lift,
)

router = APIRouter(prefix="/api/sponsor", tags=["Sponsor"])


# ──────────────────── POST /scan-candidate ────────────────────────────


@router.post("/scan-candidate", response_model=ScanCandidateResponse)
async def scan_candidate(body: ScanCandidateRequest):
    """Scan a student's badge — return their resume and skills for hiring."""
    db = get_db()

    try:
        user = await db.users.find_one({"_id": ObjectId(body.user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    demographics = user.get("demographics", {})

    return ScanCandidateResponse(
        user_id=str(user["_id"]),
        name=user.get("name", ""),
        email=user.get("email", ""),
        demographics=demographics,
        resume_url=user.get("resume_url"),
        skills=user.get("skills", []),
    )


# ──────────────────── GET /analytics/{stall_id} ──────────────────────


@router.get("/analytics/{stall_id}", response_model=AnalyticsResponse)
async def stall_analytics(stall_id: str):
    """
    Full sponsor analytics dashboard for a stall:
      - Total Footfall (distinct students)
      - Peak Traffic Hour (aggregation by hour)
      - Anonymous Demographics (major breakdown)
      - Cost per Interaction (sponsorship_cost / total_scans)
      - Average Wait Time (mean scan-to-scan delta)
      - Cross Pollination Rate
      - Flash Sale Lift
    """
    db = get_db()

    try:
        sponsor_oid = ObjectId(stall_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid stall_id format")

    sponsor = await db.sponsors.find_one({"_id": sponsor_oid})
    if not sponsor:
        raise HTTPException(status_code=404, detail="Stall not found")

    scans_col = db.scanevents

    # ── Total footfall (unique students) ──
    unique_students = await scans_col.distinct("student_id", {"sponsor_id": sponsor_oid})
    total_footfall = len(unique_students)
    total_scans = await scans_col.count_documents({"sponsor_id": sponsor_oid})

    # ── Peak traffic hour ──
    peak_pipeline = [
        {"$match": {"sponsor_id": sponsor_oid}},
        {"$group": {"_id": {"$hour": "$timestamp"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    peak_result = await scans_col.aggregate(peak_pipeline).to_list(length=1)
    peak_hour = peak_result[0]["_id"] if peak_result else None

    # ── Demographics (group by major) ──
    demo_pipeline = [
        {"$match": {"sponsor_id": sponsor_oid}},
        {"$group": {"_id": "$student_id"}},
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": "$user"},
        {
            "$group": {
                "_id": "$user.demographics.major",
                "count": {"$sum": 1},
            }
        },
    ]
    demo_result = await scans_col.aggregate(demo_pipeline).to_list(length=50)
    demographics = {
        entry["_id"]: entry["count"]
        for entry in demo_result
        if entry["_id"] is not None
    }
    if not demographics:
        demographics = {"Unknown": total_footfall}

    # ── Cost per Interaction ──
    sponsorship_cost = sponsor.get("sponsorship_package_cost", 0)
    cpi = calculate_cpi(sponsorship_cost, total_scans)

    # ── Average Wait Time ──
    ts_cursor = scans_col.find(
        {"sponsor_id": sponsor_oid}, {"timestamp": 1}
    ).sort("timestamp", 1)
    timestamps = [doc["timestamp"] for doc in await ts_cursor.to_list(length=5000)]
    avg_wait = calculate_avg_wait_time(timestamps)

    # ── Cross Pollination ──
    cross_poll = await calculate_cross_pollination(stall_id, db)

    # ── Flash Sale Lift ──
    flash_scans = await scans_col.count_documents(
        {"sponsor_id": sponsor_oid, "is_flash_sale": True}
    )
    flash_lift = calculate_flash_sale_lift(flash_scans, total_scans)

    return AnalyticsResponse(
        stall_id=str(sponsor["_id"]),
        stall_name=sponsor.get("company_name", "Unknown"),
        total_footfall=total_footfall,
        peak_traffic_hour=peak_hour,
        demographics=demographics,
        cost_per_interaction=cpi,
        avg_wait_time=avg_wait,
        cross_pollination=cross_poll,
        flash_sale_lift=flash_lift,
    )


# ──────────────── GET /traffic/{stall_id} ─────────────────────────────


@router.get("/traffic/{stall_id}", response_model=list[HourlyTrafficEntry])
async def stall_hourly_traffic(stall_id: str):
    """
    Return per-hour scan counts (8 AM – 8 PM) for a stall.
    Uses real MongoDB aggregation; falls back to realistic mock data
    if no scans exist yet (safe for demo).
    """
    db = get_db()

    try:
        sponsor_oid = ObjectId(stall_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid stall_id format")

    # Aggregate scans by hour-of-day
    pipeline = [
        {"$match": {"sponsor_id": sponsor_oid}},
        {"$group": {"_id": {"$hour": "$timestamp"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    raw = await db.scanevents.aggregate(pipeline).to_list(length=24)
    hour_map: dict[int, int] = {r["_id"]: r["count"] for r in raw}

    # If no real data, generate a realistic mock bell-curve for the demo
    if not hour_map:
        base = [8, 15, 25, 40, 60, 80, 95, 110, 100, 85, 65, 40, 20]
        for idx, h in enumerate(range(8, 21)):
            noise = random.randint(-8, 8)
            hour_map[h] = max(0, base[idx] + noise)

    # Build the 8 AM–8 PM response (12 hours)
    labels = {
        8: "8 AM", 9: "9 AM", 10: "10 AM", 11: "11 AM",
        12: "12 PM", 13: "1 PM", 14: "2 PM", 15: "3 PM",
        16: "4 PM", 17: "5 PM", 18: "6 PM", 19: "7 PM", 20: "8 PM",
    }
    if hour_map:
        peak_hour_val = max(hour_map, key=lambda h: hour_map[h])
    else:
        peak_hour_val = 14

    entries = []
    for h in range(8, 21):
        entries.append(HourlyTrafficEntry(
            hour=h,
            label=labels[h],
            scans=hour_map.get(h, 0),
            is_peak=(h == peak_hour_val),
        ))
    return entries
