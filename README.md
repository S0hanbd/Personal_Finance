# Personal Finance Management System

A comprehensive personal finance web app — income, expenses, accounts, recurring
bills, budgets, lending, obligations, analytics, and project finance.

**Currency:** BDT (৳) | **Timezone:** Asia/Dhaka

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |

## Quick Start

### With Docker (recommended)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
docker-compose up --build
# First time only:
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| Django Admin | http://localhost:8000/admin |

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

## Project Structure

```
├── backend/
│   ├── config/            # Django settings
│   └── apps/
│       ├── core/          # Base models & utilities
│       ├── authentication/ # JWT auth
│       ├── accounts/      # Financial accounts
│       ├── transactions/  # Core ledger
│       ├── budgets/       # Monthly budgets
│       ├── bills/         # Recurring expenses
│       ├── obligations/   # Future obligations
│       ├── lending/       # Lending & borrowing
│       ├── analytics/     # Reports
│       └── projects/      # Project finance
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI
│       ├── pages/         # Route pages
│       ├── hooks/         # Custom hooks
│       ├── store/         # Zustand state
│       ├── lib/           # api, money, constants
│       ├── types/         # TypeScript types
│       └── router/        # React Router config
├── docker-compose.yml
├── AGENTS.md
└── README.md
```

## Development Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Environment & Scaffold | 🔄 In Progress |
| 2 | Core Financial Ledger | ⏳ Pending |
| 3 | Recurring Bills & Obligations | ⏳ Pending |
| 4 | Budget & Planned Purchases | ⏳ Pending |
| 5 | Lending & Borrowing | ⏳ Pending |
| 6 | Analytics | ⏳ Pending |
| 7 | Project Finance | ⏳ Pending |
| 8 | Testing & Deployment | ⏳ Pending |

## Financial Integrity Rules
- Money stored as `DECIMAL(15,2)` in PostgreSQL — never float
- Frontend money processing via `decimal.js` — never native JS arithmetic
- Transfers never recorded as income or expense
- Unpaid bills do NOT reduce account balances
- Project finances are completely separate from personal finances
