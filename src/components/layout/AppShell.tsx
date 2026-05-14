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
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text-strong)]">
      <Sidebar notifications={notifications} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--surface-primary)]">
        <div className="mx-auto w-full max-w-[1560px] p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
