import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  BudgetPerformance,
  PlannedPurchase,
  CreateMonthlyBudgetPayload,
  CreatePlannedPurchasePayload,
  SettlePlannedPurchasePayload,
} from '@/types'

function extractResults<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export function useBudgetPerformance(year?: number, month?: number) {
  return useQuery<BudgetPerformance>({
    queryKey: ['budget-performance', year, month],
    queryFn: async () => {
      const params: Record<string, number> = {}
      if (year) params.year = year
      if (month) params.month = month
      const res = await api.get('/budgets/monthly/performance/', { params })
      return res.data
    },
  })
}

export function useUpsertMonthlyBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateMonthlyBudgetPayload) => {
      const res = await api.post('/budgets/monthly/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-performance'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-budgets'] })
    },
  })
}

export function usePlannedPurchases(filters?: { status?: string; priority?: string }) {
  return useQuery<PlannedPurchase[]>({
    queryKey: ['planned-purchases', filters],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filters?.status && filters.status !== 'all') params.status = filters.status
      if (filters?.priority && filters.priority !== 'all') params.priority = filters.priority
      const res = await api.get('/budgets/planned-purchases/', { params })
      return extractResults<PlannedPurchase>(res.data)
    },
  })
}

export function useCreatePlannedPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreatePlannedPurchasePayload) => {
      const res = await api.post('/budgets/planned-purchases/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-purchases'] })
    },
  })
}

export function useUpdatePlannedPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PlannedPurchase> }) => {
      const res = await api.patch(`/budgets/planned-purchases/${id}/`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-purchases'] })
    },
  })
}

export function useSettlePlannedPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: SettlePlannedPurchasePayload
    }) => {
      const res = await api.post(`/budgets/planned-purchases/${id}/purchase/`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-purchases'] })
      queryClient.invalidateQueries({ queryKey: ['budget-performance'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeletePlannedPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/budgets/planned-purchases/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-purchases'] })
    },
  })
}
