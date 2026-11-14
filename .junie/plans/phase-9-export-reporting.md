# Requirements

### Overview
Build **Phase 9 — Export & Reporting**: CSV and PDF export capabilities for transaction history, monthly financial reports, budget performance reports, and project finance reports. PDF reports include embedded charts as images for visual summaries.

### Scope

**In Scope:**
- **CSV Export** — Export filtered transactions to CSV with all fields (date, type, amount, category, account, description, project item).
- **Monthly Financial Report (PDF)** — Income vs expense summary, category breakdown, net cashflow, with embedded charts.
- **Budget Performance Report (PDF)** — Budget vs actual comparison per category with progress indicators and charts.
- **Project Finance Report (PDF)** — Per-project planned vs actual spending with item-level breakdown and progress bars.
- **Export UI** — Export buttons on TransactionsPage, AnalyticsPage, BudgetPage, and ProjectsPage with format selector.
- **Chart as Images** — Recharts components rendered to SVG/PNG and embedded in PDF reports.

**Out of Scope:**
- Excel (XLSX) format — CSV covers data portability needs.
- Scheduled email reports.
- Custom report builder.
- Multi-currency reports.

### User Stories
1. As a user, I want to export my transactions to CSV so I can analyze them in Excel or Google Sheets.
2. As a user, I want to generate a monthly financial report PDF so I can share my finances with others.
3. As a user, I want to see budget performance in a printable report so I can track my spending habits.
4. As a user, I want project-specific reports so I can review project spending with stakeholders.
5. As a user, I want charts in my PDF reports so the data is visually understandable.

### Functional Requirements
- **CSV Export**: Filtered by date range, type, account, category. Includes headers. UTF-8 encoding.
- **PDF Reports**: A4 size, professional layout with header, summary section, chart images, and data tables.
- **Chart Embedding**: Charts rendered as SVG, converted to PNG for PDF embedding.
- **Export Button**: Visible on relevant pages with dropdown for format selection (CSV/PDF).
- **Loading State**: Show progress indicator during PDF generation (server-side rendering).
- **Empty State**: "No data to export" message when filters return no results.

### Non-Functional Requirements
- PDF generation must complete within 5 seconds for up to 1 year of data.
- CSV files must be under 10MB for typical usage.
- Backend: `python manage.py check`, `ruff check .`, `pytest` pass.
- Frontend: `npm run typecheck` and `npm run lint` pass.

# Technical Design

### Current Implementation
- **No existing export functionality** — starting from scratch.
- **Transaction model**: Has all fields needed (user, account, transaction_type, amount, category, income_source, description, transaction_date, project_item).
- **Analytics services**: Pre-aggregated data available (monthly income/expense, category breakdown, etc.) — can be reused for PDF reports.
- **Frontend**: Recharts components already render charts; can be serialized to SVG for PDF embedding.
- **Dependencies**: No PDF library currently installed.

### Key Decisions
- **Backend CSV export** — Django view returns CSV stream with `Content-Type: text/csv`. Uses Django's `csv` module for proper escaping. No new dependencies needed.
- **Backend PDF generation** — Use `reportlab` (lightweight, pure Python) for PDF creation. Charts rendered server-side using analytics aggregation data, then embedded as SVG/PNG in PDF.
- **Chart rendering for PDF** — Use `reportlab`'s platypus for tables and simple bar/pie charts.
- **Frontend export trigger** — Add export button to relevant pages. On click, fetch data from backend and trigger download. For CSV, direct download. For PDF, backend generates and streams PDF.
- **Report templates** — Use reportlab's `SimpleDocTemplate` with `Table` and `Paragraph` for structured reports.

### Proposed Changes

**Backend (`apps/reports/`):**
1. **Services** (`services.py`):
 - `export_transactions_csv(user, filters)` — Returns CSV string of filtered transactions.
 - `generate_monthly_report(user, year, month)` — Returns PDF bytes with income/expense summary, category breakdown, and charts.
 - `generate_budget_report(user, year, month)` — Returns PDF bytes with budget vs actual comparison.
 - `generate_project_report(user, project_id)` — Returns PDF bytes with project item breakdown.
2. **Views** (`views.py`): `ReportsViewSet` with `@action` decorators for each report type.
3. **URLs** (`urls.py`): Wire to `/api/reports/`.
4. **Tests** (`tests.py`): Following `apps/bills/tests.py` pattern — pytest with fixtures.

