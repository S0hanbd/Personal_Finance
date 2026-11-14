import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  MonthlyTrendPoint,
  CategoryBreakdown,
  SpendingTrendPoint,
  BalanceHistoryPoint,
  TopCategoryItem,
  BudgetVsActualData,
} from '@/types/analytics'

interface DateRange {
  start_date: string
  end_date: string
}

function defaultDateRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export function useMonthlyIncomeExpense({ start_date, end_date }: DateRange) {
  return useQuery<MonthlyTrendPoint[]>({
    queryKey: ['analytics', 'monthly_trend', start_date, end_date],
    queryFn: async () => {
      const res = await api.get('/analytics/monthly_trend/', {
        params: { start_date, end_date },
      })
      return res.data
    },
  })
}

export function useSpendingByCategory({ start_date, end_date }: DateRange) {
  return useQuery<CategoryBreakdown[]>({
    queryKey: ['analytics', 'category_breakdown', start_date, end_date],
    queryFn: async () => {
      const res = await api.get('/analytics/category_breakdown/', {
        params: { start_date, end_date },
      })
      return res.data
    },
  })
}

export function useSpendingTrends({ start_date, end_date }: DateRange) {
  return useQuery<SpendingTrendPoint[]>({
    queryKey: ['analytics', 'spending_trends', start_date, end_date],
    queryFn: async () => {
      const res = await api.get('/analytics/spending_trends/', {
        params: { start_date, end_date },
      })
      return res.data
    },
  })
}

export function useAccountBalanceHistory({ start_date, end_date }: DateRange) {
  return useQuery<BalanceHistoryPoint[]>({
    queryKey: ['analytics', 'balance_history', start_date, end_date],
    queryFn: async () => {
      const res = await api.get('/analytics/balance_history/', {
        params: { start_date, end_date },
      })
      return res.data
    },
  })
}

export function useTopCategories({ start_date, end_date }: DateRange) {
  return useQuery<TopCategoryItem[]>({
    queryKey: ['analytics', 'top_categories', start_date, end_date],
    queryFn: async () => {
      const res = await api.get('/analytics/top_categories/', {
        params: { start_date, end_date },
      })
      return res.data
    },
  })
}

export function useBudgetVsActual(year?: number, month?: number) {
  return useQuery<BudgetVsActualData>({
    queryKey: ['analytics', 'budget_vs_actual', year, month],
    queryFn: async () => {
      const params: Record<string, number> = {}
      if (year) params.year = year
      if (month) params.month = month
      const res = await api.get('/analytics/budget_vs_actual/', { params })
      return res.data
    },
  })
}

export function useAnalyticsQueries() {
  const range = defaultDateRange()
  return {
    monthlyIncomeExpense: useMonthlyIncomeExpense(range),
    spendingByCategory: useSpendingByCategory(range),
    spendingTrends: useSpendingTrends(range),
    accountBalanceHistory: useAccountBalanceHistory(range),
    topCategories: useTopCategories(range),
  }
}
