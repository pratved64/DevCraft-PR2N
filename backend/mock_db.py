"""
EventFlow – In-Memory Mock Database
Pre-populated dictionaries simulating persistence.
Pokemon-themed event management platform.
"""

from datetime import datetime, timedelta

from models import User, Stall, Reward, Transaction

# ──────────────────────────── Helper ───────────────────────────────────

_now = datetime.now()


def _ts(hours_ago: int) -> datetime:
    """Create a timestamp `hours_ago` hours before now."""
    return _now - timedelta(hours=hours_ago)


# ──────────────────────────── USERS ────────────────────────────────────

USERS: dict[int, User] = {
    1: User(
        id=1,
        name="Alice Chen",
        department="CS",
        resume_url="https://resumes.eventflow.dev/alice-chen.pdf",
        skills=["Python", "ML", "Deep Learning"],
        friends=[2, 3],
        points=250,
        pokemon_dex=[
            {"stall_id": 1, "stall_name": "AWS Cloud Zone", "pokemon": "Pikachu", "rarity": "Common", "visited_at": str(_ts(5))},
            {"stall_id": 3, "stall_name": "GitHub Lounge", "pokemon": "Charizard", "rarity": "Legendary", "visited_at": str(_ts(3))},
        ],
    ),
    2: User(
        id=2,
        name="Bob Martinez",
        department="CS",
        resume_url="https://resumes.eventflow.dev/bob-martinez.pdf",
        skills=["Java", "Spring Boot", "Cloud"],
        friends=[1, 4],
        points=180,
        pokemon_dex=[
            {"stall_id": 2, "stall_name": "Google AI Lab", "pokemon": "Bulbasaur", "rarity": "Common", "visited_at": str(_ts(4))},
        ],
    ),
    3: User(
        id=3,
        name="Carol Wu",
        department="IT",
        resume_url="https://resumes.eventflow.dev/carol-wu.pdf",
        skills=["React", "TypeScript", "Next.js"],
        friends=[1, 5],
        points=320,
        pokemon_dex=[
            {"stall_id": 1, "stall_name": "AWS Cloud Zone", "pokemon": "Squirtle", "rarity": "Common", "visited_at": str(_ts(6))},
            {"stall_id": 4, "stall_name": "Meta Open Source", "pokemon": "Mewtwo", "rarity": "Legendary", "visited_at": str(_ts(2))},
        ],
    ),
    4: User(
        id=4,
        name="David Kim",
        department="DevOps",
        resume_url="https://resumes.eventflow.dev/david-kim.pdf",
        skills=["Go", "Kubernetes", "Terraform"],
        friends=[2, 5],
        points=95,
        pokemon_dex=[],
    ),
    5: User(
        id=5,
        name="Eva Singh",
        department="IT",
        resume_url="https://resumes.eventflow.dev/eva-singh.pdf",
        skills=["Data Science", "SQL", "Python"],
        friends=[3, 4],
        points=410,
        pokemon_dex=[
            {"stall_id": 5, "stall_name": "Stripe Payments", "pokemon": "Eevee", "rarity": "Common", "visited_at": str(_ts(1))},
            {"stall_id": 2, "stall_name": "Google AI Lab", "pokemon": "Rayquaza", "rarity": "Legendary", "visited_at": str(_ts(7))},
            {"stall_id": 3, "stall_name": "GitHub Lounge", "pokemon": "Snorlax", "rarity": "Common", "visited_at": str(_ts(3))},
        ],
    ),
}

# ──────────────────────────── STALLS ───────────────────────────────────

STALLS: dict[int, Stall] = {
    1: Stall(
        id=1,
        name="AWS Cloud Zone",
        is_hiring=True,
        sponsorship_amount=50000.0,
        visitor_count=120,
        visit_timestamps=[_ts(h) for h in [8, 7, 6, 5, 4, 3, 2, 1]],
        map_x=20.0,
        map_y=30.0,
    ),
    2: Stall(
        id=2,
        name="Google AI Lab",
        is_hiring=True,
        sponsorship_amount=75000.0,
        visitor_count=95,
        visit_timestamps=[_ts(h) for h in [7, 6, 5, 3, 2]],
        map_x=50.0,
        map_y=20.0,
    ),
    3: Stall(
        id=3,
        name="GitHub Lounge",
        is_hiring=False,
        sponsorship_amount=30000.0,
        visitor_count=60,
        visit_timestamps=[_ts(h) for h in [6, 4, 3, 1]],
        map_x=80.0,
        map_y=35.0,
    ),
    4: Stall(
        id=4,
        name="Meta Open Source",
        is_hiring=True,
        sponsorship_amount=60000.0,
        visitor_count=44,
        visit_timestamps=[_ts(h) for h in [5, 4, 2]],
        map_x=35.0,
        map_y=70.0,
    ),
    5: Stall(
        id=5,
        name="Stripe Payments",
        is_hiring=False,
        sponsorship_amount=40000.0,
        visitor_count=30,
        visit_timestamps=[_ts(h) for h in [3, 1]],
        map_x=65.0,
        map_y=75.0,
    ),
}

# ──────────────────────────── REWARDS ──────────────────────────────────

REWARDS: dict[int, Reward] = {
    1: Reward(id=1, type="merch", name="Pikachu Plush Toy", description="Adorable 12-inch Pikachu stuffed toy", cost=200, stock_remaining=15),
    2: Reward(id=2, type="merch", name="Pokéball Keychain", description="LED light-up Pokéball keychain", cost=80, stock_remaining=30),
    3: Reward(id=3, type="food", name="Poké Bowl Combo", description="Rice bowl + drink at the food court", cost=50, stock_remaining=40),
    4: Reward(id=4, type="food", name="Bubble Tea Voucher", description="Any flavor at the Boba Station", cost=30, stock_remaining=50),
    5: Reward(id=5, type="merch", name="Charizard Hoodie", description="Limited edition Charizard flame hoodie", cost=500, stock_remaining=5),
    6: Reward(id=6, type="discount", name="20% Cloud Credits", description="AWS/GCP cloud credits discount code", cost=100, stock_remaining=25),
    7: Reward(id=7, type="food", name="Pizza Slice + Soda", description="1 pizza slice + can of soda", cost=40, stock_remaining=35),
}

# ──────────────────────────── TRANSACTIONS ─────────────────────────────

TRANSACTIONS: list[Transaction] = []
