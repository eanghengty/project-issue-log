import { format } from 'date-fns'
import type { ActivityEntry } from '../../types/models'

interface ActivityLogProps {
  activities: ActivityEntry[]
}

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <p className="font-medium text-slate-700">
            {activity.actor} updated <span className="text-slate-900">{activity.field}</span>
          </p>
          <p className="text-xs text-slate-500">
            {activity.oldValue ? `${activity.oldValue} -> ` : ''}
            {activity.newValue}
          </p>
          <p className="mt-1 text-xs text-slate-400">{format(new Date(activity.createdAt), 'dd MMM yyyy HH:mm')}</p>
        </div>
      ))}
    </div>
  )
}
