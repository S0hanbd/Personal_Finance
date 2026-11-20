import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { SpendingTrendPoint } from '@/types/analytics'

interface Props {
  data: SpendingTrendPoint[]
}

const COLORS = {
  income: '#16A34A',
  expense: '#DC4B45',
}

export function DashboardOverviewChart({ data }: Props) {
  const chartData = useMemo(() => {
    // Group daily spending trends into income/expense bars
    // The spending_trends API returns daily expense amounts
    // We'll show daily spending as a bar chart
    return data.map((d) => ({
      date: d.date,
      expense: parseFloat(d.amount),
    }))
  }, [data])

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
        No spending data for this period.
      </div>
    )
  }

  // Format x-axis labels to show short date
  const formatXAxis = (value: string) => {
    const date = new Date(value)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEE" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickFormatter={formatXAxis}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickFormatter={(v) => `৳${v}`}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Spending']}
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #E8EAEE',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '12px',
          }}
          labelStyle={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}
        />
        <Bar
          dataKey="expense"
          fill={COLORS.expense}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
