import React, { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Settings,
  Plus,
  X,
  RefreshCw,
  Sliders,
  Calculator,
} from 'lucide-react'
import {
  useBudgetPerformance,
  useUpsertMonthlyBudget,
} from '@/hooks/useBudgetQueries'
import { ExportButton } from '@/components/shared/ExportButton'
import { downloadBudgetReport } from '@/hooks/useReportsQueries'
import { useExpenseCategories } from '@/hooks/useFinanceQueries'
import { useCalculatorInput } from '@/hooks/useCalculatorInput'
import { formatMoney, parseMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { CategoryBudgetStats, BudgetStatus } from '@/types'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function getStatusBadge(status: BudgetStatus | 'normal' | 'warning' | 'exceeded') {
  switch (status) {
    case 'normal':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          <ShieldCheck className="h-3 w-3" />
          On Track
        </span>
      )
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          Near Limit (≥80%)
        </span>
      )
    case 'exceeded':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
          <AlertOctagon className="h-3 w-3" />
          Exceeded
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          Unconfigured
        </span>
      )
  }
}

function getProgressColor(status: BudgetStatus | 'normal' | 'warning' | 'exceeded') {
  switch (status) {
    case 'normal':
      return 'bg-emerald-500'
    case 'warning':
      return 'bg-amber-500'
    case 'exceeded':
      return 'bg-rose-500'
    default:
      return 'bg-slate-300'
  }
}

// ── Set/Edit Monthly Budget Modal ───────────────────────────────────────────
interface SetBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number
  currentLimit?: string
  currentNotes?: string
  currentAllocations?: CategoryBudgetStats[]
}

