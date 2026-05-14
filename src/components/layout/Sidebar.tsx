import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  CircleUserRound,
  MapPinned,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'
import type { Notification } from '../../types/models'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

const workspaceItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/issues', label: 'Issues', icon: FolderKanban },
  { to: '/projects', label: 'Projects', icon: Building2 },
  { to: '/sites', label: 'Site Management', icon: MapPinned },
]

const peopleItems: NavItem[] = [
  { to: '/owners', label: 'Owners', icon: CircleUserRound },
  { to: '/customers', label: 'Customers', icon: Users },
]

const systemItems: NavItem[] = [{ to: '/settings', label: 'Settings', icon: Settings }]

interface SidebarProps {
  notifications: Notification[]
}

export function Sidebar({ notifications }: SidebarProps) {
  const navClass =
    'group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[var(--text-default)] transition'
  const activeClass =
    'bg-[var(--surface-primary)] text-[var(--text-strong)] shadow-[var(--shadow-soft)] border-[var(--border-soft)]'

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col overflow-hidden border-r border-[var(--border-soft)] bg-[var(--surface-sunken)] px-4 py-5">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-3 py-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">Issue Log</p>
          <h1 className="text-base font-semibold text-[var(--text-strong)]">Tracker</h1>
        </div>
        <NotificationBell notifications={notifications} />
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Workspace
          </p>
          {workspaceItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [navClass, isActive ? activeClass : 'hover:bg-[var(--surface-hover)]'].join(' ')
                }
              >
                <Icon size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-strong)]" />
                {item.label}
              </NavLink>
            )
          })}
        </div>

        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">People</p>
          {peopleItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [navClass, isActive ? activeClass : 'hover:bg-[var(--surface-hover)]'].join(' ')
                }
              >
                <Icon size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-strong)]" />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <div className="pt-4">
        {systemItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [navClass, isActive ? activeClass : 'hover:bg-[var(--surface-hover)]'].join(' ')
              }
            >
              <Icon size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-strong)]" />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </aside>
  )
}
