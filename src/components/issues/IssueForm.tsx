import { useEffect, useState } from 'react'
import type { Customer, Issue, IssuePriority, IssueStatus, Owner, Project } from '../../types/models'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

const statuses: IssueStatus[] = ['Open', 'In Progress', 'Blocked', 'Resolved', 'Closed']
const priorities: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical']

interface IssueFormValues {
  projectId: number
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  category: string
  ownerId: number
  customerId: number
  dueDate: string
}

interface IssueFormProps {
  open: boolean
  issue?: Issue
  projects: Project[]
  owners: Owner[]
  customers: Customer[]
  onClose: () => void
  onSave: (values: IssueFormValues) => Promise<void>
}

const emptyValues: IssueFormValues = {
  projectId: 0,
  title: '',
  description: '',
  status: 'Open',
  priority: 'Medium',
  category: '',
  ownerId: 0,
  customerId: 0,
  dueDate: '',
}

export function IssueForm({ open, issue, projects, owners, customers, onClose, onSave }: IssueFormProps) {
  const [values, setValues] = useState<IssueFormValues>(emptyValues)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (issue) {
      setValues({
        projectId: issue.projectId,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        category: issue.category ?? '',
        ownerId: issue.ownerId,
        customerId: issue.customerId,
        dueDate: issue.dueDate ? issue.dueDate.slice(0, 10) : '',
      })
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
  }, [issue, projects, owners, customers, open])

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
              onChange={(event) => setValues((prev) => ({ ...prev, projectId: Number(event.target.value) }))}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
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
