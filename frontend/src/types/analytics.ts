export interface MonthlyTrendPoint {
  month: string
  income: string
  expense: string
  net: string
}

export interface CategoryBreakdown {
  category: string
  amount: string
}

export interface SpendingTrendPoint {
  date: string
  amount: string
}

export interface BalanceHistoryPoint {
  date: string
  account_id: number
  account_name: string
  balance: string
}

export interface TopCategoryItem {
  category: string
  amount: string
  rank: number
}

export interface BudgetVsActualItem {
  category: string
  allocated: string
  actual: string
  variance: string
}

export interface BudgetVsActualData {
  budget_total: string
  actual_total: string
  categories: BudgetVsActualItem[]
  has_budget: boolean
}
