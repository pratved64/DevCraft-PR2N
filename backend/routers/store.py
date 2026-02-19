"""
EventFlow – Store Router
Redemption store: browse rewards, spend points for Pokémon merch & food.
Atomic MongoDB transactions for thread-safe redemptions.
"""

from __future__ import annotations

import secrets

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException
from pymongo import ReturnDocument

from database import get_db
from models import RedeemRequest, RedeemResponse, RewardItem

router = APIRouter(prefix="/api/store", tags=["Store"])


# ──────────────────── GET /rewards ────────────────────────────────────


@router.get("/rewards", response_model=list[RewardItem])
async def list_rewards(x_user_id: str = Header(default="")):
    """List all available rewards with stock and whether the user can afford each."""
    db = get_db()

    # Get user points
    user_points = 0
    user_legendaries = 0
    if x_user_id:
        try:
            user = await db.users.find_one({"_id": ObjectId(x_user_id)})
            if user:
                user_points = user.get("wallet", {}).get("total_points", 0)
                user_legendaries = user.get("wallet", {}).get("legendaries_caught", 0)
        except Exception:
            pass
    else:
        # Fallback: first user
        user = await db.users.find_one()
        if user:
            user_points = user.get("wallet", {}).get("total_points", 0)
            user_legendaries = user.get("wallet", {}).get("legendaries_caught", 0)

    rewards = await db.rewards.find().to_list(length=100)

    return [
        RewardItem(
            id=str(r["_id"]),
            item_name=r.get("item_name", "Unknown"),
            category=r.get("category", ""),
            cost_in_points=r.get("cost_in_points", 0),
            requires_legendary=r.get("requires_legendary", False),
            stock_remaining=r.get("stock_remaining", 0),
            affordable=(
                r.get("stock_remaining", 0) > 0
                and (
                    (
                        r.get("requires_legendary", False)
                        and user_legendaries > 0
                    )
                    or (
                        not r.get("requires_legendary", False)
                        and user_points >= r.get("cost_in_points", 0)
                    )
                )
            ),
        )
        for r in rewards
    ]


# ──────────────────── POST /redeem ────────────────────────────────────


@router.post("/redeem", response_model=RedeemResponse)
async def redeem_reward(body: RedeemRequest, x_user_id: str = Header(default="")):
    """
    Redeem a reward:
      1. Check user.wallet.total_points >= reward.cost_in_points
      2. Check reward.stock_remaining > 0
      3. Atomic: Deduct points, decrement stock, issue voucher code.
    """
    db = get_db()

    # Resolve user
    try:
        if x_user_id:
            user = await db.users.find_one({"_id": ObjectId(x_user_id)})
        else:
            user = await db.users.find_one()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Resolve reward
    try:
        reward = await db.rewards.find_one({"_id": ObjectId(body.reward_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reward_id format")

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    user_points = user.get("wallet", {}).get("total_points", 0)
    cost = reward.get("cost_in_points", 0)
    stock = reward.get("stock_remaining", 0)
    requires_legendary = reward.get("requires_legendary", False)
    user_legendaries = user.get("wallet", {}).get("legendaries_caught", 0)

    # ── Validation ──
    if requires_legendary:
        if user_legendaries <= 0:
            return RedeemResponse(
                success=False,
                message="This reward requires a Legendary Pokémon. You don't have one!",
                remaining_points=user_points,
                reward_stock_left=stock,
            )
    else:
        if user_points < cost:
            return RedeemResponse(
                success=False,
                message=f"Insufficient points. You have {user_points} but need {cost}.",
                remaining_points=user_points,
                reward_stock_left=stock,
            )

    if stock <= 0:
        return RedeemResponse(
            success=False,
            message=f"'{reward.get('item_name', 'Reward')}' is out of stock!",
            remaining_points=user_points,
            reward_stock_left=0,
        )

    # ── Atomic operations ──
    # 1. Decrement stock (only if > 0)
    stock_result = await db.rewards.find_one_and_update(
        {"_id": reward["_id"], "stock_remaining": {"$gt": 0}},
        {"$inc": {"stock_remaining": -1}},
        return_document=ReturnDocument.AFTER,
    )
    if not stock_result:
        return RedeemResponse(
            success=False,
            message="Race condition: item went out of stock.",
            remaining_points=user_points,
            reward_stock_left=0,
        )

    # 2. Deduct user points (or legendary count)
    if requires_legendary:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"wallet.legendaries_caught": -1}},
        )
    else:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"wallet.total_points": -cost}},
        )

    # 3. Generate voucher code
    voucher = f"EF-{secrets.token_hex(4).upper()}"

    updated_user = await db.users.find_one({"_id": user["_id"]})
    remaining = updated_user.get("wallet", {}).get("total_points", 0) if updated_user else 0

    return RedeemResponse(
        success=True,
        message=f"Successfully redeemed '{reward.get('item_name')}'! 🎉",
        remaining_points=remaining,
        reward_stock_left=stock_result.get("stock_remaining", 0),
        voucher_code=voucher,
    )
