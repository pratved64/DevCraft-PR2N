"""
EventFlow – Pydantic Models
All domain models and request/response schemas.
Pokemon-themed event management platform.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ──────────────────────────── Domain Models ────────────────────────────


class User(BaseModel):
    id: int
    name: str
    department: str = "CS"  # CS, IT, DevOps, ECE, etc.
    resume_url: str = ""
    skills: list[str] = Field(default_factory=list)
    friends: list[int] = Field(default_factory=list)
    points: int = 0
    pokemon_dex: list[dict] = Field(default_factory=list)
    # Each entry: {"stall_id": int, "stall_name": str, "pokemon": str, "rarity": str, "visited_at": str}


class Stall(BaseModel):
    id: int
    name: str
    is_hiring: bool = False
    sponsorship_amount: float = 0.0
    visitor_count: int = 0
    visit_timestamps: list[datetime] = Field(default_factory=list)
    # Map coordinates for event map (mock x,y percentages)
    map_x: float = 50.0
    map_y: float = 50.0


class Transaction(BaseModel):
    user_id: int
    stall_id: int
    timestamp: datetime
    is_flash_sale: bool = False
    pokemon_name: str = ""
    rarity: str = "Common"


class Reward(BaseModel):
    id: int
    type: str  # "food" | "merch" | "discount"
    name: str
    description: str = ""
    cost: int
    stock_remaining: int


# ──────────────────────────── Request Schemas ──────────────────────────


class ScanRequest(BaseModel):
    stall_id: int


class ScanCandidateRequest(BaseModel):
    user_id: int


class RedeemRequest(BaseModel):
    reward_id: int


# ──────────────────────────── Response Schemas ─────────────────────────


class ScanResponse(BaseModel):
    stall_name: str
    pokemon_name: str
    pokemon_type: str  # "Legendary" | "Common"
    visitor_count: int
    is_flash_sale: bool
    points_earned: int


class ScanCandidateResponse(BaseModel):
    user_id: int
    name: str
    department: str
    resume_url: str
    skills: list[str]


class LeaderboardEntry(BaseModel):
    rank: int = 0
    user_id: int
    name: str
    points: int
    pokemon_count: int
    stalls_visited: int


class StallInfo(BaseModel):
    """Used for event map / stall listing."""
    stall_id: int
    name: str
    is_hiring: bool
    visitor_count: int
    crowd_level: str  # "Low" | "Medium" | "High"
    wait_time_minutes: float
    legendary_available: bool
    map_x: float
    map_y: float


class NotificationItem(BaseModel):
    stall_id: int
    stall_name: str
    message: str
    type: str  # "legendary_alert" | "flash_sale" | "info"


class AnalyticsResponse(BaseModel):
    stall_id: int
    stall_name: str
    total_footfall: int
    peak_traffic_hour: int
    demographics: dict
    scan_rate_pct: float
    cost_per_interaction: Optional[float] = None
    avg_wait_time: Optional[str] = None
    cross_pollination: str = "30% also visited another stall"
    flash_sale_lift: str = "15% increase"


class RedeemResponse(BaseModel):
    success: bool
    message: str
    remaining_points: int = 0
    reward_stock_left: int = 0


class RewardItem(BaseModel):
    """For the rewards listing endpoint."""
    id: int
    type: str
    name: str
    description: str
    cost: int
    stock_remaining: int
    affordable: bool  # Can the current user afford it?


class StatsResponse(BaseModel):
    total_attendees: int
    total_stalls: int
    top_stall: str
    total_transactions: int
    total_pokemon_caught: int
    legendary_count: int
    highlight: str
