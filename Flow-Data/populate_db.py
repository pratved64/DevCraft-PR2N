import os
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker
from dotenv import load_dotenv

# Load environment variables — check local .env first, then backend/.env
load_dotenv()
if not os.getenv("MONGODB_URI"):
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    # Hardcoded fallback
    MONGODB_URI = "mongodb+srv://devcraft_user:djgoated@devcraft.uwfotw7.mongodb.net/?appName=devcraft"

print("Connecting to MongoDB Atlas...")
client = MongoClient(MONGODB_URI)
db = client.get_database("test")  # Mongoose defaults to 'test' if no DB name is in the URI

fake = Faker()

def seed_database():
    # 1. Clear existing data to prevent duplicate clusters
    print("Wiping old data...")
    db.users.delete_many({})
    db.sponsors.delete_many({})
    db.scanevents.delete_many({})
    db.rewards.delete_many({})

    # 2. Generate 15 Sponsors (Stalls)
    print("Seeding Sponsors...")
    sponsors = []
    categories = ["Software", "Hardware", "Food & Beverage", "Finance", "Entertainment"]
    for _ in range(15):
        sponsor = {
            "company_name": fake.company(),
            "category": random.choice(categories),
            "map_location": {
                "x_coord": random.randint(10, 900),
                "y_coord": random.randint(10, 900)
            },
            "sponsorship_package_cost": random.choice([25000, 50000, 100000]),
            "current_pokemon_spawn": {
                "name": random.choice(["Pikachu", "Bulbasaur", "Charmander", "Squirtle"]),
                "rarity": "Normal",
                "active_until": datetime.utcnow() + timedelta(hours=6)
            }
        }
        sponsors.append(sponsor)

    sponsor_insert = db.sponsors.insert_many(sponsors)
    sponsor_ids = sponsor_insert.inserted_ids

    # 3. Generate 100 Users (Students)
    print("Seeding Users...")
    users = []
    majors = ["Computer Engineering", "Mechanical", "Marketing", "Finance", "Design"]
    for _ in range(100):
        user = {
            "name": fake.name(),
            "email": fake.unique.email(),
            "demographics": {
                "major": random.choice(majors),
                "grad_year": random.choice([2026, 2027, 2028, 2029])
            },
            "wallet": {
                "total_points": 0,
                "legendaries_caught": 0
            },
            "pokedex": []
        }
        users.append(user)

    user_insert = db.users.insert_many(users)
    user_ids = user_insert.inserted_ids

    # 4. Generate 2,500 Scan Events (The Festival Traffic)
    print("Simulating 2,500 QR Code Scans...")
    scan_events = []
    pokemon_pool = [
        {"name": "Mewtwo", "type": "Psychic", "rarity": "Legendary", "pts": 500},
        {"name": "Gengar", "type": "Ghost", "rarity": "Normal", "pts": 50},
        {"name": "Eevee", "type": "Normal", "rarity": "Normal", "pts": 50},
        {"name": "Snorlax", "type": "Normal", "rarity": "Normal", "pts": 50},
        {"name": "Rayquaza", "type": "Dragon", "rarity": "Legendary", "pts": 1000},
        {"name": "Pikachu", "type": "Electric", "rarity": "Normal", "pts": 50},
        {"name": "Charizard", "type": "Fire", "rarity": "Legendary", "pts": 500},
        {"name": "Bulbasaur", "type": "Grass", "rarity": "Normal", "pts": 50},
    ]

    # Create a 6-hour time window for the festival
    start_time = datetime.utcnow() - timedelta(hours=6)

    for _ in range(2500):
        student_id = random.choice(user_ids)

        # Artificial clustering: Make 3 specific sponsors highly popular for the heatmap
        if random.random() > 0.6:
            sponsor_id = random.choice(sponsor_ids[:3])
        else:
            sponsor_id = random.choice(sponsor_ids)

        caught_mon = random.choice(pokemon_pool)

        # Distribute timestamps randomly across the 6 hours
        random_seconds = random.randint(0, int(timedelta(hours=6).total_seconds()))
        scan_time = start_time + timedelta(seconds=random_seconds)

        is_flash = caught_mon["rarity"] == "Legendary"

        scan_event = {
            "student_id": student_id,
            "sponsor_id": sponsor_id,
            "timestamp": scan_time,
            "pokemon_caught": {
                "name": caught_mon["name"],
                "type": caught_mon["type"],
                "rarity": caught_mon["rarity"]
            },
            "points_awarded": caught_mon["pts"],
            "is_flash_sale": is_flash,
            "sync_status": True
        }
        scan_events.append(scan_event)

    db.scanevents.insert_many(scan_events)

    # 5. Update user wallets based on their scans
    print("Updating user wallets from scan data...")
    for uid in user_ids:
        pipeline = [
            {"$match": {"student_id": uid}},
            {"$group": {
                "_id": None,
                "total_pts": {"$sum": "$points_awarded"},
                "legendary_count": {
                    "$sum": {"$cond": [{"$eq": ["$pokemon_caught.rarity", "Legendary"]}, 1, 0]}
                },
                "scan_ids": {"$push": "$_id"}
            }}
        ]
        result = list(db.scanevents.aggregate(pipeline))
        if result:
            data = result[0]
            db.users.update_one(
                {"_id": uid},
                {
                    "$set": {
                        "wallet.total_points": data["total_pts"],
                        "wallet.legendaries_caught": data["legendary_count"],
                        "pokedex": data["scan_ids"]
                    }
                }
            )

    # 6. Seed Rewards
    print("Seeding Rewards...")
    rewards = [
        {
            "item_name": "Premium Food Coupon",
            "category": "F&B",
            "cost_in_points": 500,
            "requires_legendary": False,
            "stock_remaining": 150
        },
        {
            "item_name": "TechCorp Internship Fast-Track",
            "category": "Career",
            "cost_in_points": 0,
            "requires_legendary": True,
            "stock_remaining": 5
        },
        {
            "item_name": "University Hoodie",
            "category": "Merch",
            "cost_in_points": 1000,
            "requires_legendary": False,
            "stock_remaining": 40
        },
        {
            "item_name": "Free Coffee",
            "category": "F&B",
            "cost_in_points": 150,
            "requires_legendary": False,
            "stock_remaining": 200
        },
        {
            "item_name": "Pokéball Keychain",
            "category": "Merch",
            "cost_in_points": 100,
            "requires_legendary": False,
            "stock_remaining": 75
        },
        {
            "item_name": "Pizza Slice + Soda",
            "category": "F&B",
            "cost_in_points": 200,
            "requires_legendary": False,
            "stock_remaining": 120
        },
        {
            "item_name": "Cloud Credits Voucher",
            "category": "Tech",
            "cost_in_points": 300,
            "requires_legendary": False,
            "stock_remaining": 30
        },
        {
            "item_name": "VIP Backstage Pass",
            "category": "Experience",
            "cost_in_points": 0,
            "requires_legendary": True,
            "stock_remaining": 10
        },
    ]
    db.rewards.insert_many(rewards)

    # 7. Create indexes for performance
    print("Creating indexes...")
    db.scanevents.create_index([("sponsor_id", 1), ("timestamp", -1)])
    db.scanevents.create_index([("student_id", 1)])
    db.scanevents.create_index([("is_flash_sale", 1)])

    print("✅ Database successfully seeded! Your Atlas cluster is locked and loaded.")
    print(f"   - {len(sponsors)} Sponsors")
    print(f"   - {len(users)} Users")
    print(f"   - {len(scan_events)} Scan Events")
    print(f"   - {len(rewards)} Rewards")

if __name__ == "__main__":
    seed_database()