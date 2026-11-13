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
* **Git Status:** Clean, root commit created, Phase 1 committed.

### Windows Environment Execution Commands
> [!IMPORTANT]
> The host OS is Windows with Device Guard. Native `.exe` files in user directories are blocked.
> Always use the exact wrappers below:
* **Frontend commands (from `frontend/` directory):**
  - Run with `pnpm.cmd`: `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd test`, `pnpm.cmd run build`
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
| **Phase 2** | Core Financial Ledger (Accounts, Transactions, Transfers, Balances) | **UP NEXT** |
| **Phase 3** | Recurring Bills & Future Financial Obligations | Pending |
| **Phase 4** | Monthly Budget Management & Planned Purchases | Pending |
| **Phase 5** | Lending, Borrowing & Person Management | Pending |
| **Phase 6** | Financial Analytics, Reports & Recharts | Pending |
| **Phase 7** | Independent Project Finance Workspace | Pending |
| **Phase 8** | Production Hardening, Security Audit & Closed-Loop QA | Pending |

---

## 3. Key Architectural Decisions & Non-Negotiable Rules

1. **ZERO FLOATING-POINT FOR MONEY (CRITICAL):**
   - Backend: All monetary values MUST use `DecimalField(max_digits=15, decimal_places=2)`. Never use `float`.
   - Frontend: All money values arrive from API as `string`. Never use native JS `number` or `parseFloat`. Always use `decimal.js` through `src/lib/money.ts`.
2. **Account Balances Derived From Ledger:**
   - Account current balance is derived from:
     $$\text{Balance} = \text{Opening} + \text{Income} + \text{Transfers In} + \text{Borrowed} + \text{Loan Collections} - \text{Expenses} - \text{Transfers Out} - \text{Lent} - \text{Repayments} - \text{Held Returned}$$
   - Cached `current_balance` on `FinancialAccount` is updated atomically in database transactions whenever ledger entries are created, updated, or deleted.
3. **Transfers & Loans Never Mixed with Income/Expense:**
   - Account transfers move money between accounts without altering net worth or appearing in income/expense reports.
   - Lending is an asset exchange, not an expense.
   - Borrowing is a liability creation, not income.
4. **UI Tokens & Slop Rejection:**
   - Palette: Deep Navy (`#172554`), Slate (`#64748B`), Off-white (`#F8FAFC`), Success (`#16A34A`), Warning (`#D97706`), Danger (`#DC2626`).
   - Every interactive flow must implement all 8 states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` (skeleton), `error` (actionable), and `empty`.

---

## 4. Phase 2 Detailed Implementation Plan (Next Agent Starts Here)

### Goal:
Build a fully operational, mathematically consistent personal financial ledger with account balance calculations, transaction entry, category/source management, and a responsive transactions table.

### Step 2.1 — Backend Ledger Business Logic (`backend/apps/transactions/` & `backend/apps/accounts/`)
1. **Atomic Balance Updates via Signals or Service Layer:**
   - When an `income` Transaction is created: `account.current_balance += amount`.
   - When an `expense` Transaction is created: `account.current_balance -= amount`.
   - When an `AccountTransfer` is created: `source_account.current_balance -= amount` and `dest_account.current_balance += amount` (wrapped in `@transaction.atomic`).
   - On edit/delete: safely reverse prior amount from old account and apply new amount to new account.
2. **Account Balance Recalculate Endpoint:**
   - Provide an audit/reconciliation service `POST /api/accounts/{id}/reconcile/` that recomputes balance strictly from opening balance + ledger.
3. **Ledger Query & Filtering:**
   - `GET /api/transactions/`: filter by `account_id`, `transaction_type`, `category_id`, `income_source_id`, `start_date`, `end_date`, `search` (in description).
4. **Backend Unit Tests:**
   - Write comprehensive tests in `apps/transactions/tests.py` and `apps/accounts/tests.py` verifying:
     - Scenarios 1, 2, 3 from Requirements spec:
       - Scenario 1: Initial opening balances (Cash: ৳2,500, Bank: ৳10,000, PayCash: ৳1,500 = Total ৳14,000).
       - Scenario 2: Income of ৳5,000 into Cash -> Cash becomes ৳7,500, Total becomes ৳19,000.
       - Scenario 3: Transfer ৳3,000 from Bank to Cash -> Bank ৳7,000, Cash ৳10,500, Total unchanged.
     - Edit/Delete rollback correctness.

### Step 2.2 — Frontend Ledger UI (`frontend/src/`)
1. **API Service Layer & TanStack Queries:**
   - Query hooks for accounts list, transactions list (with URL search params for pagination & filters), categories, and sources.
2. **Quick Add Transaction Modal (`frontend/src/components/transactions/QuickAddModal.tsx`):**
   - Three required fields: **Amount**, **Type & Category/Source**, **Account**.
   - Date defaults to today (editable).
   - Description is optional.
3. **Transactions History Table (`frontend/src/pages/TransactionsPage.tsx`):**
   - Table with Date, Type badge, Account, Category/Source, Description, Amount (green for income, red for expense, neutral for transfer).
   - Filter bar: Date range picker, Type dropdown, Account dropdown, Category dropdown, Search box.
   - Full 8-state handling: skeleton rows during loading, empty state with "Add your first transaction" CTA, error state with retry.
4. **Accounts Page (`frontend/src/pages/AccountsPage.tsx`):**
   - Account cards displaying current balance, type, and quick transfer action.

### Step 2.3 — Quality Gates & Verification
Before considering Phase 2 complete:
- [ ] Run `python manage.py check` -> must pass with 0 errors.
- [ ] Run `ruff check .` -> must pass.
- [ ] Run `pytest` -> all financial balance calculation tests must pass.
- [ ] Run `pnpm typecheck` -> must pass with 0 errors.
- [ ] Run `pnpm lint` -> must pass.
- [ ] Run `pnpm test` -> all unit tests must pass.
- [ ] Run `pnpm run build` -> production build must succeed.

---

## 5. Artifact Reference Documents
- Requirements Spec: `<appDataDir>\brain\b4773180-40c7-46d2-a3d7-f9e94943efaf\personal-finance-requirements.md`
- SDLC Protocol: `<appDataDir>\brain\b4773180-40c7-46d2-a3d7-f9e94943efaf\agentic-sdlc-protocol.md`
