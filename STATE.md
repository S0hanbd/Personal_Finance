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
| **Phase 3** | Recurring Bills, Fixed Expenses & Future Financial Obligations | **COMPLETED & VERIFIED** |
| **Phase 4** | Monthly Budget Management & Planned Purchases | **UP NEXT** |
| **Phase 5** | Lending, Borrowing & Person Management | Pending |
| **Phase 6** | Financial Analytics, Reports & Recharts | Pending |
| **Phase 7** | Independent Project Finance Workspace | Pending |
| **Phase 8** | Production Hardening, Security Audit & Closed-Loop QA | Pending |

---

## 3. Detailed Progress Summary (Phase 3 Completed)

### Phase 3 Accomplishments:
1. **Recurring Expenses & Fixed Bills Backend (`apps/bills/`):**
   - Models: `RecurringExpense` and `RecurringExpenseOccurrence` with unique constraint on `(recurring_expense, period)` to prevent duplicate occurrences.
   - Core Invariant Preserved: Generating occurrences NEVER deducts money from accounts; deduction occurs only upon explicit payment.
   - `pay_bill_occurrence`: Atomic transaction that records an expense transaction, decrements account balance, and links transaction.
   - Auto-detection of overdue bills when `due_date < today`.
   - Dedicated endpoints: `GET /api/bills/occurrences/current-month/` (auto-generates current month occurrences with summary of unpaid/paid totals), `POST /api/bills/occurrences/{id}/pay/`.
2. **Future Financial Obligations Backend (`apps/obligations/`):**
   - Models: `FinancialObligation` with priority (`urgent`, `high`, `medium`, `low`), due dates, and statuses (`pending`, `paid`, `overdue`).
   - `pay_obligation`: Atomic settlement that records an expense transaction and marks obligation as paid.
   - Endpoints: `GET /api/obligations/summary/` (pending total and count), `POST /api/obligations/{id}/pay/`.
3. **Backend Unit Tests:**
   - 23/23 tests passing (including 4 new bill tests and 3 new obligation tests verifying zero deduction on occurrence generation, atomic balance deduction on payment, prevention of double payments, and overdue checks).
4. **Frontend Recurring Bills (`BillsPage.tsx` & `useBillsQueries.ts`):**
   - Summary cards: Unpaid This Month, Paid This Month, Active Bill Rules.
   - Two-tab layout: This Month's Bills & Recurring Rules.
   - "Mark as Paid" modal: Account selection (pre-selected with preferred account), payment date, notes.
   - "New Recurring Bill" modal with frequency, due day (1-31), category, preferred account.
   - Full 8-state matrix implemented.
5. **Frontend Future Obligations (`ObligationsPage.tsx` & `useObligationsQueries.ts`):**
   - Summary cards: Total Pending Obligations, Total Settled, Status Filter pills.
   - Interactive table with priority badges, dynamic timeline/days-remaining countdowns.
   - "Mark Paid" modal with account deduction.
   - "Add Future Obligation" modal.
6. **Dashboard Live Financial Integration (`DashboardPage.tsx`):**
   - Integrated "Unpaid Fixed Expenses" card with real-time bill occurrence totals.
   - Integrated "Remaining After Fixed Expenses" (`Total Liquid Balance - Unpaid Fixed Bills`) using `decimal.js`.
   - Integrated "Future Obligations" card with pending count.

---

## 4. Key Architectural Decisions & Non-Negotiable Rules

1. **ZERO FLOATING-POINT FOR MONEY (CRITICAL):**
   - Backend: All monetary values MUST use `DecimalField(max_digits=15, decimal_places=2)`. Never use `float`.
   - Frontend: All money values arrive from API as `string`. Never use native JS `number` or `parseFloat`. Always use `decimal.js` through `src/lib/money.ts`.
2. **Account Balances Derived From Ledger:**
   - Account current balance is derived from:
     $$\text{Balance} = \text{Opening} + \text{Income} + \text{Transfers In} + \text{Borrowed} + \text{Loan Collections} - \text{Expenses} - \text{Transfers Out} - \text{Lent} - \text{Repayments} - \text{Held Returned}$$
   - Cached `current_balance` on `FinancialAccount` is updated atomically in database transactions via `apps/transactions/services.py` (`select_for_update()`).
3. **Transfers, Recurring Occurrences & Obligations Separation:**
   - Account transfers move money between accounts without altering net worth or appearing in income/expense reports.
   - Generating recurring bill occurrences does NOT deduct money until explicitly paid.
   - Future obligations are kept distinct from monthly recurring bills.
4. **UI Tokens & Slop Rejection:**
   - Palette: Deep Navy (`#172554`), Slate (`#64748B`), Off-white (`#F8FAFC`), Success (`#16A34A`), Warning (`#D97706`), Danger (`#DC2626`).
   - Every interactive flow must implement all 8 states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` (skeleton), `error` (actionable), and `empty`.

---

## 5. Immediate Next Step for Incoming Agent: Phase 4

### Objective:
Build **Phase 4 — Monthly Budget Management & Planned Purchases**.

### Target Scope:
1. **Backend (`apps/budgets/`):**
   - Models:
     - `MonthlyBudget`: user, year, month (1-12), total_amount (`DecimalField`), created_at.
     - `BudgetCategory`: budget (FK), category (FK to `ExpenseCategory`), allocated_amount (`DecimalField`).
     - `PlannedPurchase`: user, name, expected_amount (`DecimalField`), target_date, category, priority (`urgent`, `high`, `medium`, `low`), status (`planned`, `saving`, `ready`, `purchased`, `cancelled`), notes.
   - Service to compute variable spending in current month vs. budget limit (excluding fixed recurring bills as per requirements spec).
   - Alert thresholds: Normal (<80%), Approaching Warning (>=80%), Exceeded Alert (>100%).
   - Serializers, ViewSets, and URLs.
   - Integration tests.
2. **Frontend (`BudgetPage.tsx` & `PlannedSpendingPage.tsx`):**
   - Budget progress bar (color-coded: emerald <80%, amber 80-99%, rose >=100%).
   - Category budget allocations and actual spending comparison.
   - Planned purchase cards with status transitions and target dates.
   - Dashboard integration: Connect "Budget Remaining" card on `DashboardPage.tsx`.

### Quality Gate Check Before Session Sign-off:
- Backend: `python manage.py check`, `ruff check .`, `pytest` (all pass)
- Frontend: `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd test`, `pnpm.cmd run build` (all pass)
- Mandatory git commit and push to `git push origin main`.
