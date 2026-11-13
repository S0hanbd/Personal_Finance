# STATE.md — Agent Context Handoff File

Updated by the circuit breaker when 2 consecutive fix attempts fail.
Start a fresh session referencing this file to continue.

## Current Phase
**Phase 1 — Environment Bootstrapping & Guardrails** (COMPLETED & VERIFIED)

## Architecture Decisions
- Backend: Django 5 + DRF + PostgreSQL (with SQLite compatibility for local testing)
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui tokens
- State Management: Zustand (auth) + TanStack Query (server state)
- Money Integrity: DecimalField on backend + decimal.js on frontend (NEVER native float)
- Workspace: c:\Users\Elitebook\Documents\Projects\Finance tracer\Personal finance
- Currency: BDT (৳) | Timezone: Asia/Dhaka

## Completed
- [x] Git repository initialized with clean `.gitignore`
- [x] AGENTS.md mandatory operating protocol committed
- [x] Full Django modular backend scaffold (core, auth, accounts, transactions, budgets, bills, obligations, lending, analytics, projects)
- [x] All monetary fields verified with `DecimalField(max_digits=15, decimal_places=2)`
- [x] Initial database migrations generated & applied
- [x] Full React 18 + TypeScript + Tailwind CSS frontend scaffold
- [x] `money.ts` utilities built on `decimal.js` with comprehensive unit tests
- [x] All 12 route pages, navigation sidebar, and shared UI components scaffolded
- [x] Verification gates passed:
  - Frontend: `pnpm typecheck` (0 errors), `pnpm lint` (clean), `pnpm test` (5/5 passed), `pnpm run build` (successful)
  - Backend: `python manage.py check` (0 issues), `ruff check .` (clean), `pytest` (13/13 passed)
- [x] Docker configuration (`docker-compose.yml`, backend/Dockerfile, frontend/Dockerfile)

## Blockers
None.

## Next Steps
Proceed to **Phase 2: Spec & Database Schema Design** / **Core Financial Ledger Implementation**:
1. Deep-dive into Transaction ledger mutation APIs (Income, Expense, Account Transfers).
2. Balance calculation and recalculation logic (strictly derived from ledger + opening balance).
3. Connect frontend transactions table and quick-add modal.
