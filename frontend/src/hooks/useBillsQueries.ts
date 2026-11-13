import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  RecurringExpense,
  RecurringExpenseOccurrence,
  CurrentMonthBillsResponse,
} from '@/types'

function extractResults<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export function useRecurringBills() {
  return useQuery<RecurringExpense[]>({
    queryKey: ['recurring-bills'],
    queryFn: async () => {
      const res = await api.get('/bills/rules/')
      return extractResults<RecurringExpense>(res.data)
    },
  })
}

export function useCurrentMonthBills(period?: string) {
  return useQuery<CurrentMonthBillsResponse>({
    queryKey: ['bill-occurrences', 'current-month', period],
    queryFn: async () => {
      const res = await api.get('/bills/occurrences/current-month/', {
        params: period ? { period } : {},
      })
      return res.data
    },
  })
}

export interface CreateRecurringBillPayload {
  name: string
  amount: string
  frequency: 'monthly' | 'yearly'
  start_date: string
  due_day: number
  preferred_account?: number | null
  category?: number | null
  description?: string
}

export function useCreateRecurringBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateRecurringBillPayload): Promise<RecurringExpense> => {
      const res = await api.post('/bills/rules/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill-occurrences'] })
    },
  })
}

export interface PayBillPayload {
  occurrenceId: number
  accountId: number
  paymentDate?: string
  description?: string
}

export function usePayBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ occurrenceId, accountId, paymentDate, description }: PayBillPayload): Promise<RecurringExpenseOccurrence> => {
      const res = await api.post(`/bills/occurrences/${occurrenceId}/pay/`, {
        account_id: accountId,
        payment_date: paymentDate,
        description,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-occurrences'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
