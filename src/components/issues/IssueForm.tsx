import { useEffect, useMemo, useState } from 'react'
import type {
  Customer,
  Issue,
  IssuePriority,
  IssueStatus,
  Owner,
  Project,
  Site,
} from '../../types/models'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

const statuses: IssueStatus[] = ['Open', 'In Progress', 'Blocked', 'Resolved', 'Closed']
const priorities: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical']

interface IssueFormValues {
  projectId: number
  siteRefId?: number
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  category: string
  ownerId: number
  customerId: number
  dueDate: string
  updateComment: string
}

interface IssueFormProps {
  open: boolean
  issue?: Issue
  projects: Project[]
  sites: Site[]
  owners: Owner[]
  customers: Customer[]
  onClose: () => void
  onSave: (values: IssueFormValues) => Promise<void>
}

const emptyValues: IssueFormValues = {
  projectId: 0,
  siteRefId: undefined,
  title: '',
  description: '',
  status: 'Open',
  priority: 'Medium',
  category: '',
  ownerId: 0,
  customerId: 0,
  dueDate: '',
  updateComment: '',
}

const siteOptionLabel = (site: Site) => `${site.siteId} - ${site.siteName}`

function resolveSiteSelection(input: string, projectSites: Site[]) {
  const trimmed = input.trim()
  if (!trimmed) {
    return undefined
  }

  const matched =
    projectSites.find((site) => siteOptionLabel(site).toLowerCase() === trimmed.toLowerCase()) ??
    projectSites.find((site) => site.siteId.toLowerCase() === trimmed.toLowerCase()) ??
    projectSites.find((site) => site.siteName.toLowerCase() === trimmed.toLowerCase())

  return matched?.id
}

export function IssueForm({ open, issue, projects, sites, owners, customers, onClose, onSave }: IssueFormProps) {
  const [values, setValues] = useState<IssueFormValues>(emptyValues)
  const [saving, setSaving] = useState(false)
  const [siteInput, setSiteInput] = useState('')

  const currentProjectSites = useMemo(
    () => sites.filter((site) => site.projectId === values.projectId),
    [sites, values.projectId],
  )

  useEffect(() => {
    if (issue) {
      const selectedSite = sites.find((site) => site.id === issue.siteRefId)
      setValues({
        projectId: issue.projectId,
        siteRefId: issue.siteRefId,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        category: issue.category ?? '',
        ownerId: issue.ownerId,
        customerId: issue.customerId,
        dueDate: issue.dueDate ? issue.dueDate.slice(0, 10) : '',
        updateComment: '',
      })
      setSiteInput(selectedSite ? siteOptionLabel(selectedSite) : '')
      return
    }

    setValues((prev) => ({
      ...emptyValues,
      projectId: projects[0]?.id ?? 0,
      ownerId: owners[0]?.id ?? 0,
      customerId: customers[0]?.id ?? 0,
      status: prev.status,
      priority: prev.priority,
    }))
    setSiteInput('')
  }, [issue, projects, owners, customers, sites, open])

  useEffect(() => {
    if (!values.siteRefId) {
      return
    }

    const stillValid = currentProjectSites.some((site) => site.id === values.siteRefId)
    if (!stillValid) {
      setValues((prev) => ({ ...prev, siteRefId: undefined }))
      setSiteInput('')
    }
  }, [currentProjectSites, values.siteRefId])

  const canSubmit =
    values.projectId > 0 && values.ownerId > 0 && values.customerId > 0 && values.title.trim().length > 2

  return (
    <Modal open={open} title={issue ? `Edit ${issue.issueNumber}` : 'Add Issue'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!canSubmit) {
            return
          }
          setSaving(true)
          try {
            await onSave(values)
            onClose()
          } finally {
            setSaving(false)
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-600">
            Project
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.projectId}
              onChange={(event) => {
                const nextProjectId = Number(event.target.value)
                const currentSite = sites.find((site) => site.id === values.siteRefId)
                const nextSiteRefId =
                  currentSite && currentSite.projectId === nextProjectId ? currentSite.id : undefined

                setValues((prev) => ({ ...prev, projectId: nextProjectId, siteRefId: nextSiteRefId }))
                setSiteInput(nextSiteRefId && currentSite ? siteOptionLabel(currentSite) : '')
              }}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Site (autocomplete)
            <input
              list="site-options"
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              placeholder="Type site ID or name"
              value={siteInput}
              onChange={(event) => {
                const nextInput = event.target.value
                setSiteInput(nextInput)
                setValues((prev) => ({
                  ...prev,
                  siteRefId: resolveSiteSelection(nextInput, currentProjectSites),
                }))
              }}
            />
            <datalist id="site-options">
              {currentProjectSites.map((site) => (
                <option key={site.id} value={siteOptionLabel(site)} />
              ))}
            </datalist>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Category
            <input
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.category}
              onChange={(event) => setValues((prev) => ({ ...prev, category: event.target.value }))}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
            Title
            <input
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.title}
              onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
            Description
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={values.description}
              onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Status
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.status}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, status: event.target.value as IssueStatus }))
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Priority
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.priority}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, priority: event.target.value as IssuePriority }))
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Owner
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.ownerId}
              onChange={(event) => setValues((prev) => ({ ...prev, ownerId: Number(event.target.value) }))}
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Customer
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.customerId}
              onChange={(event) => setValues((prev) => ({ ...prev, customerId: Number(event.target.value) }))}
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company} - {customer.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            Due Date
            <input
              type="date"
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
              value={values.dueDate}
              onChange={(event) => setValues((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
          </label>

          {issue ? (
            <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
              Update Comment (optional)
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Add a comment about this update"
                value={values.updateComment}
                onChange={(event) => setValues((prev) => ({ ...prev, updateComment: event.target.value }))}
              />
            </label>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || saving}>
            {saving ? 'Saving...' : 'Save Issue'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export type { IssueFormValues }
