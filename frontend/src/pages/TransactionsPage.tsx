import { useState, useCallback } from 'react'
import { Plus, Search, Filter, Trash2, ArrowRightLeft, TrendingDown, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { useTransactions, useDeleteTransaction, type TransactionFilters } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useFinanceQueries'
import { QuickAddModal } from '@/components/transactions/QuickAddModal'
import { ExportButton } from '@/components/shared/ExportButton'
import { exportTransactionsCSV } from '@/hooks/useReportsQueries'
import type { Transaction, TransactionType } from '@/types'
import { formatMoney } from '@/lib/money'

// ── Type badge config ──────────────────────────────────────────────────────────
const TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  lending: 'Lent',
  borrowing: 'Borrowed',
  loan_repayment: 'Repayment',
  loan_collection: 'Collected',
  held_money: 'Held',
  return_held: 'Returned',
}

const TYPE_COLORS: Record<TransactionType, string> = {
  income: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expense: 'bg-rose-50 text-rose-700 border-rose-200',
  transfer: 'bg-blue-50 text-blue-700 border-blue-200',
  lending: 'bg-amber-50 text-amber-700 border-amber-200',
  borrowing: 'bg-amber-50 text-amber-700 border-amber-200',
  loan_repayment: 'bg-slate-100 text-slate-700 border-slate-200',
  loan_collection: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  held_money: 'bg-slate-100 text-slate-700 border-slate-200',
  return_held: 'bg-slate-100 text-slate-700 border-slate-200',
}

function amountColor(type: TransactionType): string {
  const credit: TransactionType[] = ['income', 'borrowing', 'loan_collection', 'return_held']
  const debit: TransactionType[] = ['expense', 'lending', 'loan_repayment', 'held_money']
  if (credit.includes(type)) return 'text-emerald-600'
  if (debit.includes(type)) return 'text-rose-600'
  return 'text-slate-800'
}

function amountSign(type: TransactionType): string {
  const credit: TransactionType[] = ['income', 'borrowing', 'loan_collection', 'return_held']
  if (credit.includes(type)) return '+'
  if (type === 'transfer') return '↔ '
  return '−'
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr aria-hidden="true">
      <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-muted animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-muted animate-pulse" /></td>
      <td className="px-4 py-3 text-right"><div className="h-4 w-20 rounded bg-muted animate-pulse ml-auto" /></td>
      <td className="px-4 py-3 text-center"><div className="h-7 w-12 rounded bg-muted animate-pulse mx-auto" /></td>
    </tr>
  )
}

// ── Delete confirmation dialog ─────────────────────────────────────────────────
interface DeleteDialogProps {
  transaction: Transaction
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

function DeleteDialog({ transaction, onConfirm, onCancel, isPending }: DeleteDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 id="delete-dialog-title" className="text-base font-semibold text-foreground">
              Delete Transaction?
            </h2>
            <p className="text-xs text-muted-foreground">Action cannot be undone</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This will permanently delete the{' '}
          <span className="font-medium text-foreground">{TYPE_LABELS[transaction.transaction_type]}</span>{' '}
          of <span className="font-medium text-foreground">{formatMoney(transaction.amount)}</span> and
          automatically revert the account balance.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
interface FilterBarProps {
  filters: TransactionFilters
  onFilterChange: (patch: Partial<TransactionFilters>) => void
  onClear: () => void
  accounts: Array<{ id: number; name: string }>
  hasActiveFilters: boolean
}

const TX_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'lending', label: 'Lent' },
  { value: 'borrowing', label: 'Borrowed' },
  { value: 'loan_repayment', label: 'Repayment' },
  { value: 'loan_collection', label: 'Collected' },
]

