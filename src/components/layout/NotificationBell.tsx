import { Bell } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { repository } from '../../db/repository'
import type { Notification } from '../../types/models'

interface NotificationBellProps {
  notifications: Notification[]
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((item) => !item.read).length

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-lg p-2 text-slate-200 hover:bg-slate-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => {
                void repository.markAllNotificationsRead()
              }}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() => {
                    if (notification.id) {
                      void repository.markNotificationRead(notification.id)
                    }
                  }}
                >
                  <p className="text-sm text-slate-700">{notification.message}</p>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
