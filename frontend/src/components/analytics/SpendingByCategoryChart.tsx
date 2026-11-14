import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CategoryBreakdown } from '@/types/analytics'

interface Props {
  data: CategoryBreakdown[]
}

const COLORS = [
  '#172554', '#16A34A', '#D97706', '#DC2626', '#64748B',
  '#7C3AED', '#0891B2', '#C026D3', '#EA580C', '#4F46E5',
]

export function SpendingByCategoryChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    amount: parseFloat(d.amount),
  }))

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No expense data for this period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="amount"
          nameKey="category"
        >
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Amount']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
