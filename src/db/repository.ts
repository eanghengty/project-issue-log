import { endOfDay, isBefore, parseISO } from 'date-fns'
import { db } from './database'
import type {
  ActivityEntry,
  Attachment,
  Comment,
  Customer,
  Issue,
  Notification,
  Owner,
  ProjectCustomerLink,
  ProjectOwnerLink,
  Project,
  Site,
} from '../types/models'

interface CreateSiteInput {
  siteId: string
  siteName: string
  projectId: number
}

interface CreateIssueInput {
  projectId: number
  siteRefId?: number
  title: string
  description: string
  status: Issue['status']
  priority: Issue['priority']
  category?: string
  ownerId: number
  customerId: number
  dueDate?: string
}

interface UpdateIssueWithOptionalCommentResult {
  commentAdded: boolean
}

const nowIso = () => new Date().toISOString()
const normalizeCommentDateToIso = (dateInput?: string) => {
  const trimmed = dateInput?.trim()
  if (!trimmed) {
    return nowIso()
  }

  const parsed = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid comment date.')
  }
  return parsed.toISOString()
}

const projectCode = (name: string) => {
  const letters = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3)
  return letters || 'PRJ'
}

const normalizeValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  return String(value)
}

const normalizeSiteCode = (value: string) => value.trim()

async function assertUniqueSiteId(siteId: string, excludeId?: number) {
  const normalized = normalizeSiteCode(siteId).toLowerCase()
  const sites = await db.sites.toArray()
  const duplicate = sites.find(
    (site) => site.id !== excludeId && normalizeSiteCode(site.siteId).toLowerCase() === normalized,
  )

  if (duplicate) {
    throw new Error(`Site ID "${siteId}" already exists.`)
  }
}

const addActivity = async (entry: Omit<ActivityEntry, 'id' | 'createdAt'>) => {
  return db.activities.add({
    ...entry,
    createdAt: nowIso(),
  })
}

const addNotification = async (entry: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
  return db.notifications.add({
    ...entry,
    read: false,
    createdAt: nowIso(),
  })
}

async function nextIssueNumber(projectId: number): Promise<string> {
  const project = await db.projects.get(projectId)
  const code = projectCode(project?.name ?? 'PRJ')
  const issues = await db.issues.where('projectId').equals(projectId).toArray()
  const maxSequence = issues.reduce((max, issue) => {
    const part = Number(issue.issueNumber.split('-').at(-1) ?? 0)
    return Number.isFinite(part) ? Math.max(max, part) : max
  }, 0)

  return `${code}-${maxSequence + 1}`
}

async function applyIssueUpdate(id: number, changes: Partial<Issue>, actor: string) {
  const previous = await db.issues.get(id)
  if (!previous) {
    throw new Error('Issue not found')
  }

  const nextStatus = changes.status ?? previous.status
  const updatedAt = nowIso()
  const patch: Partial<Issue> = {
    ...changes,
    updatedAt,
  }

  if ((nextStatus === 'Resolved' || nextStatus === 'Closed') && !previous.resolvedAt) {
    patch.resolvedAt = updatedAt
  }

  if (nextStatus !== 'Resolved' && nextStatus !== 'Closed') {
    patch.resolvedAt = undefined
  }

  await db.issues.update(id, patch)

  const compareFields = Object.keys(changes) as (keyof Issue)[]
  for (const field of compareFields) {
    const oldValue = normalizeValue(previous[field])
    const newValue = normalizeValue(changes[field])
    if (oldValue === newValue) {
      continue
    }

    await addActivity({
      issueId: id,
      type: field === 'status' ? 'status' : 'update',
      field,
      oldValue,
      newValue,
      actor,
    })

    if (field === 'status') {
      await addNotification({
        type: 'status',
        issueId: id,
        message: `${previous.issueNumber} changed status to ${newValue}`,
      })
    }
  }
}

