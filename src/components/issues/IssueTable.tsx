import { format } from 'date-fns'
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
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
}

const headerCell = 'px-3 py-2 text-left text-xs uppercase tracking-wide text-slate-500'

function sortIcon(active: boolean, direction: 'asc' | 'desc') {
  if (!active) {
    return <ArrowUpDown size={14} className="text-slate-400" />
  }
  return direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
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
}: IssueTableProps) {
  const requestSort = (field: SortConfig['field']) => {
    if (sort.field === field) {
      onSortChange({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
      return
    }

    onSortChange({ field, direction: 'asc' })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className={headerCell}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() => requestSort('issueNumber')}
                >
                  Issue {sortIcon(sort.field === 'issueNumber', sort.direction)}
                </button>
              </th>
              <th className={headerCell}>Title</th>
              <th className={headerCell}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() => requestSort('project')}
                >
                  Project {sortIcon(sort.field === 'project', sort.direction)}
                </button>
              </th>
              <th className={headerCell}>Status</th>
              <th className={headerCell}>Priority</th>
              <th className={headerCell}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() => requestSort('site')}
                >
                  Site {sortIcon(sort.field === 'site', sort.direction)}
                </button>
              </th>
              <th className={headerCell}>Owner</th>
              <th className={headerCell}>Customer</th>
              <th className={headerCell}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() => requestSort('dueDate')}
                >
                  Due Date {sortIcon(sort.field === 'dueDate', sort.direction)}
                </button>
              </th>
              {onEditIssue ? <th className={headerCell}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const overdue =
                Boolean(issue.dueDate) &&
                new Date(issue.dueDate as string).getTime() < Date.now() &&
                issue.status !== 'Resolved' &&
                issue.status !== 'Closed'

              return (
                <tr key={issue.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-sm font-semibold text-slate-700">
                    <Link to={`/issues/${issue.id}`} className="hover:underline">
                      {issue.issueNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">{issue.title}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{projectNames[issue.projectId]}</td>
                  <td className="px-3 py-2">
                    <Badge kind="status" value={issue.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Badge kind="priority" value={issue.priority} />
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    {issue.siteRefId ? (siteLabels[issue.siteRefId] ?? '-') : '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">{ownerNames[issue.ownerId]}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{customerNames[issue.customerId]}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className={overdue ? 'font-medium text-red-600' : 'text-slate-600'}>
                      {issue.dueDate ? format(new Date(issue.dueDate), 'dd MMM yyyy') : '-'}
                    </span>
                  </td>
                  {onEditIssue ? (
                    <td className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-800"
                        onClick={() => onEditIssue(issue)}
                      >
                        Edit
                      </button>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
