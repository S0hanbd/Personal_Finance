import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  isLoading?: boolean
}

const borderMap = {
  default: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
}

const variantLabels: Record<string, string> = {
  success: 'On Track',
  warning: 'Near Limit',
  danger: 'Over Budget',
}

export function SummaryCard({
  title,
  value,
  subtitle,
  variant = 'default',
  isLoading = false,
}: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm border border-border animate-pulse" aria-busy="true">
        <div className="h-4 bg-muted rounded w-3/4 mb-3" />
        <div className="h-8 bg-muted rounded w-1/2 mb-2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    )
  }

  return (
    <div
      className={cn('bg-white rounded-lg p-5 shadow-sm border border-border border-l-4', borderMap[variant])}
      role="status"
      aria-label={`${title}: ${value}${variantLabels[variant] ? ', ' + variantLabels[variant] : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-secondary mb-1">{title}</p>
        {variantLabels[variant] && (
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            variant === 'success' && 'bg-emerald-50 text-emerald-700',
            variant === 'warning' && 'bg-amber-50 text-amber-700',
            variant === 'danger' && 'bg-rose-50 text-rose-700',
          )}>
            {variantLabels[variant]}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

