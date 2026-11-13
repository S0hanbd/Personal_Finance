export type RecurringFrequency = 'monthly' | 'yearly'
export type RecurringStatus = 'active' | 'paused' | 'archived'
export type OccurrenceStatus = 'unpaid' | 'paid' | 'overdue' | 'skipped'

export interface RecurringExpense {
  id: number
  name: string
  category?: number | null
  category_name?: string
  amount: string
  frequency: RecurringFrequency
  start_date: string
  due_day: number
  preferred_account?: number | null
  preferred_account_name?: string
  description?: string
  status: RecurringStatus
  created_at: string
  updated_at: string
}

export interface RecurringExpenseOccurrence {
  id: number
  recurring_expense: number
  bill_name: string
  category_name?: string
  preferred_account_id?: number | null
  preferred_account_name?: string
  period: string
  due_date: string
  amount: string
  status: OccurrenceStatus
  paid_transaction?: number | null
  paid_at?: string | null
  created_at: string
}

export interface CurrentMonthBillsResponse {
  period: string
  unpaid_total: string
  paid_total: string
  results: RecurringExpenseOccurrence[]
}

