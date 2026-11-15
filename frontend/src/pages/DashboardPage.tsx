import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  ArrowRight,
  Plus,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { useAccounts } from '@/hooks/useFinanceQueries'
import { useTransactions } from '@/hooks/useTransactions'
import { useCurrentMonthBills } from '@/hooks/useBillsQueries'
import { useObligationSummary } from '@/hooks/useObligationsQueries'
import { useBudgetPerformance } from '@/hooks/useBudgetQueries'
import { QuickAddModal } from '@/components/transactions/QuickAddModal'
import { formatMoney, sumMoney, subtractMoney } from '@/lib/money'
import type { Transaction } from '@/types'
import Decimal from 'decimal.js'

export function DashboardPage() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddTab, setQuickAddTab] = useState<'expense' | 'income' | 'transfer'>('expense')

  // Calculate current month date bounds (Asia/Dhaka)
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // Data queries
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccounts()

  const {
    data: currentMonthData,
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTx,
  } = useTransactions({
    start_date: firstDayOfMonth,
    end_date: lastDayOfMonth,
  })

  const {
    data: recentTxData,
    isLoading: recentLoading,
  } = useTransactions({
    page: 1,
  })

  const {
    data: billsData,
    isLoading: billsLoading,
  } = useCurrentMonthBills()

  const {
    data: obligationData,
    isLoading: obligationLoading,
  } = useObligationSummary()

  const {
    data: budgetData,
    isLoading: budgetLoading,
  } = useBudgetPerformance()

  // Compute metrics with Decimal.js (NEVER floating-point)
  const activeAccounts = useMemo(() => accounts.filter((a) => a.status === 'active'), [accounts])

  const totalBalance = useMemo(() => {
    return sumMoney(activeAccounts.map((a) => a.current_balance))
  }, [activeAccounts])

  const unpaidBills = useMemo(() => {
    return new Decimal(billsData?.unpaid_total || '0')
  }, [billsData])

  const remainingAfterFixedBills = useMemo(() => {
    return subtractMoney(totalBalance, unpaidBills)
  }, [totalBalance, unpaidBills])

  const pendingObligations = useMemo(() => {
    return new Decimal(obligationData?.total_pending || '0')
  }, [obligationData])

  const { monthlyIncome, monthlyExpense, netCashflow } = useMemo(() => {
    const list = currentMonthData?.results ?? []
    const incomeTx = list.filter((t) => t.transaction_type === 'income')
    const expenseTx = list.filter((t) => t.transaction_type === 'expense')

    const income = sumMoney(incomeTx.map((t) => t.amount))
    const expense = sumMoney(expenseTx.map((t) => t.amount))
    const net = subtractMoney(income, expense)

    return {
      monthlyIncome: income,
      monthlyExpense: expense,
      netCashflow: net,
    }
  }, [currentMonthData])

  const recentTransactions = useMemo(() => {
    return (recentTxData?.results ?? []).slice(0, 5)
  }, [recentTxData])

  const isGlobalLoading = accountsLoading || txLoading || billsLoading || obligationLoading || budgetLoading
  const hasError = accountsError || txError

  const openQuickAdd = (tab: 'expense' | 'income' | 'transfer') => {
    setQuickAddTab(tab)
    setIsQuickAddOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time cashflow, liquid reserves, and recent activity
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openQuickAdd('expense')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <TrendingDown className="h-3.5 w-3.5" />
            + Expense
          </button>
          <button
            type="button"
            onClick={() => openQuickAdd('income')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            + Income
          </button>
          <button
            type="button"
            onClick={() => openQuickAdd('transfer')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Could not load financial data. Some metrics may be temporarily out of sync.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              refetchAccounts()
              refetchTx()
            }}
            className="inline-flex items-center gap-1 font-semibold underline hover:no-underline"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-live="polite" aria-atomic="false">
        <SummaryCard
          title="Total Liquid Balance"
          value={formatMoney(totalBalance)}
          subtitle={`${activeAccounts.length} active account${activeAccounts.length !== 1 ? 's' : ''}`}
          variant="default"
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Monthly Income"
          value={formatMoney(monthlyIncome)}
          subtitle={`Net: ${netCashflow.greaterThanOrEqualTo(0) ? '+' : ''}${formatMoney(netCashflow)}`}
          variant="success"
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Monthly Expenses"
          value={formatMoney(monthlyExpense)}
          subtitle="This month"
          variant="danger"
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Unpaid Fixed Expenses"
          value={formatMoney(unpaidBills)}
          subtitle="Recurring bills awaiting payment"
          variant="warning"
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Remaining After Fixed Expenses"
          value={formatMoney(remainingAfterFixedBills)}
          subtitle="Total Balance − Unpaid Bills"
          variant={remainingAfterFixedBills.greaterThanOrEqualTo(0) ? 'success' : 'danger'}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Future Obligations"
          value={formatMoney(pendingObligations)}
          subtitle={`${obligationData?.pending_count ?? 0} pending commitment${(obligationData?.pending_count ?? 0) !== 1 ? 's' : ''}`}
          variant="default"
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Budget Remaining"
          value={budgetData?.has_budget ? formatMoney(budgetData.remaining_budget) : 'Unset'}
          subtitle={
            budgetData?.has_budget
              ? `${budgetData.percentage_used}% used of ${formatMoney(budgetData.budget_limit)} ceiling`
              : 'No monthly ceiling configured'
          }
          variant={
            !budgetData?.has_budget
              ? 'default'
              : budgetData.status === 'exceeded'
              ? 'danger'
              : budgetData.status === 'warning'
              ? 'warning'
              : 'success'
          }
          isLoading={isGlobalLoading}
        />
      </div>

      {/* Two Column Layout: Accounts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Balances (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Accounts</h2>
            <Link
              to="/accounts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Manage</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            {accountsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2 animate-pulse">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              ))
            ) : accounts.length === 0 ? (
              <div className="text-center py-6">
                <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">No accounts configured</p>
                <Link
                  to="/accounts"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Create account
                </Link>
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition"
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{acc.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{acc.account_type.replace('_', ' ')}</p>
                  </div>
                  <p className="text-xs font-bold text-foreground tabular-nums">
                    {formatMoney(acc.current_balance)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {recentLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 animate-pulse">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-sm font-semibold text-foreground">No transactions recorded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start tracking your expenses and income using the quick add buttons above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx: Transaction) => {
                  const isCredit = ['income', 'borrowing', 'loan_collection', 'return_held'].includes(tx.transaction_type)
                  const isTransfer = tx.transaction_type === 'transfer'

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCredit
                              ? 'bg-emerald-50 text-emerald-600'
                              : isTransfer
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                        >
                          {isCredit ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : isTransfer ? (
                            <ArrowRightLeft className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {tx.description || tx.category_name || tx.income_source_name || tx.transaction_type}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {tx.account_name} · {tx.transaction_date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p
                          className={`text-xs font-bold tabular-nums ${isCredit
                              ? 'text-emerald-600'
                              : isTransfer
                                ? 'text-slate-700'
                                : 'text-rose-600'
                            }`}
                        >
                          {isCredit ? '+' : isTransfer ? '↔ ' : '−'}
                          {formatMoney(new Decimal(tx.amount))}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialTab={quickAddTab}
      />
    </div>
  )
}

export default DashboardPage
