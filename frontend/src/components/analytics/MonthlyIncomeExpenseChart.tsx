import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyTrendPoint } from '@/types/analytics'

interface Props {
  data: MonthlyTrendPoint[]
}

const COLORS = {
  income: '#16A34A',
  expense: '#DC2626',
  net: '#172554',
}

export function MonthlyIncomeExpenseChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    income: parseFloat(d.income),
    expense: parseFloat(d.expense),
    net: parseFloat(d.net),
  }))

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No transaction data for this period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748B" />
        <YAxis tick={{ fontSize: 12 }} stroke="#64748B" tickFormatter={(v) => `৳${v}`} />
        <Tooltip
          formatter={(value: number, name: string) => [`৳${value.toFixed(2)}`, name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
        />
        <Legend />
        <Bar dataKey="income" fill={COLORS.income} name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill={COLORS.expense} name="Expense" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="net" stroke={COLORS.net} strokeWidth={2} name="Net" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
