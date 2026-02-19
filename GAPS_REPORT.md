# EventFlow – Integration Audit & Gaps Report
**Generated:** 2026-02-19  
**Branch:** `nikshaan`  
**Backend:** FastAPI + MongoDB Atlas (Motor async)  
**Frontend:** Next.js 14 + Tailwind CSS v4

---

## ✅ What's Working (Smoke-Tested)

| Endpoint | Status | Data |
|---|---|---|
| `GET /` | ✅ OK | Root info |
| `GET /api/general/stats` | ✅ OK | 100 attendees, 15 sponsors, 2500 scans, 967 legendaries |
| `GET /api/game/stalls` | ✅ OK | 15 stalls with live crowd levels |
| `GET /api/game/leaderboard` | ✅ OK | 50 entries ranked by points |
| `GET /api/game/notifications` | ✅ OK | 15 legendary-spawn alerts |
| `GET /api/game/my-history` | ✅ OK | User pokedex + points |
| `POST /api/game/scan` | ✅ OK | Rarity logic, wallet update, spawn upgrade |
| `GET /api/sponsor/analytics/:id` | ✅ OK | Full ROI metrics |
| `POST /api/sponsor/scan-candidate` | ✅ OK | Resume + demographics |
| `GET /api/store/rewards` | ✅ OK | 8 rewards with affordability flag |
| `POST /api/store/redeem` | ✅ OK | Atomic stock decrement + voucher code |
| `WS /api/game/heatmap` | ✅ OK | 30s broadcast of crowd data |
| **Frontend** (`localhost:3001`) | ✅ Running | All 5 pages compiling cleanly |
| **MongoDB Atlas** | ✅ Connected | `test` database, 4 collections seeded |

---

## 🐛 Bugs Fixed in This Session

| File | Bug | Fix Applied |
|---|---|---|
| `backend/.env` | Empty — MongoDB URI never loaded | Wrote `MONGODB_URI` + `DB_NAME` |
| `devcraft/.env.local` | Empty — frontend always used `localhost:8000` fallback | Wrote `NEXT_PUBLIC_API_URL=http://localhost:8000` |
| `backend/routers/store.py` | `find_one_and_update` used `return_document=True` (wrong type) | Changed to `ReturnDocument.AFTER` from `pymongo` |
| `backend/routers/game.py` | `ObjectId(x_user_id)` called without try/except — would throw 500 on invalid header | Wrapped in try/except, reused `student_oid` variable |
| `backend/routers/game.py` | `my-history` returned `{"error": "..."}` dict on missing user — crashes frontend `.user_id` access | Returns empty `HistoryResponse` instead |
| `backend/routers/game.py` | Unused `Depends`, `get_current_user_id` imports | Removed |
| `backend/routers/sponsor.py` | Unused `Depends`, `Counter`, `datetime`, `timezone`, `Header`, `get_current_user_id` imports | Removed |
| `devcraft/app/globals.css` | Referenced `--font-geist-sans/mono` variables that don't exist (layout uses Inter/Roboto) | Fixed to `--font-inter` / `--font-roboto-mono`; added missing `@keyframes marquee`, `zoom-in`, `fade-in` |
| `devcraft/next.config.mjs` | `swcMinify: false` removed in Next 14 — causes warning | Replaced with `images.remotePatterns` for PokeAPI sprites |
| `devcraft/app/page.tsx` | Unused `useRef` import | Removed |
| `devcraft/app/studentpage/page.tsx` | Unused `useMemo` import; missing `@keyframes scan` + `marquee` + `zoom-in` animations | Fixed imports; added all missing keyframes inside component `<style>` |
| `devcraft/app/redeem/page.tsx` | MAP view pins used raw pixel values (120px, 450px) as CSS `left/top` — rendered off-screen | Changed to percentage coordinates (0–100%); added `transform: translate(-50%,-50%)` |
| `devcraft/app/redeem/page.tsx` | MAP tab existed in `view` state but had no nav button | Added MAP tab button to bottom nav |
| `devcraft/app/sponsor/page.tsx` | `retro-grid` CSS class used but not defined (defined only in `page.tsx` inline style) | Added definition to sponsor page's own `<style>` block |
| `devcraft/app/sponsor/page.tsx` | `animate-fade-in` used on KPI cards but not defined | Added `@keyframes fadeInUp` to page styles |
| `Flow-Data/app/database.py` | `get_db()` function missing entirely; hardcoded `MONGODB_URI` with no fallback | Added `get_db()`, added hardcoded fallback URI |
| `Flow-Data/requirements.txt` | Did not exist — `populate_db.py` needs `faker`, `pymongo`, `python-dotenv` | Created `requirements.txt` |
| `Flow-Data/.env` | Empty — seeder couldn't read URI | Wrote `MONGODB_URI` |

---

## ⚠️ Known Gaps (Not Yet Implemented)

