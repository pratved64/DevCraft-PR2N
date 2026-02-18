import os
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError("Missing MONGODB_URI in .env file")

print("Connecting to MongoDB Atlas...")
client = MongoClient(MONGODB_URI)
db = client.get_database("test") # Mongoose defaults to 'test' if no DB name is in the URI

fake = Faker()

def seed_database():
    # 1. Clear existing data to prevent duplicate clusters
    print("Wiping old data...")
    db.users.delete_many({})
    db.sponsors.delete_many({})
    db.scanevents.delete_many({})

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

    # 4. Generate 2,000+ Scan Events (The Festival Traffic)
    print("Simulating 2,000 QR Code Scans...")
    scan_events = []
    pokemon_pool = [
        {"name": "Mewtwo", "type": "Psychic", "rarity": "Legendary", "pts": 500},
        {"name": "Gengar", "type": "Ghost", "rarity": "Rare", "pts": 150},
        {"name": "Eevee", "type": "Normal", "rarity": "Normal", "pts": 50},
        {"name": "Snorlax", "type": "Normal", "rarity": "Rare", "pts": 200},
        {"name": "Rayquaza", "type": "Dragon", "rarity": "Legendary", "pts": 1000}
    ]

    # Create a 6-hour time window for the festival
    start_time = datetime.utcnow() - timedelta(hours=6)

    for _ in range(2500):
        # Pick a random student and a random sponsor
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
            "sync_status": True
        }
        scan_events.append(scan_event)

    db.scanevents.insert_many(scan_events)
    print("✅ Database successfully seeded! Your Atlas cluster is locked and loaded.")

if __name__ == "__main__":
    seed_database()