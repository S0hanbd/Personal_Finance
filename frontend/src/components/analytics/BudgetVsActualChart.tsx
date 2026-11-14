import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { BudgetVsActualData } from '@/types/analytics'

interface Props {
  data: BudgetVsActualData
}

export function BudgetVsActualChart({ data }: Props) {
  if (!data.has_budget || !data.categories.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {!data.has_budget ? 'No budget set for this month.' : 'No spending data yet.'}
      </div>
    )
  }

  const chartData = data.categories.map((d) => ({
    ...d,
    allocated: parseFloat(d.allocated),
    actual: parseFloat(d.actual),
    variance: parseFloat(d.variance),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#64748B" />
        <YAxis tick={{ fontSize: 12 }} stroke="#64748B" tickFormatter={(v) => `৳${v}`} />
        <Tooltip
          formatter={(value: number, name: string) => [`৳${value.toFixed(2)}`, name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
        />
        <Legend />
        <Bar dataKey="allocated" fill="#16A34A" name="Allocated" radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" fill="#DC2626" name="Actual" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
