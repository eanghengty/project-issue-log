import { LayoutDashboard, FolderKanban, Users, Building2, CircleUserRound, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'
import type { Notification } from '../../types/models'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/issues', label: 'Issues', icon: FolderKanban },
  { to: '/projects', label: 'Projects', icon: Building2 },
  { to: '/owners', label: 'Owners', icon: CircleUserRound },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  notifications: Notification[]
}

export function Sidebar({ notifications }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-900 px-4 py-5">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Issue Log</p>
          <h1 className="text-lg font-semibold text-white">Tracker</h1>
        </div>
        <NotificationBell notifications={notifications} />
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800',
                ].join(' ')
              }
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
