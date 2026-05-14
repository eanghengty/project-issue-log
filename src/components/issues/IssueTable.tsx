import { differenceInCalendarDays, format, formatDistanceToNowStrict, isBefore } from 'date-fns'
import { ArrowUpDown, ChevronDown, ChevronUp, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Issue, SortConfig } from '../../types/models'
import { Badge } from '../common/Badge'

interface IssueTableProps {
  issues: Issue[]
  projectNames: Record<number, string>
  siteLabels: Record<number, string>
  ownerNames: Record<number, string>
  customerNames: Record<number, string>
  sort: SortConfig
  onSortChange: (sort: SortConfig) => void
  onEditIssue?: (issue: Issue) => void
  onViewActivity?: (issue: Issue) => void
}

const headerCell = 'px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--text-faint)]'

function sortIcon(active: boolean, direction: 'asc' | 'desc') {
  if (!active) {
    return <ArrowUpDown size={13} className="text-[var(--text-faint)]" />
  }
  return direction === 'asc' ? (
    <ChevronUp size={13} className="text-[var(--accent-ink)]" />
  ) : (
    <ChevronDown size={13} className="text-[var(--accent-ink)]" />
  )
}

export function IssueTable({
  issues,
  projectNames,
  siteLabels,
  ownerNames,
  customerNames,
  sort,
  onSortChange,
  onEditIssue,
  onViewActivity,
}: IssueTableProps) {
  const requestSort = (field: SortConfig['field']) => {
    if (sort.field === field) {
      onSortChange({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
      return
    }

    onSortChange({ field, direction: 'asc' })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]">
      <div className="overflow-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              <th className={headerCell}>
                <button type="button" className="inline-flex items-center gap-1" onClick={() => requestSort('issueNumber')}>
                  Issue {sortIcon(sort.field === 'issueNumber', sort.direction)}
                </button>
              </th>
              <th className={headerCell}>Title</th>
              <th className={headerCell}>
                <button type="button" className="inline-flex items-center gap-1" onClick={() => requestSort('project')}>
                  Project {sortIcon(sort.field === 'project', sort.direction)}
                </button>
              </th>
              <th className={headerCell}>Status</th>
              <th className={headerCell}>Priority</th>
              <th className={headerCell}>
                <button type="button" className="inline-flex items-center gap-1" onClick={() => requestSort('site')}>
                  Site {sortIcon(sort.field === 'site', sort.direction)}
                </button>
              </th>
              <th className={headerCell}>Owner</th>
              <th className={headerCell}>Customer</th>
              <th className={headerCell}>
                <button type="button" className="inline-flex items-center gap-1" onClick={() => requestSort('dueDate')}>
                  Due Date {sortIcon(sort.field === 'dueDate', sort.direction)}
                </button>
              </th>
              {onEditIssue || onViewActivity ? <th className={headerCell}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const dueDate = issue.dueDate ? new Date(issue.dueDate) : undefined
              const overdue =
                Boolean(dueDate) &&
                isBefore(dueDate as Date, new Date()) &&
                issue.status !== 'Resolved' &&
                issue.status !== 'Closed'
              const dueSoon =
                Boolean(dueDate) &&
                !overdue &&
                differenceInCalendarDays(dueDate as Date, new Date()) >= 0 &&
                differenceInCalendarDays(dueDate as Date, new Date()) <= 2
              const dueLabel = dueDate ? formatDistanceToNowStrict(dueDate, { addSuffix: true }) : null

              return (
                <tr
                  key={issue.id}
                  className="border-t border-[var(--border-soft)] text-[13px] text-[var(--text-default)] transition hover:bg-[var(--surface-hover)]"
                >
                  <td className="px-3 py-2 font-semibold text-[var(--text-muted)]">
                    <Link to={`/issues/${issue.id}`} className="hover:text-[var(--accent-ink)] hover:underline">
                      {issue.issueNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <div className="max-w-[440px]">
                      <p className="font-medium text-[var(--text-strong)]">{issue.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-faint)]">Updated {format(new Date(issue.updatedAt), 'dd MMM yyyy')}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-default)]">{projectNames[issue.projectId] ?? '-'}</td>
                  <td className="px-3 py-2">
                    <Badge kind="status" value={issue.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Badge kind="priority" value={issue.priority} />
                  </td>
                  <td className="px-3 py-2 text-[var(--text-default)]">
                    {issue.siteRefId ? (siteLabels[issue.siteRefId] ?? '-') : '-'}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-default)]">{ownerNames[issue.ownerId] ?? 'Unassigned'}</td>
                  <td className="px-3 py-2 text-[var(--text-default)]">{customerNames[issue.customerId] ?? 'Unassigned'}</td>
                  <td className="px-3 py-2 text-sm">
                    {dueDate ? (
                      <div
                        className={[
                          'flex flex-col leading-tight',
                          overdue ? 'text-[#b33a2a]' : dueSoon ? 'text-[#a3561d]' : 'text-[var(--text-default)]',
                        ].join(' ')}
                      >
                        <span className="font-medium">{format(dueDate, 'dd MMM yyyy')}</span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--text-faint)]">
                          {dueLabel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--text-faint)]">-</span>
                    )}
                  </td>
                  {onEditIssue || onViewActivity ? (
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        {onViewActivity ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-strong)]"
                            onClick={() => onViewActivity(issue)}
                          >
                            <History size={13} />
                            Activity
                          </button>
                        ) : null}
                        {onEditIssue ? (
                          <button
                            type="button"
                            className="rounded-md border border-[var(--border-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-strong)]"
                            onClick={() => onEditIssue(issue)}
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              )
            })}
            {!issues.length ? (
              <tr>
                <td
                  colSpan={onEditIssue || onViewActivity ? 10 : 9}
                  className="px-3 py-10 text-center text-sm text-[var(--text-muted)]"
                >
                  No issues match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-xs text-[var(--text-muted)]">
        <span>
          Showing <b className="text-[var(--text-strong)]">{issues.length}</b> issues
        </span>
      </div>
    </div>
  )
}
