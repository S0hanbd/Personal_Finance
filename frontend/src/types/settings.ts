export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  bio: string
  profile_picture: string | null
  profile_picture_url: string | null
  timezone: string
  default_currency: string
}

export interface PasswordChange {
  current_password: string
  new_password1: string
  new_password2: string
}

export interface UserSettings {
  id: number
  user: number
  dashboard_cards: string[]
  sidebar_items: string[]
}

export interface DashboardCard {
  id: string
  label: string
}

export const DASHBOARD_CARDS: DashboardCard[] = [
  { id: 'total_balance', label: 'Total Balance' },
  { id: 'monthly_income', label: 'Monthly Income' },
  { id: 'monthly_expenses', label: 'Monthly Expenses' },
  { id: 'unpaid_bills', label: 'Unpaid Bills' },
  { id: 'remaining_after_bills', label: 'Remaining After Bills' },
  { id: 'future_obligations', label: 'Future Obligations' },
  { id: 'budget_remaining', label: 'Budget Remaining' },
]

export interface SidebarItem {
  id: string
  label: string
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'bills', label: 'Bills' },
  { id: 'budget', label: 'Budget' },
  { id: 'planned_spending', label: 'Planned Spending' },
  { id: 'obligations', label: 'Obligations' },
  { id: 'people', label: 'People' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'projects', label: 'Projects' },
  { id: 'settings', label: 'Settings' },
]
