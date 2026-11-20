# Phase 4: Redesign Financial Dashboard

## Goal
Redesign the main dashboard to match the premium fintech SaaS aesthetic from the reference images, with a clear visual hierarchy, analytics charts, and improved layout.

## Reference Design Inspiration
- Clean white cards with subtle borders, no heavy shadows
- KPI cards in a compact top row with icons
- Large analytics chart section (income vs expense bar chart)
- Account balances panel with card-style display
- Recent transactions in a clean list/table
- Proper spacing and visual hierarchy

## Delivery Steps

### ✓ Step 1: Review reference images and current dashboard code
Analyze the two reference dashboard designs and the existing DashboardPage.tsx to understand the current structure and plan the redesign.

### ✓ Step 2: Create dashboard analytics chart components
Build new Recharts-based components for the dashboard:
- `DashboardOverviewChart` — Bar chart showing income vs expenses for the current month
- `SpendingBreakdownChart` — Donut/pie chart for spending by category
- `CashFlowTrendChart` — Line/area chart for cash flow trend

### ✓ Step 3: Redesign DashboardPage layout
Restructure the dashboard with the following sections:
1. **Page Header** — Title, subtitle, date/period, and quick action buttons
2. **KPI Cards Row** — 7 compact metric cards in a responsive grid
3. **Analytics Section** — Two-column layout with income vs expense chart and spending breakdown
4. **Account Balances** — Card-style account list with balances
5. **Recent Transactions** — Clean transaction list with type indicators

### ✓ Step 4: Enhance SummaryCard component
Update SummaryCard to be more compact for the top row, with smaller icon badges and tighter spacing.

### ✓ Step 5: Verify and test
Run typecheck, lint, and tests to ensure the redesign doesn't break existing functionality.

---

## Design Tokens
- Background: #F5F6F8 (page), #FFFFFF (cards)
- Primary text: #171923, Secondary: #6B7280, Muted: #9CA3AF
- Border: #E8EAEE
- Primary blue: #2563EB, Success green: #16A36A, Warning amber: #F59E0B, Danger red: #DC4B45
- Card radius: rounded-xl (12px)
- Typography: Inter/Geist, tabular-nums for financial values

## Key Changes
- Add analytics charts to dashboard (income vs expense, spending breakdown)
- Restructure layout for better visual hierarchy
- Make KPI cards more compact
- Improve account balances display
- Enhance recent transactions list
- Maintain all existing data hooks and business logic
