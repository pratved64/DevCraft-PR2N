"""
EventFlow – Centralized Mock Auth
Accepts any token and returns user_id=1 for testing.
"""

from fastapi import Header


async def get_current_user(authorization: str = Header(default="Bearer mock-token")) -> int:
    """
    Mock authentication dependency.
    In production, this would decode a JWT and extract the user_id.
    For now, it accepts any token and always returns user_id=1.
    """
    # Simulate: any token → user_id 1
    return 1
