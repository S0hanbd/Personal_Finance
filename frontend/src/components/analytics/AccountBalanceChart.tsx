import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { BalanceHistoryPoint } from '@/types/analytics'

interface Props {
  data: BalanceHistoryPoint[]
}

const COLORS = ['#172554', '#16A34A', '#D97706', '#DC2626', '#64748B', '#7C3AED']

export function AccountBalanceChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No balance data for this period.
      </div>
    )
  }

  // Group by account
  const accounts = [...new Set(data.map((d) => d.account_id))]
  const accountMap = new Map<number, string>()
  data.forEach((d) => accountMap.set(d.account_id, d.account_name))

  // Pivot data: each row has date + balance per account
  const dateMap = new Map<string, { date: string; [key: string]: string | number }>()
  data.forEach((d) => {
    const row = dateMap.get(d.date) || { date: d.date }
    row[d.account_name] = parseFloat(d.balance)
    dateMap.set(d.date, row)
  })
  const chartData = Array.from(dateMap.values()).sort((a, b) => (a.date as string).localeCompare(b.date as string))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748B" />
        <YAxis tick={{ fontSize: 12 }} stroke="#64748B" tickFormatter={(v) => `৳${v}`} />
        <Tooltip
          formatter={(value: number, name: string) => [`৳${value.toFixed(2)}`, name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
        />
        <Legend />
        {accounts.map((id, idx) => (
          <Area
            key={id}
            type="monotone"
            dataKey={accountMap.get(id)!}
            stackId="1"
            stroke={COLORS[idx % COLORS.length]}
            fill={COLORS[idx % COLORS.length]}
            fillOpacity={0.15}
            name={accountMap.get(id)!}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
