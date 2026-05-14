import { format } from 'date-fns'
import type { ActivityEntry } from '../../types/models'

interface ActivityLogProps {
  activities: ActivityEntry[]
  excludeTypes?: ActivityEntry['type'][]
}

const typeStyle: Record<ActivityEntry['type'], string> = {
  create: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  update: 'bg-sky-100 text-sky-800 border border-sky-200',
  status: 'bg-amber-100 text-amber-800 border border-amber-200',
  attachment: 'bg-violet-100 text-violet-800 border border-violet-200',
  comment: 'bg-slate-100 text-slate-700 border border-slate-200',
}

const typeLabel: Record<ActivityEntry['type'], string> = {
  create: 'Created',
  update: 'Updated',
  status: 'Status',
  attachment: 'Attachment',
  comment: 'Comment',
}

const actorStyle = (actor: string) => {
  const normalized = actor.trim().toLowerCase()
  if (normalized.includes('system')) {
    return {
      label: 'System',
      className: 'bg-rose-100 text-rose-800 border border-rose-200',
    }
  }

  return {
    label: 'Editor',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  }
}

export function ActivityLog({ activities, excludeTypes = [] }: ActivityLogProps) {
  const filteredActivities = activities.filter((activity) => !excludeTypes.includes(activity.type))

  return (
    <div className="space-y-2">
      {filteredActivities.map((activity) => (
        <div key={activity.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${typeStyle[activity.type]}`}>
              {typeLabel[activity.type]}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${actorStyle(activity.actor).className}`}
            >
              {actorStyle(activity.actor).label}
            </span>
            <span className="text-xs text-slate-500">{activity.actor}</span>
          </div>
          <p className="font-medium text-slate-700">
            {activity.field === 'issue' ? 'Issue' : activity.field} change
          </p>
          <p className="text-xs text-slate-500">
            {activity.oldValue ? `${activity.oldValue} -> ` : ''}
            {activity.newValue || 'Updated'}
          </p>
          <p className="mt-1 text-xs text-slate-400">{format(new Date(activity.createdAt), 'dd MMM yyyy HH:mm')}</p>
        </div>
      ))}
    </div>
  )
}
