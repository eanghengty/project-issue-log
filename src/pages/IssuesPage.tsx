import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { SearchInput } from '../components/common/SearchInput'
import { IssueFilters } from '../components/issues/IssueFilters'
import { IssueForm, type IssueFormValues } from '../components/issues/IssueForm'
import { IssueTable } from '../components/issues/IssueTable'
import { repository } from '../db/repository'
import {
  useComments,
  useCustomers,
  useIssues,
  useOwners,
  useProjectCustomerLinks,
  useProjectOwnerLinks,
  useProjects,
  useSites,
} from '../hooks/useData'
import type { Issue, IssueFilters as IssueFiltersType, SortConfig } from '../types/models'

export function IssuesPage() {
  const projects = useProjects()
  const owners = useOwners()
  const customers = useCustomers()
  const sites = useSites()
  const projectOwnerLinks = useProjectOwnerLinks()
  const projectCustomerLinks = useProjectCustomerLinks()
  const issues = useIssues()

  const [filters, setFilters] = useState<IssueFiltersType>({ search: '' })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortConfig>({ field: 'updatedAt', direction: 'desc' })
  const [formOpen, setFormOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>(undefined)
  const editingIssueComments = useComments(editingIssue?.id)

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id as number, project.name])),
    [projects],
  )
  const ownerNames = useMemo(
    () => Object.fromEntries(owners.map((owner) => [owner.id as number, owner.name])),
    [owners],
  )
  const siteLabels = useMemo(
    () => Object.fromEntries(sites.map((site) => [site.id as number, `${site.siteId} - ${site.siteName}`])),
    [sites],
  )
  const customerNames = useMemo(
    () =>
      Object.fromEntries(
        customers.map((customer) => [customer.id as number, `${customer.company} - ${customer.name}`]),
      ),
    [customers],
  )

  const resolveCommentActor = (commentActorKey: string) => {
    if (!commentActorKey) {
      return undefined
    }
    const [actorType, actorIdRaw] = commentActorKey.split(':')
    const actorId = Number(actorIdRaw)
    if (!Number.isFinite(actorId)) {
      return undefined
    }

    if (actorType === 'owner') {
      return owners.find((owner) => owner.id === actorId)?.name
    }
    if (actorType === 'customer') {
      const customer = customers.find((item) => item.id === actorId)
      return customer ? `${customer.company} - ${customer.name}` : undefined
    }

    return undefined
  }

  const sortedFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = issues.filter((issue) => {
      const byText = `${issue.issueNumber} ${issue.title} ${issue.description}`.toLowerCase()
      if (q && !byText.includes(q)) {
        return false
      }
      if (filters.projectId && filters.projectId !== issue.projectId) {
        return false
      }
      if (filters.ownerId && filters.ownerId !== issue.ownerId) {
        return false
      }
      if (filters.customerId && filters.customerId !== issue.customerId) {
        return false
      }
      if (filters.status && filters.status !== issue.status) {
        return false
      }
      if (filters.priority && filters.priority !== issue.priority) {
        return false
      }

      return true
    })

    const valueFor = (issue: Issue) => {
      if (sort.field === 'project') {
        return projectNames[issue.projectId] ?? ''
      }
      if (sort.field === 'owner') {
        return ownerNames[issue.ownerId] ?? ''
      }
      if (sort.field === 'customer') {
        return customerNames[issue.customerId] ?? ''
      }
      if (sort.field === 'site') {
        return issue.siteRefId ? (siteLabels[issue.siteRefId] ?? '') : ''
      }
      return String(issue[sort.field as keyof Issue] ?? '')
    }

    return filtered.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1
      return valueFor(a).localeCompare(valueFor(b)) * dir
    })
  }, [issues, search, filters, sort, projectNames, ownerNames, customerNames, siteLabels])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Issues</h2>
          <p className="text-sm text-slate-500">Search, filter, sort, and manage the full issue register.</p>
        </div>
        <Button
          onClick={() => {
            setEditingIssue(undefined)
            setFormOpen(true)
          }}
        >
          <Plus size={16} /> Add Issue
        </Button>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Search issues" />

      <IssueFilters filters={filters} onChange={setFilters} projects={projects} owners={owners} customers={customers} />

      <IssueTable
        issues={sortedFiltered}
        projectNames={projectNames}
        siteLabels={siteLabels}
        ownerNames={ownerNames}
        customerNames={customerNames}
        sort={sort}
        onSortChange={setSort}
        onEditIssue={(issue) => {
          setEditingIssue(issue)
          setFormOpen(true)
        }}
      />

      <IssueForm
        open={formOpen}
        issue={editingIssue}
        comments={editingIssueComments}
        projects={projects}
        sites={sites}
        owners={owners}
        customers={customers}
        projectOwnerLinks={projectOwnerLinks}
        projectCustomerLinks={projectCustomerLinks}
        onClose={() => {
          setFormOpen(false)
          setEditingIssue(undefined)
        }}
        onSave={async (values: IssueFormValues) => {
          const issuePayload = {
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
          }

          if (editingIssue?.id) {
            const actorName = resolveCommentActor(values.commentActorKey)
            if (values.updateComment.trim() && !actorName) {
              throw new Error('Please select a valid comment actor from this project.')
            }
            const result = await repository.updateIssueWithOptionalComment(
              editingIssue.id,
              issuePayload,
              values.updateComment,
              values.updateCommentDate,
              actorName,
            )
            await repository.createOverdueNotifications()
            return result
          } else {
            await repository.createIssue(issuePayload)
            await repository.createOverdueNotifications()
            return { commentAdded: false }
          }
        }}
        onUpdateComment={async (commentId, body, date, actorKey) => {
          const actorName = resolveCommentActor(actorKey)
          if (!actorName) {
            throw new Error('Please select a valid comment actor from this project.')
          }
          await repository.updateComment(commentId, { body, createdAt: `${date}T00:00:00` }, actorName)
        }}
      />
    </div>
  )
}
