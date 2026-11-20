import { useMemo } from 'react'
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
  '#2563EB', '#16A34A', '#F59E0B', '#DC4B45', '#64748B',
  '#7C3AED', '#0891B2', '#C026D3', '#EA580C', '#4F46E5',
]

export function SpendingBreakdownChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data.length) return []
    const sorted = [...data].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    return sorted.map((d) => ({
      name: d.category,
      value: parseFloat(d.amount),
    }))
  }, [data])

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
        No expense data for this period.
      </div>
    )
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, _name: string, payload: any) => {
            const pct = ((value / total) * 100).toFixed(1)
            return [`৳${value.toFixed(2)} (${pct}%)`, payload.payload.name]
          }}
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #E8EAEE',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '12px',
          }}
        />
        <Legend
          formatter={(value: string, entry: any) => {
            const pct = ((entry.payload.value / total) * 100).toFixed(0)
            return `${value} (${pct}%)`
          }}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: '#6B7280', paddingTop: '8px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
