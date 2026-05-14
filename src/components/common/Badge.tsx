import clsx from 'clsx'
import type { IssuePriority, IssueStatus } from '../../types/models'

const statusStyle: Record<IssueStatus, string> = {
  Open: 'bg-[#eaf1fe] text-[#1f4ba5]',
  'In Progress': 'bg-[#fdf0dc] text-[#a3561d]',
  Blocked: 'bg-[#fde7e4] text-[#b33a2a]',
  Resolved: 'bg-[#e7f6ee] text-[#26784d]',
  Closed: 'bg-[#edf1f7] text-[#4d5f76]',
}

const priorityStyle: Record<IssuePriority, string> = {
  Low: 'bg-[#edf1f7] text-[#4d5f76]',
  Medium: 'bg-[#e7f0ff] text-[#2e63d5]',
  High: 'bg-[#fdf0dc] text-[#a3561d]',
  Critical: 'bg-[#fde7e4] text-[#b33a2a]',
}

const statusDotStyle: Record<IssueStatus, string> = {
  Open: 'bg-[#2e63d5]',
  'In Progress': 'bg-[#d9873a]',
  Blocked: 'bg-[#d05f4a]',
  Resolved: 'bg-[#2f8a5f]',
  Closed: 'bg-[#718197]',
}

const priorityDotStyle: Record<IssuePriority, string> = {
  Low: 'bg-[#718197]',
  Medium: 'bg-[#2e63d5]',
  High: 'bg-[#d9873a]',
  Critical: 'bg-[#d05f4a]',
}

interface BadgeProps {
  value: IssueStatus | IssuePriority
  kind: 'status' | 'priority'
}

export function Badge({ value, kind }: BadgeProps) {
  const dotClass = kind === 'status' ? statusDotStyle[value as IssueStatus] : priorityDotStyle[value as IssuePriority]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        kind === 'status' ? statusStyle[value as IssueStatus] : priorityStyle[value as IssuePriority],
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotClass)} />
      {value}
    </span>
  )
}
