import { useState } from 'react'
import {
  CalendarDays,
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
  useObligations,
  useObligationSummary,
  useCreateObligation,
  usePayObligation,
} from '@/hooks/useObligationsQueries'
import { useAccounts, useExpenseCategories } from '@/hooks/useFinanceQueries'
import { useCalculatorInput } from '@/hooks/useCalculatorInput'
import { formatMoney, parseMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { FinancialObligation, ObligationPriority } from '@/types'

// ── Priority badges configuration ─────────────────────────────────────────────
const PRIORITY_BADGES: Record<ObligationPriority, { label: string; bg: string; text: string }> = {
  urgent: { label: 'Urgent', bg: 'bg-danger/10 border-danger/20', text: 'text-danger' },
  high: { label: 'High', bg: 'bg-warning/10 border-warning/20', text: 'text-warning' },
  medium: { label: 'Medium', bg: 'bg-primary/10 border-primary/20', text: 'text-primary' },
  low: { label: 'Low', bg: 'bg-muted border-border', text: 'text-foreground' },
}

function getDaysRemaining(dueDateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`
  if (diffDays === 0) return 'Due today'
  return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
}

// ── Pay Obligation Modal ──────────────────────────────────────────────────────
interface PayModalProps {
  obligation: FinancialObligation
  onClose: () => void
}

function PayObligationModal({ obligation, onClose }: PayModalProps) {
  const { data: accounts = [] } = useAccounts()
  const payMutation = usePayObligation()

  const [accountId, setAccountId] = useState(() => (accounts[0] ? String(accounts[0].id) : ''))
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(() => `Obligation Payment: ${obligation.name}`)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!accountId) {
      setError('Please select an account.')
      return
    }

    payMutation.mutate(
      {
        obligationId: obligation.id,
        accountId: Number(accountId),
        paymentDate,
        description: description.trim(),
      },
      {
        onSuccess: () => onClose(),
        onError: (err: unknown) => {
          const res = (err as { response?: { data?: { error?: string } } })?.response?.data
          setError(res?.error || 'Failed to record payment. Please try again.')
        },
      }
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-obligation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 id="pay-obligation-title" className="text-base font-semibold text-foreground">
              Pay: {obligation.name}
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
          <span className="text-muted-foreground">Obligation Amount:</span>
          <span className="text-base font-bold text-foreground tabular-nums">
            {formatMoney(obligation.amount)}
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
            <label htmlFor="pay-ob-account" className="block text-xs font-medium text-foreground mb-1">
              Payment Account <span className="text-destructive">*</span>
            </label>
            <select
              id="pay-ob-account"
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
            <label htmlFor="pay-ob-date" className="block text-xs font-medium text-foreground mb-1">
              Payment Date
            </label>
            <input
              id="pay-ob-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="pay-ob-desc" className="block text-xs font-medium text-foreground mb-1">
              Notes / Description
            </label>
            <input
              id="pay-ob-desc"
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
              className="rounded-lg bg-gradient-to-r from-electric-blue to-electric-sky px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {payMutation.isPending ? 'Processing…' : 'Confirm & Deduct Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── New Obligation Modal ──────────────────────────────────────────────────────
interface NewObligationModalProps {
  isOpen: boolean
  onClose: () => void
}

function NewObligationModal({ isOpen, onClose }: NewObligationModalProps) {
  const [name, setName] = useState('')
  const amountInput = useCalculatorInput()
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<ObligationPriority>('medium')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: categories = [] } = useExpenseCategories()
  const createMutation = useCreateObligation()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide an obligation name.')
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

    if (!dueDate) {
      setError('Please set a due date.')
      return
    }

    createMutation.mutate(
      {
        name: name.trim(),
        amount: parsed.toFixed(2),
        due_date: dueDate,
        priority,
        category: categoryId ? Number(categoryId) : null,
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setName('')
          amountInput.reset()
          setDueDate('')
          setDescription('')
          onClose()
        },
        onError: () => {
          setError('Failed to create obligation. Check your connection and retry.')
        },
      }
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-ob-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id="new-ob-title" className="text-base font-semibold text-foreground">
            Add Future Financial Obligation
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
            <label htmlFor="ob-name" className="block text-xs font-medium text-foreground mb-1">
              Obligation Title <span className="text-destructive">*</span>
            </label>
            <input
              id="ob-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. University Semester Fee, Exam Fee, Insurance"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ob-amount" className="block text-xs font-medium text-foreground mb-1">
                Amount (৳) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calculator size={12} className="absolute right-3 top-2.5 text-muted-foreground/50" />
                <input
                  id="ob-amount"
                  type="text"
                  inputMode="decimal"
                  required
                  value={amountInput.displayValue}
                  onChange={amountInput.handleChange}
                  onBlur={amountInput.handleBlur}
                  onKeyDown={amountInput.handleKeyDown}
                  placeholder="18000.00  (e.g. 9000+9000)"
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
              <label htmlFor="ob-due-date" className="block text-xs font-medium text-foreground mb-1">
                Due Date <span className="text-destructive">*</span>
              </label>
              <input
                id="ob-due-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ob-priority" className="block text-xs font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                id="ob-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ObligationPriority)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="ob-category" className="block text-xs font-medium text-foreground mb-1">
                Category
              </label>
              <select
                id="ob-category"
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
            <label htmlFor="ob-description" className="block text-xs font-medium text-foreground mb-1">
              Description (Optional)
            </label>
            <input
              id="ob-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 5th semester tuition installment"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
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
              className="rounded-lg bg-gradient-to-r from-electric-blue to-electric-sky px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {createMutation.isPending ? 'Saving…' : 'Save Obligation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Obligations Page ─────────────────────────────────────────────────────
export function ObligationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isNewObligationOpen, setIsNewObligationOpen] = useState(false)
  const [selectedObligation, setSelectedObligation] = useState<FinancialObligation | null>(null)

  const {
    data: obligations = [],
    isLoading,
    isError,
    refetch,
  } = useObligations(statusFilter)

  const { data: summary } = useObligationSummary()

  const totalPending = summary?.total_pending ?? '0.00'
  const totalPaid = summary?.total_paid ?? '0.00'
  const pendingCount = summary?.pending_count ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Future Financial Obligations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage semester fees, examination costs, and large upcoming commitments separate from monthly bills
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewObligationOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-electric-blue to-electric-sky px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Obligation</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Pending Obligations
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums mt-1">
            {formatMoney(totalPending)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount} commitment{pendingCount !== 1 ? 's' : ''} to settle
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Settled (Paid)
          </p>
          <p className="text-2xl font-bold tracking-tight text-success tabular-nums mt-1">
            {formatMoney(totalPaid)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Settled obligations</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status Filter
            </p>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {[
                { label: 'All', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Overdue', value: 'overdue' },
                { label: 'Paid', value: 'paid' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content State Matrix */}
      {isError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center"
        >
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Failed to load obligations</h3>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-white p-6 space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border/40">
              <div className="h-4 w-36 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : obligations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-12 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-sm font-semibold text-foreground">No financial obligations found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Keep track of semester fees, annual license renewals, or lump-sum debts due in coming months.
          </p>
          <button
            type="button"
            onClick={() => setIsNewObligationOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-electric-blue to-electric-sky px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add First Obligation
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Obligation</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Due Date & Timeline</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                  <th scope="col" className="px-4 py-3 text-center w-28">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {obligations.map((ob) => {
                  const isPaid = ob.status === 'paid'
                  const isOverdue = ob.status === 'overdue'
                  const prioBadge = PRIORITY_BADGES[ob.priority] ?? PRIORITY_BADGES.medium
                  const timeline = getDaysRemaining(ob.due_date)

                  return (
                    <tr key={ob.id} className="hover:bg-muted/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{ob.name}</p>
                        {ob.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{ob.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{ob.category_name || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="text-foreground font-mono">{ob.due_date}</p>
                        {!isPaid && (
                          <p
                            className={`text-[10px] font-medium ${
                              isOverdue ? 'text-danger font-semibold' : 'text-muted-foreground'
                            }`}
                          >
                            {timeline}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${prioBadge.bg} ${prioBadge.text}`}
                        >
                          {prioBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                        {formatMoney(ob.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[11px] font-medium text-success">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-[11px] font-medium text-danger">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[11px] font-medium text-warning">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <span className="text-[11px] text-muted-foreground">Settled</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedObligation(ob)}
                            className="rounded-lg bg-gradient-to-r from-electric-blue to-electric-sky px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue"
                          >
                            Mark Paid
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

      {/* Pay Obligation Modal */}
      {selectedObligation && (
        <PayObligationModal
          obligation={selectedObligation}
          onClose={() => setSelectedObligation(null)}
        />
      )}

      {/* New Obligation Modal */}
      <NewObligationModal
        isOpen={isNewObligationOpen}
        onClose={() => setIsNewObligationOpen(false)}
      />
    </div>
  )
}

export default ObligationsPage
