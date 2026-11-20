---
sessionId: session-261115-142125-vb74
---

# Technical Overview

## Application Architecture Summary

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui tokens + Recharts
- **Backend:** Django 5 + Django REST Framework + PostgreSQL (production) / SQLite (local)
- **Package Manager:** pnpm (frontend), pip (backend)
- **Currency:** BDT (৳) | **Timezone:** Asia/Dhaka
- **Money Handling:** Backend `DecimalField(15,2)`, Frontend `decimal.js` via `lib/money.ts` — **zero floating-point for money**

---

### Backend — 10 Django Apps

| App | Models | Purpose |
|-----|--------|---------|
| `accounts` | FinancialAccount | Account CRUD, balance tracking |
| `authentication` | Profile, UserSettings | Auth, profile, password, dashboard/nav settings |
| `transactions` | Transaction, Category, IncomeSource | Transaction ledger (9 types), categories, income sources |
| `bills` | RecurringBill, BillOccurrence | Recurring bills, scheduled occurrences, payment flow |
| `budgets` | MonthlyBudget, BudgetCategory, PlannedPurchase | Monthly budget ceiling, category allocations, planned purchases |
| `obligations` | FinancialObligation, ObligationPayment | One-time/future financial commitments |
| `lending` | Person, LoanRecord, LoanSettlement | Lending/borrowing between people, settlements |
| `analytics` | (none — aggregation only) | 6 aggregation services (charts data) |
| `projects` | Project, ProjectItem | Independent project finance tracking |
| `core` | — | Shared utilities |

**Key backend patterns:**
- Service layer (`services.py`) for business logic — atomic balance updates via `select_for_update()`
- ViewSets with `@action` decorators for custom endpoints (pay, settle, etc.)
- 67+ passing pytest tests across all apps
- Security: HSTS, rate limiting, token refresh, whitenoise static files

---

### Frontend — 14 Pages

| Route | Page | Lines | Description |
|-------|------|-------|-------------|
| `/dashboard` | DashboardPage | 400 | 7 KPI cards, accounts panel, recent transactions, quick-add buttons |
| `/transactions` | TransactionsPage | 549 | Transaction table, filters, pagination, delete dialog, CSV export |
| `/accounts` | AccountsPage | 490 | Account card grid, CRUD modal, reconcile action |
| `/bills` | BillsPage | 767 | Recurring bill list, current month occurrences, pay modal, create modal |
| `/budget` | BudgetPage | 653 | Budget performance gauge, category breakdown, config modal, PDF export |
| `/planned-spending` | PlannedSpendingPage | 960 | Planned purchase cards, lifecycle transitions, filter bar, settle modal |
| `/obligations` | ObligationsPage | 685 | Obligation cards, priority badges, countdown, pay modal, create modal |
| `/people` | PeoplePage | 793 | Person directory, loan table, lend/borrow/settle modals |
| `/analytics` | AnalyticsPage | 238 | 6 Recharts in 2-column grid, period selector, PDF export |
| `/projects` | ProjectsPage | 852 | Project list, detail view, item table, progress bars, CRUD modals |
| `/settings` | SettingsPage | 69 | Tab navigation (Profile, Password, Dashboard, Navigation) |
| `/login` | LoginPage | — | Auth login form |
| `/register` | RegisterPage | — | User registration |
| `/` | Redirect | — | Redirects to `/dashboard` |

---

### Layout & Navigation

- **AppLayout** (`components/layout/AppLayout.tsx`): Wraps all authenticated routes with Sidebar + Header + main content area. Provides global QuickAddModal and keyboard shortcuts.
- **Sidebar** (`components/layout/Sidebar.tsx`): Fixed left sidebar (desktop), 7 collapsible nav groups, 11 navigation items with keyboard shortcut hints (`G+X`). Deep Navy (`#172554`) background.
- **Header** (`components/layout/Header.tsx`): Sticky top bar with breadcrumbs, "Record Transaction" CTA button, user avatar, and logout.

---

### Shared Components

| Component | Purpose |
|-----------|---------|
| `SummaryCard` | KPI card with title, value, subtitle, variant (default/success/warning/danger), loading skeleton |
| `DeleteDialog` | Confirmation modal for destructive actions |
| `EmptyState` | Empty data placeholder |
| `ErrorState` | Error banner with retry |
| `ExportButton` | Dropdown export button (CSV/PDF) |
| `KeyboardShortcutsHelp` | Modal showing all keyboard shortcuts |

