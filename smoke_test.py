#!/usr/bin/env python3
"""Quick smoke-test for all EventFlow API endpoints."""
import urllib.request
import json
import sys
import os

BASE = "http://localhost:8000"
results = {}

def get(path):
    try:
        r = urllib.request.urlopen(f"{BASE}{path}", timeout=5)
        return json.loads(r.read()), None
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"

# Root
data, err = get("/")
results["root"] = "OK" if data else f"FAIL – {err}"

# Stats
data, err = get("/api/general/stats")
results["stats"] = f"OK – {data}" if data else f"FAIL – {err}"

# Stalls
data, err = get("/api/game/stalls")
results["stalls"] = f"OK – {len(data)} stalls" if data else f"FAIL – {err}"

# Leaderboard
data, err = get("/api/game/leaderboard")
results["leaderboard"] = f"OK – {len(data)} entries" if data else f"FAIL – {err}"

# Notifications
data, err = get("/api/game/notifications")
results["notifications"] = f"OK – {len(data)} items" if data else f"FAIL – {err}"

# My history (no user – fallback to first)
data, err = get("/api/game/my-history")
results["my-history"] = f"OK – user={data.get('name')}" if data else f"FAIL – {err}"

# Rewards
data, err = get("/api/store/rewards")
results["rewards"] = f"OK – {len(data)} items" if data else f"FAIL – {err}"

# Write results
out_path = "/home/nikshaan/DevCraft-PR2N/test_results.txt"
with open(out_path, "w") as f:
    for k, v in results.items():
        f.write(f"{k:20s} {v}\n")

print("Done – see test_results.txt")
