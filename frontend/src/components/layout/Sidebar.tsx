import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Receipt,
  Calendar,
  PieChart,
  ShoppingCart,
  Users,
  BarChart3,
  FolderKanban,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

interface NavGroup {
  label: string
  items: Array<{ label: string; path: string; Icon: typeof LayoutDashboard; shortcut: string }>
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard, shortcut: 'D' },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { label: 'Transactions', path: '/transactions', Icon: ArrowLeftRight, shortcut: 'T' },
      { label: 'Accounts', path: '/accounts', Icon: Wallet, shortcut: 'A' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { label: 'Budget', path: '/budget', Icon: PieChart, shortcut: 'U' },
      { label: 'Planned Spending', path: '/planned-spending', Icon: ShoppingCart, shortcut: 'S' },
    ],
  },
  {
    label: 'Recurring',
    items: [
      { label: 'Bills', path: '/bills', Icon: Receipt, shortcut: 'B' },
      { label: 'Obligations', path: '/obligations', Icon: Calendar, shortcut: 'O' },
    ],
  },
  {
    label: 'People & Projects',
    items: [
      { label: 'People', path: '/people', Icon: Users, shortcut: 'P' },
      { label: 'Projects', path: '/projects', Icon: FolderKanban, shortcut: 'R' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', path: '/analytics', Icon: BarChart3, shortcut: 'L' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Settings', path: '/settings', Icon: Settings, shortcut: 'M' },
    ],
  },
]

function NavGroupSection({ group, onClose, collapsed }: { group: NavGroup; onClose?: () => void; collapsed: boolean }) {
  const [isOpen, setIsOpen] = useState(true)

  if (collapsed) {
    return (
      <div role="group" aria-label={group.label} className="mb-1">
        {group.items.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10'
              )
            }
            title={label}
          >
            <Icon size={18} aria-hidden="true" />
          </NavLink>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
        aria-expanded={isOpen}
      >
        {group.label}
        {isOpen
          ? <ChevronDown size={10} aria-hidden="true" />
          : <ChevronRight size={10} aria-hidden="true" />
        }
      </button>
      {isOpen && (
        <div role="group" aria-label={group.label}>
          {group.items.map(({ label, path, Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                )
              }
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-gradient-to-b from-electric-blue to-electric-sky min-h-screen fixed left-0 top-0 z-30 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center border-b border-white/20', collapsed ? 'justify-center py-5' : 'px-6 py-5')}>
        {collapsed ? (
          <span className="text-lg font-bold text-white" title={APP_NAME}>F</span>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white tracking-tight">{APP_NAME}</h1>
            <p className="text-xs text-white/70 mt-0.5">Personal Finance</p>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" aria-label="Main navigation" style={{ scrollbarWidth: 'thin' }}>
        <div className={cn('py-4', collapsed ? 'px-2' : 'px-3')}>
          {navGroups.map((group) => (
            <NavGroupSection key={group.label} group={group} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Footer with collapse toggle */}
      <div className="border-t border-white/20">
        {collapsed ? (
          <div className="flex flex-col items-center py-3">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        ) : (
          <div className="px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/60">Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white/80">?</kbd> for shortcuts</p>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className="fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-border shadow-lg lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">{APP_NAME}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Personal Finance</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          </div>
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Mobile navigation">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} onClose={onClose} collapsed={false} />
            ))}
          </nav>
          {/* Footer */}
          <div className="px-3 py-3 border-t border-border">
            <p className="px-3 text-[11px] text-muted-foreground">Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">?</kbd> for shortcuts</p>
          </div>
        </div>
      </aside>
    </>
  )
}

