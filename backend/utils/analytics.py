"""
EventFlow – Analytics Utility Functions
ROI calculations, wait-time estimation, and cross-pollination metrics.
Uses Decimal for financial precision where appropriate.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


def calculate_cpi(sponsorship_cost: float, total_scans: int) -> Optional[float]:
    """
    Cost Per Interaction = sponsorship_package_cost / total_scans.
    Returns None if total_scans is 0.
    """
    if total_scans <= 0:
        return None
    cost = Decimal(str(sponsorship_cost))
    scans = Decimal(str(total_scans))
    cpi = (cost / scans).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return float(cpi)


def calculate_flash_sale_lift(flash_scans: int, total_scans: int) -> Optional[float]:
    """
    Flash Sale Lift = flash_sale_scans / total_scans.
    Returns percentage (0-100). None if no scans.
    """
    if total_scans <= 0:
        return None
    lift = Decimal(str(flash_scans)) / Decimal(str(total_scans)) * Decimal("100")
    return float(lift.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def calculate_avg_wait_time(timestamps: list[datetime]) -> Optional[str]:
    """
    Average Wait Time = mean time delta between consecutive scans.
    Returns a human-readable "Xm Ys" string.
    """
    if len(timestamps) < 2:
        return None
    sorted_ts = sorted(timestamps)
    diffs = [
        (sorted_ts[i + 1] - sorted_ts[i]).total_seconds()
        for i in range(len(sorted_ts) - 1)
    ]
    avg_seconds = sum(diffs) / len(diffs)
    minutes = int(avg_seconds // 60)
    seconds = int(avg_seconds % 60)
    return f"{minutes}m {seconds}s"


async def calculate_cross_pollination(
    sponsor_id: str, db: AsyncIOMotorDatabase
) -> Optional[float]:
    """
    Cross-Pollination: % of users who visited *this* stall AND at least one
    other stall.

    Uses a single aggregation pipeline (no N+1) for performance:
    1. Group all scan events by student_id, collecting distinct sponsor_ids.
    2. Filter to students who visited this stall.
    3. Count how many of those also visited at least one other stall.
    """
    oid = ObjectId(sponsor_id)
    scans_col = db.get_collection("scanevents")

    pipeline = [
        # Group by student → unique set of sponsors they visited
        {
            "$group": {
                "_id": "$student_id",
                "sponsors_visited": {"$addToSet": "$sponsor_id"},
            }
        },
        # Only keep students who visited this stall
        {"$match": {"sponsors_visited": oid}},
        # Project whether they visited any OTHER stall
        {
            "$project": {
                "visited_others": {
                    "$gt": [{"$size": "$sponsors_visited"}, 1]
                }
            }
        },
        # Summarise
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "cross": {"$sum": {"$cond": ["$visited_others", 1, 0]}},
            }
        },
    ]

    result = await scans_col.aggregate(pipeline).to_list(length=1)
    if not result or result[0]["total"] == 0:
        return None

    total = result[0]["total"]
    cross = result[0]["cross"]
    pct = Decimal(str(cross)) / Decimal(str(total)) * Decimal("100")
    return float(pct.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))
