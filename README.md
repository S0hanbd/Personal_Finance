# Personal Finance Management System

A comprehensive personal finance web application for tracking income, expenses, accounts, recurring bills, budgets, lending/borrowing, financial obligations, analytics, project finance, and exportable reports.

**Currency:** BDT (৳) | **Timezone:** Asia/Dhaka | **ACID Compliance:** 100% verified ✓

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| State | Zustand + React Query |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |
| Package Manager | pnpm (frontend) · pip (backend) |

## Features

### Core Financial Ledger
- **Transactions** — Income, expense, and transfer recording with 24-hour edit window
- **Accounts** — Multi-account balance tracking with atomic balance updates
- **Categories** — Expense categories and income sources
- **Quick Add** — Calculator input, inline category/account creation, keyboard shortcuts

### Recurring Bills & Obligations
- **Recurring Bills** — Monthly bill scheduling with occurrence generation and payment tracking
- **Financial Obligations** — Future obligation planning and payment recording

### Budget & Planned Purchases
- **Monthly Budgets** — Category-based budget allocation with variable vs. fixed spending separation
- **Budget Performance** — Real-time tracking with threshold alerts (Normal/Warning/Exceeded)
- **Planned Purchases** — Purchase planning with lifecycle (Planned → Saving → Ready → Purchased)

### Lending & Borrowing
- **Person Directory** — Contact management for lending relationships
- **Loan Records** — Lend/borrow tracking with settlement workflow
- **Settlement History** — Partial and full settlement recording

### Analytics & Reports
- **6 Chart Types** — Monthly trends, category breakdown, spending trends, balance history, top categories, budget vs. actual
- **CSV Export** — Transaction export with filters
- **PDF Reports** — Monthly financial reports, budget reports, and project reports

### Project Finance
- **Project Management** — Independent project budgeting and item tracking
- **Project Items** — Estimated vs. actual spending per item with progress bars

### User Management
- **Profile** — Personal info, avatar upload, password change
- **Dashboard Settings** — Customize which summary cards appear on dashboard
- **Navigation Settings** — Reorder and hide sidebar navigation items

