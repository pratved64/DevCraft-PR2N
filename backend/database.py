"""
EventFlow – Async MongoDB Connection
Uses Motor async driver to connect to MongoDB Atlas.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "test")


class _Database:
    """Singleton container for the Motor client and database handle."""
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


_store = _Database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Opens the Motor connection pool on startup and closes it on shutdown.
    """
    print("🚀 Starting up: Connecting to MongoDB Atlas...")
    _store.client = AsyncIOMotorClient(MONGODB_URI)
    _store.db = _store.client.get_database(DB_NAME)

    # Quick connectivity test
    try:
        await _store.client.admin.command("ping")
        print("✅ MongoDB connection established")
    except Exception as exc:
        print(f"❌ MongoDB connection failed: {exc}")

    yield

    print("🛑 Shutting down: Closing MongoDB connection...")
    if _store.client:
        _store.client.close()


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database handle. Must be called after startup."""
    if _store.db is None:
        raise RuntimeError("Database not initialised – is the app running?")
    return _store.db
