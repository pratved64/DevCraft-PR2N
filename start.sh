#!/bin/bash

# ─────────────────────────────────────────────────────────────
#  EventFlow – One-shot launcher
#  Usage:
#    ./start.sh           → start backend + frontend
#    ./start.sh --seed    → seed DB first, then start
#    ./start.sh --install → install all deps, then start
# ─────────────────────────────────────────────────────────────

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    [ -n "$BACKEND_PID" ]  && kill $BACKEND_PID  2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM

echo "🧹 Cleaning up old processes..."
pkill -9 -f "uvicorn main:app" 2>/dev/null
pkill -9 -f "next-server"      2>/dev/null
pkill -9 -f "next dev"         2>/dev/null

# Force-free ports 8000 and 3000
for PORT in 8000 3000; do
    PIDS=$(lsof -t -i :$PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "  Killing PIDs on port $PORT: $PIDS"
        kill -9 $PIDS 2>/dev/null || true
    fi
done

# Wait up to 10 s for ports to free
for PORT in 8000 3000; do
    for i in $(seq 1 10); do
        lsof -i :$PORT >/dev/null 2>&1 || break
        echo "  Waiting for port $PORT to be released... ($i/10)"
        sleep 1
    done
done

if lsof -i :8000 >/dev/null 2>&1; then
    echo "❌ Port 8000 is still in use. Try: sudo kill -9 \$(sudo lsof -t -i :8000)"
    exit 1
fi

# ── Optional: install dependencies ──────────────────────────
if [ "$1" = "--install" ] || [ "$2" = "--install" ]; then
    echo ""
    echo "� Installing Python dependencies..."
    pip3 install -r backend/requirements.txt faker -q

    echo "📦 Installing Node dependencies..."
    cd devcraft && npm install --silent && cd ..
fi

# ── Optional: seed the database ─────────────────────────────
if [ "$1" = "--seed" ] || [ "$2" = "--seed" ]; then
    echo ""
    echo "🌱 Seeding MongoDB Atlas database..."
    python3 Flow-Data/populate_db.py
    echo ""
fi

# ── 1. Start Backend ─────────────────────────────────────────
echo ""
echo "🔧 Starting FastAPI backend on http://localhost:8000 ..."
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Give the backend 3 s to connect to MongoDB
sleep 3

# Quick health check
python3 -c "
import urllib.request, sys
try:
    urllib.request.urlopen('http://localhost:8000/', timeout=4)
    print('  ✅ Backend is up')
except Exception as e:
    print('  ⚠️  Backend may still be starting:', e)
"

# ── 2. Start Frontend ────────────────────────────────────────
echo ""
echo "🌐 Starting Next.js frontend on http://localhost:3000 ..."
cd devcraft
if [ ! -f "node_modules/.bin/next" ]; then
    echo "  ⚠️  node_modules missing – running npm install..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ EventFlow is running!"
echo ""
echo "  Frontend  →  http://localhost:3000"
echo "  Backend   →  http://localhost:8000"
echo "  API Docs  →  http://localhost:8000/docs"
echo ""
echo "  Pages:"
echo "    /              Homepage & live stats"
echo "    /studentpage   Pokédex map, scan, leaderboard"
echo "    /sponsor       Analytics dashboard"
echo "    /redeem        Store, Pokédex, trades"
echo "    /organizer     Ops / God-mode view"
echo ""
echo "  Press Ctrl+C to stop everything."
echo "═══════════════════════════════════════════"

wait $BACKEND_PID $FRONTEND_PID
