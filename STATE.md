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
| **Phase 3** | Recurring Bills & Future Financial Obligations | **UP NEXT** |
| **Phase 4** | Monthly Budget Management & Planned Purchases | Pending |
| **Phase 5** | Lending, Borrowing & Person Management | Pending |
| **Phase 6** | Financial Analytics, Reports & Recharts | Pending |
| **Phase 7** | Independent Project Finance Workspace | Pending |
| **Phase 8** | Production Hardening, Security Audit & Closed-Loop QA | Pending |

---

## 3. Detailed Progress Summary (Phase 2 Completed)

### Phase 2 Accomplishments:
1. **Phase 2A — Atomic Ledger Services (`backend/apps/transactions/services.py`):**
   - Atomic balance updates using `select_for_update()`.
   - Idempotent transaction deletion & modification rollback.
   - Inter-account transfers with sorted account ID locking to prevent deadlock.
   - Account audit & reconcile service (`reconcile_account`).
   - 7 exhaustive backend integration tests (all 18 backend tests pass).
2. **Phase 2B — Quick Add Modal & CTA:**
   - 3-tab UI: Expense (red), Income (green), Transfer (navy).
   - Fast inline account, category, and income source creation without navigating away.
   - Global "+ Record Transaction" button in header layout and route pages.
3. **Phase 2C — Transactions Ledger Table (`frontend/src/pages/TransactionsPage.tsx`):**
   - Paginated, filterable table with search, account dropdown, transaction type selector, and date ranges.
   - Delete confirmation dialog with automatic balance rollback.
   - Complete 8-state matrix: default, hover, focus-visible, active, disabled, loading skeletons, actionable error retry, empty states (both initial and zero filter results).
4. **Phase 2D — Financial Accounts Management (`frontend/src/pages/AccountsPage.tsx`):**
   - Summary card with live total liquid balance (using `decimal.js`).
   - Grid cards with account type icons (cash, bank, mobile banking, other).
   - One-click Inter-Account Transfer modal pre-configured with selected source account.
   - One-click Audit/Reconcile action on each account.
   - "New Account" modal with name, type, opening balance, and description.
5. **Phase 2E — Live Dynamic Dashboard (`frontend/src/pages/DashboardPage.tsx`):**
   - Real-time Total Liquid Balance, Monthly Income, Monthly Expense, and Net Cashflow metrics.
   - Zero floating-point arithmetic throughout (`money.ts` / `decimal.js`).
   - Live account balance breakdown and 5 most recent transactions with type icons.
   - Direct quick-action shortcuts for Expense, Income, and Transfer.

---

## 4. Key Architectural Decisions & Non-Negotiable Rules

1. **ZERO FLOATING-POINT FOR MONEY (CRITICAL):**
   - Backend: All monetary values MUST use `DecimalField(max_digits=15, decimal_places=2)`. Never use `float`.
   - Frontend: All money values arrive from API as `string`. Never use native JS `number` or `parseFloat`. Always use `decimal.js` through `src/lib/money.ts`.
2. **Account Balances Derived From Ledger:**
   - Account current balance is derived from:
     $$\text{Balance} = \text{Opening} + \text{Income} + \text{Transfers In} + \text{Borrowed} + \text{Loan Collections} - \text{Expenses} - \text{Transfers Out} - \text{Lent} - \text{Repayments} - \text{Held Returned}$$
   - Cached `current_balance` on `FinancialAccount` is updated atomically in database transactions via `apps/transactions/services.py` (`select_for_update()`).
3. **Transfers & Loans Never Mixed with Income/Expense:**
   - Account transfers move money between accounts without altering net worth or appearing in income/expense reports.
   - Lending is an asset exchange, not an expense.
   - Borrowing is a liability creation, not income.
4. **UI Tokens & Slop Rejection:**
   - Palette: Deep Navy (`#172554`), Slate (`#64748B`), Off-white (`#F8FAFC`), Success (`#16A34A`), Warning (`#D97706`), Danger (`#DC2626`).
   - Every interactive flow must implement all 8 states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` (skeleton), `error` (actionable), and `empty`.

---

## 5. Immediate Next Step for Incoming Agent: Phase 3

### Objective:
Build **Phase 3 — Recurring Bills & Future Financial Obligations**.

### Target Scope:
1. **Backend (`apps/bills/` & `apps/obligations/`):**
   - Models:
     - `RecurringBill`: name, amount (`DecimalField`), frequency (`monthly`, `yearly`, etc.), due_day (1-31), category, default_account, is_active.
     - `BillPayment`: recurring_bill, transaction (FK), paid_date, amount, payment_month (YYYY-MM).
     - `FinancialObligation`: title, total_amount, due_date, status (`pending`, `partially_paid`, `paid`), priority (`urgent`, `high`, `medium`, `low`).
   - Service to generate monthly bill instances and track unpaid bills for the current month.
   - Serializers, ViewSets, and URLs for bills and obligations.
   - Unit tests covering bill payment creation and balance deduction.
2. **Frontend (`BillsPage.tsx` & `ObligationsPage.tsx`):**
   - Query hooks for bills & obligations (`useBills`, `useObligations`, `usePayBill`).
   - "Unpaid Bills This Month" section with "Mark as Paid" quick action (creates an expense transaction deducting from chosen account).
   - Monthly recurring bills calendar/list with recurring cycle info.
   - Future financial obligations list with due dates and priority tags.
   - Dashboard integration: wire "Unpaid Fixed Expenses" and "Remaining After Fixed Expenses" summary cards on `DashboardPage.tsx`.

### Quality Gate Check Before Session Sign-off:
- Backend: `python manage.py check`, `ruff check .`, `pytest` (all pass)
- Frontend: `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd test`, `pnpm.cmd run build` (all pass)
- Mandatory git commit and push to `git push origin main`.
