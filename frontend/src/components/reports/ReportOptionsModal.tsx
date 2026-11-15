import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Settings2 } from 'lucide-react'
import type {
  ReportOptions,
  ReportSection,
  ReportColumn,
  ExportFilters,
} from '@/types'
import { COLUMN_LABELS, SECTION_LABELS, DEFAULT_REPORT_OPTIONS } from '@/types'

const STORAGE_KEY = 'report_options'

function loadSavedOptions(): ReportOptions {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as ReportOptions
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_REPORT_OPTIONS }
}

function saveOptions(options: ReportOptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
  } catch {
    // ignore
  }
}

/** Hooks wrapper — all hooks called unconditionally */
export function ReportOptionsModal({
  isOpen,
  onClose,
  onGenerate,
}: {
  isOpen: boolean
  onClose: () => void
  onGenerate: (options: ReportOptions) => Promise<void>
}) {
  const [options, setOptions] = useState<ReportOptions>(loadSavedOptions)
  const [loading, setLoading] = useState(false)
  const priorOpenRef = useRef(isOpen)
  const focusRef = useRef<HTMLButtonElement>(null!)

  useEffect(() => {
    if (isOpen && !priorOpenRef.current) {
      setOptions(loadSavedOptions())
      focusRef.current?.focus()
    }
    priorOpenRef.current = isOpen
  }, [isOpen])

  const toggleSection = useCallback((section: ReportSection) => {
    setOptions((prev) => {
      const sections = prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section]
      return { ...prev, sections }
    })
  }, [])

  const toggleColumn = useCallback((column: ReportColumn) => {
    setOptions((prev) => {
      const columns = prev.columns.includes(column)
        ? prev.columns.filter((c) => c !== column)
        : [...prev.columns, column]
      return { ...prev, columns }
    })
  }, [])

  const toggleCharts = useCallback(() => {
    setOptions((prev) => ({ ...prev, include_charts: !prev.include_charts }))
  }, [])

  const updateFilter = useCallback((key: keyof ExportFilters, value: string | undefined) => {
    setOptions((prev) => {
      const filters = { ...(prev.filters || {}) }
      if (value === '' || value === undefined) {
        delete filters[key]
      } else {
        (filters as Record<string, string>)[key] = value
      }
      return { ...prev, filters: Object.keys(filters).length ? filters : undefined }
    })
  }, [])

  const handleGenerate = useCallback(async () => {
    // Ensure at least one section and one column
    const finalOptions = {
      ...options,
      sections: options.sections.length ? options.sections : DEFAULT_REPORT_OPTIONS.sections,
      columns: options.columns.length ? options.columns : DEFAULT_REPORT_OPTIONS.columns,
    }
    saveOptions(finalOptions)
    setLoading(true)
    try {
      await onGenerate(finalOptions)
    } finally {
      setLoading(false)
    }
  }, [options, onGenerate])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }, [handleClose])

  if (!isOpen) return null

  return (
    <ReportOptionsModalContent
      options={options}
      loading={loading}
      focusRef={focusRef}
      toggleSection={toggleSection}
      toggleColumn={toggleColumn}
      toggleCharts={toggleCharts}
      updateFilter={updateFilter}
      handleGenerate={handleGenerate}
      handleClose={handleClose}
      handleKeyDown={handleKeyDown}
    />
  )
}

/** Content component — JSX only, no hooks */
function ReportOptionsModalContent({
  options,
  loading,
  focusRef,
  toggleSection,
  toggleColumn,
  toggleCharts,
  updateFilter,
  handleGenerate,
  handleClose,
  handleKeyDown,
}: {
  options: ReportOptions
  loading: boolean
  focusRef: React.RefObject<HTMLButtonElement>
  toggleSection: (s: ReportSection) => void
  toggleColumn: (c: ReportColumn) => void
  toggleCharts: () => void
  updateFilter: (key: keyof ExportFilters, value: string | undefined) => void
  handleGenerate: () => Promise<void>
  handleClose: () => void
  handleKeyDown: (e: React.KeyboardEvent) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl p-6 m-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-options-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="report-options-title" className="text-lg font-semibold text-slate-900">
            Customize Report
          </h2>
          <button
            ref={focusRef}
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Sections */}
        <fieldset className="mb-6">
          <legend className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <Settings2 className="h-4 w-4" />
            Sections
          </legend>
          <div className="space-y-2">
            {(Object.entries(SECTION_LABELS) as [ReportSection, string][]).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer min-h-[24px]"
              >
                <input
                  type="checkbox"
                  checked={options.sections.includes(key)}
                  onChange={() => toggleSection(key)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Columns */}
        <fieldset className="mb-6">
          <legend className="text-sm font-medium text-slate-700 mb-2">Columns</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(COLUMN_LABELS) as [ReportColumn, string][]).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer min-h-[24px]"
              >
                <input
                  type="checkbox"
                  checked={options.columns.includes(key)}
                  onChange={() => toggleColumn(key)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Charts toggle */}
        <fieldset className="mb-6">
          <legend className="text-sm font-medium text-slate-700 mb-2">Charts</legend>
          <label className="flex items-center gap-2 cursor-pointer min-h-[24px]">
            <input
              type="checkbox"
              checked={options.include_charts}
              onChange={toggleCharts}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <span className="text-sm text-slate-700">Include charts in report</span>
          </label>
        </fieldset>

        {/* Filters */}
        <fieldset className="mb-6">
          <legend className="text-sm font-medium text-slate-700 mb-2">Filters</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={options.filters?.start_date ?? ''}
                onChange={(e) => updateFilter('start_date', e.target.value || undefined)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={options.filters?.end_date ?? ''}
                onChange={(e) => updateFilter('end_date', e.target.value || undefined)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
