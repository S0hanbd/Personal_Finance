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

function NavGroupSection({ group }: { group: NavGroup }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
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
          {group.items.map(({ label, path, Icon, shortcut }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between pl-8 pr-3 py-2 rounded-md text-sm font-medium transition-colors',
                  'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  isActive ? 'bg-white/20 text-white' : 'text-white/70'
                )
              }
            >
              <span className="flex items-center gap-3">
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-white/40 bg-white/10 rounded">
                G+{shortcut}
              </kbd>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-primary text-white min-h-screen fixed left-0 top-0 z-30">
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-xs text-white/60 mt-0.5">Personal Finance</p>
      </div>
      <nav className="flex-1 px-3 py-4" aria-label="Main navigation">
        {navGroups.map((group) => (
          <NavGroupSection key={group.label} group={group} />
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-white/10">
        <p className="px-3 text-[10px] text-white/40">Press <kbd className="px-1 py-0.5 bg-white/10 rounded font-mono">?</kbd> for all shortcuts</p>
      </div>
    </aside>
  )
}

