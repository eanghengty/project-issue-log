import Dexie, { type Table } from 'dexie'
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

export class IssueLogDatabase extends Dexie {
  projects!: Table<Project, number>
  owners!: Table<Owner, number>
  customers!: Table<Customer, number>
  issues!: Table<Issue, number>
  comments!: Table<Comment, number>
  activities!: Table<ActivityEntry, number>
  attachments!: Table<Attachment, number>
  notifications!: Table<Notification, number>

  constructor() {
    super('issue-log-tracker-db')

    this.version(1).stores({
      projects: '++id, name, status, createdAt',
      owners: '++id, name, email, createdAt',
      customers: '++id, name, company, createdAt',
      issues:
        '++id, projectId, issueNumber, status, priority, ownerId, customerId, dueDate, createdAt, updatedAt',
      comments: '++id, issueId, createdAt',
      activities: '++id, issueId, type, field, createdAt',
      attachments: '++id, issueId, createdAt',
      notifications: '++id, read, type, issueId, createdAt, [type+issueId]',
    })
  }
}

export const db = new IssueLogDatabase()
