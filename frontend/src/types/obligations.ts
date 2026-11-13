export type ObligationStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type ObligationPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface FinancialObligation {
  id: number
  name: string
  amount: string
  category?: number | null
  category_name?: string
  due_date: string
  priority: ObligationPriority
  description?: string
  status: ObligationStatus
  paid_transaction?: number | null
  paid_at?: string | null
  created_at: string
  updated_at: string
}

export interface ObligationSummaryResponse {
  total_pending: string
  total_paid: string
  pending_count: number
}
