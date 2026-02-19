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

    Pipeline:
    1. Collect distinct student_ids who scanned this sponsor.
    2. For each of those students, check if they have scans at other sponsors.
    3. Return (students_with_other_stalls / total_students * 100).
    """
    oid = ObjectId(sponsor_id)
    scans_col = db.get_collection("scanevents")

    # 1. Unique students at this stall
    visitor_ids = await scans_col.distinct("student_id", {"sponsor_id": oid})
    if not visitor_ids:
        return None

    # 2. How many of those students also visited elsewhere?
    cross_count = 0
    for student_id in visitor_ids:
        other = await scans_col.find_one(
            {"student_id": student_id, "sponsor_id": {"$ne": oid}}
        )
        if other:
            cross_count += 1

    pct = Decimal(str(cross_count)) / Decimal(str(len(visitor_ids))) * Decimal("100")
    return float(pct.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))