### 🔐 Authentication
- **No real auth system.** All endpoints use `X-User-Id` header as a plain string — anyone can impersonate any user by sending any ObjectId.
- **Fix needed:** Add JWT-based login. The `auth.py` + `pyjwt` dependency are already in place — the logic just needs to be wired in.

### 👤 User Registration / Login Pages
- **No `/login` or `/register` page exists.** Currently the frontend grabs the first DB user as a fallback for the demo.
- **Fix needed:** Build a `/login` page that stores a real JWT + user ID in `localStorage`, then passes it as `X-User-Id` on all fetch calls.

### 📱 QR Code Scanning (Real)
- The "INITIATE SCAN" button in `/studentpage` calls the scan API with the **selected stall's ID** — which is correct — but a real event would use the device camera to scan a QR code printed at each physical stall.
- **Fix needed:** Integrate `react-qr-reader` or the Web `BarcodeDetector` API to decode a QR code that encodes the `sponsor_id`.

### 🗺️ Live Heatmap Rendering
- The organizer page connects to the WebSocket and receives `{x, y, scan_count}` data correctly, but **only renders a text leaderboard** — not a visual 2D heatmap.
- **Fix needed:** Use the `x_coord` / `y_coord` from the heatmap WebSocket data to render coloured circles on an `<svg>` or canvas event-map overlay.

### 📊 Sponsor Analytics: Traffic Chart Uses Hardcoded Bars
- The "Traffic Velocity & Peak Hours" bar chart in `/sponsor` uses **24 hardcoded values** (`[35, 45, 30, 60, ...]`), not real per-hour aggregation from the backend.
- The backend `peak_traffic_hour` returns only a single integer (the busiest hour), not per-hour counts.
- **Fix needed:** Add a `GET /api/sponsor/analytics/{stall_id}/hourly` endpoint that returns `[{hour: 9, count: 120}, ...]`, then bind it to the chart bars.

### ⏱️ Wait Time Is Scan-Delta, Not Real Queue Time
- `calculate_avg_wait_time()` measures the **mean gap between consecutive scans** at a stall, which approximates throughput — not actual queue wait time.
- **Fix needed:** Either accept this as a proxy metric (label it "Avg scan interval") or add an explicit `queue_entry_time` field to scan events.

### 🔔 Push Notifications
- Legendary spawn alerts are surfaced as a modal after 3 seconds (client-side), not as real push notifications.
- **Fix needed:** Integrate Web Push API with a service worker (`next-pwa`) to send background push notifications when a legendary spawns.

### 🏪 Redeem MAP View Uses Hardcoded Sponsors
- The MAP tab in `/redeem` shows 5 hardcoded `MOCK_SPONSORS` with fixed coordinates.
- **Fix needed:** Call `fetchStalls()` inside the redeem page and normalize `x_coord/y_coord` to percentages (same logic as `/studentpage`).

### 📦 Resume Upload for Sponsor Scan
- `POST /api/sponsor/scan-candidate` returns `resume_url` and `skills` fields, but users have no way to upload a resume — the fields are always `null`/`[]`.
- **Fix needed:** Add a profile/settings page with file upload (S3 or similar) and store the URL in the user document.

### 🔄 Offline-First / PWA Sync
- The schema has `sync_status: true` on scan events, indicating offline-first intent, but there is **no service worker or IndexedDB queue** implemented.
- **Fix needed:** Add `next-pwa`, cache scan actions in IndexedDB when offline, and replay them when the network returns.

### 🗑️ Cleanup Files
- `mock_db.py` (backend root), `check_ports.py`, `dbConnect.ts`, `models/` (root-level TS files), and `__pycache__` at the repo root are all dead code/artifacts.
- These don't cause errors but should be removed for a clean repo.

---

## 🏗️ Architecture Summary

```
Browser (Next.js 14 – port 3001)
    │
    ├── /                   → Homepage + live stats
    ├── /studentpage        → Pokédex map, QR scan, leaderboard
    ├── /sponsor            → Analytics dashboard
    ├── /redeem             → Store (MART), Pokédex (DEX), trades (LINK)
    └── /organizer          → God-mode ops view + live WS heatmap
    │
    └── HTTP/WS → FastAPI (port 8000)
                    │
                    ├── /api/general   → Stats
                    ├── /api/game      → Scan, history, leaderboard, stalls, WS heatmap
                    ├── /api/sponsor   → Analytics, candidate scan
                    └── /api/store     → Rewards, redeem
                    │
                    └── MongoDB Atlas (async Motor)
                            ├── users       (100 docs)
                            ├── sponsors    (15 docs)
                            ├── scanevents  (2,500 docs)
                            └── rewards     (8 docs)
```


No real JWT auth (uses mock X-User-Id header)
No real QR scanner (simulates scan)
Hourly traffic chart uses hardcoded data
Redeem MAP uses mock sponsors (not live DB)
No PWA/offline sync
No resume upload
Wait time is approximated
No Web Push notifications