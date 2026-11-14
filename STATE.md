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
| **Phase 5** | Lending, Borrowing & Person Management | **UP NEXT** |
| **Phase 6** | Financial Analytics, Reports & Recharts | Pending |
| **Phase 7** | Independent Project Finance Workspace | Pending |
| **Phase 8** | Production Hardening, Security Audit & Closed-Loop QA | Pending |

---

## 3. Detailed Progress Summary (Phase 2.5 — Modal Redesign)

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

## 3. Detailed Progress Summary (Phase 4 Completed)

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

## 4. Key Architectural Decisions & Non-Negotiable Rules

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

## 5. Immediate Next Step for Incoming Agent: Phase 5

### Objective:
Build **Phase 5 — Lending, Borrowing & Person Management**.

### Target Scope:
1. **Backend (`apps/lending/`):**
   - Models:
     - `Person`: user, name, phone, email, notes, total_lent (`DecimalField`), total_borrowed (`DecimalField`).
     - `LoanRecord`: user, person (FK), loan_type (`lent` vs. `borrowed`), initial_amount (`DecimalField`), remaining_amount (`DecimalField`), due_date, status (`active`, `settled`, `defaulted`), notes.
     - `LoanSettlement`: loan (FK), transaction (FK), amount (`DecimalField`), settlement_date, notes.
   - Atomic services to lend money (creates lending expense / deduction from account), borrow money (creates borrowing income / deposit to account), and record partial or full repayments.
   - Serializers, ViewSets, and integration tests.
2. **Frontend (`PeoplePage.tsx` & `useLendingQueries.ts`):**
   - Summary cards: Total Money Lent (Receivable), Total Money Borrowed (Payable), Net Counterparty Position.
   - Person cards / directory with individual debt balance sheets.
   - "Lend / Borrow" modal with counterparty selection or creation.
   - "Record Repayment / Collection" modal with account selection and balance update.

### Quality Gate Check Before Session Sign-off:
- Backend: `python manage.py check`, `ruff check .`, `pytest` (all pass)
- Frontend: `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd test`, `pnpm.cmd run build` (all pass)
- Mandatory git commit and push to `git push origin main`.
