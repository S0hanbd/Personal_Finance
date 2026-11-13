import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  FinancialObligation,
  ObligationSummaryResponse,
} from '@/types'

function extractResults<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export function useObligations(statusFilter?: string) {
  return useQuery<FinancialObligation[]>({
    queryKey: ['obligations', statusFilter],
    queryFn: async () => {
      const res = await api.get('/obligations/', {
        params: statusFilter ? { status: statusFilter } : {},
      })
      return extractResults<FinancialObligation>(res.data)
    },
  })
}

export function useObligationSummary() {
  return useQuery<ObligationSummaryResponse>({
    queryKey: ['obligations', 'summary'],
    queryFn: async () => {
      const res = await api.get('/obligations/summary/')
      return res.data
    },
  })
}

export interface CreateObligationPayload {
  name: string
  amount: string
  category?: number | null
  due_date: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  description?: string
}

export function useCreateObligation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateObligationPayload): Promise<FinancialObligation> => {
      const res = await api.post('/obligations/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] })
    },
  })
}

export interface PayObligationPayload {
  obligationId: number
  accountId: number
  paymentDate?: string
  description?: string
}

export function usePayObligation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ obligationId, accountId, paymentDate, description }: PayObligationPayload): Promise<FinancialObligation> => {
      const res = await api.post(`/obligations/${obligationId}/pay/`, {
        account_id: accountId,
        payment_date: paymentDate,
        description,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

