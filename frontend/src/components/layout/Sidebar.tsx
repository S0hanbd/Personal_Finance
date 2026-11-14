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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard, shortcut: 'D' },
  { label: 'Transactions', path: '/transactions', Icon: ArrowLeftRight, shortcut: 'T' },
  { label: 'Accounts', path: '/accounts', Icon: Wallet, shortcut: 'A' },
  { label: 'Bills', path: '/bills', Icon: Receipt, shortcut: 'B' },
  { label: 'Obligations', path: '/obligations', Icon: Calendar, shortcut: 'O' },
  { label: 'Budget', path: '/budget', Icon: PieChart, shortcut: 'U' },
  { label: 'Planned Spending', path: '/planned-spending', Icon: ShoppingCart, shortcut: 'S' },
  { label: 'People', path: '/people', Icon: Users, shortcut: 'P' },
  { label: 'Analytics', path: '/analytics', Icon: BarChart3, shortcut: 'L' },
  { label: 'Projects', path: '/projects', Icon: FolderKanban, shortcut: 'R' },
  { label: 'Settings', path: '/settings', Icon: Settings, shortcut: 'M' },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-primary text-white min-h-screen fixed left-0 top-0 z-30">
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-xs text-white/60 mt-0.5">Personal Finance</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map(({ label, path, Icon, shortcut }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                isActive ? 'bg-white/20 text-white' : 'text-white/70'
              )
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={18} aria-hidden="true" />
              {label}
            </span>
            <kbd className="hidden group-hover:inline-flex lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-white/40 bg-white/10 rounded">
              G+{shortcut}
            </kbd>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-white/10">
        <p className="px-3 text-[10px] text-white/40">Press <kbd className="px-1 py-0.5 bg-white/10 rounded font-mono">?</kbd> for all shortcuts</p>
      </div>
    </aside>
  )
}

