# STATE.md — Agent Context & State Handoff File

> **FOR INCOMING AI AGENTS:** Read this file FIRST before taking any action.
> This repository uses strict atomic task gating defined in `AGENTS.md`.
> Follow all instructions below to continue development without instruction drift or regression.

---

## 1. Project Context & Environment

* **Project:** Personal Finance Management System
* **Workspace Root:** `c:\Users\Elitebook\Documents\Projects\Finance tracer\Personal finance`
* **Default Currency:** BDT (৳) | **Timezone:** Asia/Dhaka
* **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui tokens + Recharts
* **Backend:** Django 5 + Django REST Framework + PostgreSQL / SQLite (for local checks)
* **Git Remote:** `https://github.com/S0hanbd/Personal_Finance.git` (tracked on `main`)
* **Mandatory Rule:** At the end of every session, commit all changes, update STATE.md, and push to `git push origin main`.
* **Git Status:** Clean, all commits synced with `origin/main`.

### Windows Environment Execution Commands
> [!IMPORTANT]
> The host OS is Windows with Device Guard. Native `.exe` files in user directories are blocked.
> Always use the exact wrappers below:
* **Frontend commands (from `frontend/` directory):**
  - Run with `pnpm.cmd`: `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd test -- --run`, `pnpm.cmd run build`
* **Backend commands (from `backend/` directory):**
  - Python venv is at `backend/venv`
  - System check: `.\venv\Scripts\python.exe manage.py check`
  - Migrations: `.\venv\Scripts\python.exe manage.py migrate`
  - Unit tests: `.\venv\Scripts\python.exe -m pytest`
  - Linter: `.\venv\Scripts\python.exe -m ruff check .`

---

## 2. Current Status & Phase Tracking

| Phase | Description | Status |
|:---:|---|:---:|
| **Phase 1** | Environment Bootstrapping, Harness, Quality Gates & Scaffolding | **COMPLETED & VERIFIED** |
| **Phase 2** | Financial Ledger, Quick Add, Transactions Table, Accounts & Dashboard | **COMPLETED & VERIFIED** |
| **Phase 2.5** | Record Transaction Modal Redesign (UI/UX) | **COMPLETED & VERIFIED** |
| **Phase 3** | Recurring Bills, Fixed Expenses & Future Financial Obligations | **COMPLETED & VERIFIED** |
| **Phase 4** | Monthly Budget Management & Planned Purchases | **COMPLETED & VERIFIED** |
| **Phase 5** | Lending, Borrowing & Person Management | **COMPLETED & VERIFIED** |
| **Phase 6** | Financial Analytics, Reports & Recharts | **COMPLETED & VERIFIED** |
| **Phase 7** | Independent Project Finance Workspace | **COMPLETED & VERIFIED** |
| **Phase 8** | Production Hardening, Security Audit & Closed-Loop QA | **COMPLETED & VERIFIED** |
| **Phase 9** | Export & Reporting | **COMPLETED & VERIFIED** |
| **Phase 10** | Transaction Editing, Profile Management & Dashboard Settings | **IN PROGRESS** (Step 1–2 done, Step 3 pending) |

---

## 3. Project File Map (NO NEED TO EXPLORE)

### Backend Apps (Django REST Framework)
| App | Models | Key Files | API Base |
|-----|--------|-----------|----------|
| `accounts` | FinancialAccount | models.py, services.py, views.py | `/api/accounts/` |
| `authentication` | Profile | models.py, views.py | `/api/auth/` |
| `transactions` | Transaction, Category, IncomeSource | models.py, services.py, views.py | `/api/transactions/` |
| `bills` | RecurringBill, BillOccurrence | models.py, services.py, views.py | `/api/bills/` |
| `budgets` | MonthlyBudget, BudgetCategory, PlannedPurchase | models.py, services.py, views.py | `/api/budgets/` |
| `obligations` | FinancialObligation, OblangementPayment | models.py, services.py, views.py | `/api/obligations/` |
| `lending` | Person, LoanRecord, LoanSettlement | models.py, services.py, views.py | `/api/lending/` |
| `analytics` | (none — aggregation only) | services.py, views.py | `/api/analytics/` |
| `projects` | Project, ProjectItem | models.py, serializers.py, views.py | `/api/projects/` |
| `core` | — | utils.py (shared utilities) | — |

