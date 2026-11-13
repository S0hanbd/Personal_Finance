export type AccountType = 'cash' | 'bank' | 'mobile_banking' | 'other'
export type AccountStatus = 'active' | 'archived'

export interface FinancialAccount {
  id: number
  name: string
  account_type: AccountType
  currency: string
  opening_balance: string   // string — use decimal.js to process, never parseFloat
  current_balance: string   // string — use decimal.js to process, never parseFloat
  description: string
  status: AccountStatus
  created_at: string
  updated_at: string
}
