import api from '@/lib/api'
import type {
  ExportFilters,
  MonthlyReportParams,
  BudgetReportParams,
  ProjectReportParams,
} from '@/types'

/** Download a blob response as a file */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Export transactions to CSV and trigger download */
export async function exportTransactionsCSV(filters: ExportFilters = {}) {
  const res = await api.get('/reports/export_csv/', {
    params: filters,
    responseType: 'blob',
  })
  downloadBlob(res.data, 'transactions.csv')
  return res.data
}

/** Generate monthly financial report PDF and trigger download */
export async function downloadMonthlyReport(params: MonthlyReportParams) {
  const res = await api.get('/reports/monthly_report/', {
    params: { year: params.year, month: params.month },
    responseType: 'blob',
  })
  downloadBlob(res.data, `monthly_report_${params.year}_${String(params.month).padStart(2, '0')}.pdf`)
  return res.data
}

/** Generate budget performance report PDF and trigger download */
export async function downloadBudgetReport(params: BudgetReportParams) {
  const res = await api.get('/reports/budget_report/', {
    params: { year: params.year, month: params.month },
    responseType: 'blob',
  })
  downloadBlob(res.data, `budget_report_${params.year}_${String(params.month).padStart(2, '0')}.pdf`)
  return res.data
}

/** Generate project finance report PDF and trigger download */
export async function downloadProjectReport(params: ProjectReportParams) {
  const res = await api.get('/reports/project_report/', {
    params: { project_id: params.project_id },
    responseType: 'blob',
  })
  downloadBlob(res.data, `project_report_${params.project_id}.pdf`)
  return res.data
}
