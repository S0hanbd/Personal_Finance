import React, { useState, useMemo, useEffect } from 'react'
import {
  ShoppingBag,
  Plus,
  Filter,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  RefreshCw,
  X,
  Tag,
  TrendingDown,
} from 'lucide-react'
import {
  usePlannedPurchases,
  useCreatePlannedPurchase,
  useUpdatePlannedPurchase,
  useSettlePlannedPurchase,
  useDeletePlannedPurchase,
} from '@/hooks/useBudgetQueries'
import { useAccounts, useExpenseCategories } from '@/hooks/useFinanceQueries'
import { formatMoney, sumMoney } from '@/lib/money'
import type {
  PlannedPurchase,
  PlannedPurchasePriority,
  PlannedPurchaseStatus,
  CreatePlannedPurchasePayload,
} from '@/types'

// ── Badges ──────────────────────────────────────────────────────────────────
function getPriorityBadge(priority: PlannedPurchasePriority) {
  switch (priority) {
    case 'urgent':
      return (
        <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          Urgent
        </span>
      )
    case 'high':
      return (
        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          High
        </span>
      )
    case 'medium':
      return (
        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
          Medium
        </span>
      )
    case 'low':
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          Low
        </span>
      )
  }
}

function getStatusBadge(status: PlannedPurchaseStatus) {
  switch (status) {
    case 'planned':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
          <Clock className="h-3 w-3" />
          Planned
        </span>
      )
    case 'saving':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          <TrendingDown className="h-3 w-3" />
          Saving Up
        </span>
      )
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          Ready to Buy
        </span>
      )
    case 'purchased':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
          <Check className="h-3 w-3" />
          Purchased
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 line-through">
          Cancelled
        </span>
      )
  }
}

// ── Target Date Countdown Helper ────────────────────────────────────────────
function formatTargetCountdown(targetDateStr: string | null) {
  if (!targetDateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDateStr)
  target.setHours(0, 0, 0, 0)

  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return <span className="text-rose-600 font-medium">Overdue by {Math.abs(diffDays)}d</span>
  }
  if (diffDays === 0) {
    return <span className="text-amber-600 font-semibold">Target today</span>
  }
  if (diffDays <= 7) {
    return <span className="text-amber-600 font-medium">In {diffDays} days</span>
  }
  return <span className="text-muted-foreground">In {diffDays} days</span>
}

// ── Settle Planned Purchase Modal ───────────────────────────────────────────
interface SettleModalProps {
  item: PlannedPurchase | null
  onClose: () => void
}

