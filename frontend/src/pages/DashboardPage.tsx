import { SummaryCard } from '@/components/shared/SummaryCard'

export function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Your complete financial overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <SummaryCard title="Total Available Balance" value="৳0.00" variant="default" />
        <SummaryCard title="Monthly Income" value="৳0.00" variant="success" />
        <SummaryCard title="Monthly Expenses" value="৳0.00" variant="danger" />
        <SummaryCard title="Unpaid Fixed Expenses" value="৳0.00" variant="warning" />
        <SummaryCard
          title="Remaining After Fixed Expenses"
          value="৳0.00"
          subtitle="Total Balance − Unpaid Bills"
          variant="default"
        />
        <SummaryCard title="Budget Remaining" value="৳0.00" variant="success" />
      </div>
      <p className="text-sm text-muted-foreground">Full dashboard modules will be connected in Phase 2.</p>
    </div>
  )
}

