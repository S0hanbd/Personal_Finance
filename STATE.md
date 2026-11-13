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
| **Phase 2A** | Backend Financial Ledger Services, Atomic Balance Calculations & Tests | **COMPLETED & VERIFIED** |
| **Phase 2B** | Frontend Quick Add Transaction Dialog & Category/Source UI | **UP NEXT** |
| **Phase 2C** | Frontend Transactions History Table (Filterable, Responsive) | Pending |
| **Phase 2D** | Frontend Accounts Overview & Transfer Modal | Pending |
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
   - Cached `current_balance` on `FinancialAccount` is updated atomically in database transactions via `apps/transactions/services.py` (`select_for_update()`).
3. **Transfers & Loans Never Mixed with Income/Expense:**
   - Account transfers move money between accounts without altering net worth or appearing in income/expense reports.
   - Lending is an asset exchange, not an expense.
   - Borrowing is a liability creation, not income.
4. **UI Tokens & Slop Rejection:**
   - Palette: Deep Navy (`#172554`), Slate (`#64748B`), Off-white (`#F8FAFC`), Success (`#16A34A`), Warning (`#D97706`), Danger (`#DC2626`).
   - Every interactive flow must implement all 8 states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` (skeleton), `error` (actionable), and `empty`.

---

## 4. Immediate Next Step for Incoming Agent: Session 2B

### Objective:
Build the frontend transaction entry mechanism — the **Quick Add Modal** and category/source selection.

### Key Files to Work On:
1. `frontend/src/lib/api.ts` (Ensure auth headers and response data types are cleanly typed)
2. `frontend/src/components/transactions/QuickAddModal.tsx`:
   - 3 required fields:
     - Amount (`string`, formatted with 2 decimal places, positive)
     - Transaction Type (`income` / `expense`) + Category or Income Source
     - Account dropdown
   - Optional fields:
     - Description (text)
     - Transaction Date (defaults to today's date YYYY-MM-DD, editable)
   - State matrix:
     - Submitting / pending state (disables submit button to prevent double-click)
     - Actionable error alert on failure with retry
     - On success: invalidates TanStack Query caches for `['accounts']` and `['transactions']` and closes modal.
3. Wire the Quick Add button into `frontend/src/components/layout/Header.tsx` or `AppLayout.tsx` so it is accessible from anywhere.

### Quality Gate Check Before Session 2B Sign-off:
- Run `pnpm.cmd typecheck` (must pass with 0 errors)
- Run `pnpm.cmd lint` (must pass)
- Run `pnpm.cmd test` (must pass)

---

## 5. Artifact Reference Documents
- Requirements Spec: `<appDataDir>\brain\b4773180-40c7-46d2-a3d7-f9e94943efaf\personal-finance-requirements.md`
- SDLC Protocol: `<appDataDir>\brain\b4773180-40c7-46d2-a3d7-f9e94943efaf\agentic-sdlc-protocol.md`
