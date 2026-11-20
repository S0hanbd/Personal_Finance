import { useState } from 'react'
import { toast } from 'sonner'
import {
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  X,
  Calculator,
  Check,
  AlertCircle,
} from 'lucide-react'
import {
  usePeople,
  useLendingSummary,
  useLoans,
  useLendMoney,
  useBorrowMoney,
  useSettleLoan,
  type LendMoneyPayload,
  type BorrowMoneyPayload,
  type SettleLoanPayload,
} from '@/hooks/useLendingQueries'
import { useAccounts } from '@/hooks/useFinanceQueries'
import { useCalculatorInput } from '@/hooks/useCalculatorInput'
import { formatMoney, parseMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { LoanRecord } from '@/types'

/*
 * Architecture note: This page uses the "hooks wrapper + content component" pattern.
 * All React hooks live in PeoplePage and are called unconditionally on every render.
 * The JSX is delegated to PeoplePageContent, which is a plain function component — it never
 * calls hooks, so it can be safely rendered without violating React's Rules of Hooks.
 */

export function PeoplePage() {
  const { data: summary, isLoading: summaryLoading } = useLendingSummary()
  const { data: people = [], isLoading: peopleLoading } = usePeople()
  const { data: loans = [] } = useLoans()
  const { data: accounts = [] } = useAccounts()
  const lendMutation = useLendMoney()
  const borrowMutation = useBorrowMoney()
  const settleMutation = useSettleLoan()

  const [showLendModal, setShowLendModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [settleLoan, setSettleLoan] = useState<LoanRecord | null>(null)

  return (
    <PeoplePageContent
      summary={summary}
      summaryLoading={summaryLoading}
      people={people}
      peopleLoading={peopleLoading}
      loans={loans}
      accounts={accounts}
      showLendModal={showLendModal}
      setShowLendModal={setShowLendModal}
      showBorrowModal={showBorrowModal}
      setShowBorrowModal={setShowBorrowModal}
      settleLoan={settleLoan}
      setSettleLoan={setSettleLoan}
      lendMutation={lendMutation}
      borrowMutation={borrowMutation}
      settleMutation={settleMutation}
    />
  )
}

// ── Content Component (NO hooks — safe for conditional rendering) ────────────

interface ContentProps {
  summary: { total_lent: string; total_borrowed: string; net_position: string } | undefined
  summaryLoading: boolean
  people: Array<{ id: number; name: string; total_lent: string; total_borrowed: string }>
  peopleLoading: boolean
  loans: LoanRecord[]
  accounts: Array<{ id: number; name: string; current_balance: string }>
  showLendModal: boolean
  setShowLendModal: (v: boolean) => void
  showBorrowModal: boolean
  setShowBorrowModal: (v: boolean) => void
  settleLoan: LoanRecord | null
  setSettleLoan: (v: LoanRecord | null) => void
  lendMutation: { mutate: (p: LendMoneyPayload) => void; isPending: boolean; error: Error | null }
  borrowMutation: { mutate: (p: BorrowMoneyPayload) => void; isPending: boolean; error: Error | null }
  settleMutation: { mutate: (p: SettleLoanPayload) => void; isPending: boolean; error: Error | null }
}

function PeoplePageContent(props: ContentProps) {
  const {
    summary, summaryLoading, people, peopleLoading, loans, accounts,
    showLendModal, setShowLendModal, showBorrowModal, setShowBorrowModal,
    settleLoan, setSettleLoan, lendMutation, borrowMutation, settleMutation,
  } = props

  const netPositive = summary ? parseMoney(summary.net_position).gte(0) : true

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">People & Loans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track money lent to and borrowed from others
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLendModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success hover:bg-success/20 transition min-h-[24px] min-w-[24px]"
          >
            <ArrowDownCircle className="h-4 w-4" />
            Lend Money
          </button>
          <button
            onClick={() => setShowBorrowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-warning/10 px-4 py-2 text-sm font-medium text-warning hover:bg-warning/20 transition min-h-[24px] min-w-[24px]"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Borrow Money
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={ArrowDownCircle}
          label="Total Lent"
          value={summaryLoading ? '—' : formatMoney(summary?.total_lent ?? '0')}
          color="text-success"
          bgColor="bg-success/10"
        />
        <SummaryCard
          icon={ArrowUpCircle}
          label="Total Borrowed"
          value={summaryLoading ? '—' : formatMoney(summary?.total_borrowed ?? '0')}
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <SummaryCard
          icon={netPositive ? TrendingUp : TrendingDown}
          label="Net Position"
          value={summaryLoading ? '—' : formatMoney(summary?.net_position ?? '0')}
          color={netPositive ? 'text-success' : 'text-danger'}
          bgColor={netPositive ? 'bg-success/10' : 'bg-danger/10'}
        />
      </div>

      {/* Person Directory */}
      <div className="rounded-xl border border-border bg-white">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            People Directory
          </h2>
        </div>
        {peopleLoading
          ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-pulse h-4 bg-muted rounded w-24 mx-auto" />
              </div>
            )
          : people.length === 0
            ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No people added yet.</p>
                  <p className="text-xs mt-1">Lend or borrow money to get started.</p>
                </div>
              )
            : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Money Lent</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Money Borrowed</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Active Loans</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {people.map((person) => {
                        const personLoans = loans.filter(
                          (l) => l.person === person.id && l.status === 'active'
                        )
                        return (
                          <tr key={person.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                            <td className="p-3 font-medium text-foreground">{person.name}</td>
                            <td className="p-3 text-right tabular-nums text-success">
                              {formatMoney(person.total_lent)}
                            </td>
                            <td className="p-3 text-right tabular-nums text-warning">
                              {formatMoney(person.total_borrowed)}
                            </td>
                            <td className="p-3 text-right tabular-nums text-muted-foreground">
                              {personLoans.length}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSettleLoan(
                                  personLoans.find((l) => l.person === person.id) || null
                                )}
                                disabled={personLoans.length === 0}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition min-h-[24px] min-w-[24px]',
                                  personLoans.length > 0
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'text-muted-foreground/50 cursor-not-allowed'
                                )}
                              >
                                Settle
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
      </div>

      {/* Active Loans */}
      {loans.length > 0 && (
        <div className="rounded-xl border border-border bg-white">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Active Loans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Person</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Remaining</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.filter((l) => l.status === 'active').map((loan) => (
                  <tr key={loan.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                    <td className="p-3 font-medium text-foreground">{loan.person_name}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          loan.loan_type === 'lent'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        )}
                      >
                        {loan.loan_type === 'lent' ? 'Lent' : 'Borrowed'}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      {formatMoney(loan.initial_amount)}
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium text-foreground">
                      {formatMoney(loan.remaining_amount)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      {loan.due_date || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSettleLoan(loan)}
                        className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition min-h-[24px] min-w-[24px]"
                      >
                        <Check className="h-3 w-3" />
                        Settle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showLendModal && (
        <LendBorrowModal
          mode="lend"
          onClose={() => setShowLendModal(false)}
          accounts={accounts}
          onSubmit={(data) => {
            lendMutation.mutate(data)
            toast.success('Money lent successfully')
          }}
          isPending={lendMutation.isPending}
          error={lendMutation.error}
        />
      )}
      {showBorrowModal && (
        <LendBorrowModal
          mode="borrow"
          onClose={() => setShowBorrowModal(false)}
          accounts={accounts}
          onSubmit={(data) => {
            borrowMutation.mutate(data)
            toast.success('Money borrowed successfully')
          }}
          isPending={borrowMutation.isPending}
          error={borrowMutation.error}
        />
      )}
      {settleLoan && (
        <SettleModal
          loan={settleLoan}
          onClose={() => setSettleLoan(null)}
          accounts={accounts}
          onSubmit={(data) => {
            settleMutation.mutate(data)
            toast.success('Settlement recorded')
          }}
          isPending={settleMutation.isPending}
          error={settleMutation.error}
        />
      )}
    </div>
  )
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
  bgColor: string
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', bgColor)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ── Lend/Borrow Modal ─────────────────────────────────────────────────────────

function LendBorrowModal({
  mode,
  onClose,
  accounts,
  onSubmit,
  isPending,
  error,
}: {
  mode: 'lend' | 'borrow'
  onClose: () => void
  accounts: Array<{ id: number; name: string; current_balance: string }>
  onSubmit: (payload: LendMoneyPayload | BorrowMoneyPayload) => void
  isPending: boolean
  error: Error | null
}) {
  const amountInput = useCalculatorInput()
  const [personName, setPersonName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isLend = mode === 'lend'
  const title = isLend ? 'Lend Money' : 'Borrow Money'
  const submitLabel = isLend ? 'Lend' : 'Borrow'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!personName.trim()) {
      setSubmitError('Please enter a person name.')
      return
    }
    if (!accountId) {
      setSubmitError('Please select an account.')
      return
    }

    const finalAmount = amountInput.isExpression
      ? (amountInput.previewValue ?? amountInput.displayValue)
      : amountInput.displayValue
    const amountDecimal = parseMoney(finalAmount)
    if (amountDecimal.lte(0)) {
      setSubmitError('Please enter a valid amount.')
      return
    }

    onSubmit({
      person_name: personName.trim(),
      amount: amountDecimal.toFixed(2),
      account_id: Number(accountId),
      due_date: dueDate || null,
      notes: notes.trim(),
      phone,
      email,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition min-h-[24px] min-w-[24px]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {'Request failed. Please try again.'}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Person Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g. Rahim"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Amount (BDT) <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amountInput.displayValue}
                onChange={amountInput.handleChange}
                onBlur={amountInput.handleBlur}
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary tabular-nums',
                  amountInput.isExpression && 'ring-2 ring-primary/30'
                )}
                placeholder="0.00"
                required
              />
              {amountInput.isExpression && (
                <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              )}
            </div>
            {amountInput.isExpression && amountInput.previewValue && (
              <p className="mt-1 text-xs text-primary">
                Total {formatMoney(amountInput.previewValue)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {isLend ? 'Deduct from' : 'Receive into'} <span className="text-danger">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatMoney(acc.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Note (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition min-h-[24px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition min-h-[24px]',
                isPending
                  ? 'bg-primary/50 cursor-not-allowed'
                  : isLend
                    ? 'bg-success hover:bg-success/90'
                    : 'bg-warning hover:bg-warning/90'
              )}
            >
              {isPending ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Settle Modal ──────────────────────────────────────────────────────────────

function SettleModal({
  loan,
  onClose,
  accounts,
  onSubmit,
  isPending,
  error,
}: {
  loan: LoanRecord
  onClose: () => void
  accounts: Array<{ id: number; name: string; current_balance: string }>
  onSubmit: (payload: SettleLoanPayload) => void
  isPending: boolean
  error: Error | null
}) {
  const amountInput = useCalculatorInput()
  const [accountId, setAccountId] = useState('')
  const [settlementDate, setSettlementDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!accountId) {
      setSubmitError('Please select an account.')
      return
    }

    const finalAmount = amountInput.isExpression
      ? (amountInput.previewValue ?? amountInput.displayValue)
      : amountInput.displayValue
    const amountDecimal = parseMoney(finalAmount)
    if (amountDecimal.lte(0)) {
      setSubmitError('Please enter a valid amount.')
      return
    }

    onSubmit({
      loanId: loan.id,
      amount: amountDecimal.toFixed(2),
      account_id: Number(accountId),
      settlement_date: settlementDate,
      notes: notes.trim(),
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Record Settlement</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition min-h-[24px] min-w-[24px]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-4 rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Person:</span>
            <span className="font-medium text-foreground">{loan.person_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium text-foreground capitalize">{loan.loan_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining:</span>
            <span className="font-bold text-foreground tabular-nums">{formatMoney(loan.remaining_amount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {'Request failed. Please try again.'}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Settlement Amount (BDT) <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amountInput.displayValue}
                onChange={amountInput.handleChange}
                onBlur={amountInput.handleBlur}
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary tabular-nums',
                  amountInput.isExpression && 'ring-2 ring-primary/30'
                )}
                placeholder={formatMoney(loan.remaining_amount).replace('৳', '')}
                required
              />
              {amountInput.isExpression && (
                <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              )}
            </div>
            {amountInput.isExpression && amountInput.previewValue && (
              <p className="mt-1 text-xs text-primary">
                Total {formatMoney(amountInput.previewValue)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Account <span className="text-danger">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatMoney(acc.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Settlement Date</label>
            <input
              type="date"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Note (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition min-h-[24px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition min-h-[24px]',
                isPending && 'bg-primary/50 cursor-not-allowed'
              )}
            >
              {isPending ? 'Saving...' : 'Record Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

