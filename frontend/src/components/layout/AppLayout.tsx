import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from 'react-error-boundary'
import { cn } from '@/lib/utils'
import type { TabType } from '@/components/transactions/QuickAddModal'
import { Sidebar, MobileNav } from './Sidebar'
import { Header } from './Header'
import { QuickAddModal } from '@/components/transactions/QuickAddModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { KeyboardShortcutsHelp } from '@/components/shared/KeyboardShortcutsHelp'

function ErrorBoundaryFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-4" aria-hidden="true">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{errorMessage}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors min-h-[36px] min-w-[80px]"
      >
        Try again
      </button>
    </div>
  )
}

export function AppLayout() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddTab, setQuickAddTab] = useState<TabType>('expense')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  const handleQuickAddExpense = useCallback(() => {
    setQuickAddTab('expense')
    setIsQuickAddOpen(true)
  }, [])

  const handleQuickAddIncome = useCallback(() => {
    setQuickAddTab('income')
    setIsQuickAddOpen(true)
  }, [])

  const handleQuickAddTransfer = useCallback(() => {
    setQuickAddTab('transfer')
    setIsQuickAddOpen(true)
  }, [])

  const handleQuickAdd = useCallback(() => {
    setQuickAddTab('expense')
    setIsQuickAddOpen(true)
  }, [])

  const handleToggleHelp = useCallback(() => {
    setIsHelpOpen((prev) => !prev)
  }, [])

  const handleToggleMobileNav = useCallback(() => {
    setIsMobileNavOpen((prev) => !prev)
  }, [])

  const handleCloseMobileNav = useCallback(() => {
    setIsMobileNavOpen(false)
  }, [])

  // Close mobile nav on Escape key
  useEffect(() => {
    if (!isMobileNavOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseMobileNav()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileNavOpen, handleCloseMobileNav])

  const { shortcuts } = useKeyboardShortcuts({
    onQuickAddExpense: handleQuickAddExpense,
    onQuickAddIncome: handleQuickAddIncome,
    onQuickAddTransfer: handleQuickAddTransfer,
    onToggleHelp: handleToggleHelp,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Navigation Link — WCAG 2.4.1 Bypass Blocks */}
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-50 -translate-y-full rounded-br-lg bg-primary px-4 py-2 text-sm font-medium text-white focus:translate-y-0"
      >
        Skip to main content
      </a>

      <Toaster position="top-right" duration={4000} />

      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <MobileNav isOpen={isMobileNavOpen} onClose={handleCloseMobileNav} />
      <div className={cn('flex flex-col min-h-screen', sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        <Header onQuickAdd={handleQuickAdd} onToggleMobileNav={handleToggleMobileNav} />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        initialTab={quickAddTab}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        shortcuts={shortcuts}
      />
    </div>
  )
}
