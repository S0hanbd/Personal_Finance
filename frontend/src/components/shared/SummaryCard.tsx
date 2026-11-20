import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertTriangle, MinusCircle, Wallet } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'orange'
  icon?: React.ElementType
  trend?: { value: string; up: boolean }
  isLoading?: boolean
}

const iconMap: Record<string, React.ElementType> = {
  default: MinusCircle,
  success: TrendingUp,
  warning: AlertTriangle,
  danger: TrendingDown,
  orange: Wallet,
}

const cardStyles: Record<string, string> = {
  default: 'bg-lavender-light border border-lavender text-navy',
  success: 'bg-lavender-light border border-lavender text-navy',
  warning: 'bg-lavender-light border border-lavender text-navy',
  danger: 'bg-lavender-light border border-lavender text-navy',
  orange: 'bg-gradient-to-br from-[#F97316] to-[#FB923C] text-white',
}

const iconStyles: Record<string, string> = {
  default: 'bg-lavender/50 text-navy',
  success: 'bg-lime/30 text-navy',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  orange: 'bg-white/20 text-white',
}

const trendBgStyles: Record<string, Record<string, string>> = {
  default: { up: 'bg-lime/30 text-navy', down: 'bg-danger/10 text-danger' },
  success: { up: 'bg-lime/30 text-navy', down: 'bg-danger/10 text-danger' },
  warning: { up: 'bg-lime/30 text-navy', down: 'bg-danger/10 text-danger' },
  danger: { up: 'bg-lime/30 text-navy', down: 'bg-danger/10 text-danger' },
  orange: { up: 'bg-white/20 text-white', down: 'bg-white/20 text-white' },
}

const subtitleColorMap: Record<string, string> = {
  default: 'text-navy/60',
  success: 'text-navy/60',
  warning: 'text-navy/60',
  danger: 'text-navy/60',
  orange: 'text-white/70',
}

const titleColorMap: Record<string, string> = {
  default: 'text-navy/70',
  success: 'text-navy/70',
  warning: 'text-navy/70',
  danger: 'text-navy/70',
  orange: 'text-white/80',
}

export function SummaryCard({
  title,
  value,
  subtitle,
  variant = 'default',
  icon: IconOverride,
  trend,
  isLoading = false,
}: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-lavender-light rounded-2xl p-5 animate-pulse" aria-busy="true">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-8 w-8 rounded-full bg-muted" />
        </div>
        <div className="h-8 bg-muted rounded w-1/2 mb-2" />
        <div className="h-4 bg-muted rounded w-2/5" />
      </div>
    )
  }

  const Icon = IconOverride || iconMap[variant]
  const trendBg = trend ? trendBgStyles[variant][trend.up ? 'up' : 'down'] : ''

  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-shadow hover:shadow-md',
        cardStyles[variant]
      )}
      role="status"
      aria-label={`${title}: ${value}${subtitle ? ', ' + subtitle : ''}`}
    >
      {/* Header — title + icon */}
      <div className="flex items-center justify-between mb-3">
        <p className={cn('text-sm font-medium', titleColorMap[variant])}>{title}</p>
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', iconStyles[variant])}>
          <Icon size={16} aria-hidden="true" />
        </div>
      </div>

      {/* Large value */}
      <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>

      {/* Subtitle or trend indicator */}
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full', trendBg)}>
            {trend.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </span>
        )}
        {subtitle && <p className={cn('text-xs', subtitleColorMap[variant])}>{subtitle}</p>}
      </div>
    </div>
  )
}

