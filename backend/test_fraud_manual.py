
import asyncio
import os
import sys
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Setup path to import backend modules
current_dir = os.path.dirname(os.path.abspath(__file__))
# backend is the current dir
sys.path.append(current_dir)

# Load env from Flow-Data/.env if not present
flow_data_env = os.path.join(current_dir, "..", "Flow-Data", ".env")
load_dotenv(flow_data_env)

# Import backend modules
# We need to initialize the database singleton so fraud_engine's get_db() works
from database import _store

MONGO_URL = os.getenv("MONGODB_URI")
if not MONGO_URL:
    print("❌ Error: MONGODB_URI not found.")
    sys.exit(1)

DB_NAME = "test"  # Matches database.py default

async def test_fraud_engine():
    print(f"Connecting to DB: {DB_NAME}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Initialize the singleton for the app code to use
    _store.client = client
    _store.db = db
    
    from services.fraud_engine import fraud_engine
    
    # Clean up previous tests
    student_id = ObjectId()
    sponsor_id_1 = ObjectId()
    sponsor_id_2 = ObjectId()
    
    print(f"🧪 Testing with Student ID: {student_id}")

    # Setup Sponsors at distant locations
    # Sponsor 1: (0, 0)
    await db.sponsors.insert_one({
        "_id": sponsor_id_1,
        "company_name": "Test Sponsor A",
        "map_location": {"x_coord": 0, "y_coord": 0}
    })
    
    # Sponsor 2: (1000, 1000) -> Distance approx 1414m
    await db.sponsors.insert_one({
        "_id": sponsor_id_2,
        "company_name": "Test Sponsor B",
        "map_location": {"x_coord": 1000, "y_coord": 1000}
    })
    
    # 1. First Scan (Safe)
    scan_1 = {
        "_id": ObjectId(),
        "student_id": student_id,
        "sponsor_id": sponsor_id_1,
        "timestamp": datetime.utcnow(),
        "sync_status": True
    }
    # Insert manually without engine to simulate history
    await db.scanevents.insert_one(scan_1)
    print("✅ Inserted Scan 1 (Base)")
    
    # 2. Second Scan (Impossible Travel)
    # 5 seconds later, 1400m away
    scan_2_id = ObjectId()
    scan_2 = {
        "_id": scan_2_id,
        "student_id": student_id,
        "sponsor_id": sponsor_id_2,
        "timestamp": datetime.utcnow() + timedelta(seconds=5),
        "sync_status": True
    }
    # Insert manually
    await db.scanevents.insert_one(scan_2)
    print("✅ Inserted Scan 2 (Impossible Travel)")
    
    print("🔍 Triggering Fraud Check...")
    await fraud_engine.verify_scan(scan_2)
    
    # 3. Check for Alert
    # Verify_scan is async and inserts alert
    alert = await db.fraud_alerts.find_one({"student_id": student_id, "scan_event_id": scan_2_id})
    
    if alert:
        print(f"🎉 SUCCESS: Fraud Alert Found!")
        print(f"   Reason: {alert['reason']}")
        print(f"   Severity: {alert['severity']}")
    else:
        print("❌ FAILURE: No fraud alert generated.")

    # Cleanup
    print("Cleaning up test data...")
    await db.sponsors.delete_many({"_id": {"$in": [sponsor_id_1, sponsor_id_2]}})
    await db.scanevents.delete_many({"student_id": student_id})
    await db.fraud_alerts.delete_many({"student_id": student_id})
    
    # Close client
    client.close()

if __name__ == "__main__":
    asyncio.run(test_fraud_engine())
