# app/database.py
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://devcraft_user:djgoated@devcraft.uwfotw7.mongodb.net/?appName=devcraft",
)
DB_NAME = os.getenv("DB_NAME", "test")


class Database:
    client: AsyncIOMotorClient = None


db = Database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the startup and shutdown lifecycle of the FastAPI application.
    Ensures the connection pool is opened and closed safely.
    """
    print("🚀 Starting up: Connecting to MongoDB Atlas...")
    db.client = AsyncIOMotorClient(MONGODB_URI)
    yield
    print("🛑 Shutting down: Closing MongoDB connection...")
    db.client.close()


def get_db():
    """Return the active database handle."""
    if db.client is None:
        raise RuntimeError("Database not initialised – is the app running?")
    return db.client.get_database(DB_NAME)


# --- Custom Database Helper Functions ---

async def get_crowd_heatmap_data(minutes_ago: int = 30):
    """
    Aggregates scan events from the last X minutes and groups them 
    by sponsor location to generate the heatmap weights.
    """
    database = db.client.get_database("test")
    scan_events = database.get_collection("scanevents")
    
    time_threshold = datetime.utcnow() - timedelta(minutes=minutes_ago)
    
    # The MongoDB Aggregation Pipeline
    pipeline = [
        # 1. Filter for recent scans
        {"$match": {"timestamp": {"$gte": time_threshold}}},
        # 2. Join with the Sponsors collection to get physical coordinates
        {"$lookup": {
            "from": "sponsors",
            "localField": "sponsor_id",
            "foreignField": "_id",
            "as": "sponsor_info"
        }},
        {"$unwind": "$sponsor_info"},
        # 3. Group by the specific coordinates and count the traffic
        {"$group": {
            "_id": {
                "x": "$sponsor_info.map_location.x_coord",
                "y": "$sponsor_info.map_location.y_coord"
            },
            "weight": {"$sum": 1} # Each scan adds 1 to the heatmap intensity
        }},
        # 4. Format the output cleanly for the Next.js frontend
        {"$project": {
            "_id": 0,
            "x": "$_id.x",
            "y": "$_id.y",
            "value": "$weight"
        }}
    ]
    
    # Motor returns an async cursor for aggregations
    cursor = scan_events.aggregate(pipeline)
    return await cursor.to_list(length=None)