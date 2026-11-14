import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PeriodSelectorProps {
  onDateRangeChange: (start_date: string, end_date: string) => void
}

const quickRanges = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '3m', days: 90 },
  { label: '6m', days: 180 },
  { label: 'YTD', ytd: true },
  { label: 'All', all: true },
]

function getDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function getYTD(): string {
  const d = new Date()
  return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]
}

export function PeriodSelector({ onDateRangeChange }: PeriodSelectorProps) {
  const [active, setActive] = useState<string>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const handleQuick = (label: string, range: (typeof quickRanges)[0]) => {
    setActive(label)
    const end = new Date().toISOString().split('T')[0]
    let start: string
    if (range.all) {
      start = '2000-01-01'
    } else if (range.ytd) {
      start = getYTD()
    } else if (range.days) {
      start = getDate(range.days)
    } else {
      start = getDate(30)
    }
    onDateRangeChange(start, end)
  }

  const handleCustom = () => {
    if (customStart && customEnd) {
      setActive('custom')
      onDateRangeChange(customStart, customEnd)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Date range">
        {quickRanges.map((range) => {
          const label = range.label
          const isActive = active === label
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleQuick(label, range)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md border min-w-[24px] min-h-[24px]',
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-secondary border-border hover:border-primary/50',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          aria-label="Start date"
          className="px-2 py-1.5 text-sm border border-border rounded-md min-h-[24px]"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          aria-label="End date"
          className="px-2 py-1.5 text-sm border border-border rounded-md min-h-[24px]"
        />
        <button
          type="button"
          onClick={handleCustom}
          disabled={!customStart || !customEnd}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed min-h-[24px]"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