function FilterBar({ filters, onFilterChange, onClear, accounts, hasActiveFilters }: FilterBarProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="tx-search" className="block text-xs font-medium text-muted-foreground mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="tx-search"
              type="search"
              value={filters.search ?? ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              placeholder="Search description…"
              autoComplete="off"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Account */}
        <div>
          <label htmlFor="tx-account" className="block text-xs font-medium text-muted-foreground mb-1">
            Account
          </label>
          <select
            id="tx-account"
            value={filters.account ?? ''}
            onChange={(e) => onFilterChange({ account: e.target.value, page: 1 })}
            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={String(a.id)}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="tx-type" className="block text-xs font-medium text-muted-foreground mb-1">
            Type
          </label>
          <select
            id="tx-type"
            value={filters.transaction_type ?? ''}
            onChange={(e) => onFilterChange({ transaction_type: e.target.value, page: 1 })}
            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {TX_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div>
          <label htmlFor="tx-start" className="block text-xs font-medium text-muted-foreground mb-1">
            From Date
          </label>
          <input
            id="tx-start"
            type="date"
            value={filters.start_date ?? ''}
            onChange={(e) => onFilterChange({ start_date: e.target.value, page: 1 })}
            className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* To Date */}
        <div>
          <label htmlFor="tx-end" className="block text-xs font-medium text-muted-foreground mb-1">
            To Date
          </label>
          <div className="flex gap-2">
            <input
              id="tx-end"
              type="date"
              value={filters.end_date ?? ''}
              onChange={(e) => onFilterChange({ end_date: e.target.value, page: 1 })}
              className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClear}
                title="Clear all filters"
                className="h-9 px-2.5 rounded-lg border border-border bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page Component ────────────────────────────────────────────────────────
const EMPTY_FILTERS: TransactionFilters = {
  account: '',
  transaction_type: '',
  start_date: '',
  end_date: '',
  search: '',
  page: 1,
}

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useTransactions(filters)
  const { data: accounts = [] } = useAccounts()
  const deleteMutation = useDeleteTransaction()

  const hasActiveFilters = Boolean(
    filters.account || filters.transaction_type || filters.start_date || filters.end_date || filters.search
  )

  const handleFilterChange = useCallback((patch: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
  }, [])

  const transactions = data?.results ?? []
  const totalCount = data?.count ?? 0
  const currentPage = filters.page ?? 1
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const pendingTx = pendingDeleteId !== null
    ? transactions.find((t) => t.id === pendingDeleteId) ?? null
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit trail of all income, expenses, and ledger transfers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            options={[
              {
                label: 'Export CSV',
                icon: 'csv',
                onClick: async () => {
                  await exportTransactionsCSV({
                    start_date: filters.start_date,
                    end_date: filters.end_date,
                    transaction_type: filters.transaction_type,
                  })
                },
              },
            ]}
          />
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        accounts={accounts}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Content State Matrix */}
      {isError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center"
        >
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Failed to load transactions</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            There was a problem retrieving your ledger records. Check your connection or try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Date</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Account</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Category / Source</th>
                  <th scope="col" className="px-4 py-3">Description</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3 text-center w-16">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                          <Filter className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {hasActiveFilters ? 'No matching transactions' : 'No transactions recorded yet'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          {hasActiveFilters
                            ? 'No transactions matched your filter criteria. Try resetting filters.'
                            : 'Start tracking your cashflow by recording your first transaction.'}
                        </p>
                        {hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={handleClearFilters}
                            className="mt-4 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                          >
                            Clear Filters
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsQuickAddOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Record First Transaction
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const color = amountColor(tx.transaction_type)
                    const sign = amountSign(tx.transaction_type)
                    const badgeClass = TYPE_COLORS[tx.transaction_type] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                    const categoryOrSource = tx.category_name ?? tx.income_source_name ?? '—'

                    return (
                      <tr
                        key={tx.id}
                        className="transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
                      >
                        <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">
                          {tx.transaction_date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>
                            {tx.transaction_type === 'income' && <TrendingUp className="mr-1 h-3 w-3" />}
                            {tx.transaction_type === 'expense' && <TrendingDown className="mr-1 h-3 w-3" />}
                            {tx.transaction_type === 'transfer' && <ArrowRightLeft className="mr-1 h-3 w-3" />}
                            {TYPE_LABELS[tx.transaction_type] ?? tx.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {tx.account_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {categoryOrSource}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate" title={tx.description}>
                          {tx.description || <span className="text-muted-foreground/50 italic">None</span>}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${color}`}>
                          {sign}{formatMoney(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(tx.id)}
                            title="Delete transaction"
                            aria-label={`Delete transaction of ${formatMoney(tx.amount)} on ${tx.transaction_date}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground bg-card">
              <span>
                Showing {transactions.length} of {totalCount} transactions
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handleFilterChange({ page: currentPage - 1 })}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <span className="font-medium text-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handleFilterChange({ page: currentPage + 1 })}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingTx && (
        <DeleteDialog
          transaction={pendingTx}
          isPending={deleteMutation.isPending}
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => {
            deleteMutation.mutate(pendingTx.id, {
              onSuccess: () => setPendingDeleteId(null),
            })
          }}
        />
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  )
}

export default TransactionsPage