### Backend Services (Business Logic)
- `transactions/services.py`: `create_transaction()`, `create_transfer()` — atomic balance updates via `select_for_update()`
- `bills/services.py`: `generate_bill_occurrences()`, `pay_bill_occurrence()` — schedule + payment flow
- `budgets/services.py`: `calculate_budget_performance()` — variable spending exclusion of recurring bills
- `lending/services.py`: `lend_money()`, `borrow_money()`, `record_settlement()` — loan lifecycle
- `analytics/services.py`: 6 aggregation functions — monthly income/expense, spending by category, spending trends, account balance history, top categories, budget vs actual

### Frontend Structure
```
frontend/src/
  main.tsx                    — Entry point
  App.tsx                     — Router + QueryClient provider
  index.css                   — Tailwind + shadcn/ui base
  router/index.tsx            — Route definitions (all pages)
  
  pages/                      — Page components (1 per route)
    DashboardPage.tsx         — KPIs, recent transactions, budget card
    TransactionsPage.tsx      — Transaction list + filters
    AccountsPage.tsx          — Account CRUD + balance overview
    BillsPage.tsx             — Recurring bills management
    BudgetPage.tsx            — Monthly budget + variable spending
    PlannedSpendingPage.tsx   — Planned purchases lifecycle
    ObligationsPage.tsx       — Financial obligations
    PeoplePage.tsx            — Lending/borrowing + person directory
    AnalyticsPage.tsx         — 6 chart types with period selector
    ProjectsPage.tsx          — Project planning with item tracking
    SettingsPage.tsx          — User settings
    auth/LoginPage.tsx        — Login form
    auth/RegisterPage.tsx     — Registration form

  components/
    layout/                   — AppLayout, Header, Sidebar
    shared/                   — EmptyState, ErrorState, SummaryCard, KeyboardShortcutsHelp, ExportButton
    transactions/             — QuickAddModal (hooks wrapper + content pattern)
    analytics/                — PeriodSelector, 6 Recharts chart components
    reports/                  — ReportOptionsModal
    settings/                 — ProfileSettings, PasswordSettings, DashboardSettings, NavigationSettings

  hooks/                      — React Query hooks (1 per domain)
    useAuth.ts                — Auth mutations + protected query wrapper
    useFinanceQueries.ts      — Accounts, categories, income sources
    useTransactions.ts        — Transaction CRUD queries
    useBillsQueries.ts        — Bill CRUD + occurrence queries
    useBudgetQueries.ts       — Budget + planned purchase queries
    useObligationsQueries.ts  — Obligation queries
    useLendingQueries.ts      — Person + loan queries
    useAnalyticsQueries.ts    — Analytics chart data queries
    useProjectsQueries.ts     — Project and project item queries
    useSettingsQueries.ts     — Profile, password, user settings queries
    useCalculatorInput.ts     — Calculator input logic (shared)
    useKeyboardShortcuts.ts   — Global keyboard shortcuts

  types/                      — TypeScript interfaces (money as string)
    accounts.ts, auth.ts, bills.ts, budgets.ts,
    lending.ts, obligations.ts, transactions.ts,
    analytics.ts, projects.ts, reports.ts, settings.ts, index.ts

  lib/
    api.ts                    — Axios instance + interceptors
    money.ts                  — Decimal.js wrappers (formatBDT, parseAmount, etc.)
    constants.ts              — App constants
    utils.ts                  — cn() (clsx + tailwind-merge)

  store/
    authStore.ts              — Zustand auth store (token, user, refreshAccessToken)
    settingsStore.ts          — Zustand settings store (dashboard cards, sidebar items)
```

