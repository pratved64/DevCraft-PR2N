# EventFlow – Pokémon-Themed Event Platform

A full-stack event engagement platform: QR-scan stalls to catch Pokémon, earn points, view live crowd analytics, and redeem rewards.

---

## 🚀 Starting the App

### First time (install deps + seed DB + start everything)
```bash
./start.sh --install --seed
```

### Normal start (after first-time setup)
```bash
./start.sh
```

### That's it. You'll see:
```
  Frontend  →  http://localhost:3000
  Backend   →  http://localhost:8000
  API Docs  →  http://localhost:8000/docs
```
Press **Ctrl+C** to stop everything.


## �️ Manual Setup (if needed)

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 1. Install Python dependencies
```bash
pip3 install -r backend/requirements.txt faker
```

### 2. Install Node dependencies
```bash
cd devcraft && npm install
```

### 3. Seed the database
```bash
python3 Flow-Data/populate_db.py
```
This creates **100 users, 15 sponsors, 2,500 scan events, and 8 rewards** in MongoDB Atlas.

### 4. Start backend (Terminal 1)
```bash
cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Start frontend (Terminal 2)
```bash
cd devcraft && npm run dev
```

---

## 🔑 Environment Files (already configured)

| File | Key | Value |
|---|---|---|
| `backend/.env` | `MONGODB_URI` | Atlas connection string |
| `backend/.env` | `DB_NAME` | `test` |
| `devcraft/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |

---

## 📂 Project Structure
- `backend/`: FastAPI backend (Authentication, Game Logic, Analytics, WebSockets)
- `devcraft/`: Next.js Frontend (React, Tailwind, Three.js)
- `Flow-Data/`: Data models and seeding scripts
