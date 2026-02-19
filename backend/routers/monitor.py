"""
EventFlow – Monitor Router
Organizer "God Mode" dashboard: security/fraud alerts.
Pulls from the fraud_alerts collection (written by the fraud engine).
Falls back to mock data if no alerts exist yet (safe for demo).
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from database import get_db

router = APIRouter(prefix="/api/monitor", tags=["Monitor"])


@router.get("/alerts")
async def get_alerts():
    """
    Return recent fraud/security alerts for the organizer dashboard.
    Returns real alerts from MongoDB if available, otherwise demo data.
    """
    db = get_db()

    raw = await db.fraud_alerts.find().sort("timestamp", -1).limit(20).to_list(length=20)

    if raw:
        alerts = []
        for i, doc in enumerate(raw):
            ts = doc.get("timestamp")
            if isinstance(ts, datetime):
                time_str = ts.astimezone(timezone.utc).strftime("%H:%M")
            else:
                time_str = "—"
            alerts.append(
                {
                    "id": i + 1,
                    "user": doc.get("user_id", f"User_{i + 1}"),
                    "reason": doc.get("reason", "Suspicious activity detected"),
                    "time": time_str,
                }
            )
        return alerts

    # Demo fallback – realistic mock data so the UI is never empty
    return [
        {
            "id": 1,
            "user": "User_992",
            "reason": "Velocity Check (>3 scans/10s)",
            "time": "14:32",
        },
        {
            "id": 2,
            "user": "User_104",
            "reason": "Duplicate Resume Drop",
            "time": "13:15",
        },
        {
            "id": 3,
            "user": "User_337",
            "reason": "Rapid Badge Clone Attempt",
            "time": "11:48",
        },
    ]
