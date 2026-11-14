# Requirements

### Overview
Build **Phase 6 — Financial Analytics, Reports & Recharts**: a comprehensive analytics page with six chart types showing spending patterns, income trends, and budget performance.

### Scope

**In Scope:**
- **Monthly Income vs Expense** — Bar chart comparing monthly income and expense, with net cashflow line overlay.
- **Spending by Category** — Donut chart showing expense distribution across categories.
- **Spending Trends** — Line chart showing daily/weekly spending over a period.
- **Account Balance History** — Area chart showing balance changes over time.
- **Top Spending Categories** — Horizontal bar chart ranking categories by total spend.
- **Budget vs Actual** — Comparison chart showing budget allocations vs actual spending.
- **Period controls** — Quick range buttons (7d, 30d, 3m, 6m, YTD, All) plus custom date range picker.
- **Backend aggregation** — Pre-computed data points returned by the API.

**Out of Scope:**
- Export to PDF/CSV.
- Custom chart configurations.
- Real-time WebSocket updates.
- Multi-currency analytics.

# Technical Design

### Current Implementation
- **Backend analytics** (`apps/analytics/`): Placeholder only. `views.py` returns `[]`, no models/services.
- **Frontend**: `AnalyticsPage.tsx` is a placeholder. `recharts` is installed but unused.
- **Transaction model**: Has `transaction_type`, `amount`, `category`, `income_source`, `transaction_date`, `account` — all data needed for analytics.
- **Budget model**: Has `MonthlyBudget` with `total_amount` and `BudgetCategory` with `allocated_amount` — needed for budget vs actual.

### Key Decisions
- **Backend aggregation** — All chart data computed server-side via Django ORM `aggregate()`/`annotate()`. Returns pre-calculated data points. Frontend only renders.
- **Single analytics endpoint per chart** — Each chart has its own endpoint to keep responses small and cacheable.
- **Date range filtering** — All endpoints accept `start_date` and `end_date` query params. Default to last 30 days.
- **Recharts for all charts** — Already installed. Uses `BarChart`, `PieChart`, `LineChart`, `AreaChart`, and `ComposedChart`.
- **Color palette from Tailwind** — Chart colors: `#172554` (primary), `#16A34A` (income/success), `#DC2626` (expense/danger), `#D97706` (warning), `#64748B` (muted).

### File Structure
```
backend/apps/analytics/
  services.py        (new — 6 aggregation functions)
  views.py           (rewrite — AnalyticsViewSet with actions)
  urls.py            (rewrite — router wiring)
  tests.py           (rewrite — pytest tests)

frontend/src/
  types/analytics.ts (new — chart data interfaces)
  types/index.ts     (modified — add analytics export)
  hooks/useAnalyticsQueries.ts  (new — React Query hooks)
  components/analytics/
    MonthlyIncomeExpenseChart.tsx  (new)
    SpendingByCategoryChart.tsx    (new)
    SpendingTrendsChart.tsx        (new)
    AccountBalanceChart.tsx        (new)
    TopCategoriesChart.tsx         (new)
    BudgetVsActualChart.tsx        (new)
    PeriodSelector.tsx             (new)
  pages/AnalyticsPage.tsx          (rewrite — full page)
```

# Delivery Steps

### ✓ Step 1: Backend analytics services, views, URLs, and tests
Implement all six aggregation services, the AnalyticsViewSet, URL routing, and pytest validation.
- `services.py`: Create 6 functions: `get_monthly_income_expense()`, `get_spending_by_category()`, `get_spending_trends()` with auto-granularity, `get_account_balance_history()`, `get_top_categories()`, `get_budget_vs_actual()`. All use Django ORM aggregate/annotate with Decimal serialization.
- `views.py`: `AnalyticsViewSet` with `@action` decorators: `monthly_trend`, `category_breakdown`, `spending_trends`, `balance_history`, `top_categories`, `budget_vs_actual`. All accept `start_date`/`end_date` query params.
- `urls.py`: Wire ViewSet via DefaultRouter to `/api/analytics/`.
- `tests.py`: 8+ test cases — each aggregation function tested with seeded data, empty period handling, API endpoint integration.
- Run `python manage.py check`, `ruff check .`, and `python -m pytest` to verify.

### ✓ Step 2: Frontend analytics types, hooks, chart components, and AnalyticsPage
Build the complete frontend analytics module: types, React Query hooks, six Recharts components, period selector, and the full AnalyticsPage.
- `src/types/analytics.ts`: `MonthlyTrendPoint`, `CategoryBreakdown`, `SpendingTrendPoint`, `BalanceHistoryPoint`, `TopCategoryItem`, `BudgetVsActualItem` interfaces. Money fields as `string`.
- `src/types/index.ts`: Add `export * from './analytics'`.
- `src/hooks/useAnalyticsQueries.ts`: 6 query hooks following `useFinanceQueries.ts` pattern. All accept `start_date`/`end_date`, default to last 30 days.
- `src/components/analytics/PeriodSelector.tsx`: Quick range buttons (7d, 30d, 3m, 6m, YTD, All) + custom date range picker. Emits `onDateRangeChange` callback.
- `src/components/analytics/MonthlyIncomeExpenseChart.tsx`: Recharts `ComposedChart` with bars for income/expense and line for net cashflow.
- `src/components/analytics/SpendingByCategoryChart.tsx`: Recharts `PieChart` (donut) with category colors and legend.
- `src/components/analytics/SpendingTrendsChart.tsx`: Recharts `LineChart` with daily/weekly data points.
- `src/components/analytics/AccountBalanceChart.tsx`: Recharts `AreaChart` with multiple account lines.
- `src/components/analytics/TopCategoriesChart.tsx`: Recharts horizontal `BarChart` ranked by spend.
- `src/components/analytics/BudgetVsActualChart.tsx`: Recharts grouped `BarChart` comparing allocated vs actual per category.
- `src/pages/AnalyticsPage.tsx`: Full page with `PeriodSelector` at top, six chart cards in 2-column grid (1-column on mobile). Each card has a title, loading skeleton, empty state, and error retry. Follows hooks wrapper + content component pattern.
- Run `npm run typecheck` and `npm run lint` to verify.