function SettleModal({ item, onClose }: SettleModalProps) {
  const { data: accounts = [] } = useAccounts()
  const settleMutation = useSettlePlannedPurchase()

  const [accountId, setAccountId] = useState('')
  const [actualAmount, setActualAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setActualAmount(item.estimated_amount)
      setDescription(`Purchased: ${item.name}`)
      setError(null)
      const primary = accounts[0]
      if (primary) setAccountId(String(primary.id))
    }
  }, [item, accounts])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [item, onClose])

  if (!item) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!accountId) {
      setError('Please select an account for payment deduction.')
      return
    }

    try {
      await settleMutation.mutateAsync({
        id: item.id,
        payload: {
          account_id: parseInt(accountId, 10),
          actual_amount: actualAmount,
          payment_date: paymentDate,
          description,
        },
      })
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to complete purchase. Check account balance.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settle-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 id="settle-modal-title" className="text-base font-semibold text-foreground">
              Complete Planned Purchase
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record expense and deduct from your balance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          >
            <AlertOctagon className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl bg-muted/40 p-3 space-y-1">
          <p className="text-xs font-semibold text-foreground">{item.name}</p>
          <p className="text-[11px] text-muted-foreground">
            Estimated Amount:{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {formatMoney(item.estimated_amount)}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="settle-account" className="block text-xs font-medium text-foreground mb-1">
              Payment Account <span className="text-destructive">*</span>
            </label>
            <select
              id="settle-account"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Balance: {formatMoney(acc.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="settle-amount" className="block text-xs font-medium text-foreground mb-1">
              Final Amount Spent (৳) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-muted-foreground font-semibold">৳</span>
              <input
                id="settle-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settle-date" className="block text-xs font-medium text-foreground mb-1">
              Purchase Date
            </label>
            <input
              id="settle-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="settle-desc" className="block text-xs font-medium text-foreground mb-1">
              Transaction Description
            </label>
            <input
              id="settle-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={settleMutation.isPending}
              className="h-9 px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={settleMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              {settleMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Purchase'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Planned Purchase Modal ──────────────────────────────────────────────
interface AddModalProps {
  isOpen: boolean
  onClose: () => void
}

function AddPlannedPurchaseModal({ isOpen, onClose }: AddModalProps) {
  const { data: categories = [] } = useExpenseCategories()
  const createMutation = useCreatePlannedPurchase()

  const [name, setName] = useState('')
  const [estimatedAmount, setEstimatedAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<PlannedPurchasePriority>('medium')
  const [status, setStatus] = useState<PlannedPurchaseStatus>('planned')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setEstimatedAmount('')
      setTargetDate('')
      setCategoryId('')
      setPriority('medium')
      setStatus('planned')
      setNotes('')
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide an item name.')
      return
    }
    if (!estimatedAmount || parseFloat(estimatedAmount) <= 0) {
      setError('Please provide an estimated amount greater than 0.')
      return
    }

    const payload: CreatePlannedPurchasePayload = {
      name: name.trim(),
      estimated_amount: estimatedAmount,
      target_date: targetDate || null,
      category: categoryId ? parseInt(categoryId, 10) : null,
      priority,
      status,
      notes: notes.trim(),
    }

    try {
      await createMutation.mutateAsync(payload)
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to create planned item.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 id="add-modal-title" className="text-base font-semibold text-foreground">
              Add Planned Purchase
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan and save for major future expenses
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          >
            <AlertOctagon className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="item-name" className="block text-xs font-medium text-foreground mb-1">
              Item Name <span className="text-destructive">*</span>
            </label>
            <input
              id="item-name"
              type="text"
              required
              placeholder="e.g., Mechanical Keyboard, Laptop Upgrade"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="item-amount" className="block text-xs font-medium text-foreground mb-1">
              Estimated Amount (৳) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-muted-foreground font-semibold">৳</span>
              <input
                id="item-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="15000.00"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-priority" className="block text-xs font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                id="item-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PlannedPurchasePriority)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="item-status" className="block text-xs font-medium text-foreground mb-1">
                Initial Status
              </label>
              <select
                id="item-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as PlannedPurchaseStatus)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="planned">Planned</option>
                <option value="saving">Saving Up</option>
                <option value="ready">Ready to Buy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-category" className="block text-xs font-medium text-foreground mb-1">
                Category
              </label>
              <select
                id="item-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="item-date" className="block text-xs font-medium text-foreground mb-1">
                Target Date
              </label>
              <input
                id="item-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-notes" className="block text-xs font-medium text-foreground mb-1">
              Notes
            </label>
            <textarea
              id="item-notes"
              rows={2}
              placeholder="e.g., Check for Black Friday discounts before purchasing"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="h-9 px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────────
export function PlannedSpendingPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [settlingItem, setSettlingItem] = useState<PlannedPurchase | null>(null)

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = usePlannedPurchases({
    status: statusFilter,
    priority: priorityFilter,
  })

  const updateMutation = useUpdatePlannedPurchase()
  const deleteMutation = useDeletePlannedPurchase()

  const summary = useMemo(() => {
    const activeItems = items.filter((i) => i.status !== 'cancelled' && i.status !== 'purchased')
    const totalPlanned = sumMoney(activeItems.map((i) => i.estimated_amount))
    const readyCount = items.filter((i) => i.status === 'ready').length
    const savingCount = items.filter((i) => i.status === 'saving').length
    const purchasedCount = items.filter((i) => i.status === 'purchased').length

    return {
      totalPlanned,
      readyCount,
      savingCount,
      purchasedCount,
    }
  }, [items])

  const handleStatusChange = async (item: PlannedPurchase, newStatus: PlannedPurchaseStatus) => {
    if (newStatus === 'purchased') {
      setSettlingItem(item)
      return
    }
    await updateMutation.mutateAsync({
      id: item.id,
      data: { status: newStatus },
    })
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this planned purchase?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Planned Spending</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reservations, priority targets, and future capital purchases
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Planned Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Total Planned In-Flight</span>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {formatMoney(summary.totalPlanned)}
          </p>
          <p className="text-[11px] text-muted-foreground">Across planned & saving targets</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Ready to Buy</span>
          <p className="text-xl font-bold text-emerald-600 tabular-nums">
            {summary.readyCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Funds secured for purchase</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Saving Up</span>
          <p className="text-xl font-bold text-blue-600 tabular-nums">
            {summary.savingCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Actively building cash allocation</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Settled Purchased</span>
          <p className="text-xl font-bold text-purple-600 tabular-nums">
            {summary.purchasedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Completed goals</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm text-xs">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'planned', label: 'Planned' },
            { id: 'saving', label: 'Saving Up' },
            { id: 'ready', label: 'Ready to Buy' },
            { id: 'purchased', label: 'Purchased' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 shrink-0" />
            <span>Failed to load planned purchases list.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 font-semibold hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-6 w-24 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-semibold text-foreground">No Planned Purchases Found</h2>
            <p className="text-xs text-muted-foreground">
              {statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters to view more items.'
                : 'Start tracking high-ticket items or future goals to plan savings ahead of time.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Planned Item
            </button>
          </div>
        </div>
      ) : (
        /* Populated Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-border/80 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
                      {item.name}
                    </h2>
                    {item.category_name && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        {item.category_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {formatMoney(item.estimated_amount)}
                  </span>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {item.target_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Target: {item.target_date}</span>
                    <span className="text-[11px]">({formatTargetCountdown(item.target_date)})</span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t border-border/60">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs">
                  {item.status !== 'purchased' && item.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => setSettlingItem(item)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold hover:bg-primary/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Check className="h-3 w-3" />
                      Buy & Deduct
                    </button>
                  )}

                  {item.status === 'planned' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item, 'saving')}
                      className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    >
                      Start Saving
                    </button>
                  )}

                  {item.status === 'saving' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item, 'ready')}
                      className="rounded-lg border border-border px-2 py-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                    >
                      Mark Ready
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddPlannedPurchaseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <SettleModal item={settlingItem} onClose={() => setSettlingItem(null)} />
    </div>
  )
}
