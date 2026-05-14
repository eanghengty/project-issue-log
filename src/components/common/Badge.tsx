import clsx from 'clsx'
import type { IssuePriority, IssueStatus } from '../../types/models'

const statusStyle: Record<IssueStatus, string> = {
  Open: 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-amber-50 text-amber-700',
  Blocked: 'bg-red-50 text-red-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
  Closed: 'bg-slate-100 text-slate-700',
}

const priorityStyle: Record<IssuePriority, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-sky-50 text-sky-700',
  High: 'bg-orange-50 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
}

interface BadgeProps {
  value: IssueStatus | IssuePriority
  kind: 'status' | 'priority'
}

export function Badge({ value, kind }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        kind === 'status' ? statusStyle[value as IssueStatus] : priorityStyle[value as IssuePriority],
      )}
    >
      {value}
    </span>
  )
}
