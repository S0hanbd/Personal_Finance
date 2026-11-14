import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TopCategoryItem } from '@/types/analytics'

interface Props {
  data: TopCategoryItem[]
}

export function TopCategoriesChart({ data }: Props) {
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
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748B" tickFormatter={(v) => `৳${v}`} />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} stroke="#64748B" width={70} />
        <Tooltip
          formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Spend']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
        />
        <Bar dataKey="amount" fill="#172554" radius={[0, 4, 4, 0]} name="Total Spend" />
      </BarChart>
    </ResponsiveContainer>
  )
}
