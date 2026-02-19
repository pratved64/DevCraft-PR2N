"""
EventFlow – Game Router
Student gameplay: scan stalls, view history, leaderboard, stalls map,
notifications, and live heatmap via WebSocket.
All data sourced from MongoDB via async Motor.
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Header, Query, WebSocket, WebSocketDisconnect

from database import get_db
from models import (
    HistoryResponse,
    LeaderboardEntry,
    NotificationItem,
    PokemonInfo,
    ScanRequest,
    ScanResponse,
    StallInfo,
    serialize_doc,
)

router = APIRouter(prefix="/api/game", tags=["Game"])

# ──────────────────────── Pokémon Pools ────────────────────────────────

COMMON_POKEMON = [
    {"name": "Pikachu", "type": "Electric"},
    {"name": "Bulbasaur", "type": "Grass"},
    {"name": "Squirtle", "type": "Water"},
    {"name": "Eevee", "type": "Normal"},
    {"name": "Jigglypuff", "type": "Normal"},
    {"name": "Snorlax", "type": "Normal"},
    {"name": "Psyduck", "type": "Water"},
    {"name": "Magikarp", "type": "Water"},
    {"name": "Charmander", "type": "Fire"},
    {"name": "Rattata", "type": "Normal"},
]

LEGENDARY_POKEMON = [
    {"name": "Mewtwo", "type": "Psychic"},
    {"name": "Rayquaza", "type": "Dragon"},
    {"name": "Charizard", "type": "Fire"},
    {"name": "Dragonite", "type": "Dragon"},
    {"name": "Gengar", "type": "Ghost"},
    {"name": "Articuno", "type": "Ice"},
    {"name": "Zapdos", "type": "Electric"},
    {"name": "Moltres", "type": "Fire"},
    {"name": "Lugia", "type": "Psychic"},
    {"name": "Ho-Oh", "type": "Fire"},
]

LOW_TRAFFIC_THRESHOLD = 5  # < 5 scans in 10 min = Legendary
LEGENDARY_POINTS = 50
COMMON_POINTS = 10


# ──────────────────────── Helpers ──────────────────────────────────────


async def _recent_scan_count(db, sponsor_oid: ObjectId, minutes: int = 10) -> int:
    """Count scans at this sponsor in the last N minutes."""
    threshold = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    return await db.scanevents.count_documents(
        {"sponsor_id": sponsor_oid, "timestamp": {"$gte": threshold}}
    )


# ──────────────────────── GET /my-history ──────────────────────────────


@router.get("/my-history")
async def my_history(x_user_id: str = Header(default="")):
    """
    Return the authenticated user's pokedex (scan events) and total points.
    """
    db = get_db()

    # If a user id is given, try to look them up
    if x_user_id:
        try:
            user = await db.users.find_one({"_id": ObjectId(x_user_id)})
        except Exception:
            user = None
    else:
        # Fallback: return the first user in the DB for demo purposes
        user = await db.users.find_one()

    if not user:
        return HistoryResponse(
            user_id="",
            name="Guest",
            total_points=0,
            legendaries_caught=0,
            pokedex=[],
        )

    # Fetch the user's scan events (their pokedex)
    pokedex_ids = user.get("pokedex", [])
    scans = []
    if pokedex_ids:
        cursor = db.scanevents.find({"_id": {"$in": pokedex_ids}})
        scans = await cursor.to_list(length=500)

    return HistoryResponse(
        user_id=str(user["_id"]),
        name=user.get("name", "Unknown"),
        total_points=user.get("wallet", {}).get("total_points", 0),
        legendaries_caught=user.get("wallet", {}).get("legendaries_caught", 0),
        pokedex=[serialize_doc(s) for s in scans],
    )


# ──────────────────────── POST /scan ──────────────────────────────────


@router.post("/scan", response_model=ScanResponse)
async def scan_stall(body: ScanRequest, x_user_id: str = Header(default="")):
    """
    The Core Scan Loop:
      1. Count scans in last 10 min (Crowd Density).
      2. Rarity Algorithm: < LOW_TRAFFIC_THRESHOLD → Legendary + bonus pts.
      3. Flash Sale Trigger: low-traffic stall → is_flash_sale = True.
      4. Insert scan event, update user wallet & pokedex.
      5. If low traffic, update sponsor's current_pokemon_spawn to Legendary.
    """
    db = get_db()

    try:
        sponsor_oid = ObjectId(body.sponsor_id)
    except Exception:
        return ScanResponse(
            stall_name="Unknown",
            pokemon=PokemonInfo(name="MissingNo", type="Unknown", rarity="Normal"),
            visitor_count=0,
            is_flash_sale=False,
            points_earned=0,
        )

    sponsor = await db.sponsors.find_one({"_id": sponsor_oid})
    if not sponsor:
        return ScanResponse(
            stall_name="Unknown",
            pokemon=PokemonInfo(name="MissingNo", type="Unknown", rarity="Normal"),
            visitor_count=0,
            is_flash_sale=False,
            points_earned=0,
        )

    # 1. Crowd density
    recent_scans = await _recent_scan_count(db, sponsor_oid)
    is_legendary = recent_scans < LOW_TRAFFIC_THRESHOLD
    is_flash_sale = is_legendary

    # 2. Pick pokémon
    if is_legendary:
        poke = random.choice(LEGENDARY_POKEMON)
        rarity = "Legendary"
        points_earned = LEGENDARY_POINTS
    else:
        poke = random.choice(COMMON_POKEMON)
        rarity = "Normal"
        points_earned = COMMON_POINTS

    now = datetime.now(timezone.utc)

    # 3. Insert scan event
    try:
        student_oid = ObjectId(x_user_id) if x_user_id else None
    except Exception:
        student_oid = None

    scan_doc = {
        "student_id": student_oid,
        "sponsor_id": sponsor_oid,
        "timestamp": now,
        "pokemon_caught": {
            "name": poke["name"],
            "type": poke["type"],
            "rarity": rarity,
        },
        "points_awarded": points_earned,
        "is_flash_sale": is_flash_sale,
        "sync_status": True,
    }
    result = await db.scanevents.insert_one(scan_doc)
    scan_event_id = result.inserted_id

    # 4. Update user wallet & pokedex
    if student_oid:
        try:
            update_fields: dict = {
                "$inc": {"wallet.total_points": points_earned},
                "$push": {"pokedex": scan_event_id},
            }
            if is_legendary:
                update_fields["$inc"]["wallet.legendaries_caught"] = 1

            await db.users.update_one(
                {"_id": student_oid}, update_fields
            )
        except Exception:
            pass  # Non-critical: user might not exist yet

    # 5. If low traffic, update sponsor's pokemon spawn
    if is_legendary:
        await db.sponsors.update_one(
            {"_id": sponsor_oid},
            {
                "$set": {
                    "current_pokemon_spawn.name": poke["name"],
                    "current_pokemon_spawn.rarity": "Legendary",
                    "current_pokemon_spawn.active_until": now + timedelta(hours=1),
                }
            },
        )

    # Total scans for this sponsor (for visitor_count)
    total_scans = await db.scanevents.count_documents({"sponsor_id": sponsor_oid})

    return ScanResponse(
        stall_name=sponsor.get("company_name", "Unknown"),
        pokemon=PokemonInfo(name=poke["name"], type=poke["type"], rarity=rarity),
        visitor_count=total_scans,
        is_flash_sale=is_flash_sale,
        points_earned=points_earned,
    )


# ──────────────────────── GET /leaderboard ────────────────────────────


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    filter: str | None = Query(default=None, description="Pass 'friends' to filter"),
    x_user_id: str = Header(default=""),
):
    """
    Leaderboard ranked by total_points.
    ?filter=friends → returns the current user + 5 mock rivals for demo purposes.
    """
    db = get_db()

    pipeline = [
        {"$sort": {"wallet.total_points": -1}},
        {"$limit": 50},
        {
            "$project": {
                "name": 1,
                "wallet": 1,
                "pokedex": 1,
            }
        },
    ]

    cursor = db.users.aggregate(pipeline)
    users = await cursor.to_list(length=50)

    if filter == "friends" and x_user_id:
        # Demo strategy: find the current user and inject 5 realistic mock rivals
        # around their rank so the friends leaderboard looks populated.
        MOCK_FRIEND_NAMES = ["ASH K.", "MISTY W.", "BROCK S.", "GARY O.", "DAWN P."]
        MOCK_FRIEND_SPRITES = [25, 120, 74, 6, 393]  # Pokédex IDs for avatars

        # Locate current user in the sorted list
        current_user_entry = None
        for i, u in enumerate(users):
            if str(u["_id"]) == x_user_id:
                user_pts = u.get("wallet", {}).get("total_points", 0)
                current_user_entry = LeaderboardEntry(
                    rank=1,
                    user_id=str(u["_id"]),
                    name=u.get("name", "YOU").split()[0].upper()[:8],
                    points=user_pts,
                    pokemon_count=len(u.get("pokedex", [])),
                    legendaries_caught=u.get("wallet", {}).get("legendaries_caught", 0),
                )
                break

        if not current_user_entry and users:
            u = users[0]
            user_pts = u.get("wallet", {}).get("total_points", 0)
            current_user_entry = LeaderboardEntry(
                rank=1,
                user_id=str(u["_id"]),
                name=u.get("name", "YOU").split()[0].upper()[:8],
                points=user_pts,
                pokemon_count=len(u.get("pokedex", [])),
                legendaries_caught=u.get("wallet", {}).get("legendaries_caught", 0),
            )
        elif not current_user_entry:
            current_user_entry = LeaderboardEntry(
                rank=3, user_id=x_user_id, name="YOU",
                points=420, pokemon_count=8, legendaries_caught=1,
            )

        base_pts = current_user_entry.points
        base_count = current_user_entry.pokemon_count

        # Build a small friends board with the current user sandwiched in rank 3
        friends_board = [
            LeaderboardEntry(rank=1, user_id="f1", name=MOCK_FRIEND_NAMES[0],
                             points=base_pts + random.randint(200, 800),
                             pokemon_count=base_count + random.randint(3, 10),
                             legendaries_caught=random.randint(1, 4)),
            LeaderboardEntry(rank=2, user_id="f2", name=MOCK_FRIEND_NAMES[1],
                             points=base_pts + random.randint(50, 199),
                             pokemon_count=base_count + random.randint(1, 4),
                             legendaries_caught=random.randint(0, 2)),
            LeaderboardEntry(rank=3, **{k: v for k, v in current_user_entry.model_dump().items() if k != "rank"}),
            LeaderboardEntry(rank=4, user_id="f3", name=MOCK_FRIEND_NAMES[2],
                             points=max(0, base_pts - random.randint(50, 200)),
                             pokemon_count=max(0, base_count - random.randint(1, 3)),
                             legendaries_caught=random.randint(0, 1)),
            LeaderboardEntry(rank=5, user_id="f4", name=MOCK_FRIEND_NAMES[3],
                             points=max(0, base_pts - random.randint(200, 500)),
                             pokemon_count=max(0, base_count - random.randint(3, 7)),
                             legendaries_caught=0),
            LeaderboardEntry(rank=6, user_id="f5", name=MOCK_FRIEND_NAMES[4],
                             points=max(0, base_pts - random.randint(500, 900)),
                             pokemon_count=max(0, base_count - random.randint(5, 10)),
                             legendaries_caught=0),
        ]
        return friends_board

    # ── Default: global leaderboard ──
    entries = []
    for i, u in enumerate(users):
        entries.append(
            LeaderboardEntry(
                rank=i + 1,
                user_id=str(u["_id"]),
                name=u.get("name", "Unknown"),
                points=u.get("wallet", {}).get("total_points", 0),
                pokemon_count=len(u.get("pokedex", [])),
                legendaries_caught=u.get("wallet", {}).get("legendaries_caught", 0),
            )
        )

    return entries


# ──────────────────────── GET /stalls ─────────────────────────────────


@router.get("/stalls", response_model=list[StallInfo])
async def list_stalls():
    """
    List all sponsors with live crowd level and current pokemon spawn.
    Uses a single aggregation to batch all scan counts — no N+1.
    """
    db = get_db()

    sponsors = await db.sponsors.find().to_list(length=100)
    sponsor_oids = [sp["_id"] for sp in sponsors]

    # ── Batch: total scans per stall (all-time) ──
    total_pipeline = [
        {"$match": {"sponsor_id": {"$in": sponsor_oids}}},
        {"$group": {"_id": "$sponsor_id", "count": {"$sum": 1}}},
    ]
    total_results = await db.scanevents.aggregate(total_pipeline).to_list(length=200)
    total_map: dict = {r["_id"]: r["count"] for r in total_results}

    # ── Batch: recent scans per stall (last 10 min) ──
    threshold = datetime.now(timezone.utc) - timedelta(minutes=10)
    recent_pipeline = [
        {"$match": {"sponsor_id": {"$in": sponsor_oids}, "timestamp": {"$gte": threshold}}},
        {"$group": {"_id": "$sponsor_id", "count": {"$sum": 1}}},
    ]
    recent_results = await db.scanevents.aggregate(recent_pipeline).to_list(length=200)
    recent_map: dict = {r["_id"]: r["count"] for r in recent_results}

    result = []
    for sp in sponsors:
        sp_oid = sp["_id"]
        scan_count = recent_map.get(sp_oid, 0)
        total_count = total_map.get(sp_oid, 0)

        if scan_count < 5:
            crowd_level = "Low"
        elif scan_count < 20:
            crowd_level = "Medium"
        else:
            crowd_level = "High"

        spawn = sp.get("current_pokemon_spawn", {})

        result.append(
            StallInfo(
                stall_id=str(sp_oid),
                company_name=sp.get("company_name", "Unknown"),
                category=sp.get("category", ""),
                map_location=sp.get("map_location", {"x_coord": 0, "y_coord": 0}),
                current_pokemon_spawn={
                    "name": spawn.get("name", "Ditto"),
                    "rarity": spawn.get("rarity", "Normal"),
                },
                crowd_level=crowd_level,
                scan_count_10m=scan_count,
                total_scan_count=total_count,
            )
        )

    return result


# ──────────────────────── GET /notifications ──────────────────────────


@router.get("/notifications", response_model=list[NotificationItem])
async def notifications():
    """
    Return alerts for legendary Pokémon opportunities at low-crowd stalls.
    """
    db = get_db()
    sponsors = await db.sponsors.find().to_list(length=100)

    alerts: list[NotificationItem] = []
    for sp in sponsors:
        scan_count = await _recent_scan_count(db, sp["_id"])
        if scan_count < LOW_TRAFFIC_THRESHOLD:
            alerts.append(
                NotificationItem(
                    stall_id=str(sp["_id"]),
                    stall_name=sp.get("company_name", "Unknown"),
                    message=f"🔥 Legendary Pokémon spotted at {sp.get('company_name')}! Low crowd – head there now!",
                    type="legendary_alert",
                )
            )

    if not alerts:
        alerts.append(
            NotificationItem(
                stall_id="",
                stall_name="EventFlow",
                message="🎉 All stalls are buzzing! Keep scanning to earn more points.",
                type="info",
            )
        )

    return alerts


# ──────────────────────── WS /heatmap ─────────────────────────────────


@router.websocket("/heatmap")
async def heatmap(websocket: WebSocket):
    """Broadcast live crowd heatmap data for each sponsor every 30s."""
    await websocket.accept()
    try:
        while True:
            db = get_db()
            sponsors = await db.sponsors.find().to_list(length=100)
            sponsor_oids = [sp["_id"] for sp in sponsors]

            # Batch: total scans per stall (all-time) for leaderboard bars
            total_pipeline = [
                {"$match": {"sponsor_id": {"$in": sponsor_oids}}},
                {"$group": {"_id": "$sponsor_id", "count": {"$sum": 1}}},
            ]
            total_results = await db.scanevents.aggregate(total_pipeline).to_list(length=200)
            total_map: dict = {r["_id"]: r["count"] for r in total_results}

            data = []
            for sp in sponsors:
                sp_oid = sp["_id"]
                recent_count = await _recent_scan_count(db, sp_oid, minutes=30)
                total_count = total_map.get(sp_oid, 0)
                loc = sp.get("map_location", {})

                if recent_count < 5:
                    crowd = "Low"
                elif recent_count < 20:
                    crowd = "Medium"
                else:
                    crowd = "High"

                data.append(
                    {
                        "stall_id": str(sp_oid),
                        "stall_name": sp.get("company_name", ""),
                        "x": loc.get("x_coord", 0),
                        "y": loc.get("y_coord", 0),
                        "scan_count": total_count,     # all-time for the leaderboard bar
                        "recent_scan_count": recent_count,  # 30-min for crowd level
                        "crowd_level": crowd,
                        "legendary_available": crowd == "Low",
                    }
                )

            await websocket.send_json(
                {
                    "heatmap": data,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        pass
