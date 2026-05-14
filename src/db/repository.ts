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
  Project,
} from '../types/models'

interface CreateIssueInput {
  projectId: number
  title: string
  description: string
  status: Issue['status']
  priority: Issue['priority']
  category?: string
  ownerId: number
  customerId: number
  dueDate?: string
}

const nowIso = () => new Date().toISOString()

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

export const repository = {
  async createProject(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = nowIso()
    return db.projects.add({ ...input, createdAt: timestamp, updatedAt: timestamp })
  },

  async updateProject(id: number, changes: Partial<Project>) {
    return db.projects.update(id, { ...changes, updatedAt: nowIso() })
  },

  async createOwner(input: Omit<Owner, 'id' | 'createdAt'>) {
    return db.owners.add({ ...input, createdAt: nowIso() })
  },

  async updateOwner(id: number, changes: Partial<Owner>) {
    return db.owners.update(id, changes)
  },

  async createCustomer(input: Omit<Customer, 'id' | 'createdAt'>) {
    return db.customers.add({ ...input, createdAt: nowIso() })
  },

  async updateCustomer(id: number, changes: Partial<Customer>) {
    return db.customers.update(id, changes)
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
      await db.owners.clear()
      await db.customers.clear()
      await db.issues.clear()
      await db.comments.clear()
      await db.activities.clear()
      await db.attachments.clear()
      await db.notifications.clear()
    })
  },

  async bulkImport(data: {
    projects: Project[]
    owners: Owner[]
    customers: Customer[]
    issues: Issue[]
    comments: Comment[]
    activities: ActivityEntry[]
    attachments: Attachment[]
    notifications: Notification[]
  }) {
    await repository.clearAll()

    return db.transaction('rw', db.tables, async () => {
      await db.projects.bulkAdd(data.projects)
      await db.owners.bulkAdd(data.owners)
      await db.customers.bulkAdd(data.customers)
      await db.issues.bulkAdd(data.issues)
      await db.comments.bulkAdd(data.comments)
      await db.activities.bulkAdd(data.activities)
      await db.attachments.bulkAdd(data.attachments)
      await db.notifications.bulkAdd(data.notifications)
    })
  },
}
