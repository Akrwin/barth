# BARTH — Personal Financial Dashboard

A minimalist personal finance tracker built with a strict black-and-white design system. Track income and expenses, manage budgets, monitor installment plans, and maintain a monthly payment checklist.

**Live:** [barth-neon.vercel.app](https://barth-neon.vercel.app)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + SQLAlchemy + Alembic |
| Database | PostgreSQL (Neon serverless) |
| Auth | JWT (python-jose + bcrypt) |
| Deploy | Vercel (frontend) · Railway (backend) · Neon (DB) |

---

## Features

- **Dashboard** — Asset overview, net income, outflow breakdown, budget progress with period toggle (Monthly / Quarterly / Yearly)
- **Activity** — Transaction history grouped by day, dynamic category filters, delete support
- **New Record** — Add income or expense with category selection, 3-month history panel, and checklist matching by note
- **Active Plans** — Installment tracker with repayment forecast and total debt breakdown
- **Monthly Checklist** — Persistent checklist synced across months; past months are frozen as snapshots

---

## Project Structure

```
barth/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── pages/     # Dashboard, Activity, Add, Installments, Login, Register
│   │   ├── components/
│   │   │   └── ui/    # NavBar, Sidebar, Button, ProgressBar
│   │   └── lib/
│   │       └── api.ts # API client + TypeScript types
│   └── vercel.json    # SPA routing config
│
└── backend/           # FastAPI app
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── database.py
    │   ├── models/
    │   ├── routers/   # auth, transactions, budgets, installments, dashboard, categories, checklist
    │   └── schemas/
    ├── alembic/       # Database migrations
    ├── Dockerfile
    └── start.sh       # Runs migrations then starts server
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.12+
- Docker (for local PostgreSQL)

### 1. Start the database

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your local DATABASE_URL

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local: VITE_API_URL=http://localhost:8000

npm run dev
```

App available at: `http://localhost:5173`

---

## Deployment

Deployed across three free-tier services — no credit card required.

| Service | Role | Config |
|---------|------|--------|
| [Neon](https://neon.tech) | PostgreSQL | Copy connection string |
| [Railway](https://railway.app) | FastAPI backend | Root dir: `backend`, uses `Dockerfile` |
| [Vercel](https://vercel.com) | React frontend | Root dir: `frontend`, framework: Vite |

### Environment Variables

**Railway (backend):**
```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
SECRET_KEY=<random 64-char hex>
ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Vercel (frontend):**
```
VITE_API_URL=https://your-backend.railway.app
```

On first deploy, Railway automatically runs `alembic upgrade head` via `start.sh` before starting the server.

---

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## Design System

- **Typefaces:** Manrope (headlines) · Inter (body) · Material Symbols Outlined (icons)
- **Palette:** Black `#000000` · White `#FFFFFF` only — no grays, no colors
- **Borders:** 2px solid black throughout
- **Border radius:** 0px (square corners everywhere)
- **Motion:** minimal — only opacity and scale transitions

---

## License

MIT
