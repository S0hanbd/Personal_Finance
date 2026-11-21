import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
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

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const location = useLocation()

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  if (isAuthenticated && token) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function RootRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  return <Navigate to={isAuthenticated && token ? '/dashboard' : '/login'} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

