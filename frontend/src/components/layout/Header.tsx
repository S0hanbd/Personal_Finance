import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, LogOut, User as UserIcon, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { QuickAddModal } from '@/components/transactions/QuickAddModal'

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/accounts': 'Accounts',
  '/bills': 'Bills',
  '/obligations': 'Obligations',
  '/budget': 'Budget',
  '/planned-spending': 'Planned Spending',
  '/people': 'People',
  '/analytics': 'Analytics',
  '/projects': 'Projects',
  '/settings': 'Settings',
}

function Breadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  if (parts.length === 0 || location.pathname === '/dashboard') return null

  const crumbs = parts.map((part, i) => {
    const path = '/' + parts.slice(0, i + 1).join('/')
    const label = routeLabels[path] || part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return { path, label }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-1">
      <ol className="flex items-center gap-1 text-xs text-muted-foreground">
        <li>
          <a href="/dashboard" className="hover:text-foreground transition-colors">Home</a>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-1">
            <ChevronRight size={10} aria-hidden="true" />
            {i === crumbs.length - 1
              ? <span className="text-foreground font-medium">{crumb.label}</span>
              : <a href={crumb.path} className="hover:text-foreground transition-colors">{crumb.label}</a>
            }
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface HeaderProps {
  onQuickAdd?: () => void
  onToggleMobileNav?: () => void
}

export function Header({ onQuickAdd }: HeaderProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleQuickAddClick = () => {
    if (onQuickAdd) {
      onQuickAdd()
    } else {
      setIsQuickAddOpen(true)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 py-3.5">
        <Breadcrumbs />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Personal Finance Management
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {user ? `Signed in as ${user.username}` : 'Track your income, bills and balances in real time'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Add CTA Button */}
            <button
              onClick={handleQuickAddClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:bg-primary/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus size={16} />
              <span>Record Transaction</span>
            </button>

            {/* User profile / logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-primary" title={user.email}>
                  <UserIcon size={16} />
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-1.5 text-muted-foreground hover:text-danger rounded-md hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Add Modal — rendered here when no external onQuickAdd is provided */}
      {!onQuickAdd && (
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
        />
      )}
    </>
  )
}

