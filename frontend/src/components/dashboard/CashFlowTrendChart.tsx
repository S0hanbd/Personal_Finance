import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ResponsiveContainer,
} from 'recharts'
import type { SpendingTrendPoint } from '@/types/analytics'

interface Props {
  data: SpendingTrendPoint[]
}

export function CashFlowTrendChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data.length) return []
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
    let cumulative = 0
    return sorted.map((d) => {
      const amount = parseFloat(d.amount)
      cumulative -= amount // expenses reduce cash flow
      return {
        date: d.date,
        cashflow: cumulative,
      }
    })
  }, [data])

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
        No cash flow data for this period.
      </div>
    )
  }

  const formatXAxis = (value: string) => {
    const date = new Date(value)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
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
          formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Cash Flow']}
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #E8EAEE',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '12px',
          }}
          labelStyle={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}
        />
        <Area
          type="monotone"
          dataKey="cashflow"
          stackId="1"
          stroke="transparent"
          fill="#2563EB"
          fillOpacity={0.08}
        />
        <Line
          type="monotone"
          dataKey="cashflow"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: '#2563EB', fill: '#2563EB' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
