"""
EventFlow – General Router
Homepage: dynamic aggregate stats from in-memory data.
"""

from fastapi import APIRouter

from mock_db import STALLS, TRANSACTIONS, USERS
from models import StatsResponse

router = APIRouter(prefix="/api/general", tags=["General"])


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Return live aggregate event statistics from in-memory data."""

    total_attendees = len(USERS)
    total_stalls = len(STALLS)
    total_transactions = len(TRANSACTIONS)

    # Total pokemon caught across all users
    total_pokemon = sum(len(u.pokemon_dex) for u in USERS.values())
    legendary_count = sum(
        1
        for u in USERS.values()
        for entry in u.pokemon_dex
        if entry.get("rarity") == "Legendary"
    )

    # Top stall by visitor_count
    top_stall = max(STALLS.values(), key=lambda s: s.visitor_count)

    return StatsResponse(
        total_attendees=total_attendees,
        total_stalls=total_stalls,
        top_stall=top_stall.name,
        total_transactions=total_transactions,
        total_pokemon_caught=total_pokemon,
        legendary_count=legendary_count,
        highlight="⚡ Legendary Pokémon spawning at low-crowd stalls – explore now!",
    )
