interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-4" aria-hidden="true">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors min-h-[36px] min-w-[80px]"
        >
          Try again
        </button>
      )}
    </div>
  )
}

