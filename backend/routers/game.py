"""
EventFlow – Game Router
Student gameplay: scan stalls, view history, leaderboard, stalls map,
notifications, and live heatmap via WebSocket.
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from auth import get_current_user
from mock_db import STALLS, TRANSACTIONS, USERS
from models import (
    LeaderboardEntry,
    NotificationItem,
    ScanRequest,
    ScanResponse,
    StallInfo,
    Transaction,
)

router = APIRouter(prefix="/api/game", tags=["Game"])


# ──────────────────────── Helpers ──────────────────────────────────────

COMMON_POKEMON = [
    "Pikachu", "Bulbasaur", "Squirtle", "Eevee", "Jigglypuff",
    "Snorlax", "Psyduck", "Togepi", "Magikarp", "Ditto",
]

LEGENDARY_POKEMON = [
    "Mewtwo", "Rayquaza", "Charizard", "Dragonite", "Gengar",
    "Articuno", "Zapdos", "Moltres", "Lugia", "Ho-Oh",
]


def _get_crowd_threshold() -> float:
    """Bottom 40th-percentile visitor_count = low crowd threshold."""
    counts = sorted(s.visitor_count for s in STALLS.values())
    idx = max(0, int(len(counts) * 0.4) - 1)
    return counts[idx]


def _stall_wait_time(stall) -> float:
    """Mock wait time in minutes derived from recent scan frequency."""
    if len(stall.visit_timestamps) < 2:
        return round(random.uniform(1.0, 3.0), 1)
    sorted_ts = sorted(stall.visit_timestamps)
    recent = sorted_ts[-5:]  # last 5 scans
    if len(recent) >= 2:
        diffs = [(recent[i + 1] - recent[i]).total_seconds() for i in range(len(recent) - 1)]
        avg_gap = sum(diffs) / len(diffs)
        # More frequent scans → longer wait
        return round(min(avg_gap / 60, 30.0), 1)
    return round(random.uniform(2.0, 8.0), 1)


def _crowd_level(stall) -> str:
    threshold = _get_crowd_threshold()
    if stall.visitor_count <= threshold:
        return "Low"
    elif stall.visitor_count <= threshold * 2:
        return "Medium"
    return "High"


# ──────────────────────── GET /my-history ──────────────────────────────

@router.get("/my-history")
async def my_history(user_id: int = Depends(get_current_user)):
    """Return the current user's pokemon_dex; grouped by stall."""
    user = USERS.get(user_id)
    if not user:
        return {"error": "User not found"}

    legendary_count = sum(1 for p in user.pokemon_dex if p.get("rarity") == "Legendary")
    common_count = sum(1 for p in user.pokemon_dex if p.get("rarity") == "Common")
    unique_stalls = len({p["stall_id"] for p in user.pokemon_dex})

    return {
        "user_id": user.id,
        "name": user.name,
        "points": user.points,
        "pokemon_dex": user.pokemon_dex,
        "total_pokemon": len(user.pokemon_dex),
        "legendary_count": legendary_count,
        "common_count": common_count,
        "unique_stalls_visited": unique_stalls,
    }


# ──────────────────────── POST /scan ──────────────────────────────────

@router.post("/scan", response_model=ScanResponse)
async def scan_stall(body: ScanRequest, user_id: int = Depends(get_current_user)):
    """
    Scan a stall QR code to claim a Pokémon:
      1. Increment visitor_count & append timestamp
      2. Low-crowd stalls (bottom 40%) → Legendary Pokémon + 25 pts
      3. Other stalls → Common Pokémon + 10 pts
    """
    stall = STALLS.get(body.stall_id)
    if not stall:
        return ScanResponse(
            stall_name="Unknown",
            pokemon_name="MissingNo",
            pokemon_type="Common",
            visitor_count=0,
            is_flash_sale=False,
            points_earned=0,
        )

    # 1: Update stall
    stall.visitor_count += 1
    now = datetime.now()
    stall.visit_timestamps.append(now)

    # 2: Determine rarity — low crowd = Legendary
    threshold = _get_crowd_threshold()
    is_legendary = stall.visitor_count <= threshold
    is_flash_sale = is_legendary

    if is_legendary:
        pokemon_name = random.choice(LEGENDARY_POKEMON)
        rarity = "Legendary"
        points_earned = 25
    else:
        pokemon_name = random.choice(COMMON_POKEMON)
        rarity = "Common"
        points_earned = 10

    # Record transaction
    tx = Transaction(
        user_id=user_id,
        stall_id=stall.id,
        timestamp=now,
        is_flash_sale=is_flash_sale,
        pokemon_name=pokemon_name,
        rarity=rarity,
    )
    TRANSACTIONS.append(tx)

    # Add to user's pokemon_dex
    user = USERS.get(user_id)
    if user:
        user.pokemon_dex.append({
            "stall_id": stall.id,
            "stall_name": stall.name,
            "pokemon": pokemon_name,
            "rarity": rarity,
            "visited_at": str(now),
        })
        user.points += points_earned

    return ScanResponse(
        stall_name=stall.name,
        pokemon_name=pokemon_name,
        pokemon_type=rarity,
        visitor_count=stall.visitor_count,
        is_flash_sale=is_flash_sale,
        points_earned=points_earned,
    )


