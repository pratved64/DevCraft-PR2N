"""
EventFlow – FastAPI Backend
Entry point. Run with: cd backend && python3 -m uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import lifespan
from routers import general, game, sponsor, store

# ──────────────────────────── App ──────────────────────────────────────

app = FastAPI(
    title="EventFlow API",
    description=(
        "Pokémon-themed event engagement platform. "
        "Production backend powered by MongoDB Atlas via async Motor."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ──────────────────────────── CORS ─────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────── Routers ──────────────────────────────────

app.include_router(general.router)
app.include_router(game.router)
app.include_router(sponsor.router)
app.include_router(store.router)


# ──────────────────────────── Root ─────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "EventFlow",
        "theme": "Pokémon",
        "status": "running",
        "database": "MongoDB Atlas (async Motor)",
        "docs": "/docs",
        "version": "1.0.0",
        "endpoints": {
            "homepage": "/api/general/stats",
            "game": [
                "/api/game/my-history",
                "/api/game/scan",
                "/api/game/leaderboard",
                "/api/game/stalls",
                "/api/game/notifications",
            ],
            "heatmap_ws": "ws://localhost:8000/api/game/heatmap",
            "sponsor": [
                "/api/sponsor/scan-candidate",
                "/api/sponsor/analytics/{stall_id}",
            ],
            "store": ["/api/store/rewards", "/api/store/redeem"],
        },
    }
