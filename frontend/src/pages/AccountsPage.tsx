import { useState } from 'react'
import {
  Wallet,
  Building2,
  Smartphone,
  CircleDollarSign,
  Plus,
  ArrowRightLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useAccounts, useCreateAccount, useReconcileAccount } from '@/hooks/useFinanceQueries'
import { QuickAddModal } from '@/components/transactions/QuickAddModal'
import { formatMoney, sumMoney, parseMoney } from '@/lib/money'
import type { FinancialAccount, AccountType } from '@/types'

// ── Icons & Colors per Account Type ──────────────────────────────────────────
const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string }
> = {
  cash: {
    label: 'Cash in Hand',
    icon: Wallet,
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
  },
  bank: {
    label: 'Bank Account',
    icon: Building2,
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
  },
  mobile_banking: {
    label: 'Mobile Banking (bKash/Nagad)',
    icon: Smartphone,
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
  },
  other: {
    label: 'Other Asset',
    icon: CircleDollarSign,
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
  },
}

// ── New Account Modal ────────────────────────────────────────────────────────
interface NewAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

function NewAccountModal({ isOpen, onClose }: NewAccountModalProps) {
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('cash')
  const [openingBalance, setOpeningBalance] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateAccount()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide an account name.')
      return
    }

    const parsed = parseMoney(openingBalance || '0')
    if (parsed.isNegative()) {
      setError('Opening balance cannot be negative.')
      return
    }

    createMutation.mutate(
      {
        name: name.trim(),
        account_type: accountType,
        opening_balance: parsed.toFixed(2),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setName('')
          setOpeningBalance('')
          setDescription('')
          onClose()
        },
        onError: (err: unknown) => {
          const res = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
          if (res?.name) {
            setError(Array.isArray(res.name) ? String(res.name[0]) : 'Account with this name already exists.')
          } else {
            setError('Failed to create account. Please check your connection and retry.')
          }
        },
      }
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id="new-account-title" className="text-base font-semibold text-foreground">
            Create Financial Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            <label htmlFor="account-name" className="block text-xs font-medium text-foreground mb-1">
              Account Name <span className="text-destructive">*</span>
            </label>
            <input
              id="account-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brac Bank, bKash Personal, Main Cash"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="account-type" className="block text-xs font-medium text-foreground mb-1">
              Account Type <span className="text-destructive">*</span>
            </label>
            <select
              id="account-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
              <option value="other">Other Asset</option>
            </select>
          </div>

          <div>
            <label htmlFor="account-opening-bal" className="block text-xs font-medium text-foreground mb-1">
              Opening Balance (৳)
            </label>
            <input
              id="account-opening-bal"
              type="number"
              step="0.01"
              min="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Initial starting balance. All future transactions will update this ledger.
            </p>
          </div>

          <div>
            <label htmlFor="account-desc" className="block text-xs font-medium text-foreground mb-1">
              Description (optional)
            </label>
            <input
              id="account-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Primary salary account"
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
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Account Card Component ────────────────────────────────────────────────────
interface AccountCardProps {
  account: FinancialAccount
  onTransfer: (accountId: string) => void
}

function AccountCard({ account, onTransfer }: AccountCardProps) {
  const config = ACCOUNT_TYPE_CONFIG[account.account_type] ?? ACCOUNT_TYPE_CONFIG.other
  const Icon = config.icon
  const reconcileMutation = useReconcileAccount()
  const [reconciledMsg, setReconciledMsg] = useState(false)

  const handleReconcile = () => {
    reconcileMutation.mutate(account.id, {
      onSuccess: () => {
        setReconciledMsg(true)
        setTimeout(() => setReconciledMsg(false), 3000)
      },
    })
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md hover:border-border/80">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${config.bg} ${config.text}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground line-clamp-1">{account.name}</h3>
              <p className="text-[11px] text-muted-foreground">{config.label}</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 capitalize">
            {account.status}
          </span>
        </div>

        {/* Balance Display */}
        <div className="mt-5">
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums mt-0.5">
            {formatMoney(account.current_balance)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Opening: <span className="font-mono">{formatMoney(account.opening_balance)}</span>
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onTransfer(account.id.toString())}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Transfer
        </button>

        <button
          type="button"
          onClick={handleReconcile}
          disabled={reconcileMutation.isPending}
          title="Audit and recompute balance from transaction ledger"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          {reconciledMsg ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600 text-[11px]">Reconciled</span>
            </>
          ) : (
            <>
              <RefreshCw className={`h-3.5 w-3.5 ${reconcileMutation.isPending ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">Audit</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main Accounts Page ────────────────────────────────────────────────────────
export function AccountsPage() {
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)
  const [transferAccountId, setTransferAccountId] = useState<string | null>(null)

  const { data: accounts = [], isLoading, isError, refetch } = useAccounts()

  const activeAccounts = accounts.filter((a) => a.status === 'active')
  const totalBalance = sumMoney(activeAccounts.map((a) => a.current_balance))

  const handleOpenTransfer = (accountId: string) => {
    setTransferAccountId(accountId)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage bank accounts, mobile wallets, and cash reserves
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewAccountOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Account</span>
        </button>
      </div>

      {/* Total Balance Summary Banner */}
      {!isLoading && !isError && accounts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Liquid Reserves
              </p>
              <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
                {formatMoney(totalBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Summed across {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''} (BDT)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTransferAccountId(accounts[0]?.id.toString() ?? null)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition shadow-sm"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Inter-Account Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State Matrix */}
      {isError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center"
        >
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Failed to load accounts</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Could not connect to the accounts service. Check your connection or try again.
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
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-7 w-32 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No accounts created yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Add your cash-in-hand, bank accounts, or mobile wallets (bKash/Nagad) to start managing your finances.
          </p>
          <button
            type="button"
            onClick={() => setIsNewAccountOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            Create First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onTransfer={handleOpenTransfer}
            />
          ))}
        </div>
      )}

      {/* New Account Modal */}
      <NewAccountModal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
      />

      {/* Transfer Modal via QuickAddModal */}
      {transferAccountId !== null && (
        <QuickAddModal
          isOpen={true}
          onClose={() => setTransferAccountId(null)}
          initialTab="transfer"
          initialAccountId={transferAccountId}
        />
      )}
    </div>
  )
}

export default AccountsPage
