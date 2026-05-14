import { useEffect, useRef, type PropsWithChildren } from 'react'
import { Sidebar } from './Sidebar'
import { useNotifications } from '../../hooks/useData'

export function AppShell({ children }: PropsWithChildren) {
  const notifications = useNotifications()
  const latestNotifiedId = useRef<number | null>(null)

  useEffect(() => {
    if (!notifications.length) {
      return
    }

    const newest = notifications[0]
    if (!newest?.id) {
      return
    }

    if (latestNotifiedId.current === null) {
      latestNotifiedId.current = newest.id
      return
    }

    if (newest.id <= latestNotifiedId.current) {
      return
    }

    latestNotifiedId.current = newest.id
    if ('Notification' in window && Notification.permission === 'granted') {
      // Fire desktop notification only for new unseen items while app is open.
      new Notification('Issue Log Tracker', { body: newest.message })
    }
  }, [notifications])

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar notifications={notifications} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