### API Endpoints Summary
| Domain | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/logout/`, `GET /api/auth/me/`, `GET/PATCH /api/auth/profile/`, `POST /api/auth/change_password/`, `GET/PATCH /api/auth/settings/` |
| Accounts | `GET/POST /api/accounts/`, `GET/PUT/PATCH/DELETE /api/accounts/{id}/` |
| Transactions | `GET/POST /api/transactions/`, `GET/PUT/PATCH/DELETE /api/transactions/{id}/` |
| Bills | `GET/POST /api/bills/`, `GET/PUT/DELETE /api/bills/{id}/`, `POST /api/bills/{id}/pay/` |
| Budgets | `GET/POST /api/budgets/monthly/`, `GET /api/budgets/monthly/performance/`, `GET/POST /api/budgets/planned-purchases/`, `POST /api/budgets/planned-purchases/{id}/purchase/` |
| Obligations | `GET/POST /api/obligations/`, `GET/PUT/DELETE /api/obligations/{id}/`, `POST /api/obligations/{id}/pay/` |
| Lending | `GET/POST /api/lending/people/`, `GET/POST /api/lending/loans/`, `POST /api/lending/loans/{id}/settle/` |
| Analytics | `GET /api/analytics/monthly_trend/`, `GET /api/analytics/category_breakdown/`, `GET /api/analytics/spending_trends/`, `GET /api/analytics/balance_history/`, `GET /api/analytics/top_categories/`, `GET /api/analytics/budget_vs_actual/` |
| Projects | `GET/POST /api/projects/`, `GET/PUT/DELETE /api/projects/{id}/`, `GET/POST /api/projects/{id}/items/`, `GET/PUT/DELETE /api/projects/{id}/items/{item_id}/` |
| Reports | `GET /api/reports/export_csv/`, `GET /api/reports/monthly_report/`, `GET /api/reports/budget_report/`, `GET /api/reports/project_report/` |

### Key Patterns to Follow
1. **Backend app structure:** models → serializers → services → views → urls → tests
2. **Frontend hooks pattern:** `useXxxQueries.ts` — React Query hooks per domain, follow `useFinanceQueries.ts` pattern
3. **Frontend types:** Money fields always `string`, interfaces in `types/`, re-exported from `types/index.ts`
4. **Modal pattern:** Hooks wrapper + content component (see `QuickAddModal.tsx`)
5. **Money handling:** Backend `DecimalField` + Python `Decimal`. Frontend `decimal.js` via `lib/money.ts`.

---

## 4. Detailed Progress Summary (Phase 2.5 — Modal Redesign)

### QuickAddModal Redesign (`frontend/src/components/transactions/QuickAddModal.tsx`):
- **Title:** "Record transaction" (sentence case), subtitle removed.
- **Transaction type:** Accessible `fieldset`/`radiogroup` with `role="radio"`, `aria-checked`, and visible Check icon on selected tab — recognizable without color alone. Unselected tabs use `text-foreground` (not muted) for ≥4.5:1 contrast.
- **Amount field:** Label "Amount (BDT)", empty placeholder, persistent help text ("Enter a number or expression"). Calculator preview shows "Total ৳X,XXX.XX". Calculator icon has `aria-label="Open calculator"`.
- **Amount validation:** Replaced `parseFloat` with `Decimal.js` — no floating-point for money.
- **Category/Source:** Marked optional per backend schema (`null` FK). Labels: "Category (optional)" / "Income source (optional)". Empty option: "No category" / "No source".
- **Account labels:** "Paid from" (expense), "Received into" (income), "From account" / "To account" (transfer).
- **Date & Note:** "Transaction date" and "Note (optional)".
- **Creation flows:** Category and account creation inline beside triggering field. Enter key isolated to trigger only the editor's save. Focus management with refs. Cancel restores prior selection.
- **Submit guard:** `isPending` check prevents duplicate submissions.
- **Success feedback:** Confirmation message ("Expense of ৳X saved.") shown before close.
- **Submit labels:** "Add expense" / "Add income" / "Record transfer".
- **Accessibility:** `min-h-[24px]`/`min-w-[24px]` hit areas, backdrop click-to-close, Escape closes, `aria-live="polite"` for calculator preview, proper `role="dialog"` with `aria-modal="true"`.
- **Responsive:** Date and Note fields in `grid-cols-2` with `min-w-0` to prevent overflow at 320px.

## 5. Detailed Progress Summary (Phase 4 Completed)

### Phase 4 Accomplishments:
1. **Monthly Budget Backend (`apps/budgets/`):**
   - Models:
     - `MonthlyBudget`: `(user, year, month, total_amount, notes)` with unique constraint on `(user, year, month)`.
     - `BudgetCategory`: `(budget, category, allocated_amount)` with unique constraint on `(budget, category)`.
     - `PlannedPurchase`: `(user, name, estimated_amount, target_date, category, priority, status, notes, purchased_transaction, purchased_at)`.
   - Variable Spending Calculation:
     - `calculate_budget_performance(user, year, month)` differentiates variable expenses from recurring bills (`bill_occurrence__isnull=True`), preventing double counting.
     - Threshold status classification: Normal (`<80%`), Warning (`80%–100%`), Exceeded (`>100%`).
     - Category-by-category breakdown computation with allocated vs. actual variable spend.
   - Settle Planned Purchase Service:
     - `settle_planned_purchase`: Atomically creates an expense transaction in the selected account, reduces balance, and marks item as purchased.
   - Endpoints:
     - `GET /api/budgets/monthly/performance/?year=&month=`
     - `POST /api/budgets/monthly/` (with nested category allocations)
     - `GET /api/budgets/planned-purchases/` (supports `status` and `priority` filters)
     - `POST /api/budgets/planned-purchases/{id}/purchase/`
2. **Backend Unit Tests:**
   - 26/26 backend pytest cases passing across accounts, authentication, bills, obligations, budgets, and transactions.
   - Verified threshold transitions, exclusion of recurring bill occurrences, and double-settlement prevention.
3. **Frontend Monthly Budget Management (`BudgetPage.tsx` & `useBudgetQueries.ts`):**
   - Month/Year selector with quick previous/next navigation and "This Month" jump.
   - 4 summary cards: Monthly Budget Limit, Variable Spent, Budget Remaining (with status pill), and Fixed Recurring Bills.
   - Visual health progress gauge with color coding: Emerald (`<80%`), Amber (`80%–99%`), Rose (`≥100%`).
   - Category breakdown list with individual progress meters and status badges.
   - "Configure Monthly Budget" modal with dynamic category allocation inputs and validation.
   - Full 8-state matrix (`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` skeleton, `error` retry, `empty`).
4. **Frontend Planned Spending (`PlannedSpendingPage.tsx`):**
   - Summary cards: Total Planned In-Flight, Ready to Buy, Saving Up, Settled Purchased.
   - Filter bar: status pills (`All`, `Planned`, `Saving Up`, `Ready to Buy`, `Purchased`, `Cancelled`) + Priority dropdown.
   - Planned item cards with target date countdowns (overdue, today, days remaining), priority badges, and notes.
   - Lifecycle action transitions (`Start Saving`, `Mark Ready`, `Buy & Deduct`).
   - "Complete Planned Purchase" modal with account selection and atomic deduction.
   - "Add Planned Purchase" modal.
5. **Dashboard Live Integration (`DashboardPage.tsx`):**
   - Live "Budget Remaining" card integrated into top KPI grid, reflecting variable spending against current month's budget ceiling.

---

## 6. Key Architectural Decisions & Non-Negotiable Rules

1. **ZERO FLOATING-POINT FOR MONEY (CRITICAL):**
   - Backend: All monetary values MUST use `DecimalField(max_digits=15, decimal_places=2)`. Never use `float`.
   - Frontend: All money values arrive from API as `string`. Never use native JS `number` or `parseFloat`. Always use `decimal.js` through `src/lib/money.ts`.
2. **Account Balances Derived From Ledger:**
   - Cached `current_balance` on `FinancialAccount` is updated atomically in database transactions via `apps/transactions/services.py` (`select_for_update()`).
3. **Transfers, Recurring Occurrences, Obligations & Budgets Separation:**
   - Recurring bill occurrences never deduct balances until explicitly paid.
   - Variable budget ceilings measure daily variable spending and explicitly exclude recurring bill payments to prevent double counting.
   - Planned purchases remain advisory until explicitly settled via "Buy & Deduct".
4. **UI Tokens & Slop Rejection:**
   - Palette: Deep Navy (`#172554`), Slate (`#64748B`), Off-white (`#F8FAFC`), Success (`#16A34A`), Warning (`#D97706`), Danger (`#DC2626`).
   - Every interactive flow implements all 8 states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` (skeleton), `error` (actionable), and `empty`.

---

## 7. Phase 5 Completed — Lending, Borrowing & Person Management

### What Was Built:
1. **Backend (`apps/lending/`):**
   - Models: `Person` (user, name, phone, email, total_lent, total_borrowed), `LoanRecord` (person, loan_type, initial_amount, remaining_amount, due_date, status), `LoanSettlement` (loan, transaction FK, amount, settlement_date).
   - Services: `lend_money()` — deducts account via `lending` transaction; `borrow_money()` — adds to account via `borrowing` transaction; `record_settlement()` — creates `loan_collection`/`loan_repayment`, decrements remaining, auto-settles at zero.
   - Serializers: 6 serializers (Person, LoanRecord, LoanSettlement, LendMoney, BorrowMoney, SettleLoan).
   - ViewSets: PersonViewSet (CRUD + summary), LoanRecordViewSet (lend/borrow/settle actions), LoanSettlementViewSet (read-only).
   - Tests: 11/11 passing (6 service + 5 API integration).
2. **Frontend:**
   - `src/types/lending.ts`: Person, LoanRecord, LoanSettlement, LendingSummary interfaces.
   - `src/hooks/useLendingQueries.ts`: usePeople, useLendingSummary, useLoans, useLendMoney, useBorrowMoney, useSettleLoan, useCreatePerson.
   - `src/pages/PeoplePage.tsx`: Summary cards (Total Lent, Total Borrowed, Net Position), person directory table, active loans table, Lend/Borrow modals with calculator input, Settle modal.

### Verification:
- Backend: `python manage.py check` ✓, `ruff check .` ✓, `pytest` 11/11 ✓
- Frontend: `npm run typecheck` ✓, `npm run lint` ✓
- Git: committed and pushed to `origin/main`

### Phase 6 — Financial Analytics, Reports & Recharts (Completed):
1. **Backend (`apps/analytics/`):** 6 aggregation services (monthly income/expense, spending by category, spending trends with auto-granularity, account balance history, top categories, budget vs actual). AnalyticsViewSet with 6 `@action` endpoints. 17 tests passing.
2. **Frontend:** `types/analytics.ts`, `hooks/useAnalyticsQueries.ts`, 6 Recharts chart components (ComposedChart, PieChart, LineChart, AreaChart, horizontal BarChart, grouped BarChart), PeriodSelector, full AnalyticsPage with 2-column grid.

### Phase 7 — Independent Project Finance Workspace (Completed):
1. **Backend (`apps/projects/`):** Models — `Project`, `ProjectItem`. Transaction model updated with nullable `project_item` FK. 4 serializers with computed `actual_spent`, `total_estimated`, `remaining`, `percent_spent`. ProjectViewSet and ProjectItemViewSet. 13 tests passing.
2. **Frontend:** `types/projects.ts`, `hooks/useProjectsQueries.ts`, full ProjectsPage with project list, summary cards, detail view with editable items table, per-item progress bars. QuickAddModal updated with optional project item selector.

### Phase 8 — Production Hardening, Security Audit & Closed-Loop QA (Completed):
1. **Security:** Fixed ALLOWED_HOSTS wildcard, added HSTS (1 year), proxy headers, CSRF_TRUSTED_ORIGINS. DRF throttling (AnonRateThrottle, UserRateThrottle). LoginThrottle/RegisterThrottle for auth endpoints. Whitenoise for static files.
2. **Docker:** Updated Dockerfile with gunicorn entrypoint (4 workers). Added `backend-prod` service to docker-compose.yml with health check.
3. **Frontend Security:** Token refresh interceptor in `api.ts` with retry queue and lock flag. `refreshAccessToken` action in authStore.
4. **Tests:** Added ownership tests for accounts, transactions, lending, and projects. Added `other_user`/`other_auth_client` fixtures. 67 total tests passing.
5. **Config:** Created `.env.example` template. Added `gunicorn` and `whitenoise` to requirements.txt.

### Phase 9 — Export & Reporting (Completed):
1. **Backend (`apps/reports/`):** 4 services — `export_transactions_csv()` (Django csv module), `generate_monthly_report()` (reportlab PDF with income/expense summary and category breakdown), `generate_budget_report()` (budget vs actual tables), `generate_project_report()` (item-level breakdown with transactions). ReportsViewSet with 4 `@action` endpoints. 19 tests passing.
2. **Frontend:** `types/reports.ts`, `hooks/useReportsQueries.ts` (blob download functions), reusable `ExportButton` component with dropdown. Integrated into TransactionsPage (CSV), AnalyticsPage (monthly PDF), BudgetPage (budget PDF), ProjectsPage (project PDF).
3. **Dependencies:** Added `reportlab==4.2.2` to requirements.txt.

### Phase 10 — Transaction Editing, Profile Management & Dashboard Settings (In Progress):

**Step 1 (Completed) — Backend:**
1. **Transaction 24-hour edit window:** `_check_24_hour_window()` added to `update_transaction()` and `delete_transaction()` in `transactions/services.py`. Rejects edits/deletes older than 24 hours with ValidationError.
2. **Profile model extension:** Added `first_name`, `last_name`, `phone`, `bio`, `profile_picture` (ImageField) to User model. Created `UserSettings` model with `dashboard_cards` and `sidebar_items` JSONFields.
3. **API endpoints:** `GET/PATCH /api/auth/profile/`, `POST /api/auth/change_password/`, `GET/PATCH /api/auth/settings/`. Serializers: ProfileSerializer, PasswordChangeSerializer, UserSettingsSerializer.
4. **Dependencies:** Added `Pillow>=10.0.0` to requirements.txt. Migration created.

**Step 2 (Completed) — Frontend Settings Infrastructure:**
1. **Types:** `src/types/settings.ts` — UserProfile, PasswordChange, UserSettings, DashboardCard, SidebarItem interfaces + DASHBOARD_CARDS and SIDEBAR_ITEMS constants.
2. **Hooks:** `src/hooks/useSettingsQueries.ts` — useUserProfile, useUpdateProfile (FormData support), useChangePassword, useUserSettings, useUpdateSettings.
3. **Store:** `src/store/settingsStore.ts` — Zustand store caching dashboardCards and sidebarItems with loadSettings, updateDashboardCards, updateSidebarItems actions.
4. **Components:** `src/components/settings/` — ProfileSettings (avatar upload, name, phone, bio), PasswordSettings (current/new/confirm), DashboardSettings (toggle switches for 7 cards), NavigationSettings (toggle + up/down reorder for 11 nav items).
5. **Page:** `src/pages/SettingsPage.tsx` — Full rewrite with tab navigation (Profile, Password, Dashboard, Navigation). Loads settings into store on mount.
6. **Verification:** `npx tsc --noEmit` ✓, `npx eslint` ✓

**Step 3 (Pending — for other agent) — Frontend Integration:**
1. `src/hooks/useTransactions.ts` — Add `useUpdateTransaction()` mutation.
2. `src/pages/TransactionsPage.tsx` — Add edit button and edit modal (24-hour window check).
3. `src/components/layout/Sidebar.tsx` — Read from settingsStore to filter/order nav items.
4. `src/pages/DashboardPage.tsx` — Read from settingsStore to conditionally render SummaryCards.