export const repository = {
  async createProject(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = nowIso()
    return db.projects.add({ ...input, createdAt: timestamp, updatedAt: timestamp })
  },

  async updateProject(id: number, changes: Partial<Project>) {
    return db.projects.update(id, { ...changes, updatedAt: nowIso() })
  },

  async createSite(input: CreateSiteInput) {
    const siteId = normalizeSiteCode(input.siteId)
    if (!siteId) {
      throw new Error('Site ID is required.')
    }
    if (!input.siteName.trim()) {
      throw new Error('Site name is required.')
    }

    await assertUniqueSiteId(siteId)
    const timestamp = nowIso()
    return db.sites.add({
      siteId,
      siteName: input.siteName.trim(),
      projectId: input.projectId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  },

  async updateSite(id: number, changes: Partial<Site>) {
    const existing = await db.sites.get(id)
    if (!existing) {
      throw new Error('Site not found')
    }

    const nextSiteId = changes.siteId ? normalizeSiteCode(changes.siteId) : existing.siteId
    if (!nextSiteId) {
      throw new Error('Site ID is required.')
    }

    const nextSiteName = changes.siteName?.trim() ?? existing.siteName
    if (!nextSiteName) {
      throw new Error('Site name is required.')
    }

    await assertUniqueSiteId(nextSiteId, id)
    return db.sites.update(id, {
      ...changes,
      siteId: nextSiteId,
      siteName: nextSiteName,
      updatedAt: nowIso(),
    })
  },

  async deleteSite(id: number) {
    const usageCount = await db.issues.where('siteRefId').equals(id).count()
    if (usageCount > 0) {
      throw new Error('Cannot delete site because it is linked to existing issues.')
    }

    return db.sites.delete(id)
  },

  async createOwner(input: Omit<Owner, 'id' | 'createdAt'>) {
    return db.owners.add({ ...input, createdAt: nowIso() })
  },

  async updateOwner(id: number, changes: Partial<Owner>) {
    return db.owners.update(id, changes)
  },

  async deleteOwner(id: number) {
    return db.transaction('rw', db.owners, db.projectOwnerLinks, db.issues, async () => {
      await db.projectOwnerLinks.where('ownerId').equals(id).delete()
      await db.issues.where('ownerId').equals(id).modify({ ownerId: 0, updatedAt: nowIso() })
      return db.owners.delete(id)
    })
  },

  async createCustomer(input: Omit<Customer, 'id' | 'createdAt'>) {
    return db.customers.add({ ...input, createdAt: nowIso() })
  },

  async updateCustomer(id: number, changes: Partial<Customer>) {
    return db.customers.update(id, changes)
  },

  async deleteCustomer(id: number) {
    return db.transaction('rw', db.customers, db.projectCustomerLinks, db.issues, async () => {
      await db.projectCustomerLinks.where('customerId').equals(id).delete()
      await db.issues.where('customerId').equals(id).modify({ customerId: 0, updatedAt: nowIso() })
      return db.customers.delete(id)
    })
  },

  async getOwnerProjectIds(ownerId: number) {
    const links = await db.projectOwnerLinks.where('ownerId').equals(ownerId).toArray()
    return links.map((link) => link.projectId)
  },

  async getCustomerProjectIds(customerId: number) {
    const links = await db.projectCustomerLinks.where('customerId').equals(customerId).toArray()
    return links.map((link) => link.projectId)
  },

  async getOwnerIdsForProject(projectId: number) {
    const links = await db.projectOwnerLinks.where('projectId').equals(projectId).toArray()
    return links.map((link) => link.ownerId)
  },

  async getCustomerIdsForProject(projectId: number) {
    const links = await db.projectCustomerLinks.where('projectId').equals(projectId).toArray()
    return links.map((link) => link.customerId)
  },

  async setOwnerProjectLinks(ownerId: number, projectIds: number[]) {
    return db.transaction('rw', db.projectOwnerLinks, async () => {
      const uniqueIds = Array.from(new Set(projectIds))
      await db.projectOwnerLinks.where('ownerId').equals(ownerId).delete()
      if (!uniqueIds.length) {
        return
      }

      const links: ProjectOwnerLink[] = uniqueIds.map((projectId) => ({
        ownerId,
        projectId,
      }))
      await db.projectOwnerLinks.bulkAdd(links)
    })
  },

  async setCustomerProjectLinks(customerId: number, projectIds: number[]) {
    return db.transaction('rw', db.projectCustomerLinks, async () => {
      const uniqueIds = Array.from(new Set(projectIds))
      await db.projectCustomerLinks.where('customerId').equals(customerId).delete()
      if (!uniqueIds.length) {
        return
      }

      const links: ProjectCustomerLink[] = uniqueIds.map((projectId) => ({
        customerId,
        projectId,
      }))
      await db.projectCustomerLinks.bulkAdd(links)
    })
  },

  async setProjectOwnerLinks(projectId: number, ownerIds: number[]) {
    return db.transaction('rw', db.projectOwnerLinks, async () => {
      const uniqueIds = Array.from(new Set(ownerIds))
      await db.projectOwnerLinks.where('projectId').equals(projectId).delete()
      if (!uniqueIds.length) {
        return
      }

      const links: ProjectOwnerLink[] = uniqueIds.map((ownerId) => ({
        projectId,
        ownerId,
      }))
      await db.projectOwnerLinks.bulkAdd(links)
    })
  },

  async setProjectCustomerLinks(projectId: number, customerIds: number[]) {
    return db.transaction('rw', db.projectCustomerLinks, async () => {
      const uniqueIds = Array.from(new Set(customerIds))
      await db.projectCustomerLinks.where('projectId').equals(projectId).delete()
      if (!uniqueIds.length) {
        return
      }

      const links: ProjectCustomerLink[] = uniqueIds.map((customerId) => ({
        projectId,
        customerId,
      }))
      await db.projectCustomerLinks.bulkAdd(links)
    })
  },

  async createIssue(input: CreateIssueInput, actor = 'System') {
    return db.transaction(
      'rw',
      db.issues,
      db.activities,
      db.notifications,
      db.projects,
      async () => {
        const timestamp = nowIso()
        const issueNumber = await nextIssueNumber(input.projectId)
        const id = await db.issues.add({
          ...input,
          issueNumber,
          createdAt: timestamp,
          updatedAt: timestamp,
          resolvedAt: input.status === 'Resolved' || input.status === 'Closed' ? timestamp : undefined,
        })

        await addActivity({
          issueId: id,
          type: 'create',
          field: 'issue',
          oldValue: '',
          newValue: `Created ${issueNumber}`,
          actor,
        })

        await addNotification({
          type: 'issue',
          issueId: id,
          message: `New issue ${issueNumber}: ${input.title}`,
        })

        return id
      },
    )
  },

  async updateIssue(id: number, changes: Partial<Issue>, actor = 'System') {
    return db.transaction('rw', db.issues, db.activities, db.notifications, async () => {
      await applyIssueUpdate(id, changes, actor)
    })
  },

  async deleteIssue(id: number) {
    return db.transaction('rw', [db.issues, db.comments, db.attachments, db.activities, db.notifications], async () => {
      const issue = await db.issues.get(id)
      if (!issue) {
        throw new Error('Issue not found.')
      }

      await db.comments.where('issueId').equals(id).delete()
      await db.attachments.where('issueId').equals(id).delete()
      await db.activities.where('issueId').equals(id).delete()
      await db.notifications.where('issueId').equals(id).delete()
      await db.issues.delete(id)
    })
  },

  async updateIssueWithOptionalComment(
    id: number,
    changes: Partial<Issue>,
    commentBody?: string,
    commentDate?: string,
    actor = 'System User',
  ): Promise<UpdateIssueWithOptionalCommentResult> {
    return db.transaction('rw', db.issues, db.comments, db.activities, db.notifications, async () => {
      await applyIssueUpdate(id, changes, actor)

      const trimmedComment = commentBody?.trim()
      if (!trimmedComment) {
        return { commentAdded: false }
      }

      const commentAuthor = actor.trim() || 'System User'
      const issue = await db.issues.get(id)
      await db.comments.add({
        issueId: id,
        author: commentAuthor,
        body: trimmedComment,
        createdAt: normalizeCommentDateToIso(commentDate),
      })

      await addActivity({
        issueId: id,
        type: 'comment',
        field: 'comment',
        oldValue: '',
        newValue: trimmedComment,
        actor: commentAuthor,
      })

      await addNotification({
        type: 'comment',
        issueId: id,
        message: `New comment on ${issue?.issueNumber ?? `Issue #${id}`}`,
      })

      return { commentAdded: true }
    })
  },

  async updateComment(commentId: number, changes: { body: string; createdAt: string }, actor: string) {
    const trimmedBody = changes.body.trim()
    if (!trimmedBody) {
      throw new Error('Comment body is required.')
    }

    const parsedDate = new Date(changes.createdAt)
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error('Invalid comment date.')
    }

    return db.transaction('rw', db.comments, db.activities, async () => {
      const comment = await db.comments.get(commentId)
      if (!comment) {
        throw new Error('Comment not found.')
      }

      await db.comments.update(commentId, {
        body: trimmedBody,
        createdAt: parsedDate.toISOString(),
      })

      await addActivity({
        issueId: comment.issueId,
        type: 'comment',
        field: 'comment',
        oldValue: '',
        newValue: 'Edited comment content/date',
        actor,
      })
    })
  },

  async addComment(issueId: number, body: string, author: string) {
    return db.transaction('rw', db.comments, db.activities, db.notifications, db.issues, async () => {
      const issue = await db.issues.get(issueId)
      const id = await db.comments.add({
        issueId,
        author,
        body,
        createdAt: nowIso(),
      })

      await addActivity({
        issueId,
        type: 'comment',
        field: 'comment',
        oldValue: '',
        newValue: body,
        actor: author,
      })

      await addNotification({
        type: 'comment',
        issueId,
        message: `New comment on ${issue?.issueNumber ?? `Issue #${issueId}`}`,
      })

      return id
    })
  },

  async addAttachment(issueId: number, file: File, actor: string) {
    return db.transaction(
      'rw',
      db.attachments,
      db.activities,
      db.notifications,
      db.issues,
      async () => {
        const issue = await db.issues.get(issueId)
        const id = await db.attachments.add({
          issueId,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          blob: file,
          createdAt: nowIso(),
        })

        await addActivity({
          issueId,
          type: 'attachment',
          field: 'attachment',
          oldValue: '',
          newValue: file.name,
          actor,
        })

        await addNotification({
          type: 'system',
          issueId,
          message: `Attachment added to ${issue?.issueNumber ?? `Issue #${issueId}`}: ${file.name}`,
        })

        return id
      },
    )
  },

  async deleteAttachment(id: number) {
    return db.attachments.delete(id)
  },

  async markNotificationRead(id: number) {
    return db.notifications.update(id, { read: true })
  },

  async markAllNotificationsRead() {
    return db.notifications.filter((notification) => !notification.read).modify({ read: true })
  },

  async createOverdueNotifications() {
    const now = new Date()
    const openStatuses: Issue['status'][] = ['Open', 'In Progress', 'Blocked']
    const issues = await db.issues.where('status').anyOf(openStatuses).toArray()

    for (const issue of issues) {
      if (!issue.dueDate || !isBefore(parseISO(issue.dueDate), endOfDay(now))) {
        continue
      }

      const existing = await db.notifications
        .where('[type+issueId]')
        .equals(['overdue', issue.id as number])
        .last()

      if (existing) {
        continue
      }

      await addNotification({
        type: 'overdue',
        issueId: issue.id,
        message: `${issue.issueNumber} is overdue`,
      })
    }
  },

  async clearAll() {
    return db.transaction('rw', db.tables, async () => {
      await db.projects.clear()
      await db.sites.clear()
      await db.owners.clear()
      await db.customers.clear()
      await db.projectOwnerLinks.clear()
      await db.projectCustomerLinks.clear()
      await db.issues.clear()
      await db.comments.clear()
      await db.activities.clear()
      await db.attachments.clear()
      await db.notifications.clear()
    })
  },

  async bulkImport(data: {
    projects: Project[]
    sites: Site[]
    owners: Owner[]
    customers: Customer[]
    projectOwnerLinks: ProjectOwnerLink[]
    projectCustomerLinks: ProjectCustomerLink[]
    issues: Issue[]
    comments: Comment[]
    activities: ActivityEntry[]
    attachments: Attachment[]
    notifications: Notification[]
  }) {
    await repository.clearAll()

    return db.transaction('rw', db.tables, async () => {
      await db.projects.bulkAdd(data.projects)
      await db.sites.bulkAdd(data.sites)
      await db.owners.bulkAdd(data.owners)
      await db.customers.bulkAdd(data.customers)
      await db.projectOwnerLinks.bulkAdd(data.projectOwnerLinks)
      await db.projectCustomerLinks.bulkAdd(data.projectCustomerLinks)
      await db.issues.bulkAdd(data.issues)
      await db.comments.bulkAdd(data.comments)
      await db.activities.bulkAdd(data.activities)
      await db.attachments.bulkAdd(data.attachments)
      await db.notifications.bulkAdd(data.notifications)
    })
  },
}
