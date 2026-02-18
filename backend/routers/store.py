"""
EventFlow – Store Router
Redemption store: browse rewards, spend points for Pokémon merch & food.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from mock_db import REWARDS, USERS
from models import RedeemRequest, RedeemResponse, RewardItem

router = APIRouter(prefix="/api/store", tags=["Store"])


# ──────────────────── GET /rewards ────────────────────────────────────

@router.get("/rewards", response_model=list[RewardItem])
async def list_rewards(user_id: int = Depends(get_current_user)):
    """List all available rewards with stock and whether the user can afford each."""
    user = USERS.get(user_id)
    user_points = user.points if user else 0

    return [
        RewardItem(
            id=r.id,
            type=r.type,
            name=r.name,
            description=r.description,
            cost=r.cost,
            stock_remaining=r.stock_remaining,
            affordable=(user_points >= r.cost and r.stock_remaining > 0),
        )
        for r in REWARDS.values()
    ]


# ──────────────────── POST /redeem ────────────────────────────────────

@router.post("/redeem", response_model=RedeemResponse)
async def redeem_reward(
    body: RedeemRequest,
    user_id: int = Depends(get_current_user),
):
    """
    Redeem a reward:
      1. Check user.points >= reward.cost
      2. Check reward.stock_remaining > 0
      3. Deduct points, decrement stock
    """
    user = USERS.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reward = REWARDS.get(body.reward_id)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    # Validation
    if user.points < reward.cost:
        return RedeemResponse(
            success=False,
            message=f"Insufficient points. You have {user.points} but need {reward.cost}.",
            remaining_points=user.points,
            reward_stock_left=reward.stock_remaining,
        )

    if reward.stock_remaining <= 0:
        return RedeemResponse(
            success=False,
            message=f"'{reward.name}' is out of stock!",
            remaining_points=user.points,
            reward_stock_left=0,
        )

    # Deduct & decrement
    user.points -= reward.cost
    reward.stock_remaining -= 1

    return RedeemResponse(
        success=True,
        message=f"Successfully redeemed '{reward.name}'! 🎉",
        remaining_points=user.points,
        reward_stock_left=reward.stock_remaining,
    )
