import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { FinancialAccount, IncomeSource, ExpenseCategory, Transaction } from '@/types'

// Helper to extract list from paginated or non-paginated responses
function extractResults<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export function useAccounts() {
  return useQuery<FinancialAccount[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounts/')
      return extractResults<FinancialAccount>(res.data)
    },
  })
}

export function useIncomeSources() {
  return useQuery<IncomeSource[]>({
    queryKey: ['income-sources'],
    queryFn: async () => {
      const res = await api.get('/transactions/income-sources/')
      return extractResults<IncomeSource>(res.data)
    },
  })
}

export function useExpenseCategories() {
  return useQuery<ExpenseCategory[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/transactions/categories/')
      return extractResults<ExpenseCategory>(res.data)
    },
  })
}

export interface CreateTransactionPayload {
  account: number
  transaction_type: 'income' | 'expense' | 'lending' | 'borrowing'
  amount: string
  category?: number | null
  income_source?: number | null
  description?: string
  transaction_date: string
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload): Promise<Transaction> => {
      const res = await api.post('/transactions/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export interface CreateTransferPayload {
  source_account: number
  destination_account: number
  amount: string
  description?: string
  transaction_date: string
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTransferPayload) => {
      const res = await api.post('/transactions/transfers/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<ExpenseCategory> => {
      const res = await api.post('/transactions/categories/', { name })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}

export function useCreateIncomeSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<IncomeSource> => {
      const res = await api.post('/transactions/income-sources/', { name })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-sources'] })
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; account_type: string; opening_balance: string }): Promise<FinancialAccount> => {
      const res = await api.post('/accounts/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

