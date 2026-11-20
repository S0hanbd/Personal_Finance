---
sessionId: session-261115-142125-vb74
---

# Phase 2: Complete Design System Overhaul

## Design Thesis

**"Premium, modern fintech SaaS interface"** — minimalist, professional, clean, spacious, and elegant. The app handles real money, so clarity, trustworthiness, and consistency trump flashy design.

---

## Requirements

### Overview & Goals

Redesign the entire application's visual identity with a consistent, premium design system. The goal is a modern fintech SaaS look — clean whites, subtle borders, spacious layouts, and a restrained color palette that communicates financial trust.

### Scope

**In Scope:**
- New color palette across the entire application
- New typography system (Inter font)
- New card/container design system
- New button and input component styles
- Updated Sidebar navigation design
- Updated Header design
- Updated Dashboard page layout
- Responsive design for all pages
- Mobile navigation drawer
- Consistent spacing and interaction patterns

**Out of Scope:**
- Backend changes (frontend only)
- New features or business logic changes
- Chart library migration (keep Recharts)
- Authentication flow redesign
- Page refactoring for code size (e.g., PlannedSpendingPage at 960 lines)

### User Stories

- As a user, I want a clean, modern interface so I can focus on my financial data without visual noise.
- As a user, I want consistent colors and typography so the app feels professional and trustworthy.
- As a mobile user, I want to navigate the app easily on small screens.
- As a user, I want clear visual hierarchy so I can quickly understand my financial position.

---

## Technical Design

### Current Implementation

| Aspect | Current State |
|--------|--------------|
| **Colors** | Deep Navy sidebar (`#172554`), Slate text, Off-white bg (`#F8FAFC`) |
| **Typography** | `system-ui` font stack, no external fonts |
| **Cards** | `SummaryCard` with left border accent, white bg, `shadow-sm` |
| **Sidebar** | Fixed left, Deep Navy bg, collapsible nav groups, keyboard shortcut hints |
| **Header** | Sticky top bar, breadcrumbs, CTA button, user avatar |
| **Layout** | Fixed sidebar + sticky header + main content (`max-w-7xl`) |
| **Mobile** | Sidebar hidden (`hidden lg:flex`), no mobile navigation |
| **Dark Mode** | CSS tokens exist, no toggle UI |
| **Radius** | `0.5rem` (rounded-lg) |
| **Tailwind Config** | Custom colors: `primary`, `secondary`, `success`, `warning`, `danger` |

### Key Decisions

1. **Inter Font** — Load Inter from Google Fonts (or self-host). Replace `system-ui` stack. Inter is the industry standard for fintech interfaces (used by Notion, Linear, Vercel).
2. **New Color Palette** — Replace all existing custom colors with the user-specified palette. The sidebar will transition from Deep Navy to a clean white/light design.
3. **Card System** — All cards get white background, 12-16px border radius, 1px subtle border, no shadow (or very soft shadow only on hover).
4. **Button System** — Primary buttons: blue bg + white text. Secondary buttons: white bg + border + dark text.
5. **Sidebar Redesign** — Transition from dark sidebar to a light, minimal sidebar with blue accent for active state.
6. **Mobile Navigation** — Slide-in drawer replacing the hidden sidebar on screens <1024px.
7. **No New Dependencies** — Use existing Lucide React for icons, Tailwind for styling. Only add Inter font.

### Proposed Changes

#### 1. Design Tokens (Foundation)

**File: `tailwind.config.ts`** — Replace all custom colors with the new palette:

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#F5F6F8` | Page background |
| `card` | `#FFFFFF` | Card/container background |
| `foreground` | `#171923` | Primary text |
| `muted-foreground` | `#6B7280` | Secondary text |
| `hint` | `#9CA3AF` | Muted text |
| `border` | `#E8EAEE` | All borders |
| `primary` | `#2563EB` | Primary actions, nav highlight |
| `primary-light` | `#EFF6FF` | Light blue backgrounds |
| `success` | `#16A36A` | Income, positive indicators |
| `success-light` | `#EAF8F0` | Light green backgrounds |
| `warning` | `#F59E0B` | Warnings, pending |
| `warning-light` | `#FFF7E6` | Light amber backgrounds |
| `danger` | `#DC4B45` | Expenses, exceeded budgets |
| `danger-light` | `#FEF0EF` | Light red backgrounds |

