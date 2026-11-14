import {
  LineChart,
  Line,
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

export function SpendingTrendsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    amount: parseFloat(d.amount),
  }))

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No spending data for this period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748B" />
        <YAxis tick={{ fontSize: 12 }} stroke="#64748B" tickFormatter={(v) => `৳${v}`} />
        <Tooltip
          formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Spending']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#D97706"
          strokeWidth={2}
          dot={false}
          name="Spending"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
