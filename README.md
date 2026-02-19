# ⚡ EventFlow – Next-Gen Event Engagement Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-blue)](https://tailwindcss.com/)

**EventFlow** is a gamified, real-time event management platform designed to transform passive attendees into active participants. By combining physical QR scans with digital rewards, live analytics, and interactive visualizations, EventFlow creates an immersive experience for students, sponsors, and organizers alike.

---

## 🌟 Key Features

### 🎓 **Student App**
-   **Poké-Scan Engine:** Scan QR codes at sponsor stalls to "catch" Pokémon and earn XP.
-   **Live Leaderboard:** Compete with friends and global attendees in real-time.
-   **Rarity System:** Strategic "Legendary" spawns at low-traffic stalls to drive footfall.
-   **Sleek UI:** Glassmorphism design with 3D elements and smooth animations.

### 🏢 **Sponsor Dashboard**
-   **Real-Time Analytics:** View live footfall, unique visitors, and peak traffic hours.
-   **Lead Generation:** Capture attendee profiles effortlessly with every scan.
-   **ROI Metrics:** Track conversion rates and engagement depth.

### 🛡️ **Organizer "God Mode"**
-   **Bird's Eye View:** Monitor the entire event's pulse with a live heatmap.
-   **Fraud Detection:** AI-powered alerts for suspicious activity (e.g., duplicate resume drops, velocity checks).
-   **Crowd Control:** Predictive insights to manage bottlenecks before they happen.

---

## 🛠️ Tech Stack

### **Frontend**
-   **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS v4, Lucide React (Icons)
-   **Visuals:** Three.js (via `@react-three/fiber`) for 3D elements, Framer Motion for animations.

### **Backend**
-   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
-   **Database Driver:** Motor (Async MongoDB)
-   **Real-Time:** Native WebSockets for live heatmaps and leaderboards.
-   **Security:** JWT Authentication, BCrypt hashing.

### **Database**
-   **Primary:** MongoDB Atlas (Cloud)
-   **Data Model:** Users, Sponsors, ScanEvents, Rewards, FraudAlerts.

---

## 🚀 Getting Started

### Prerequisites
-   **Node.js** 18+
-   **Python** 3.9+
-   **npm** or **yarn**

### Quick Start (Recommended)
Use the included helper script to handle everything (install deps, seed DB, start servers):

```bash
./start.sh --install --seed
```

### Manual Setup

#### 1. Backend Setup
```bash
# Install Python dependencies
pip3 install -r backend/requirements.txt faker

# Start the FastAPI server
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend runs on `http://localhost:8000`*

#### 2. Frontend Setup
```bash
# Install Node dependencies
cd devcraft
npm install

# Start the Next.js development server
npm run dev
```
*The frontend runs on `http://localhost:3000`*

#### 3. Database Seeding (Optional)
Populate the database with realistic mock data (100 users, 2.5k scans, 15 sponsors):
```bash
python3 Flow-Data/populate_db.py
```

---

## 📚 API Documentation

Once the backend is running, you can access the interactive API docs (Swagger UI) at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 📂 Project Structure

```
.
├── backend/                # FastAPI Application
│   ├── routers/            # API Endpoints (Game, Sponsor, Auth)
│   ├── models/             # Pydantic Schemas
│   ├── database.py         # MongoDB Connection
│   └── main.py             # Entry Point
├── devcraft/               # Next.js Frontend
│   ├── app/                # App Router Pages
│   ├── components/         # Reusable UI Components
│   ├── lib/                # API Client & Utilities
│   └── public/             # Static Assets
├── Flow-Data/              # Data Seeding Scripts
└── start.sh                # Master startup script
```

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
