import { Plus, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { repository } from '../db/repository'
import { useCustomers, useIssues, useOwners, useProjects, useSites } from '../hooks/useData'
import { computeDashboardMetrics, countByPriority, countByProject, countByStatus } from '../lib/metrics'
import type { Issue, IssueFilters, SortConfig } from '../types/models'
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
  const issues = useIssues()

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [filters, setFilters] = useState<IssueFilters>({ search: '' })
  const [sort, setSort] = useState<SortConfig>({ field: 'updatedAt', direction: 'desc' })

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

  const filteredIssues = useMemo(() => {
    const searchQuery = search.trim().toLowerCase()
    const base = issues.filter((issue) => {
      const text = `${issue.issueNumber} ${issue.title} ${issue.description}`.toLowerCase()
      const matchesSearch = !searchQuery || text.includes(searchQuery)
      const matchesProject = !filters.projectId || issue.projectId === filters.projectId
      const matchesOwner = !filters.ownerId || issue.ownerId === filters.ownerId
      const matchesCustomer = !filters.customerId || issue.customerId === filters.customerId
      const matchesStatus = !filters.status || issue.status === filters.status
      const matchesPriority = !filters.priority || issue.priority === filters.priority

      return (
        matchesSearch &&
        matchesProject &&
        matchesOwner &&
        matchesCustomer &&
        matchesStatus &&
        matchesPriority
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
  }, [issues, filters, search, sort, projectNames, ownerNames, customerNames, siteLabels])

  const metrics = useMemo(() => computeDashboardMetrics(issues), [issues])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard Summary</h2>
          <p className="text-sm text-slate-500">Track all project issues in one place.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Add Issue
        </Button>
      </header>

      <SummaryPanel
        metrics={metrics}
        statusData={countByStatus(issues)}
        priorityData={countByPriority(issues)}
        projectData={countByProject(issues, projectNames)}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-64 flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search issue number, title, description" />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters((prev) => !prev)}>
            <SlidersHorizontal size={16} /> Filters
          </Button>
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
        }}
      />
    </div>
  )
}
