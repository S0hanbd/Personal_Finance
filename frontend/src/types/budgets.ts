export type BudgetStatus = 'normal' | 'warning' | 'exceeded' | 'unconfigured'

export interface CategoryBudgetStats {
  category_id: number | null
  category_name: string
  allocated_amount: string
  spent_amount: string
  remaining_amount: string
  percentage_used: number
  status: 'normal' | 'warning' | 'exceeded'
}

export interface BudgetPerformance {
  has_budget: boolean
  budget_id: number | null
  year: number
  month: number
  budget_limit: string
  variable_spent: string
  fixed_spent: string
  total_spent: string
  remaining_budget: string
  percentage_used: number
  status: BudgetStatus
  notes: string
  category_breakdowns: CategoryBudgetStats[]
}

export interface BudgetCategoryAllocation {
  id: number
  category: number
  category_name: string
  allocated_amount: string
}

export interface MonthlyBudget {
  id: number
  year: number
  month: number
  total_amount: string
  notes: string
  category_allocations: BudgetCategoryAllocation[]
  created_at: string
  updated_at: string
}

export type PlannedPurchasePriority = 'urgent' | 'high' | 'medium' | 'low'
export type PlannedPurchaseStatus = 'planned' | 'saving' | 'ready' | 'purchased' | 'cancelled'

export interface PlannedPurchase {
  id: number
  name: string
  estimated_amount: string
  target_date: string | null
  category: number | null
  category_name?: string
  priority: PlannedPurchasePriority
  status: PlannedPurchaseStatus
  notes: string
  purchased_transaction_id?: number | null
  purchased_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateMonthlyBudgetPayload {
  year: number
  month: number
  total_amount: string
  notes?: string
  allocations?: {
    category_id: number
    allocated_amount: string
  }[]
}

export interface CreatePlannedPurchasePayload {
  name: string
  estimated_amount: string
  target_date?: string | null
  category?: number | null
  priority: PlannedPurchasePriority
  status?: PlannedPurchaseStatus
  notes?: string
}

export interface SettlePlannedPurchasePayload {
  account_id: number
  actual_amount?: string
  payment_date?: string
  description?: string
}

