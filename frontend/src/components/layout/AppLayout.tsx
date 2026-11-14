import { useState, useCallback } from 'react'
import type { TabType } from '@/components/transactions/QuickAddModal'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { QuickAddModal } from '@/components/transactions/QuickAddModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { KeyboardShortcutsHelp } from '@/components/shared/KeyboardShortcutsHelp'

export function AppLayout() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddTab, setQuickAddTab] = useState<TabType>('expense')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

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

  const { shortcuts } = useKeyboardShortcuts({
    onQuickAddExpense: handleQuickAddExpense,
    onQuickAddIncome: handleQuickAddIncome,
    onQuickAddTransfer: handleQuickAddTransfer,
    onToggleHelp: handleToggleHelp,
  })

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onQuickAdd={handleQuickAdd} />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet />
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
