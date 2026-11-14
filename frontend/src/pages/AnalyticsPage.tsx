import { useState, useCallback } from 'react'
import {
  useMonthlyIncomeExpense,
  useSpendingByCategory,
  useSpendingTrends,
  useAccountBalanceHistory,
  useTopCategories,
  useBudgetVsActual,
} from '@/hooks/useAnalyticsQueries'
import { PeriodSelector } from '@/components/analytics/PeriodSelector'
import { MonthlyIncomeExpenseChart } from '@/components/analytics/MonthlyIncomeExpenseChart'
import { SpendingByCategoryChart } from '@/components/analytics/SpendingByCategoryChart'
import { SpendingTrendsChart } from '@/components/analytics/SpendingTrendsChart'
import { AccountBalanceChart } from '@/components/analytics/AccountBalanceChart'
import { TopCategoriesChart } from '@/components/analytics/TopCategoriesChart'
import { BudgetVsActualChart } from '@/components/analytics/BudgetVsActualChart'
import type { MonthlyTrendPoint, CategoryBreakdown, SpendingTrendPoint, BalanceHistoryPoint, TopCategoryItem, BudgetVsActualData } from '@/types/analytics'

function getDefaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  )
}

// Content component — no hooks, safe to render conditionally
function AnalyticsPageContent({
  onDateRangeChange,
  monthlyData,
  categoryData,
  trendsData,
  balanceData,
  topData,
  budgetData,
  isLoadingMonthly,
  isLoadingCategory,
  isLoadingTrends,
  isLoadingBalance,
  isLoadingTop,
  isLoadingBudget,
  errorMonthly,
  errorCategory,
  errorTrends,
  errorBalance,
  errorTop,
  errorBudget,
}: {
  onDateRangeChange: (start: string, end: string) => void
  monthlyData: MonthlyTrendPoint[]
  categoryData: CategoryBreakdown[]
  trendsData: SpendingTrendPoint[]
  balanceData: BalanceHistoryPoint[]
  topData: TopCategoryItem[]
  budgetData: BudgetVsActualData
  isLoadingMonthly: boolean
  isLoadingCategory: boolean
  isLoadingTrends: boolean
  isLoadingBalance: boolean
  isLoadingTop: boolean
  isLoadingBudget: boolean
  errorMonthly?: Error
  errorCategory?: Error
  errorTrends?: Error
  errorBalance?: Error
  errorTop?: Error
  errorBudget?: Error
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-foreground">Financial Analytics</h1>
        <PeriodSelector onDateRangeChange={onDateRangeChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Income vs Expense">
          {isLoadingMonthly ? (
            <div className="flex items-center justify-center h-64 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : errorMonthly ? (
            <div className="flex items-center justify-center h-64 text-danger text-sm">
              Failed to load. Please try again.
            </div>
          ) : (
            <MonthlyIncomeExpenseChart data={monthlyData} />
          )}
        </ChartCard>

        <ChartCard title="Spending by Category">
          {isLoadingCategory ? (
            <div className="flex items-center justify-center h-64 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : errorCategory ? (
            <div className="flex items-center justify-center h-64 text-danger text-sm">
              Failed to load. Please try again.
            </div>
          ) : (
            <SpendingByCategoryChart data={categoryData} />
          )}
        </ChartCard>

        <ChartCard title="Spending Trends">
          {isLoadingTrends ? (
            <div className="flex items-center justify-center h-64 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : errorTrends ? (
            <div className="flex items-center justify-center h-64 text-danger text-sm">
              Failed to load. Please try again.
            </div>
          ) : (
            <SpendingTrendsChart data={trendsData} />
          )}
        </ChartCard>

        <ChartCard title="Account Balance History">
          {isLoadingBalance ? (
            <div className="flex items-center justify-center h-64 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : errorBalance ? (
            <div className="flex items-center justify-center h-64 text-danger text-sm">
              Failed to load. Please try again.
            </div>
          ) : (
            <AccountBalanceChart data={balanceData} />
          )}
        </ChartCard>

        <ChartCard title="Top Spending Categories">
          {isLoadingTop ? (
            <div className="flex items-center justify-center h-64 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : errorTop ? (
            <div className="flex items-center justify-center h-64 text-danger text-sm">
              Failed to load. Please try again.
            </div>
          ) : (
            <TopCategoriesChart data={topData} />
          )}
        </ChartCard>

        <ChartCard title="Budget vs Actual">
          {isLoadingBudget ? (
            <div className="flex items-center justify-center h-64 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : errorBudget ? (
            <div className="flex items-center justify-center h-64 text-danger text-sm">
              Failed to load. Please try again.
            </div>
          ) : (
            <BudgetVsActualChart data={budgetData} />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

// Hooks wrapper — calls all hooks unconditionally
export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(getDefaultRange)
  const { start_date, end_date } = dateRange

  const monthlyQuery = useMonthlyIncomeExpense({ start_date, end_date })
  const categoryQuery = useSpendingByCategory({ start_date, end_date })
  const trendsQuery = useSpendingTrends({ start_date, end_date })
  const balanceQuery = useAccountBalanceHistory({ start_date, end_date })
  const topQuery = useTopCategories({ start_date, end_date })
  const budgetQuery = useBudgetVsActual()

  const handleDateRangeChange = useCallback((start: string, end: string) => {
    setDateRange({ start_date: start, end_date: end })
  }, [])

  return (
    <AnalyticsPageContent
      onDateRangeChange={handleDateRangeChange}
      monthlyData={monthlyQuery.data ?? []}
      categoryData={categoryQuery.data ?? []}
      trendsData={trendsQuery.data ?? []}
      balanceData={balanceQuery.data ?? []}
      topData={topQuery.data ?? []}
      budgetData={budgetQuery.data ?? { has_budget: false, categories: [], budget_total: '0', actual_total: '0' }}
      isLoadingMonthly={monthlyQuery.isLoading}
      isLoadingCategory={categoryQuery.isLoading}
      isLoadingTrends={trendsQuery.isLoading}
      isLoadingBalance={balanceQuery.isLoading}
      isLoadingTop={topQuery.isLoading}
      isLoadingBudget={budgetQuery.isLoading}
      errorMonthly={monthlyQuery.error as Error | undefined}
      errorCategory={categoryQuery.error as Error | undefined}
      errorTrends={trendsQuery.error as Error | undefined}
      errorBalance={balanceQuery.error as Error | undefined}
      errorTop={topQuery.error as Error | undefined}
      errorBudget={budgetQuery.error as Error | undefined}
    />
  )
}

