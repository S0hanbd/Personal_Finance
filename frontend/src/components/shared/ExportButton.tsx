import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, ChevronDown, FileText, FileSpreadsheet, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportOptions } from '@/types'
import { ReportOptionsModal } from '@/components/reports/ReportOptionsModal'

export interface ExportOption {
  label: string
  icon: 'csv' | 'pdf'
  onClick: () => Promise<void>
}

interface ExportButtonProps {
  options: ExportOption[]
  onCustomizePdf?: (options: ReportOptions) => Promise<void>
  className?: string
}

export function ExportButton({ options, onCustomizePdf, className }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [showCustomize, setShowCustomize] = useState(false)

  const handleExport = async (option: ExportOption) => {
    setIsOpen(false)
    setLoading(option.label)
    try {
      await option.onClick()
      toast.success('Export completed')
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  const handleCustomize = () => {
    setIsOpen(false)
    setShowCustomize(true)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading !== null}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
            'bg-white text-slate-700 border border-slate-300',
            'hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {loading !== null ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
          <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-slate-200"
              role="listbox"
            >
              <div className="py-1">
                {options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleExport(option)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                      'text-slate-700 hover:bg-slate-50',
                    )}
                    role="option"
                  >
                    {option.icon === 'csv' ? (
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-red-600" />
                    )}
                    {option.label}
                  </button>
                ))}
                {onCustomizePdf && (
                  <button
                    onClick={handleCustomize}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                      'text-slate-700 hover:bg-slate-50',
                    )}
                    role="option"
                  >
                    <Settings2 className="h-4 w-4 text-slate-500" />
                    Customize PDF
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {onCustomizePdf && (
        <ReportOptionsModal
          isOpen={showCustomize}
          onClose={() => setShowCustomize(false)}
          onGenerate={async (opts) => {
            setLoading('Custom PDF')
            try {
              await onCustomizePdf(opts)
              toast.success('Custom PDF exported')
            } catch {
              toast.error('Export failed')
            } finally {
              setLoading(null)
              setShowCustomize(false)
            }
          }}
        />
      )}
    </>
  )
}
