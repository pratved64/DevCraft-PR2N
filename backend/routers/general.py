"""
EventFlow – General Router
Homepage: dynamic aggregate stats from MongoDB.
"""

from fastapi import APIRouter

from database import get_db
from models import StatsResponse

router = APIRouter(prefix="/api/general", tags=["General"])


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Return live aggregate event statistics from MongoDB."""
    db = get_db()

    total_attendees = await db.users.count_documents({})
    total_sponsors = await db.sponsors.count_documents({})
    total_scans = await db.scanevents.count_documents({})

    # Legendary count
    legendary_count = await db.scanevents.count_documents(
        {"pokemon_caught.rarity": "Legendary"}
    )

    # Top stall: sponsor with the most scans
    top_pipeline = [
        {"$group": {"_id": "$sponsor_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
        {
            "$lookup": {
                "from": "sponsors",
                "localField": "_id",
                "foreignField": "_id",
                "as": "sponsor",
            }
        },
        {"$unwind": {"path": "$sponsor", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "_id": 0,
                "company_name": "$sponsor.company_name",
                "count": 1,
            }
        },
    ]
    cursor = db.scanevents.aggregate(top_pipeline)
    top_result = await cursor.to_list(length=1)
    top_stall = top_result[0]["company_name"] if top_result else "N/A"

    return StatsResponse(
        total_attendees=total_attendees,
        total_sponsors=total_sponsors,
        total_scans=total_scans,
        top_stall=top_stall,
        legendary_count=legendary_count,
        highlight="⚡ Legendary Pokémon spawning at low-crowd stalls – explore now!",
    )
