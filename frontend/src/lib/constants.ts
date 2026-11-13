export const APP_NAME = 'FinanceTracer'
export const DEFAULT_CURRENCY = 'BDT'
export const DEFAULT_TIMEZONE = 'Asia/Dhaka'

export const ROUTES = {
  dashboard: '/dashboard',
  transactions: '/transactions',
  newTransaction: '/transactions/new',
  accounts: '/accounts',
  account: (id: string | number) => `/accounts/${id}`,
  bills: '/bills',
  obligations: '/obligations',
  budget: '/budget',
  plannedSpending: '/planned-spending',
  people: '/people',
  analytics: '/analytics',
  projects: '/projects',
  project: (id: string | number) => `/projects/${id}`,
  settings: '/settings',
  login: '/login',
  register: '/register',
} as const