function SetBudgetModal({
  isOpen,
  onClose,
  year,
  month,
  currentLimit = '',
  currentNotes = '',
  currentAllocations = [],
}: SetBudgetModalProps) {
  const { data: categories = [] } = useExpenseCategories()
  const upsertBudget = useUpsertMonthlyBudget()

  const totalAmountInput = useCalculatorInput({ initialValue: currentLimit })
  const [notes, setNotes] = useState(currentNotes)
  const [allocations, setAllocations] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      totalAmountInput.setValue(currentLimit)
      setNotes(currentNotes)
      const initialMap: Record<number, string> = {}
      currentAllocations.forEach((alloc) => {
        if (alloc.category_id) {
          initialMap[alloc.category_id] = alloc.allocated_amount
        }
      })
      setAllocations(initialMap)
      setError(null)
    }
  }, [isOpen, currentLimit, currentNotes, currentAllocations, totalAmountInput])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAllocationChange = (catId: number, val: string) => {
    setAllocations((prev) => ({
      ...prev,
      [catId]: val,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Resolve any pending expression before submitting
    const finalAmount = totalAmountInput.isExpression
      ? (totalAmountInput.previewValue ?? totalAmountInput.displayValue)
      : totalAmountInput.displayValue
    const parsed = parseMoney(finalAmount)
    if (parsed.lessThanOrEqualTo(0)) {
      setError('Please provide a valid budget limit greater than 0.')
      return
    }

    const payloadAllocations = Object.entries(allocations)
      .filter(([_, amt]) => amt && parseFloat(amt) > 0)
      .map(([catId, amt]) => ({
        category_id: parseInt(catId, 10),
        allocated_amount: amt,
      }))

    try {
      await upsertBudget.mutateAsync({
        year,
        month,
        total_amount: parsed.toFixed(2),
        notes,
        allocations: payloadAllocations,
      })
      toast.success('Budget saved successfully')
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to save monthly budget. Please check your inputs.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 id="budget-modal-title" className="text-base font-semibold text-foreground">
              Configure Monthly Budget
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target for {MONTH_NAMES[month - 1]} {year}
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
            <label htmlFor="total-amount" className="block text-xs font-medium text-foreground mb-1">
              Total Monthly Spending Ceiling (৳) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-muted-foreground font-semibold">৳</span>
              <Calculator size={12} className="absolute right-3 top-2 text-muted-foreground/50" />
              <input
                id="total-amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="50000.00  (e.g. 30000+20000)"
                value={totalAmountInput.displayValue}
                onChange={totalAmountInput.handleChange}
                onBlur={totalAmountInput.handleBlur}
                onKeyDown={totalAmountInput.handleKeyDown}
                className={cn(
                  'w-full h-9 pl-7 pr-9 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  totalAmountInput.isExpression && 'border-primary/50 ring-1 ring-primary/20'
                )}
              />
            </div>
            {totalAmountInput.isExpression && totalAmountInput.previewValue && (
              <p className="mt-1 text-[11px] font-medium text-primary" role="status" aria-live="polite">
                = {parseFloat(totalAmountInput.previewValue).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              Variable day-to-day limit (groceries, leisure, transport). Fixed bills are tracked separately.
            </p>
          </div>

          <div>
            <label htmlFor="budget-notes" className="block text-xs font-medium text-foreground mb-1">
              Budget Notes (Optional)
            </label>
            <input
              id="budget-notes"
              type="text"
              placeholder="e.g., Focus on reducing dine-out spending this month"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Category Allocations */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground">
                Category Allocations (Optional)
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Set sub-limits per category
              </span>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No expense categories available.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-foreground truncate max-w-[180px]">{cat.name}</span>
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground font-semibold">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={allocations[cat.id] ?? ''}
                        onChange={(e) => handleAllocationChange(cat.id, e.target.value)}
                        className="w-full h-8 pl-6 pr-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={upsertBudget.isPending}
              className="h-9 px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={upsertBudget.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              {upsertBudget.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Budget'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Budget Page ────────────────────────────────────────────────────────
export function BudgetPage() {
  const today = useMemo(() => new Date(), [])
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    data: performance,
    isLoading,
    isError,
    refetch,
  } = useBudgetPerformance(selectedYear, selectedMonth)

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1)
      setSelectedMonth(12)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1)
      setSelectedMonth(1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  const handleJumpCurrent = () => {
    setSelectedYear(today.getFullYear())
    setSelectedMonth(today.getMonth() + 1)
  }

  const isCurrentMonth =
    selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Monthly Budget Limits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ceilings, category allocations, and variable spending performance
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 text-xs font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleJumpCurrent}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              This Month
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {performance?.has_budget ? (
              <>
                <Settings className="h-3.5 w-3.5" />
                Adjust Budget
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Set Budget
              </>
            )}
          </button>
          <ExportButton
            options={[
              {
                label: 'Budget Report (PDF)',
                icon: 'pdf',
                onClick: async () => {
                  await downloadBudgetReport({ year: selectedYear, month: selectedMonth })
                },
              },
            ]}
          />
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
            <span>Failed to load budget calculations for this period.</span>
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
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border border-border bg-card p-4 space-y-2">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-6 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="h-40 rounded-2xl border border-border bg-card p-6" />
        </div>
      ) : performance && !performance.has_budget ? (
        /* Empty State: No Budget Configured */
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Sliders className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              No Budget Set for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h2>
            <p className="text-xs text-muted-foreground">
              You haven't defined a monthly variable budget ceiling yet. Setting a ceiling protects your savings by flagging variable spending spikes.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Set Budget for {MONTH_NAMES[selectedMonth - 1]}
            </button>
          </div>
        </div>
      ) : performance ? (
        /* Populated State */
        <div className="space-y-6">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Monthly Budget Limit</span>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {formatMoney(performance.budget_limit)}
              </p>
              <p className="text-[11px] text-muted-foreground">Configured spending ceiling</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Variable Spent</span>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {formatMoney(performance.variable_spent)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {performance.percentage_used}% of ceiling used
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Budget Remaining</span>
              <p
                className={`text-xl font-bold tabular-nums ${
                  parseFloat(performance.remaining_budget) >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {formatMoney(performance.remaining_budget)}
              </p>
              <div className="pt-0.5">{getStatusBadge(performance.status)}</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Fixed Recurring Bills</span>
              <p className="text-xl font-bold text-slate-700 tabular-nums">
                {formatMoney(performance.fixed_spent)}
              </p>
              <p className="text-[11px] text-muted-foreground">Excluded from variable budget</p>
            </div>
          </div>

          {/* Health Gauge Progress Bar */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Budget Health Indicator</h2>
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {performance.percentage_used}% used
              </span>
            </div>

            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${getProgressColor(
                  performance.status
                )}`}
                style={{ width: `${Math.min(performance.percentage_used, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>0% (Safe)</span>
              <span>80% (Warning Threshold)</span>
              <span>100% (Ceiling)</span>
            </div>
          </div>

          {/* Category Allocations & Actual Spending */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Category Breakdown</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allocations versus actual variable spending for this month
                </p>
              </div>
            </div>

            {performance.category_breakdowns.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No category allocations configured. You can assign category sub-limits by clicking "Adjust Budget".
              </div>
            ) : (
              <div className="divide-y divide-border">
                {performance.category_breakdowns.map((cat, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{cat.category_name}</span>
                        {getStatusBadge(cat.status)}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground tabular-nums">
                          {formatMoney(cat.spent_amount)}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatMoney(cat.allocated_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${getProgressColor(
                          cat.status
                        )}`}
                        style={{ width: `${Math.min(cat.percentage_used, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Set/Edit Budget Modal */}
      <SetBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        year={selectedYear}
        month={selectedMonth}
        currentLimit={performance?.has_budget ? performance.budget_limit : ''}
        currentNotes={performance?.notes || ''}
        currentAllocations={performance?.category_breakdowns || []}
      />
    </div>
  )
}
