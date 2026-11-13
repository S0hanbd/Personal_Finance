import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { BillsPage } from '@/pages/BillsPage'
import { ObligationsPage } from '@/pages/ObligationsPage'
import { BudgetPage } from '@/pages/BudgetPage'
import { PlannedSpendingPage } from '@/pages/PlannedSpendingPage'
import { PeoplePage } from '@/pages/PeoplePage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/transactions', element: <TransactionsPage /> },
      { path: '/accounts', element: <AccountsPage /> },
      { path: '/bills', element: <BillsPage /> },
      { path: '/obligations', element: <ObligationsPage /> },
      { path: '/budget', element: <BudgetPage /> },
      { path: '/planned-spending', element: <PlannedSpendingPage /> },
      { path: '/people', element: <PeoplePage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])

