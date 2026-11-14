import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

export interface KeyboardShortcut {
  key: string
  label: string
  description: string
  action: () => void
}

interface UseKeyboardShortcutsOptions {
  onQuickAddExpense?: () => void
  onQuickAddIncome?: () => void
  onQuickAddTransfer?: () => void
  onToggleHelp?: () => void
}

/**
 * Chord-based keyboard shortcuts following vim-style conventions.
 * Press 'G' then 'D' to navigate to Dashboard, etc.
 * Single-key shortcuts: E (expense), I (income), V (transfer), ? (help), Escape (close).
 */
export function useKeyboardShortcuts({ onQuickAddExpense, onQuickAddIncome, onQuickAddTransfer, onToggleHelp }: UseKeyboardShortcutsOptions = {}) {
  const navigate = useNavigate()
  const chordKey = useRef<string | null>(null)
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearChord = useCallback(() => {
    if (chordTimer.current) {
      clearTimeout(chordTimer.current)
      chordTimer.current = null
    }
    chordKey.current = null
  }, [])

  const navigateIfNotHere = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      navigate(path)
    }
  }, [navigate])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input, textarea, or select
    const target = e.target as HTMLElement | null
    const isInput = target && ('INPUT' === target.tagName || 'TEXTAREA' === target.tagName || 'SELECT' === target.tagName)
    if (isInput) return

    // Ignore if modifier keys are pressed (except for explicit combos)
    if (e.ctrlKey || e.metaKey || e.altKey) return

    const key = e.key.toLowerCase()

    // Single-key shortcuts
    if (key === '?' || (key === '/' && !chordKey.current)) {
      // Only trigger help on '?' to avoid conflict with slash search
      if (key === '?' && onToggleHelp) {
        e.preventDefault()
        onToggleHelp()
        return
      }
    }

    if (key === 'e' && onQuickAddExpense) {
      e.preventDefault()
      onQuickAddExpense()
      return
    }

    if (key === 'i' && onQuickAddIncome) {
      e.preventDefault()
      onQuickAddIncome()
      return
    }

    if (key === 'v' && onQuickAddTransfer) {
      e.preventDefault()
      onQuickAddTransfer()
      return
    }

    // Chord handling: first key is 'g' (go)
    if (key === 'g' && !chordKey.current) {
      chordKey.current = 'g'
      // Reset chord after 2 seconds of inactivity
      chordTimer.current = setTimeout(() => {
        clearChord()
      }, 2000)
      return
    }

    // Second key of chord
    if (chordKey.current === 'g') {
      e.preventDefault()
      clearChord()

      switch (key) {
        case 'd':
          navigateIfNotHere(ROUTES.dashboard)
          break
        case 't':
          navigateIfNotHere(ROUTES.transactions)
          break
        case 'a':
          navigateIfNotHere(ROUTES.accounts)
          break
        case 'b':
          navigateIfNotHere(ROUTES.bills)
          break
        case 'o':
          navigateIfNotHere(ROUTES.obligations)
          break
        case 'u':
          navigateIfNotHere(ROUTES.budget)
          break
        case 's':
          navigateIfNotHere(ROUTES.plannedSpending)
          break
        case 'p':
          navigateIfNotHere(ROUTES.people)
          break
        case 'l':
          navigateIfNotHere(ROUTES.analytics)
          break
        case 'r':
          navigateIfNotHere(ROUTES.projects)
          break
        case 'm':
          navigateIfNotHere(ROUTES.settings)
          break
      }
    }
  }, [navigateIfNotHere, onQuickAddExpense, onQuickAddIncome, onQuickAddTransfer, onToggleHelp, clearChord])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearChord()
    }
  }, [handleKeyDown, clearChord])

  // Return the list of shortcuts for the help modal
  const shortcuts: KeyboardShortcut[] = [
    { key: 'G then D', label: 'Dashboard', description: 'Go to the dashboard overview', action: () => navigateIfNotHere(ROUTES.dashboard) },
    { key: 'G then T', label: 'Transactions', description: 'View and manage transactions', action: () => navigateIfNotHere(ROUTES.transactions) },
    { key: 'G then A', label: 'Accounts', description: 'Manage financial accounts', action: () => navigateIfNotHere(ROUTES.accounts) },
    { key: 'G then B', label: 'Bills', description: 'Track recurring bills', action: () => navigateIfNotHere(ROUTES.bills) },
    { key: 'G then O', label: 'Obligations', description: 'View financial obligations', action: () => navigateIfNotHere(ROUTES.obligations) },
    { key: 'G then U', label: 'Budget', description: 'Manage budgets', action: () => navigateIfNotHere(ROUTES.budget) },
    { key: 'G then S', label: 'Planned Spending', description: 'View planned spending', action: () => navigateIfNotHere(ROUTES.plannedSpending) },
    { key: 'G then P', label: 'People', description: 'Manage people and lending', action: () => navigateIfNotHere(ROUTES.people) },
    { key: 'G then L', label: 'Analytics', description: 'View analytics and reports', action: () => navigateIfNotHere(ROUTES.analytics) },
    { key: 'G then R', label: 'Projects', description: 'Manage financial projects', action: () => navigateIfNotHere(ROUTES.projects) },
    { key: 'G then M', label: 'Settings', description: 'App settings', action: () => navigateIfNotHere(ROUTES.settings) },
    { key: 'E', label: 'Add Expense', description: 'Quick add a new expense', action: () => onQuickAddExpense?.() },
    { key: 'I', label: 'Add Income', description: 'Quick add a new income', action: () => onQuickAddIncome?.() },
    { key: 'V', label: 'Add Transfer', description: 'Quick add a new transfer', action: () => onQuickAddTransfer?.() },
    { key: '?', label: 'Keyboard Shortcuts', description: 'Show this help dialog', action: () => onToggleHelp?.() },
    { key: 'Escape', label: 'Close', description: 'Close modals and dialogs', action: () => {} },
  ]

  return { shortcuts }
}
