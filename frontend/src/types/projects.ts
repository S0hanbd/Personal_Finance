export interface Project {
  id: number
  name: string
  description: string
  status: 'active' | 'on_hold' | 'completed' | 'archived'
  start_date: string | null
  end_date: string | null
  total_estimated: string
  total_spent: string
  item_count: number
  created_at: string
  updated_at: string
}

export interface ProjectItem {
  id: number
  project: number
  name: string
  estimated_amount: string
  notes: string
  order: number
  actual_spent: string
  remaining: string
  percent_spent: number
  created_at: string
  updated_at: string
}

export interface ProjectDetail extends Project {
  items: ProjectItem[]
  remaining: string
  percent_complete: number
}

export interface ProjectSummary {
  total_estimated: string
  total_spent: string
  remaining: string
  project_count: number
}
