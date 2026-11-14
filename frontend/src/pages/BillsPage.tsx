import { useState, useMemo } from 'react'
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  AlertCircle,
  RefreshCw,
  X,
  Calculator,
} from 'lucide-react'
import {
  useCurrentMonthBills,
  useRecurringBills,
  useCreateRecurringBill,
  usePayBill,
} from '@/hooks/useBillsQueries'
import { useAccounts, useExpenseCategories } from '@/hooks/useFinanceQueries'
import { useCalculatorInput } from '@/hooks/useCalculatorInput'
import { formatMoney, parseMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { RecurringExpenseOccurrence } from '@/types'

// ── Pay Bill Modal ────────────────────────────────────────────────────────────
interface PayBillModalProps {
  occurrence: RecurringExpenseOccurrence
  onClose: () => void
}

function PayBillModal({ occurrence, onClose }: PayBillModalProps) {
  const { data: accounts = [] } = useAccounts()
  const payMutation = usePayBill()

  const defaultAccountId = useMemo(() => {
    if (occurrence.preferred_account_id) {
      return String(occurrence.preferred_account_id)
    }
    return accounts[0] ? String(accounts[0].id) : ''
  }, [occurrence.preferred_account_id, accounts])

  const [accountId, setAccountId] = useState(defaultAccountId)
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(
    () => `Bill Payment: ${occurrence.bill_name} (${occurrence.period})`
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!accountId) {
      setError('Please select an account to pay from.')
      return
    }

    payMutation.mutate(
      {
        occurrenceId: occurrence.id,
        accountId: Number(accountId),
        paymentDate,
        description: description.trim(),
      },
      {
        onSuccess: () => onClose(),
        onError: (err: unknown) => {
          const res = (err as { response?: { data?: { error?: string } } })?.response?.data
          setError(res?.error || 'Failed to record bill payment. Please try again.')
        },
      }
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-bill-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 id="pay-bill-title" className="text-base font-semibold text-foreground">
              Pay Bill: {occurrence.bill_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-4 rounded-lg bg-muted/50 p-3 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Bill Amount:</span>
          <span className="text-base font-bold text-foreground tabular-nums">
            {formatMoney(occurrence.amount)}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pay-account" className="block text-xs font-medium text-foreground mb-1">
              Payment Account <span className="text-destructive">*</span>
            </label>
            <select
              id="pay-account"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Select Account</option>
              {accounts.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name} (Balance: {formatMoney(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pay-date" className="block text-xs font-medium text-foreground mb-1">
              Payment Date
            </label>
            <input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="pay-desc" className="block text-xs font-medium text-foreground mb-1">
              Description / Notes
            </label>
            <input
              id="pay-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={payMutation.isPending}
              className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
            >
              {payMutation.isPending ? 'Processing…' : 'Confirm & Deduct Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── New Recurring Bill Modal ──────────────────────────────────────────────────
interface NewBillModalProps {
  isOpen: boolean
  onClose: () => void
}

function NewBillModal({ isOpen, onClose }: NewBillModalProps) {
  const [name, setName] = useState('')
  const amountInput = useCalculatorInput()
  const [dueDay, setDueDay] = useState('1')
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly')
  const [categoryId, setCategoryId] = useState('')
  const [preferredAccountId, setPreferredAccountId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useExpenseCategories()
  const createMutation = useCreateRecurringBill()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide a bill name.')
      return
    }

    // Resolve any pending expression before submitting
    const finalAmount = amountInput.isExpression
      ? (amountInput.previewValue ?? amountInput.displayValue)
      : amountInput.displayValue
    const parsed = parseMoney(finalAmount)
    if (parsed.lessThanOrEqualTo(0)) {
      setError('Amount must be greater than zero.')
      return
    }

    const day = parseInt(dueDay, 10)
    if (isNaN(day) || day < 1 || day > 31) {
      setError('Due day must be between 1 and 31.')
      return
    }

    createMutation.mutate(
      {
        name: name.trim(),
        amount: parsed.toFixed(2),
        due_day: day,
        frequency,
        category: categoryId ? Number(categoryId) : null,
        preferred_account: preferredAccountId ? Number(preferredAccountId) : null,
        start_date: new Date().toISOString().split('T')[0],
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setName('')
          amountInput.reset()
          setDescription('')
          onClose()
        },
        onError: () => {
          setError('Failed to create recurring bill. Check your connection and retry.')
        },
      }
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-bill-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id="new-bill-title" className="text-base font-semibold text-foreground">
            Configure Recurring Bill
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="bill-name" className="block text-xs font-medium text-foreground mb-1">
              Bill / Expense Name <span className="text-destructive">*</span>
            </label>
            <input
              id="bill-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. House Rent, WiFi Internet, Electricity"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bill-amount" className="block text-xs font-medium text-foreground mb-1">
                Amount (৳) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calculator size={12} className="absolute right-3 top-2.5 text-muted-foreground/50" />
                <input
                  id="bill-amount"
                  type="text"
                  inputMode="decimal"
                  required
                  value={amountInput.displayValue}
                  onChange={amountInput.handleChange}
                  onBlur={amountInput.handleBlur}
                  onKeyDown={amountInput.handleKeyDown}
                  placeholder="5000.00  (e.g. 2000+3000)"
                  className={cn(
                    'w-full h-9 px-3 pr-9 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    amountInput.isExpression && 'border-primary/50 ring-1 ring-primary/20'
                  )}
                />
              </div>
              {amountInput.isExpression && amountInput.previewValue && (
                <p className="mt-1 text-[11px] font-medium text-primary" role="status" aria-live="polite">
                  = {parseFloat(amountInput.previewValue).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳
                </p>
              )}
            </div>
            <div>
              <label htmlFor="bill-due-day" className="block text-xs font-medium text-foreground mb-1">
                Due Day of Month (1–31) <span className="text-destructive">*</span>
              </label>
              <input
                id="bill-due-day"
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bill-frequency" className="block text-xs font-medium text-foreground mb-1">
                Frequency
              </label>
              <select
                id="bill-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'yearly')}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label htmlFor="bill-category" className="block text-xs font-medium text-foreground mb-1">
                Category
              </label>
              <select
                id="bill-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">None / General</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bill-pref-account" className="block text-xs font-medium text-foreground mb-1">
              Preferred Account (Optional)
            </label>
            <select
              id="bill-pref-account"
              value={preferredAccountId}
              onChange={(e) => setPreferredAccountId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">No preference</option>
              {accounts.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
            >
              {createMutation.isPending ? 'Saving…' : 'Save Recurring Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Bills Page ───────────────────────────────────────────────────────────
export function BillsPage() {
  const [activeTab, setActiveTab] = useState<'this-month' | 'rules'>('this-month')
  const [isNewBillOpen, setIsNewBillOpen] = useState(false)
  const [selectedOccurrence, setSelectedOccurrence] = useState<RecurringExpenseOccurrence | null>(null)

  const {
    data: monthData,
    isLoading: monthLoading,
    isError: monthError,
    refetch: refetchMonth,
  } = useCurrentMonthBills()

  const {
    data: billRules = [],
    isLoading: rulesLoading,
    isError: rulesError,
    refetch: refetchRules,
  } = useRecurringBills()

  const occurrences = monthData?.results ?? []
  const unpaidTotal = monthData?.unpaid_total ?? '0.00'
  const paidTotal = monthData?.paid_total ?? '0.00'

  const unpaidCount = occurrences.filter((o) => o.status === 'unpaid' || o.status === 'overdue').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Recurring Bills & Fixed Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track fixed monthly commitments, utilities, and rent with automatic occurrence management
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewBillOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Recurring Bill</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unpaid This Month</p>
          <p className="text-2xl font-bold tracking-tight text-amber-600 tabular-nums mt-1">
            {formatMoney(unpaidTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {unpaidCount} bill{unpaidCount !== 1 ? 's' : ''} awaiting payment
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid This Month</p>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums mt-1">
            {formatMoney(paidTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Already deducted from balances</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Bill Rules</p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums mt-1">
            {billRules.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Configured recurring templates</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('this-month')}
          className={`pb-3 px-4 transition border-b-2 ${
            activeTab === 'this-month'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          This Month&apos;s Bills ({occurrences.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-4 transition border-b-2 ${
            activeTab === 'rules'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Recurring Rules ({billRules.length})
        </button>
      </div>

      {/* TAB 1: This Month's Bills */}
      {activeTab === 'this-month' && (
        <>
          {monthError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center"
            >
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <h3 className="text-sm font-semibold text-foreground">Failed to load this month&apos;s bills</h3>
              <button
                type="button"
                onClick={() => refetchMonth()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : monthLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-border/40">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : occurrences.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <CalendarClock className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-sm font-semibold text-foreground">No bills for this month</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Add your recurring rent, utility, or subscription bills to automatically track monthly payments.
              </p>
              <button
                type="button"
                onClick={() => setIsNewBillOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Recurring Bill
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3">Bill</th>
                      <th scope="col" className="px-4 py-3">Category</th>
                      <th scope="col" className="px-4 py-3">Due Date</th>
                      <th scope="col" className="px-4 py-3">Preferred Account</th>
                      <th scope="col" className="px-4 py-3 text-right">Amount</th>
                      <th scope="col" className="px-4 py-3 text-center">Status</th>
                      <th scope="col" className="px-4 py-3 text-center w-28">
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {occurrences.map((occ) => {
                      const isPaid = occ.status === 'paid'
                      const isOverdue = occ.status === 'overdue'

                      return (
                        <tr key={occ.id} className="hover:bg-muted/40 transition">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {occ.bill_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {occ.category_name || '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">
                            {occ.due_date}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {occ.preferred_account_name || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                            {formatMoney(occ.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                                <AlertTriangle className="h-3 w-3" /> Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                <Clock className="h-3 w-3" /> Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isPaid ? (
                              <span className="text-[11px] text-muted-foreground">Completed</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedOccurrence(occ)}
                                className="rounded-lg bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: Recurring Rules */}
      {activeTab === 'rules' && (
        <>
          {rulesError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center"
            >
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <h3 className="text-sm font-semibold text-foreground">Failed to load recurring rules</h3>
              <button
                type="button"
                onClick={() => refetchRules()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : rulesLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-border/40">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : billRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <p className="text-sm font-semibold text-foreground">No recurring bill rules configured</p>
              <button
                type="button"
                onClick={() => setIsNewBillOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add Bill Rule
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3">Rule Name</th>
                      <th scope="col" className="px-4 py-3">Amount</th>
                      <th scope="col" className="px-4 py-3">Frequency</th>
                      <th scope="col" className="px-4 py-3">Due Day</th>
                      <th scope="col" className="px-4 py-3">Category</th>
                      <th scope="col" className="px-4 py-3">Preferred Account</th>
                      <th scope="col" className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {billRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-muted/40 transition">
                        <td className="px-4 py-3 font-medium text-foreground">{rule.name}</td>
                        <td className="px-4 py-3 font-semibold text-foreground tabular-nums">
                          {formatMoney(rule.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{rule.frequency}</td>
                        <td className="px-4 py-3 text-muted-foreground">Day {rule.due_day} of month</td>
                        <td className="px-4 py-3 text-muted-foreground">{rule.category_name || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{rule.preferred_account_name || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700 capitalize">
                            {rule.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pay Bill Modal */}
      {selectedOccurrence && (
        <PayBillModal
          occurrence={selectedOccurrence}
          onClose={() => setSelectedOccurrence(null)}
        />
      )}

      {/* New Bill Modal */}
      <NewBillModal
        isOpen={isNewBillOpen}
        onClose={() => setIsNewBillOpen(false)}
      />
    </div>
  )
}

export default BillsPage
