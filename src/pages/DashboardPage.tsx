import { Plus, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { format, isAfter, isBefore, isSameDay, parseISO, startOfWeek } from 'date-fns'
import { repository } from '../db/repository'
import {
  useCustomers,
  useIssues,
  useOwners,
  useProjectCustomerLinks,
  useProjectOwnerLinks,
  useProjects,
  useSites,
} from '../hooks/useData'
import { computeDashboardMetrics, countByPriority, countByProject, countByStatus } from '../lib/metrics'
import type { Issue, IssueFilters, IssuePriority, IssueStatus, SortConfig } from '../types/models'
import { SummaryPanel } from '../components/dashboard/SummaryPanel'
import { Button } from '../components/common/Button'
import { SearchInput } from '../components/common/SearchInput'
import { IssueTable } from '../components/issues/IssueTable'
import { IssueForm, type IssueFormValues } from '../components/issues/IssueForm'
import { IssueFilters as FiltersPanel } from '../components/issues/IssueFilters'

export function DashboardPage() {
  const projects = useProjects()
  const owners = useOwners()
  const customers = useCustomers()
  const sites = useSites()
  const projectOwnerLinks = useProjectOwnerLinks()
  const projectCustomerLinks = useProjectCustomerLinks()
  const issues = useIssues()

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [filters, setFilters] = useState<IssueFilters>({ search: '' })
  const [sort, setSort] = useState<SortConfig>({ field: 'updatedAt', direction: 'desc' })
  const [summaryFilters, setSummaryFilters] = useState<{
    status?: IssueStatus
    priority?: IssuePriority
    projectId?: number
    special?: 'overdue' | 'resolvedThisWeek'
  }>({})

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id as number, project.name])),
    [projects],
  )

  const ownerNames = useMemo(
    () => Object.fromEntries(owners.map((owner) => [owner.id as number, owner.name])),
    [owners],
  )

  const customerNames = useMemo(
    () =>
      Object.fromEntries(
        customers.map((customer) => [customer.id as number, `${customer.company} - ${customer.name}`]),
      ),
    [customers],
  )

  const siteLabels = useMemo(
    () => Object.fromEntries(sites.map((site) => [site.id as number, `${site.siteId} - ${site.siteName}`])),
    [sites],
  )

  const isOverdueIssue = (issue: Issue) => {
    if (!issue.dueDate || issue.status === 'Resolved' || issue.status === 'Closed') {
      return false
    }
    return isBefore(parseISO(issue.dueDate), new Date())
  }

  const isResolvedThisWeekIssue = (issue: Issue) => {
    if (!issue.resolvedAt) {
      return false
    }
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return isAfter(parseISO(issue.resolvedAt), weekStart)
  }

  const filteredIssues = useMemo(() => {
    const searchQuery = search.trim().toLowerCase()
    const base = issues.filter((issue) => {
      const text = `${issue.issueNumber} ${issue.title} ${issue.description}`.toLowerCase()
      const matchesSearch = !searchQuery || text.includes(searchQuery)
      const matchesProject =
        (!filters.projectId || issue.projectId === filters.projectId) &&
        (!summaryFilters.projectId || issue.projectId === summaryFilters.projectId)
      const matchesOwner = !filters.ownerId || issue.ownerId === filters.ownerId
      const matchesCustomer = !filters.customerId || issue.customerId === filters.customerId
      const matchesStatus =
        (!filters.status || issue.status === filters.status) &&
        (!summaryFilters.status || issue.status === summaryFilters.status)
      const matchesPriority =
        (!filters.priority || issue.priority === filters.priority) &&
        (!summaryFilters.priority || issue.priority === summaryFilters.priority)
      const matchesSpecial =
        !summaryFilters.special ||
        (summaryFilters.special === 'overdue' ? isOverdueIssue(issue) : isResolvedThisWeekIssue(issue))

      return (
        matchesSearch &&
        matchesProject &&
        matchesOwner &&
        matchesCustomer &&
        matchesStatus &&
        matchesPriority &&
        matchesSpecial
      )
    })

    const compare = (a: Issue, b: Issue) => {
      const multiplier = sort.direction === 'asc' ? 1 : -1
      const valueA =
        sort.field === 'project'
          ? projectNames[a.projectId] ?? ''
          : sort.field === 'owner'
            ? ownerNames[a.ownerId] ?? ''
            : sort.field === 'customer'
              ? customerNames[a.customerId] ?? ''
              : sort.field === 'site'
                ? a.siteRefId
                  ? siteLabels[a.siteRefId] ?? ''
                  : ''
              : (a[sort.field as keyof Issue] ?? '')
      const valueB =
        sort.field === 'project'
          ? projectNames[b.projectId] ?? ''
          : sort.field === 'owner'
            ? ownerNames[b.ownerId] ?? ''
            : sort.field === 'customer'
              ? customerNames[b.customerId] ?? ''
              : sort.field === 'site'
                ? b.siteRefId
                  ? siteLabels[b.siteRefId] ?? ''
                  : ''
              : (b[sort.field as keyof Issue] ?? '')

      return String(valueA).localeCompare(String(valueB)) * multiplier
    }

    return base.sort(compare)
  }, [issues, filters, search, sort, projectNames, ownerNames, customerNames, siteLabels, summaryFilters])

  const metrics = useMemo(() => computeDashboardMetrics(issues), [issues])
  const createdTodayCounts = useMemo(() => {
    const now = new Date()
    return {
      total: issues.filter((issue) => isSameDay(parseISO(issue.createdAt), now)).length,
      open: issues.filter((issue) => issue.status === 'Open' && isSameDay(parseISO(issue.createdAt), now)).length,
      inProgress: issues.filter((issue) => issue.status === 'In Progress' && isSameDay(parseISO(issue.createdAt), now)).length,
      overdue: issues.filter((issue) => isOverdueIssue(issue) && isSameDay(parseISO(issue.createdAt), now)).length,
      resolvedThisWeek: issues.filter((issue) => isResolvedThisWeekIssue(issue) && isSameDay(parseISO(issue.createdAt), now)).length,
    }
  }, [issues])

  const applySummaryFilter = (next: Partial<typeof summaryFilters>) => {
    setSummaryFilters((previous) => ({
      ...previous,
      ...next,
    }))
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">Dashboard</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-strong)]">Field Operations Overview</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Active issue health across projects and participants as of {format(new Date(), 'dd MMM yyyy')}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowFilters((prev) => !prev)}>
              <SlidersHorizontal size={16} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Add Issue
            </Button>
          </div>
        </div>
      </header>

      <SummaryPanel
        metrics={metrics}
        statusData={countByStatus(issues)}
        priorityData={countByPriority(issues)}
        projectData={countByProject(issues, projectNames)}
        createdTodayCounts={createdTodayCounts}
        activeSummaryFilter={summaryFilters}
        onTotalSelect={() =>
          setSummaryFilters({})
        }
        onStatusSelect={(status) =>
          applySummaryFilter({ status, special: undefined })
        }
        onPrioritySelect={(priority) =>
          applySummaryFilter({ priority })
        }
        onProjectSelect={(projectId) =>
          applySummaryFilter({ projectId })
        }
        onSpecialSelect={(special) =>
          applySummaryFilter({ special })
        }
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-soft)]">
          <div className="min-w-64 flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search issue number, title, description"
              hint="Ctrl+K"
            />
          </div>
        </div>

        {showFilters ? (
          <FiltersPanel filters={filters} projects={projects} owners={owners} customers={customers} onChange={setFilters} />
        ) : null}

        <IssueTable
          issues={filteredIssues.slice(0, 8)}
          projectNames={projectNames}
          siteLabels={siteLabels}
          ownerNames={ownerNames}
          customerNames={customerNames}
          sort={sort}
          onSortChange={setSort}
        />
      </section>

      <IssueForm
        open={formOpen}
        projects={projects}
        sites={sites}
        owners={owners}
        customers={customers}
        projectOwnerLinks={projectOwnerLinks}
        projectCustomerLinks={projectCustomerLinks}
        onClose={() => setFormOpen(false)}
        onSave={async (values: IssueFormValues) => {
          await repository.createIssue({
            projectId: values.projectId,
            siteRefId: values.siteRefId,
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            category: values.category,
            ownerId: values.ownerId,
            customerId: values.customerId,
            dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
          })
          await repository.createOverdueNotifications()
          return { commentAdded: false }
        }}
      />
    </div>
  )
}
