"""
EventFlow – General Router
Homepage: dynamic aggregate stats from MongoDB.
"""

from fastapi import APIRouter

from database import get_db
from models import StatsResponse, TopStallEntry

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

    # Top 5 stalls by total scan count
    top_pipeline = [
        {"$group": {"_id": "$sponsor_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
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
                "stall_id": {"$toString": "$_id"},
                "company_name": "$sponsor.company_name",
                "category": "$sponsor.category",
                "scan_count": "$count",
            }
        },
    ]
    cursor = db.scanevents.aggregate(top_pipeline)
    top_results = await cursor.to_list(length=5)

    top_stalls = [
        TopStallEntry(
            stall_id=r.get("stall_id", ""),
            company_name=r.get("company_name") or "Unknown",
            category=r.get("category") or "",
            scan_count=r.get("scan_count", 0),
        )
        for r in top_results
    ]
    # ── Fallback: if no scan events yet, list all sponsors with count=0 ──
    if not top_stalls:
        sponsors_cursor = db.sponsors.find()
        all_sponsors = await sponsors_cursor.to_list(length=5)
        top_stalls = [
            TopStallEntry(
                stall_id=str(sp["_id"]),
                company_name=sp.get("company_name") or "Unknown Stall",
                category=sp.get("category") or "",
                scan_count=0,
            )
            for sp in all_sponsors
        ]

    top_stall_name = top_stalls[0].company_name if top_stalls else "N/A"

    return StatsResponse(
        total_attendees=total_attendees,
        total_sponsors=total_sponsors,
        total_scans=total_scans,
        top_stall=top_stall_name,
        top_stalls=top_stalls,
        legendary_count=legendary_count,
        highlight="⚡ Legendary Pokémon spawning at low-crowd stalls – explore now!",
    )
