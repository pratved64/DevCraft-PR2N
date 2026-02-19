"""
EventFlow – Centralized Mock Auth
Accepts any token and returns a fixed user_id for testing.
In production, decode a real JWT here.
"""

from fastapi import Header


async def get_current_user(
    authorization: str = Header(default="Bearer mock-token"),
) -> str:
    """
    Mock authentication dependency.
    In production, this would decode a JWT and extract the user_id (ObjectId string).
    For now, it accepts any token and always returns a placeholder user_id.
    The frontend can override this by sending a real user _id in the header.
    """
    # Allow the frontend to pass a real user _id via "X-User-Id" header
    # (quick hack for demo; in production, parse the JWT instead)
    return "mock-user"


async def get_current_user_id(
    x_user_id: str = Header(default=""),
    authorization: str = Header(default="Bearer mock-token"),
) -> str | None:
    """
    Extract user id from the X-User-Id header.
    Returns the id string or None if not provided.
    """
    return x_user_id if x_user_id else None
