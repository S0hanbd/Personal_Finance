import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Transaction } from '@/types'

export interface TransactionFilters {
  account?: string
  transaction_type?: string
  start_date?: string
  end_date?: string
  search?: string
  page?: number
}

export interface PaginatedTransactions {
  count: number
  next: string | null
  previous: string | null
  results: Transaction[]
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery<PaginatedTransactions>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filters.account) params.account = filters.account
      if (filters.transaction_type) params.transaction_type = filters.transaction_type
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.search) params.search = filters.search
      if (filters.page && filters.page > 1) params.page = String(filters.page)

      const res = await api.get('/transactions/', { params })
      // Handle both paginated and plain-list responses
      if (Array.isArray(res.data)) {
        return { count: res.data.length, next: null, previous: null, results: res.data }
      }
      return res.data as PaginatedTransactions
    },
    placeholderData: (prev) => prev,
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/transactions/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useRecentTransactions(limit = 5) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async () => {
      const res = await api.get('/transactions/', { params: { page_size: limit } })
      if (Array.isArray(res.data)) return res.data.slice(0, limit)
      return (res.data?.results ?? []).slice(0, limit)
    },
  })
}