**Frontend:**
1. **Types** (`src/types/reports.ts`): `ExportFilters`, `ReportParams`.
2. **Types index** (`src/types/index.ts`): Export reports types.
3. **Hooks** (`src/hooks/useReportsQueries.ts`): `useExportCSV()`, `useMonthlyReport()`, `useBudgetReport()`, `useProjectReport()`.
4. **Components** (`src/components/shared/ExportButton.tsx`): Reusable export button with dropdown (CSV/PDF), loading state, and error handling.
5. **Page Updates**: Add export buttons to TransactionsPage, AnalyticsPage, BudgetPage, ProjectsPage.

### File Structure
```
backend/apps/reports/
  services.py        (new — CSV and PDF generation)
  views.py           (new — ReportsViewSet)
  urls.py            (new — router wiring)
  tests.py           (new — pytest tests)

backend/requirements.txt  (modified — add reportlab)

frontend/src/
  types/reports.ts        (new)
  types/index.ts          (modified — add reports export)
  hooks/useReportsQueries.ts  (new)
  components/shared/ExportButton.tsx  (new)
  pages/TransactionsPage.tsx  (modified — add export button)
  pages/AnalyticsPage.tsx     (modified — add export button)
  pages/BudgetPage.tsx        (modified — add export button)
  pages/ProjectsPage.tsx      (modified — add export button)
```

### Risks
- **ReportLab chart limitations** — ReportLab's built-in charts are basic. For complex charts, use simple bar/pie charts in reportlab.
- **PDF generation performance** — Large datasets may slow PDF generation. Mitigation: limit to 1 year of data.
- **Frontend chart-to-PNG** — Keep chart rendering server-side for simplicity.

# Testing

### Validation Approach
Follow existing pytest pattern. Test CSV format, PDF generation, and data accuracy.

### Key Scenarios
1. **CSV export** — Creates transactions, exports CSV, verifies headers and data rows match.
2. **CSV filtering** — Exports with date range filter, verifies only matching transactions included.
3. **Monthly report PDF** — Creates transactions across months, generates PDF, verifies summary totals match.
4. **Budget report PDF** — Creates budget and expenses, generates PDF, verifies budget vs actual comparison.
5. **Project report PDF** — Creates project with items and transactions, generates PDF, verifies item breakdown.
6. **Empty data handling** — No transactions in period returns empty CSV/PDF with "No data" message.
7. **API integration** — GET endpoints return correct content types (text/csv, application/pdf).
8. **Frontend** — `npm run typecheck` and `npm run lint` pass.

# Delivery Steps

### ✓ Step 1: Backend reports app: services, views, URLs, and tests
Create the reports backend: CSV export, PDF generation, API endpoints, and pytest validation.
- `apps/reports/services.py`: Create 4 functions: `export_transactions_csv()` using Django csv module, `generate_monthly_report()` using reportlab with income/expense summary and charts, `generate_budget_report()` with budget vs actual tables, `generate_project_report()` with item-level breakdown. All use Decimal for money values.
- `apps/reports/views.py`: `ReportsViewSet` with `@action` decorators: `export_csv` (returns StreamingHttpResponse with CSV), `monthly_report` (returns HttpResponse with PDF), `budget_report` (returns PDF), `project_report` (returns PDF). All filtered by user.
- `apps/reports/urls.py`: Wire ViewSet via DefaultRouter to `/api/reports/`.
- `apps/reports/tests.py`: 8+ tests — CSV format verification, CSV filtering, PDF generation for each report type, empty data handling, API content types.
- `requirements.txt`: Add `reportlab==4.2.2`.
- Run `python manage.py check`, `ruff check .`, and `pytest` to verify.

### ✓ Step 2: Frontend types, hooks, ExportButton, and page integrations
Build the frontend reports module: types, React Query hooks, reusable ExportButton, and integrate into existing pages.
- `src/types/reports.ts`: `ExportFilters` (start_date, end_date, transaction_type, account_id, category_id), `ReportParams` (year, month, project_id).
- `src/types/index.ts`: Add `export * from './reports'`.
- `src/hooks/useReportsQueries.ts`: `useExportCSV()` — returns blob URL for download, `useMonthlyReport()`, `useBudgetReport()`, `useProjectReport()` — all return blob URLs. Follow existing hooks pattern.
- `src/components/shared/ExportButton.tsx`: Reusable button with dropdown (CSV/PDF options), loading spinner during generation, error toast on failure. Uses `Download` icon from lucide-react.
- `src/pages/TransactionsPage.tsx`: Add ExportButton in header, passes current filters to export.
- `src/pages/AnalyticsPage.tsx`: Add ExportButton for monthly report, passes selected date range.
- `src/pages/BudgetPage.tsx`: Add ExportButton for budget report, passes selected month.
- `src/pages/ProjectsPage.tsx`: Add ExportButton per project in detail view.
- Run `npm run typecheck` and `npm run lint` to verify.
