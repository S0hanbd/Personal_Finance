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
  { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard },
  { label: 'Transactions', path: '/transactions', Icon: ArrowLeftRight },
  { label: 'Accounts', path: '/accounts', Icon: Wallet },
  { label: 'Bills', path: '/bills', Icon: Receipt },
  { label: 'Obligations', path: '/obligations', Icon: Calendar },
  { label: 'Budget', path: '/budget', Icon: PieChart },
  { label: 'Planned Spending', path: '/planned-spending', Icon: ShoppingCart },
  { label: 'People', path: '/people', Icon: Users },
  { label: 'Analytics', path: '/analytics', Icon: BarChart3 },
  { label: 'Projects', path: '/projects', Icon: FolderKanban },
  { label: 'Settings', path: '/settings', Icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-primary text-white min-h-screen fixed left-0 top-0 z-30">
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-xs text-white/60 mt-0.5">Personal Finance</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                isActive ? 'bg-white/20 text-white' : 'text-white/70'
              )
            }
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

