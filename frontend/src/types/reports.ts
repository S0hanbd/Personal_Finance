/** Available report sections */
export type ReportSection = 'summary' | 'categories' | 'transactions' | 'charts';

/** Available report columns */
export type ReportColumn =
  | 'date'
  | 'type'
  | 'amount'
  | 'account'
  | 'category'
  | 'income_source'
  | 'project_item'
  | 'description';

/** Column display labels */
export const COLUMN_LABELS: Record<ReportColumn, string> = {
  date: 'Date',
  type: 'Type',
  amount: 'Amount',
  account: 'Account',
  category: 'Category',
  income_source: 'Income Source',
  project_item: 'Project Item',
  description: 'Description',
} as const;

/** Section display labels */
export const SECTION_LABELS: Record<ReportSection, string> = {
  summary: 'Summary',
  categories: 'Category Breakdown',
  transactions: 'Transaction Details',
  charts: 'Charts & Projections',
} as const;

/** Export filters for CSV download */
export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  transaction_type?: string;
  account_id?: number;
  category_id?: number;
}

/** Report customization options */
export interface ReportOptions {
  sections: ReportSection[];
  columns: ReportColumn[];
  include_charts: boolean;
  filters?: ExportFilters;
}

/** Default report options */
export const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  sections: ['summary', 'categories', 'transactions', 'charts'],
  columns: [
    'date', 'type', 'amount', 'account', 'category',
    'income_source', 'project_item', 'description',
  ],
  include_charts: true,
};

/** Parameters for monthly financial report */
export interface MonthlyReportParams {
  year: number;
  month: number;
  options?: ReportOptions;
}

/** Parameters for budget performance report */
export interface BudgetReportParams {
  year: number;
  month: number;
  options?: ReportOptions;
}

/** Parameters for project finance report */
export interface ProjectReportParams {
  project_id: number;
  options?: ReportOptions;
}
