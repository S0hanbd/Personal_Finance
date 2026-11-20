import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  ArrowRight,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Plus,
  HandCoins,
  CreditCard,
  ReceiptText,
  FileClock,
  Target,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { useAccounts } from '@/hooks/useFinanceQueries'
import { useTransactions } from '@/hooks/useTransactions'
import { useCurrentMonthBills } from '@/hooks/useBillsQueries'
import { useObligationSummary } from '@/hooks/useObligationsQueries'
import { useBudgetPerformance } from '@/hooks/useBudgetQueries'
import { useSpendingTrends, useSpendingByCategory } from '@/hooks/useAnalyticsQueries'
import { QuickAddModal } from '@/components/transactions/QuickAddModal'
import { DashboardOverviewChart } from '@/components/dashboard/DashboardOverviewChart'
import { SpendingBreakdownChart } from '@/components/dashboard/SpendingBreakdownChart'
import { CashFlowTrendChart } from '@/components/dashboard/CashFlowTrendChart'
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

  // Analytics data for charts — current month range
  const {
    data: spendingTrendsData,
    isLoading: trendsLoading,
  } = useSpendingTrends({ start_date: firstDayOfMonth, end_date: lastDayOfMonth })

  const {
    data: categoryBreakdownData,
    isLoading: categoryLoading,
  } = useSpendingByCategory({ start_date: firstDayOfMonth, end_date: lastDayOfMonth })

  // Compute metrics with Decimal.js (NEVER floating-point)
  const activeAccounts = useMemo(() => accounts.filter((a) => a.status === 'active'), [accounts])

  const totalBalance = useMemo(() => {
    return sumMoney(activeAccounts.map((a) => a.current_balance))
  }, [activeAccounts])

  const cashBalance = useMemo(() => {
    return sumMoney(activeAccounts.filter((a) => a.account_type === 'cash').map((a) => a.current_balance))
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

  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const list = currentMonthData?.results ?? []
    const incomeTx = list.filter((t) => t.transaction_type === 'income')
    const expenseTx = list.filter((t) => t.transaction_type === 'expense')

    const income = sumMoney(incomeTx.map((t) => t.amount))
    const expense = sumMoney(expenseTx.map((t) => t.amount))

    return {
      monthlyIncome: income,
      monthlyExpense: expense,
    }
  }, [currentMonthData])

  const recentTransactions = useMemo(() => {
    return (recentTxData?.results ?? []).slice(0, 5)
  }, [recentTxData])

  const isGlobalLoading = accountsLoading || txLoading || billsLoading || obligationLoading || budgetLoading
  const isChartsLoading = trendsLoading || categoryLoading
  const hasError = accountsError || txError

  const openQuickAdd = (tab: 'expense' | 'income' | 'transfer') => {
    setQuickAddTab(tab)
    setIsQuickAddOpen(true)
  }

  // Format current month for display
  const currentMonthLabel = useMemo(() => {
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [now])

  return (
    <div className="space-y-6">
      {/* SECTION 1: Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your financial activities · {currentMonthLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openQuickAdd('expense')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <TrendingDown className="h-3.5 w-3.5" />
            + Expense
          </button>
          <button
            type="button"
            onClick={() => openQuickAdd('income')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-electric-blue/20 bg-electric-blue/5 px-3 py-2 text-xs font-semibold text-electric-blue hover:bg-electric-blue/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            + Income
          </button>
          <button
            type="button"
            onClick={() => openQuickAdd('transfer')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-electric-blue/20 bg-electric-blue/5 px-3 py-2 text-xs font-semibold text-electric-blue hover:bg-electric-blue/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue"
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

      {/* SECTION 2: KPI Cards — Redesigned grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4" aria-live="polite" aria-atomic="false">
        {/* Money on Hand — Cash accounts only */}
        <SummaryCard
          title="Money on Hand"
          value={formatMoney(cashBalance)}
          subtitle="Cash accounts"
          variant="orange"
          icon={HandCoins}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Monthly Income"
          value={formatMoney(monthlyIncome)}
          subtitle="This month"
          variant="success"
          icon={TrendingUp}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Monthly Expenses"
          value={formatMoney(monthlyExpense)}
          subtitle="This month"
          variant="danger"
          icon={ReceiptText}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Unpaid Bills"
          value={formatMoney(unpaidBills)}
          subtitle="Recurring bills"
          variant="warning"
          icon={FileClock}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Disposable"
          value={formatMoney(remainingAfterFixedBills)}
          subtitle="After fixed bills"
          variant={remainingAfterFixedBills.greaterThanOrEqualTo(0) ? 'success' : 'danger'}
          icon={Wallet}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Obligations"
          value={formatMoney(pendingObligations)}
          subtitle={`${obligationData?.pending_count ?? 0} pending`}
          variant="default"
          icon={Target}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Budget Remaining"
          value={budgetData?.has_budget ? formatMoney(budgetData.remaining_budget) : '—'}
          subtitle={
            budgetData?.has_budget
              ? `${budgetData.percentage_used}% used`
              : 'No budget set'
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
          icon={PieChartIcon}
          isLoading={isGlobalLoading}
        />
        <SummaryCard
          title="Net Cashflow"
          value={formatMoney(subtractMoney(monthlyIncome, monthlyExpense))}
          subtitle="Income − Expenses"
          variant={monthlyIncome.greaterThanOrEqualTo(monthlyExpense) ? 'success' : 'danger'}
          icon={CreditCard}
          isLoading={isGlobalLoading}
        />
      </div>

      {/* SECTION 3: Analytics Charts — Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Spending Overview */}
        <div className="rounded-xl border border-lavender bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-navy">Daily Spending</h2>
          </div>
          {isChartsLoading ? (
            <div className="flex items-center justify-center h-56">
              <div className="w-full h-4 bg-muted rounded animate-pulse space-y-2" />
            </div>
          ) : (
            <DashboardOverviewChart data={spendingTrendsData ?? []} />
          )}
        </div>

        {/* Spending by Category */}
        <div className="rounded-xl border border-lavender bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-navy">Spending by Category</h2>
          </div>
          {isChartsLoading ? (
            <div className="flex items-center justify-center h-56">
              <div className="w-full h-4 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <SpendingBreakdownChart data={categoryBreakdownData ?? []} />
          )}
        </div>

        {/* Cash Flow Trend — Full width */}
        <div className="lg:col-span-2 rounded-xl border border-lavender bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-navy">Cash Flow Trend</h2>
          </div>
          {isChartsLoading ? (
            <div className="flex items-center justify-center h-56">
              <div className="w-full h-4 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <CashFlowTrendChart data={spendingTrendsData ?? []} />
          )}
        </div>
      </div>

      {/* SECTION 4 & 5: Account Balances + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Account Balances Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Account Balances</h2>
            <Link
              to="/accounts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-electric-blue hover:underline"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-lavender bg-white p-4 space-y-2">
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
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-electric-blue hover:underline"
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
                    <p className="text-xs font-semibold text-navy line-clamp-1">{acc.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{acc.account_type.replace('_', ' ')}</p>
                  </div>
                  <p className="text-xs font-bold text-navy tabular-nums">
                    {formatMoney(acc.current_balance)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions — 2 columns width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-electric-blue hover:underline"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-lavender bg-white overflow-hidden">
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
                              ? 'bg-success/10 text-success'
                              : isTransfer
                                ? 'bg-primary/10 text-primary'
                                : 'bg-danger/10 text-danger'
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
                              ? 'text-success'
                              : isTransfer
                                ? 'text-foreground'
                                : 'text-danger'
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