# ──────────────────────── GET /leaderboard ────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    filter: str | None = Query(default=None, description="Pass 'friends' to filter"),
    user_id: int = Depends(get_current_user),
):
    """
    Leaderboard ranked by points.
    Includes pokemon_count and stalls_visited for comparison.
    ?filter=friends → only friends + self.
    """
    if filter == "friends":
        current_user = USERS.get(user_id)
        if not current_user:
            return []
        friend_ids = set(current_user.friends) | {user_id}
        pool = [u for uid, u in USERS.items() if uid in friend_ids]
    else:
        pool = list(USERS.values())

    pool.sort(key=lambda u: u.points, reverse=True)

    return [
        LeaderboardEntry(
            rank=i + 1,
            user_id=u.id,
            name=u.name,
            points=u.points,
            pokemon_count=len(u.pokemon_dex),
            stalls_visited=len({p["stall_id"] for p in u.pokemon_dex}),
        )
        for i, u in enumerate(pool)
    ]


# ──────────────────────── GET /stalls ─────────────────────────────────

@router.get("/stalls", response_model=list[StallInfo])
async def list_stalls(user_id: int = Depends(get_current_user)):
    """
    List all stalls with live crowd level, wait time, and legendary availability.
    Used for the event map view.
    """
    result = []
    for stall in STALLS.values():
        crowd = _crowd_level(stall)
        result.append(StallInfo(
            stall_id=stall.id,
            name=stall.name,
            is_hiring=stall.is_hiring,
            visitor_count=stall.visitor_count,
            crowd_level=crowd,
            wait_time_minutes=_stall_wait_time(stall),
            legendary_available=(crowd == "Low"),
            map_x=stall.map_x,
            map_y=stall.map_y,
        ))
    return result


# ──────────────────────── GET /notifications ──────────────────────────

@router.get("/notifications", response_model=list[NotificationItem])
async def notifications(user_id: int = Depends(get_current_user)):
    """
    Return alerts for legendary Pokémon opportunities at low-crowd stalls.
    """
    alerts: list[NotificationItem] = []
    for stall in STALLS.values():
        if _crowd_level(stall) == "Low":
            alerts.append(NotificationItem(
                stall_id=stall.id,
                stall_name=stall.name,
                message=f"🔥 Legendary Pokémon spotted at {stall.name}! Low crowd – head there now!",
                type="legendary_alert",
            ))
    if not alerts:
        alerts.append(NotificationItem(
            stall_id=0,
            stall_name="EventFlow",
            message="🎉 All stalls are buzzing! Keep scanning to earn more points.",
            type="info",
        ))
    return alerts


# ──────────────────────── WS /heatmap ─────────────────────────────────

@router.websocket("/heatmap")
async def heatmap(websocket: WebSocket):
    """Broadcast live crowd heatmap + wait times for each stall every 3s."""
    await websocket.accept()
    try:
        while True:
            data = []
            for stall in STALLS.values():
                crowd = _crowd_level(stall)
                data.append({
                    "stall_id": stall.id,
                    "stall_name": stall.name,
                    "visitor_count": stall.visitor_count,
                    "intensity": random.randint(1, 100),
                    "crowd_level": crowd,
                    "wait_time_minutes": _stall_wait_time(stall),
                    "legendary_available": crowd == "Low",
                    "map_x": stall.map_x,
                    "map_y": stall.map_y,
                })
            await websocket.send_json({
                "heatmap": data,
                "timestamp": str(datetime.now()),
            })
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass
