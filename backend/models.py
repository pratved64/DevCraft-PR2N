"""
EventFlow – Pydantic Models
All domain models and request/response schemas.
Pokemon-themed event management platform.

NOTE: These are Pydantic schemas for FastAPI validation & serialisation.
The actual persistence layer is MongoDB via Motor (no ORM – raw async queries).
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ──────────────────────────── Serialisation Helpers ─────────────────────

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-safe dict (ObjectId → str, datetime → ISO)."""
    if doc is None:
        return {}
    doc = dict(doc)
    for key, val in doc.items():
        if hasattr(val, '__str__') and type(val).__name__ == 'ObjectId':
            doc[key] = str(val)
        elif hasattr(val, 'isoformat'):  # datetime
            doc[key] = val.isoformat()
        elif isinstance(val, dict):
            doc[key] = serialize_doc(val)
        elif isinstance(val, list):
            doc[key] = [
                serialize_doc(v) if isinstance(v, dict)
                else (str(v) if type(v).__name__ == 'ObjectId' else v)
                for v in val
            ]
    return doc


# ──────────────────────────── Request Schemas ──────────────────────────


class ScanRequest(BaseModel):
    sponsor_id: str  # MongoDB ObjectId as string


class ScanCandidateRequest(BaseModel):
    user_id: str


class RedeemRequest(BaseModel):
    reward_id: str


# ──────────────────────────── Response Schemas ─────────────────────────


class PokemonInfo(BaseModel):
    name: str
    type: str
    rarity: str  # "Normal" | "Legendary"


class ScanResponse(BaseModel):
    stall_name: str
    pokemon: PokemonInfo
    visitor_count: int
    is_flash_sale: bool
    points_earned: int


class ScanCandidateResponse(BaseModel):
    user_id: str
    name: str
    email: str
    demographics: dict
    resume_url: Optional[str] = None
    skills: list[str] = Field(default_factory=list)


class LeaderboardEntry(BaseModel):
    rank: int = 0
    user_id: str
    name: str
    points: int
    pokemon_count: int
    legendaries_caught: int


class StallInfo(BaseModel):
    """Used for event map / stall listing."""
    stall_id: str
    company_name: str
    category: str
    map_location: dict
    current_pokemon_spawn: dict
    crowd_level: str  # "Low" | "Medium" | "High"
    scan_count_10m: int
    total_scan_count: int = 0  # All-time scans for this stall


class NotificationItem(BaseModel):
    stall_id: str
    stall_name: str
    message: str
    type: str  # "legendary_alert" | "flash_sale" | "info"


class AnalyticsResponse(BaseModel):
    stall_id: str
    stall_name: str
    total_footfall: int
    peak_traffic_hour: Optional[int] = None
    demographics: dict
    cost_per_interaction: Optional[float] = None
    avg_wait_time: Optional[str] = None
    cross_pollination: Optional[float] = None
    flash_sale_lift: Optional[float] = None


class RedeemResponse(BaseModel):
    success: bool
    message: str
    remaining_points: int = 0
    reward_stock_left: int = 0
    voucher_code: Optional[str] = None


class RewardItem(BaseModel):
    """For the rewards listing endpoint."""
    id: str
    item_name: str
    category: str
    cost_in_points: int
    requires_legendary: bool
    stock_remaining: int
    affordable: bool  # Can the current user afford it?


class TopStallEntry(BaseModel):
    stall_id: str
    company_name: str
    category: str
    scan_count: int


class HourlyTrafficEntry(BaseModel):
    hour: int          # 0-23
    label: str         # "8 AM", "9 AM", …
    scans: int
    is_peak: bool


class StatsResponse(BaseModel):
    total_attendees: int
    total_sponsors: int
    total_scans: int
    top_stall: Optional[str] = None
    top_stalls: list["TopStallEntry"] = Field(default_factory=list)
    legendary_count: int
    highlight: str


class HistoryResponse(BaseModel):
    user_id: str
    name: str
    total_points: int
    legendaries_caught: int
    pokedex: list[dict]
