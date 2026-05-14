import type { Customer, IssueFilters as FiltersType, IssuePriority, IssueStatus, Owner, Project } from '../../types/models'
import { Button } from '../common/Button'

const statuses: IssueStatus[] = ['Open', 'In Progress', 'Blocked', 'Resolved', 'Closed']
const priorities: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical']

interface IssueFiltersProps {
  filters: FiltersType
  projects: Project[]
  owners: Owner[]
  customers: Customer[]
  onChange: (next: FiltersType) => void
}

export function IssueFilters({ filters, projects, owners, customers, onChange }: IssueFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-5">
      <select
        className="h-10 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-default)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        value={filters.projectId ?? ''}
        onChange={(event) =>
          onChange({ ...filters, projectId: event.target.value ? Number(event.target.value) : undefined })
        }
      >
        <option value="">All projects</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-default)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        value={filters.ownerId ?? ''}
        onChange={(event) =>
          onChange({ ...filters, ownerId: event.target.value ? Number(event.target.value) : undefined })
        }
      >
        <option value="">All owners</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-default)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        value={filters.customerId ?? ''}
        onChange={(event) =>
          onChange({ ...filters, customerId: event.target.value ? Number(event.target.value) : undefined })
        }
      >
        <option value="">All customers</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.company}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-default)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        value={filters.status ?? ''}
        onChange={(event) =>
          onChange({
            ...filters,
            status: (event.target.value as IssueStatus) || undefined,
          })
        }
      >
        <option value="">All status</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <select
          className="h-10 flex-1 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-default)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          value={filters.priority ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              priority: (event.target.value as IssuePriority) || undefined,
            })
          }
        >
          <option value="">All priority</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <Button
          variant="ghost"
          className="border border-[var(--border-soft)]"
          onClick={() =>
            onChange({
              search: filters.search,
            })
          }
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
