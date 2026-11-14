import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Person,
  LoanRecord,
  LoanSettlement,
  LendingSummary,
  PaginatedResponse,
} from '@/types'

export function usePeople() {
  return useQuery<Person[]>({
    queryKey: ['lending', 'people'],
    queryFn: async () => {
      const res = await api.get('/lending/people/')
      return (res.data as PaginatedResponse<Person>).results
    },
  })
}

export function useLendingSummary() {
  return useQuery<LendingSummary>({
    queryKey: ['lending', 'summary'],
    queryFn: async () => {
      const res = await api.get('/lending/people/summary/')
      return res.data
    },
  })
}

export function useLoans() {
  return useQuery<LoanRecord[]>({
    queryKey: ['lending', 'loans'],
    queryFn: async () => {
      const res = await api.get('/lending/loans/')
      return (res.data as PaginatedResponse<LoanRecord>).results
    },
  })
}

export function useSettlements() {
  return useQuery<LoanSettlement[]>({
    queryKey: ['lending', 'settlements'],
    queryFn: async () => {
      const res = await api.get('/lending/settlements/')
      return (res.data as PaginatedResponse<LoanSettlement>).results
    },
  })
}

export interface LendMoneyPayload {
  person_name: string
  amount: string
  account_id: number
  due_date?: string | null
  notes?: string
  phone?: string
  email?: string
}

export function useLendMoney() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: LendMoneyPayload): Promise<LoanRecord> => {
      const res = await api.post('/lending/loans/lend/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export interface BorrowMoneyPayload {
  person_name: string
  amount: string
  account_id: number
  due_date?: string | null
  notes?: string
  phone?: string
  email?: string
}

export function useBorrowMoney() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: BorrowMoneyPayload): Promise<LoanRecord> => {
      const res = await api.post('/lending/loans/borrow/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export interface SettleLoanPayload {
  loanId: number
  amount: string
  account_id: number
  settlement_date?: string
  notes?: string
}

export function useSettleLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ loanId, amount, account_id, settlement_date, notes }: SettleLoanPayload) => {
      const res = await api.post(`/lending/loans/${loanId}/settle/`, {
        amount,
        account_id,
        settlement_date,
        notes,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export interface CreatePersonPayload {
  name: string
  phone?: string
  email?: string
  notes?: string
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreatePersonPayload): Promise<Person> => {
      const res = await api.post('/lending/people/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending', 'people'] })
    },
  })
}