---

### Analytics (6 Charts)

All in `components/analytics/`, using Recharts:
1. `MonthlyIncomeExpenseChart` — ComposedChart (bar + line)
2. `SpendingByCategoryChart` — PieChart
3. `SpendingTrendsChart` — LineChart with auto-granularity
4. `AccountBalanceChart` — AreaChart
5. `TopCategoriesChart` — Horizontal BarChart
6. `BudgetVsActualChart` — Grouped BarChart

---

### Modal Pattern (Hooks Wrapper + Content Component)

Used in `QuickAddModal`, `PeoplePage`, and `AnalyticsPage`:
1. **Wrapper component** — calls ALL hooks unconditionally at top level
2. **Content component** — receives all state as props, never calls hooks, safe for conditional rendering

This prevents "Rendered more hooks than during the previous render" errors.

---

### Design System

- **Palette:** Deep Navy (`#172554`), Slate (`#64748B`), Off-white (`#F8FAFC`), Success (`#16A34A`), Warning (`#D97706`), Danger (`#DC2626`)
- **CSS Variables:** shadcn/ui tokens in `index.css` (background, foreground, card, muted, accent, border, ring)
- **Typography:** system-ui font stack
- **Radius:** 0.5rem (rounded-lg)
- **8-State Matrix:** default, hover, focus-visible, active, disabled, loading (skeleton), error (actionable), empty
- **Accessibility:** WCAG 2.2 AA targets, skip navigation, `aria-live`, `role="dialog"`, focus management, ≥24px hit areas

---

### Hooks Architecture

| Hook File | Purpose |
|-----------|---------|
| `useAuth.ts` | Auth mutations + protected query wrapper |
| `useFinanceQueries.ts` | Accounts, categories, income sources |
| `useTransactions.ts` | Transaction CRUD queries |
| `useBillsQueries.ts` | Bill CRUD + occurrence queries |
| `useBudgetQueries.ts` | Budget + planned purchase queries |
| `useObligationsQueries.ts` | Obligation queries |
| `useLendingQueries.ts` | Person + loan queries |
| `useAnalyticsQueries.ts` | 6 chart data queries |
| `useProjectsQueries.ts` | Project + item queries |
| `useSettingsQueries.ts` | Profile, password, user settings |
| `useCalculatorInput.ts` | Calculator input logic (shared) |
| `useKeyboardShortcuts.ts` | Global keyboard shortcuts |

---

### State Management

- **React Query** — Server state (data fetching, caching, mutations)
- **Zustand** — Client state (`authStore.ts` for auth token/user, `settingsStore.ts` for dashboard cards and sidebar items)
- **localStorage** — Persistent settings storage

---

### Current Phase Status

- **Phase 1–9:** COMPLETED & VERIFIED
- **Phase 10:** IN PROGRESS (Step 1–2 done: backend edit window + settings infrastructure. Step 3 pending: transaction edit UI, sidebar/settings integration)
- **Current Branch:** `ui-redesign` (new branch for UI redesign work)

---

### Key Observations for Redesign

1. **Pages are large** — PlannedSpendingPage (960 lines), QuickAddModal (1048 lines), ProjectsPage (852 lines), PeoplePage (793 lines), BillsPage (767 lines). Heavy inline modals.
2. **Consistent patterns** — All pages follow the same structure: header with title + CTA, summary cards, data table/card list, modals for CRUD.
3. **Color coding is functional** — Uses semantic colors (emerald for income, rose for expenses, blue for transfers) consistently.
4. **Dashboard is the hub** — 7 KPI cards aggregate from 5 backend services, quick-add buttons, accounts panel, recent transactions.
5. **No dark mode toggle** — Dark mode tokens exist in CSS but no UI to switch.
6. **Mobile sidebar is hidden** — Sidebar is `hidden lg:flex`, no mobile navigation drawer.
7. **Settings infrastructure is ready** — DashboardSettings and NavigationSettings components exist but are not yet wired to DashboardPage and Sidebar.

# Delivery Steps

### ✓ Step 1: Complete Phase 1 analysis and present technical overview
Deliver a comprehensive technical overview of the existing application covering all pages, components, backend apps, patterns, and design system. This analysis is complete — no code changes are made in this phase.