### Security & Production
- JWT authentication with token refresh interceptor
- API rate limiting (anonymous, authenticated, auth endpoints)
- HSTS, CSRF protection, secure headers
- Gunicorn production server with Docker deployment

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
│   ├── config/            # Django settings & WSGI
│   └── apps/
│       ├── core/          # Base models & utilities
│       ├── authentication/ # JWT auth, profile, user settings
│       ├── accounts/      # Financial accounts
│       ├── transactions/  # Core ledger (income/expense/transfer)
│       ├── budgets/       # Monthly budgets & planned purchases
│       ├── bills/         # Recurring expenses & occurrences
│       ├── obligations/   # Future financial obligations
│       ├── lending/       # Lending, borrowing & person management
│       ├── analytics/     # Aggregation services for charts
│       ├── projects/      # Independent project finance
│       └── reports/       # CSV/PDF export services
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI (layout, shared, settings)
│       ├── pages/         # Route pages (13 pages)
│       ├── hooks/         # React Query hooks (10 domain hooks)
│       ├── store/         # Zustand stores (auth, settings)
│       ├── lib/           # api client, decimal.js money utils
│       ├── types/         # TypeScript interfaces (money as string)
│       └── router/        # React Router config
├── docker-compose.yml
├── AGENTS.md
└── README.md
```

## API Endpoints

| Domain | Endpoints |
|--------|-----------|
| **Auth** | `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/logout/`, `GET /api/auth/me/` |
| **Profile** | `GET/PATCH /api/auth/profile/`, `POST /api/auth/change_password/` |
| **Settings** | `GET/PATCH /api/auth/settings/` |
| **Accounts** | `GET/POST /api/accounts/`, `GET/PUT/PATCH/DELETE /api/accounts/{id}/` |
| **Transactions** | `GET/POST /api/transactions/`, `GET/PUT/PATCH/DELETE /api/transactions/{id}/` |
| **Bills** | `GET/POST /api/bills/`, `GET/PUT/DELETE /api/bills/{id}/`, `POST /api/bills/{id}/pay/` |
| **Budgets** | `GET/POST /api/budgets/monthly/`, `GET /api/budgets/monthly/performance/` |
| **Planned Purchases** | `GET/POST /api/budgets/planned-purchases/`, `POST /api/budgets/planned-purchases/{id}/purchase/` |
| **Obligations** | `GET/POST /api/obligations/`, `GET/PUT/DELETE /api/obligations/{id}/`, `POST /api/obligations/{id}/pay/` |
| **Lending** | `GET/POST /api/lending/people/`, `GET/POST /api/lending/loans/`, `POST /api/lending/loans/{id}/settle/` |
| **Analytics** | `GET /api/analytics/monthly_trend/`, `GET /api/analytics/category_breakdown/`, `GET /api/analytics/spending_trends/`, `GET /api/analytics/balance_history/`, `GET /api/analytics/top_categories/`, `GET /api/analytics/budget_vs_actual/` |
| **Projects** | `GET/POST /api/projects/`, `GET/PUT/DELETE /api/projects/{id}/`, `GET/POST /api/projects/{id}/items/` |
| **Reports** | `GET /api/reports/export_csv/`, `GET /api/reports/monthly_report/`, `GET /api/reports/budget_report/`, `GET /api/reports/project_report/` |

## Development Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Environment & Scaffold | ✅ Completed |
| 2 | Core Financial Ledger | ✅ Completed |
| 2.5 | Transaction Modal Redesign (UI/UX) | ✅ Completed |
| 3 | Recurring Bills & Obligations | ✅ Completed |
| 4 | Budget & Planned Purchases | ✅ Completed |
| 5 | Lending & Borrowing | ✅ Completed |
| 6 | Analytics & Charts | ✅ Completed |
| 7 | Project Finance | ✅ Completed |
| 8 | Production Hardening & Security | ✅ Completed |
| 9 | Export & Reporting (CSV/PDF) | ✅ Completed |
| 10 | Transaction Editing, Profile & Settings | 🔄 In Progress |

## Verification Commands

```bash
# Frontend
cd frontend
pnpm typecheck      # TypeScript type checking
pnpm lint           # ESLint
pnpm test -- --run  # Vitest

# Backend
cd backend
.\venv\Scripts\python.exe manage.py check    # Django system check
.\venv\Scripts\python.exe -m ruff check .    # Linting
.\venv\Scripts\python.exe -m pytest          # 107 tests
```

## Financial Integrity Rules

- **No floating-point for money** — `DECIMAL(15,2)` in PostgreSQL; `decimal.js` in frontend
- **Atomic balance updates** — `select_for_update()` with deadlock prevention (sorted ID ordering)
- **100% ACID compliance** — All write operations wrapped in `@transaction.atomic`
- **24-hour edit window** — Transactions can only be edited/deleted within 24 hours of creation
- **Transfers** never recorded as income or expense
- **Unpaid bills** do NOT reduce account balances
- **Project finances** are completely separate from personal finances
- **Ownership isolation** — All queries filtered by `user` to prevent cross-user data leaks

## ACID Compliance

The backend achieves **100% ACID compliance** across all 16 write functions:

| Property | Score | Details |
|----------|-------|---------|
| **Atomicity** | 100% | All write functions wrapped in `@transaction.atomic` |
| **Consistency** | 100% | All money fields use `DecimalField(15,2)`; zero `FloatField` |
| **Isolation** | 100% | `select_for_update()` on all balance mutations; deadlock prevention via sorted ID ordering |
| **Durability** | 100% | Django ORM + PostgreSQL 16 ensures committed transactions survive crashes |

See [ACID_AUDIT_REPORT.md](ACID_AUDIT_REPORT.md) for the full audit details.