**File: `index.css`** — Update shadcn/ui CSS variables to match the new palette. Add Inter font import.

#### 2. Typography System

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page heading | 24-28px | semibold (600) | 1.2 |
| Section heading | 16-18px | semibold (600) | 1.3 |
| Card label | 13-14px | medium (500) | 1.4 |
| Financial value | 26-32px | semibold (600) | 1.2 |
| Body text | 14px | regular (400) | 1.5 |
| Supporting text | 12-13px | regular (400) | 1.4 |

Financial numbers use `tabular-nums` for alignment.

#### 3. Card Component Redesign

**File: `components/shared/SummaryCard.tsx`**
- White background (`bg-white`)
- 16px border radius (`rounded-xl`)
- 1px border (`border border-[#E8EAEE]`)
- No shadow (remove `shadow-sm`)
- Consistent padding (`p-5`)
- Remove left border accent (replace with icon-based indicator)
- Add subtle colored icon badge for variant indication

#### 4. Button System

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `#2563EB` | White | None | `#1D4ED8` |
| Secondary | White | `#171923` | `#E8EAEE` | `#F9FAFB` |
| Danger | `#DC4B45` | White | None | `#B91C1C` |
| Ghost | Transparent | `#6B7280` | None | `#F3F4F6` |

All buttons: `rounded-lg` (8px), `h-10` (40px height), `font-medium`.

#### 5. Input System

- White background
- `#E8EAEE` border (1px)
- `rounded-lg` (8px)
- `h-10` (40px height) for consistency
- Focus: `ring-2 ring-primary border-primary`
- Placeholder: `#9CA3AF`

#### 6. Sidebar Redesign

**File: `components/layout/Sidebar.tsx`**
- White background (replace Deep Navy)
- Right border (`border-r border-[#E8EAEE]`)
- Active item: blue left accent + blue text (`#2563EB`)
- Hover: light gray background (`#F9FAFB`)
- Logo: text-based, `#171923`
- Nav group labels: `#9CA3AF`, uppercase, smaller
- Remove keyboard shortcut kbd badges (cleaner look)

#### 7. Header Redesign

**File: `components/layout/Header.tsx`**
- Clean white background
- Subtle bottom border
- Page title as h1 (24px, semibold)
- "Record Transaction" button: primary blue
- User avatar: circular, subtle border
- Hamburger button on mobile

#### 8. Mobile Navigation Drawer

**New File: `components/layout/MobileNav.tsx`**
- Slide-in from left
- Overlay backdrop
- Same nav items as desktop
- Close on: overlay click, Escape, nav item click
- Focus trap, `role="dialog"`

#### 9. Dashboard Page Redesign

**File: `pages/DashboardPage.tsx`**
- KPI cards: 3-column grid (responsive)
- Each card: white bg, rounded-xl, subtle border, icon badge
- Quick action buttons: updated button styles
- Account panel: card-based list
- Recent transactions: card-based list with icon indicators

#### 10. Responsive Layout Fixes

All pages:
- Summary cards: 1-col mobile → 2-col tablet → 3-col desktop
- Tables: horizontal scroll on mobile
- Modals: full-screen on mobile, centered on desktop
- Charts: proper aspect ratio

### Architecture Diagram

``` mermaid
graph LR
  A[tailwind.config.ts<br/>Color tokens] --> B[index.css<br/>CSS variables + Inter font]
  B --> C[SummaryCard.tsx<br/>Card component]
  B --> D[Sidebar.tsx<br/>Navigation]
  B --> E[Header.tsx<br/>Top bar]
  B --> F[MobileNav.tsx<br/>Mobile drawer]
  C --> G[DashboardPage.tsx]
  D --> H[AppLayout.tsx]
  E --> H
  F --> H
  G --> I[All Pages]
  H --> I
```

