export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'lending'
  | 'borrowing'
  | 'loan_repayment'
  | 'loan_collection'
  | 'held_money'
  | 'return_held'

export interface Transaction {
  id: number
  account: number
  account_name: string
  transaction_type: TransactionType
  amount: string // API delivers string; calculate with decimal.js
  category?: number
  category_name?: string
  income_source?: number
  income_source_name?: string
  description: string
  transaction_date: string
  created_at: string
}

export interface IncomeSource {
  id: number
  name: string
  description: string
  status: 'active' | 'archived'
}

export interface ExpenseCategory {
  id: number
  name: string
  description: string
  status: 'active' | 'archived'
}

export interface CreateTransactionRequest {
  account: number
  transaction_type: TransactionType
  amount: string
  category?: number
  income_source?: number
  description?: string
  transaction_date: string
}

