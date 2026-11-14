/** Export filters for CSV download */
export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  transaction_type?: string;
  account_id?: number;
  category_id?: number;
}

/** Parameters for monthly financial report */
export interface MonthlyReportParams {
  year: number;
  month: number;
}

/** Parameters for budget performance report */
export interface BudgetReportParams {
  year: number;
  month: number;
}

/** Parameters for project finance report */
export interface ProjectReportParams {
  project_id: number;
}
