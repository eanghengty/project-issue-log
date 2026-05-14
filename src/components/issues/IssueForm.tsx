import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import type {
  Comment,
  Customer,
  Issue,
  IssuePriority,
  IssueStatus,
  Owner,
  ProjectCustomerLink,
  ProjectOwnerLink,
  Project,
  Site,
} from '../../types/models'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { ConfirmDialog } from '../common/ConfirmDialog'

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
  updateCommentDate: string
  commentActorKey: string
}

interface IssueFormSaveResult {
  commentAdded: boolean
}

interface IssueFormProps {
  open: boolean
  issue?: Issue
  comments?: Comment[]
  projects: Project[]
  sites: Site[]
  owners: Owner[]
  customers: Customer[]
  projectOwnerLinks: ProjectOwnerLink[]
  projectCustomerLinks: ProjectCustomerLink[]
  onClose: () => void
  onSave: (values: IssueFormValues) => Promise<IssueFormSaveResult>
  onUpdateComment?: (commentId: number, body: string, date: string, actorKey: string) => Promise<void>
  onDeleteIssue?: (issue: Issue) => Promise<void>
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
  updateCommentDate: '',
  commentActorKey: '',
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

export function IssueForm({
  open,
  issue,
  comments = [],
  projects,
  sites,
  owners,
  customers,
  projectOwnerLinks,
  projectCustomerLinks,
  onClose,
  onSave,
  onUpdateComment,
  onDeleteIssue,
}: IssueFormProps) {
  const [values, setValues] = useState<IssueFormValues>(emptyValues)
  const [saving, setSaving] = useState(false)
  const [siteInput, setSiteInput] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')
  const [editingCommentDate, setEditingCommentDate] = useState('')
  const [editingCommentActorKey, setEditingCommentActorKey] = useState('')
  const [editingCommentError, setEditingCommentError] = useState<string | null>(null)
  const [savingCommentEdit, setSavingCommentEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const currentProjectSites = useMemo(
    () => sites.filter((site) => site.projectId === values.projectId),
    [sites, values.projectId],
  )
  const linkedOwnerIds = useMemo(
    () =>
      projectOwnerLinks
        .filter((link) => link.projectId === values.projectId)
        .map((link) => link.ownerId),
    [projectOwnerLinks, values.projectId],
  )
  const linkedCustomerIds = useMemo(
    () =>
      projectCustomerLinks
        .filter((link) => link.projectId === values.projectId)
        .map((link) => link.customerId),
    [projectCustomerLinks, values.projectId],
  )
  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => linkedOwnerIds.includes(owner.id as number))
  }, [linkedOwnerIds, owners])
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => linkedCustomerIds.includes(customer.id as number))
  }, [linkedCustomerIds, customers])

  const commentActorOptions = useMemo(
    () => ({
      owners: filteredOwners.map((owner) => ({ key: `owner:${owner.id}`, label: owner.name })),
      customers: filteredCustomers.map((customer) => ({
        key: `customer:${customer.id}`,
        label: `${customer.company} - ${customer.name}`,
      })),
    }),
    [filteredCustomers, filteredOwners],
  )
  const orderedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (timeDiff !== 0) {
        return timeDiff
      }
      return (a.id ?? 0) - (b.id ?? 0)
    })
  }, [comments])

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
        updateCommentDate: '',
        commentActorKey: '',
      })
      setSiteInput(selectedSite ? siteOptionLabel(selectedSite) : '')
      setSubmitError(null)
      setSubmitSuccess(null)
      return
    }

    setValues((prev) => ({
      ...emptyValues,
      projectId: projects[0]?.id ?? 0,
      ownerId: owners[0]?.id ?? 0,
      customerId: customers[0]?.id ?? 0,
      status: prev.status,
      priority: prev.priority,
      commentActorKey: '',
    }))
    setSiteInput('')
    setSubmitError(null)
    setSubmitSuccess(null)
    setEditingCommentId(null)
    setEditingCommentBody('')
    setEditingCommentDate('')
    setEditingCommentActorKey('')
    setEditingCommentError(null)
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

  useEffect(() => {
    if (!filteredOwners.some((owner) => owner.id === values.ownerId)) {
      setValues((prev) => ({ ...prev, ownerId: filteredOwners[0]?.id ?? 0 }))
    }
  }, [filteredOwners, values.ownerId])

  useEffect(() => {
    if (!filteredCustomers.some((customer) => customer.id === values.customerId)) {
      setValues((prev) => ({ ...prev, customerId: filteredCustomers[0]?.id ?? 0 }))
    }
  }, [filteredCustomers, values.customerId])

  useEffect(() => {
    const validActorKeys = new Set([
      ...commentActorOptions.owners.map((actor) => actor.key),
      ...commentActorOptions.customers.map((actor) => actor.key),
    ])
    if (values.commentActorKey && !validActorKeys.has(values.commentActorKey)) {
      setValues((prev) => ({ ...prev, commentActorKey: '' }))
    }
  }, [commentActorOptions, values.commentActorKey])

  const requiresCommentActor = Boolean(issue && values.updateComment.trim())
  const requiresCommentDate = Boolean(issue && values.updateComment.trim())
  const titleTooShort = values.title.trim().length <= 2
  const missingProject = values.projectId <= 0
  const missingOwner = values.ownerId <= 0
  const missingCustomer = values.customerId <= 0
  const missingCommentActor = requiresCommentActor && !values.commentActorKey
  const missingCommentDate = requiresCommentDate && !values.updateCommentDate
  const canSubmit =
    !missingProject &&
    !missingOwner &&
    !missingCustomer &&
    !titleTooShort &&
    !missingCommentActor &&
    !missingCommentDate

  const validationMessages: string[] = []
  if (missingProject) {
    validationMessages.push('Select a project.')
  }
  if (titleTooShort) {
    validationMessages.push('Title must be at least 3 characters.')
  }
  if (missingOwner || missingCustomer) {
    validationMessages.push('Select both an owner and a customer linked to this project.')
  }
  if (missingCommentActor) {
    validationMessages.push('Select a comment actor when adding an update comment.')
  }
  if (missingCommentDate) {
    validationMessages.push('Select a comment date when adding an update comment.')
  }

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
          setSubmitError(null)
          setSubmitSuccess(null)
          try {
            const result = await onSave(values)
            if (issue) {
              setValues((prev) => ({ ...prev, updateComment: '', updateCommentDate: '', commentActorKey: '' }))
              if (result.commentAdded) {
                setSubmitSuccess('Issue updated. Comment saved successfully.')
              } else {
                setSubmitSuccess('Issue updated.')
              }
              return
            }
            onClose()
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Unable to save issue.')
          } finally {
            setSaving(false)
          }
        }}
      >
        <div className="space-y-4">
          <section className="space-y-3 rounded-lg border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-slate-900">Context</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-600">
                Project <span className="text-red-600">*</span>
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
                Site
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

              <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
                Category
                <input
                  className="h-10 w-full rounded-lg border border-slate-200 px-3"
                  value={values.category}
                  onChange={(event) => setValues((prev) => ({ ...prev, category: event.target.value }))}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-slate-900">Issue Details</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
                Title <span className="text-red-600">*</span>
                <input
                  className="h-10 w-full rounded-lg border border-slate-200 px-3"
                  value={values.title}
                  onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                {titleTooShort ? (
                  <p className="text-xs text-red-600">Title must be at least 3 characters.</p>
                ) : null}
              </label>

              <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
                Description
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={values.description}
                  onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-slate-900">Assignment</h3>
            <div className="grid gap-3 md:grid-cols-2">
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
                Owner <span className="text-red-600">*</span>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 px-3"
                  value={values.ownerId}
                  onChange={(event) => setValues((prev) => ({ ...prev, ownerId: Number(event.target.value) }))}
                >
                  <option value={0}>Select owner</option>
                  {filteredOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm text-slate-600">
                Customer <span className="text-red-600">*</span>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 px-3"
                  value={values.customerId}
                  onChange={(event) => setValues((prev) => ({ ...prev, customerId: Number(event.target.value) }))}
                >
                  <option value={0}>Select customer</option>
                  {filteredCustomers.map((customer) => (
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
          </section>

          {issue ? (
            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/40 p-3">
              <h3 className="text-sm font-semibold text-slate-900">Update Comment</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
                  Comment (optional)
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                    placeholder="Add a comment about this update"
                    value={values.updateComment}
                    onChange={(event) => setValues((prev) => ({ ...prev, updateComment: event.target.value }))}
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Comment Date{requiresCommentDate ? <span className="text-red-600"> *</span> : null}
                  <input
                    type="date"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
                    value={values.updateCommentDate}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, updateCommentDate: event.target.value }))
                    }
                  />
                  {missingCommentDate ? (
                    <p className="text-xs text-red-600">Comment date is required when adding a comment.</p>
                  ) : null}
                </label>
                <label className="space-y-1 text-sm text-slate-600 md:col-span-2">
                  Comment Actor{requiresCommentActor ? <span className="text-red-600"> *</span> : null}
                  <select
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3"
                    value={values.commentActorKey}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, commentActorKey: event.target.value }))
                    }
                  >
                    <option value="">Select owner or customer</option>
                    <optgroup label="Owners">
                      {commentActorOptions.owners.map((actor) => (
                        <option key={actor.key} value={actor.key}>
                          {actor.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Customers">
                      {commentActorOptions.customers.map((actor) => (
                        <option key={actor.key} value={actor.key}>
                          {actor.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {requiresCommentActor ? (
                    <p className="text-xs text-slate-500">
                      Choose the project-linked owner or customer for this comment.
                    </p>
                  ) : null}
                  {missingCommentActor ? (
                    <p className="text-xs text-red-600">Comment actor is required when adding a comment.</p>
                  ) : null}
                </label>
              </div>
            </section>
          ) : null}
          {issue ? (
            <section className="space-y-3 rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900">Comment History</h3>
              {orderedComments.length === 0 ? (
                <p className="text-sm text-slate-500">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {orderedComments.map((comment) => (
                    <article key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{comment.author}</span>
                        <span>{format(new Date(comment.createdAt), 'dd MMM yyyy')}</span>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editingCommentBody}
                            onChange={(event) => setEditingCommentBody(event.target.value)}
                          />
                          <div className="grid gap-2 md:grid-cols-2">
                            <input
                              type="date"
                              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                              value={editingCommentDate}
                              onChange={(event) => setEditingCommentDate(event.target.value)}
                            />
                            <select
                              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                              value={editingCommentActorKey}
                              onChange={(event) => setEditingCommentActorKey(event.target.value)}
                            >
                              <option value="">Select edit actor</option>
                              <optgroup label="Owners">
                                {commentActorOptions.owners.map((actor) => (
                                  <option key={actor.key} value={actor.key}>
                                    {actor.label}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Customers">
                                {commentActorOptions.customers.map((actor) => (
                                  <option key={actor.key} value={actor.key}>
                                    {actor.label}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          {editingCommentError ? (
                            <p className="text-xs text-red-600">{editingCommentError}</p>
                          ) : null}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              disabled={savingCommentEdit}
                              onClick={async () => {
                                if (!onUpdateComment || !comment.id) {
                                  return
                                }
                                if (!editingCommentBody.trim()) {
                                  setEditingCommentError('Comment content is required.')
                                  return
                                }
                                if (!editingCommentDate) {
                                  setEditingCommentError('Comment date is required.')
                                  return
                                }
                                if (!editingCommentActorKey) {
                                  setEditingCommentError('Please select an edit actor.')
                                  return
                                }
                                setSavingCommentEdit(true)
                                setEditingCommentError(null)
                                try {
                                  await onUpdateComment(
                                    comment.id,
                                    editingCommentBody.trim(),
                                    editingCommentDate,
                                    editingCommentActorKey,
                                  )
                                  setEditingCommentId(null)
                                  setEditingCommentBody('')
                                  setEditingCommentDate('')
                                  setEditingCommentActorKey('')
                                } catch (error) {
                                  setEditingCommentError(
                                    error instanceof Error ? error.message : 'Unable to update comment.',
                                  )
                                } finally {
                                  setSavingCommentEdit(false)
                                }
                              }}
                            >
                              {savingCommentEdit ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentBody('')
                                setEditingCommentDate('')
                                setEditingCommentActorKey('')
                                setEditingCommentError(null)
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-slate-700">{comment.body}</p>
                          <button
                            type="button"
                            className="mt-2 text-xs text-slate-600 hover:text-slate-900"
                            onClick={() => {
                              setEditingCommentId(comment.id ?? null)
                              setEditingCommentBody(comment.body)
                              setEditingCommentDate(comment.createdAt.slice(0, 10))
                              setEditingCommentActorKey('')
                              setEditingCommentError(null)
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
        {!linkedOwnerIds.length || !linkedCustomerIds.length ? (
          <p className="text-xs text-slate-500">
            This project needs linked owners/customers in Projects before issue assignments can be completed.
          </p>
        ) : null}
        {validationMessages.length ? (
          <p className="text-sm text-red-600">{validationMessages[0]}</p>
        ) : null}
        {submitSuccess ? <p className="text-sm text-emerald-700">{submitSuccess}</p> : null}
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-slate-200 bg-white pt-4">
          <div>
            {issue && onDeleteIssue ? (
              <Button
                type="button"
                variant="danger"
                disabled={deleting || saving}
                onClick={() => {
                  setDeleteDialogOpen(true)
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Issue'}
              </Button>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || saving || deleting}>
            {saving ? 'Saving...' : issue ? 'Save Changes' : 'Create Issue'}
          </Button>
          </div>
        </div>
      </form>
      {issue && onDeleteIssue ? (
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Issue"
          description={`Delete issue "${issue.issueNumber} - ${issue.title}"? This will also remove comments, attachments, activity logs, and notifications.`}
          confirmLabel="Delete Issue"
          confirmPending={deleting}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={async () => {
            setSubmitError(null)
            setSubmitSuccess(null)
            setDeleting(true)
            try {
              await onDeleteIssue(issue)
              setDeleteDialogOpen(false)
            } catch (error) {
              setSubmitError(error instanceof Error ? error.message : 'Unable to delete issue.')
            } finally {
              setDeleting(false)
            }
          }}
        />
      ) : null}
    </Modal>
  )
}

export type { IssueFormSaveResult, IssueFormValues }
