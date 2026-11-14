export type LoanType = 'lent' | 'borrowed'
export type LoanStatus = 'active' | 'settled'

export interface Person {
  id: number
  name: string
  phone: string
  email: string
  notes: string
  total_lent: string
  total_borrowed: string
  created_at: string
  updated_at: string
}

export interface LoanRecord {
  id: number
  person: number
  person_name: string
  loan_type: LoanType
  initial_amount: string
  remaining_amount: string
  due_date: string | null
  status: LoanStatus
  notes: string
  created_at: string
  updated_at: string
}

export interface LoanSettlement {
  id: number
  loan_id: number
  person_name: string
  amount: string
  settlement_date: string
  notes: string
  created_at: string
}

export interface LendingSummary {
  total_lent: string
  total_borrowed: string
  net_position: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