### File Structure

| Action | File |
|--------|------|
| **Modify** | `frontend/tailwind.config.ts` — New color palette |
| **Modify** | `frontend/src/index.css` — CSS variables, Inter font |
| **Modify** | `frontend/src/components/shared/SummaryCard.tsx` — Card redesign |
| **Modify** | `frontend/src/components/layout/Sidebar.tsx` — Sidebar redesign |
| **Modify** | `frontend/src/components/layout/Header.tsx` — Header redesign |
| **New** | `frontend/src/components/layout/MobileNav.tsx` — Mobile drawer |
| **Modify** | `frontend/src/components/layout/AppLayout.tsx` — Wire MobileNav |
| **Modify** | `frontend/src/pages/DashboardPage.tsx` — Dashboard redesign |
| **Modify** | `frontend/src/pages/TransactionsPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/AccountsPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/BillsPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/BudgetPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/PlannedSpendingPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/ObligationsPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/PeoplePage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/AnalyticsPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/ProjectsPage.tsx` — Responsive fixes |
| **Modify** | `frontend/src/pages/SettingsPage.tsx` — Style updates |
| **Modify** | `frontend/src/pages/auth/LoginPage.tsx` — Style updates |
| **Modify** | `frontend/src/pages/auth/RegisterPage.tsx` — Style updates |

### Risks

| Risk | Mitigation |
|------|-----------|
| Color changes break chart colors | Update Recharts color config to use new palette |
| Sidebar redesign breaks navigation | Keep nav data structure, only change styling |
| Mobile drawer conflicts with existing layout | Only visible <1024px, isolated component |
| Inter font loading causes FOIT | Use `font-display: swap` |
| Global color changes cause regressions | Verify all pages after token changes |

---

## Testing

### Validation Approach

After each stage, run:
- `pnpm typecheck` — TypeScript compilation
- `pnpm lint` — ESLint pass
- `pnpm test -- --run` — Frontend tests pass
- Visual inspection at 375px, 768px, 1280px breakpoints

### Key Scenarios

1. All pages render with new color palette
2. Sidebar navigation works (active state, hover, click)
3. Mobile drawer opens/closes correctly
4. Summary cards display correctly with new design
5. Buttons and inputs have correct styles
6. Financial numbers use tabular nums
7. All charts respect new color palette
8. No horizontal scroll at any breakpoint

### Edge Cases

- Empty states still look good with new design
- Loading skeletons match new card design
- Error states use new danger colors
- Modal full-screen on mobile
- Chart colors don't clash with new palette

---

## Dependencies

- **Inter Font** — New dependency (Google Fonts or self-hosted)
- **Lucide React** — Already installed
- **Tailwind CSS** — Already installed
- No other new packages required

---

## Delivery Steps

### ✓ Step 1: Establish design tokens and typography
Replace all color tokens in `tailwind.config.ts` and `index.css` with the new palette. Add Inter font. Update CSS variables for shadcn/ui compatibility. This is the foundation — all subsequent changes depend on these tokens being correct.

### ✓ Step 2: Redesign core layout components
Redesign Sidebar (white bg, blue accent), Header (clean white, new CTA button), and create MobileNav drawer. Wire MobileNav into AppLayout. These components form the shell of every page.

### ✓ Step 3: Redesign card system and Dashboard page
Update SummaryCard component with new design (icon badge, no left border). Redesign DashboardPage layout with new card grid, quick action buttons, and account/transaction panels.

### ✓ Step 4: Apply design system to all pages and responsive fixes
Update all remaining pages with new colors, card styles, button styles, and input styles. Fix responsive layout issues (card stacking, table scrolling, modal full-screen on mobile). Update auth pages.

### ✓ Step 5: Verification and polish
Run verification commands, fix any TypeScript/lint errors, test all breakpoints, verify chart colors, and ensure consistency across the application.
