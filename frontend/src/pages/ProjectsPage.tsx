import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import {
  FolderOpen,
  Plus,
  X,
  Trash2,
  Edit2,
  Calculator,
  FolderPlus,
} from 'lucide-react'
import {
  useProjects,
  useProject,
  useProjectSummary,
  useCreateProject,
  useCreateProjectItem,
  useUpdateProjectItem,
  useDeleteProjectItem,
} from '@/hooks/useProjectsQueries'
import { ExportButton } from '@/components/shared/ExportButton'
import { downloadProjectReport } from '@/hooks/useReportsQueries'
import { useCalculatorInput } from '@/hooks/useCalculatorInput'
import { formatMoney, parseMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { ProjectItem } from '@/types'

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ percent, value, max }: {
  percent: number
  value: string
  max: string
}) {
  const clamped = Math.min(percent, 100)
  const isOver = percent > 100
  const isAmber = percent >= 80 && !isOver
  const colorClass = isOver
    ? 'bg-destructive'
    : isAmber
      ? 'bg-amber-500'
      : 'bg-success'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {formatMoney(value)} / {formatMoney(max)}
        </span>
        <span className={cn(
          'font-medium tabular-nums',
          isOver && 'text-destructive',
          isAmber && 'text-amber-600',
        )}>
          {percent.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

// ── Create Project Modal ──────────────────────────────────────────────────────
function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const createProject = useCreateProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }
    createProject.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => onClose(),
        onError: () => setError('Failed to create project.'),
      },
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            <h2 id="create-project-title" className="text-base font-semibold text-foreground">
              New Project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-foreground mb-1">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., House Renovation"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="project-desc" className="block text-sm font-medium text-foreground mb-1">
              Description (optional)
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder="Brief description of the project"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Item Modal ────────────────────────────────────────────────────────────
function AddItemModal({ projectId, onClose }: {
  projectId: number
  onClose: () => void
}) {
  const createItem = useCreateProjectItem()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const {
    displayValue: amountDisplay,
    previewValue,
    isExpression,
    handleChange: handleAmountChange,
    handleBlur: handleAmountBlur,
    reset: resetAmount,
  } = useCalculatorInput({ initialValue: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Item name is required.')
      return
    }
    const amount = isExpression ? (previewValue || '0') : (amountDisplay || '0')
    createItem.mutate(
      { projectId, name: name.trim(), estimated_amount: amount, notes: notes.trim() },
      {
        onSuccess: () => {
          setName('')
          setNotes('')
          resetAmount()
          onClose()
        },
        onError: () => setError('Failed to create item.'),
      },
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id="add-item-title" className="text-base font-semibold text-foreground">
            Add Planning Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="item-name" className="block text-sm font-medium text-foreground mb-1">
              Item Name
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., Cement, Labor, Paint"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="item-amount" className="block text-sm font-medium text-foreground mb-1">
              Estimated Amount (BDT)
            </label>
            <div className="relative">
              <input
                id="item-amount"
                type="text"
                inputMode="decimal"
                value={amountDisplay}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums',
                  isExpression && 'ring-2 ring-blue-400/50 border-blue-400',
                )}
                placeholder="0.00"
              />
              {isExpression && (
                <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
              )}
            </div>
            {isExpression && previewValue && (
              <p className="mt-1 text-xs text-blue-600" aria-live="polite">
                Total {formatMoney(previewValue)}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="item-notes" className="block text-sm font-medium text-foreground mb-1">
              Notes (optional)
            </label>
            <input
              id="item-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Optional notes"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createItem.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {createItem.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Item Modal ───────────────────────────────────────────────────────────
function EditItemModal({ projectId, item, onClose }: {
  projectId: number
  item: ProjectItem
  onClose: () => void
}) {
  const updateItem = useUpdateProjectItem()
  const [name, setName] = useState(item.name)
  const [notes, setNotes] = useState(item.notes)
  const [error, setError] = useState<string | null>(null)
  const {
    displayValue: amountDisplay,
    previewValue,
    isExpression,
    handleChange: handleAmountChange,
    handleBlur: handleAmountBlur,
  } = useCalculatorInput({ initialValue: item.estimated_amount })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Item name is required.')
      return
    }
    const amount = isExpression ? (previewValue || item.estimated_amount) : (amountDisplay || item.estimated_amount)
    updateItem.mutate(
      { projectId, itemId: item.id, name: name.trim(), estimated_amount: amount, notes: notes.trim() },
      {
        onSuccess: () => onClose(),
        onError: () => setError('Failed to update item.'),
      },
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-item-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id="edit-item-title" className="text-base font-semibold text-foreground">
            Edit Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-item-name" className="block text-sm font-medium text-foreground mb-1">
              Item Name
            </label>
            <input
              id="edit-item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="edit-item-amount" className="block text-sm font-medium text-foreground mb-1">
              Estimated Amount (BDT)
            </label>
            <div className="relative">
              <input
                id="edit-item-amount"
                type="text"
                inputMode="decimal"
                value={amountDisplay}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums',
                  isExpression && 'ring-2 ring-blue-400/50 border-blue-400',
                )}
              />
              {isExpression && (
                <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
              )}
            </div>
            {isExpression && previewValue && (
              <p className="mt-1 text-xs text-blue-600" aria-live="polite">
                Total {formatMoney(previewValue)}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="edit-item-notes" className="block text-sm font-medium text-foreground mb-1">
              Notes (optional)
            </label>
            <input
              id="edit-item-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateItem.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {updateItem.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetailView({ projectId, onBack }: {
  projectId: number
  onBack: () => void
}) {
  const { data: project, isLoading } = useProject(projectId)
  const deleteItem = useDeleteProjectItem()
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<ProjectItem | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found.</p>
        <button onClick={onBack} className="mt-4 text-sm text-primary hover:underline">
          ← Back to projects
        </button>
      </div>
    )
  }

  const remaining = project.remaining || '0'
  const percentComplete = project.percent_complete || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="Back to projects"
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <ExportButton
          options={[
            {
              label: 'Project Report (PDF)',
              icon: 'pdf',
              onClick: async () => {
                await downloadProjectReport({ project_id: project.id })
              },
            },
          ]}
        />
        <span className={cn(
          'px-2 py-1 text-xs font-medium rounded-full',
          project.status === 'active' && 'bg-green-100 text-green-800',
          project.status === 'on_hold' && 'bg-amber-100 text-amber-800',
          project.status === 'completed' && 'bg-blue-100 text-blue-800',
          project.status === 'archived' && 'bg-gray-100 text-gray-800',
        )}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Estimated</p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {formatMoney(project.total_estimated)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {formatMoney(project.total_spent)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Remaining</p>
          <p className={cn(
            'text-lg font-bold tabular-nums',
            parseMoney(remaining).lt(0) && 'text-destructive',
          )}>
            {formatMoney(remaining)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">% Complete</p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {percentComplete.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Planning Items</h3>
          <button
            onClick={() => setShowAddItem(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
          >
            <Plus className="h-3 w-3" />
            Add Item
          </button>
        </div>

        {project.items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No planning items yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add items to plan your project budget.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {project.items.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      {item.notes && (
                        <span className="text-xs text-muted-foreground truncate">
                          — {item.notes}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground tabular-nums">
                      <span>Est: {formatMoney(item.estimated_amount)}</span>
                      <span>Spent: {formatMoney(item.actual_spent)}</span>
                      <span className={cn(
                        parseMoney(item.remaining).lt(0) && 'text-destructive font-medium',
                      )}>
                        Rem: {formatMoney(item.remaining)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <ProgressBar
                  percent={item.percent_spent}
                  value={item.actual_spent}
                  max={item.estimated_amount}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddItem && (
        <AddItemModal projectId={projectId} onClose={() => setShowAddItem(false)} />
      )}
      {editingItem && (
        <EditItemModal
          projectId={projectId}
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <DeleteDialog
          title="Delete Project Item?"
          description={`This will permanently delete "${deletingItem.name}" (${formatMoney(deletingItem.estimated_amount)}). This cannot be undone.`}
          onConfirm={() => {
            deleteItem.mutate({ projectId, itemId: deletingItem.id }, {
              onSuccess: () => {
                toast.success('Item deleted')
                setDeletingItem(null)
              },
            })
          }}
          onCancel={() => setDeletingItem(null)}
          isPending={deleteItem.isPending}
        />
      )}
    </div>
  )
}

// ── Main Page (Hooks Wrapper) ─────────────────────────────────────────────────
export function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects()
  const { data: summary } = useProjectSummary()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'all') return true
    return p.status === statusFilter
  })

  if (selectedProjectId) {
    return (
      <ProjectDetailView
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Plan and track expenses for your projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Projects</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {summary.project_count}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Estimated</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatMoney(summary.total_estimated)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatMoney(summary.total_spent)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={cn(
              'text-lg font-bold tabular-nums',
              parseMoney(summary.remaining).lt(0) && 'text-destructive',
            )}>
              {formatMoney(summary.remaining)}
            </p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2">
        {['all', 'active', 'on_hold', 'completed', 'archived'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition',
              statusFilter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Project List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            No projects yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a project to start planning and tracking expenses.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition truncate">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {project.description}
                    </p>
                  )}
                </div>
                <span className={cn(
                  'ml-2 px-2 py-0.5 text-xs font-medium rounded-full shrink-0',
                  project.status === 'active' && 'bg-green-100 text-green-800',
                  project.status === 'on_hold' && 'bg-amber-100 text-amber-800',
                  project.status === 'completed' && 'bg-blue-100 text-blue-800',
                  project.status === 'archived' && 'bg-gray-100 text-gray-800',
                )}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Estimated</p>
                  <p className="font-medium text-foreground tabular-nums">
                    {formatMoney(project.total_estimated)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Spent</p>
                  <p className="font-medium text-foreground tabular-nums">
                    {formatMoney(project.total_spent)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-medium text-foreground tabular-nums">
                    {project.item_count}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

