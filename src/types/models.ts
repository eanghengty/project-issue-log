export type ProjectStatus = 'active' | 'archived'

export type IssueStatus =
  | 'Open'
  | 'In Progress'
  | 'Blocked'
  | 'Resolved'
  | 'Closed'

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Project {
  id?: number
  name: string
  description?: string
  status: ProjectStatus
  color: string
  createdAt: string
  updatedAt: string
}

export interface Site {
  id?: number
  siteId: string
  siteName: string
  projectId: number
  createdAt: string
  updatedAt: string
}

export interface Owner {
  id?: number
  name: string
  email: string
  title?: string
  createdAt: string
}

export interface Customer {
  id?: number
  name: string
  company: string
  email?: string
  phone?: string
  createdAt: string
}

export interface Issue {
  id?: number
  projectId: number
  siteRefId?: number
  issueNumber: string
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  category?: string
  ownerId: number
  customerId: number
  dueDate?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface Comment {
  id?: number
  issueId: number
  author: string
  body: string
  createdAt: string
}

export interface ActivityEntry {
  id?: number
  issueId: number
  type: 'create' | 'update' | 'comment' | 'attachment' | 'status'
  field: string
  oldValue?: string
  newValue?: string
  actor: string
  createdAt: string
}

export interface Attachment {
  id?: number
  issueId: number
  fileName: string
  mimeType: string
  size: number
  blob: Blob
  createdAt: string
}

export interface Notification {
  id?: number
  type: 'issue' | 'status' | 'comment' | 'overdue' | 'system'
  message: string
  issueId?: number
  read: boolean
  createdAt: string
}

export interface IssueFilters {
  search: string
  projectId?: number
  ownerId?: number
  customerId?: number
  status?: IssueStatus
  priority?: IssuePriority
}

export interface SortConfig {
  field: keyof Issue | 'project' | 'owner' | 'customer' | 'site'
  direction: 'asc' | 'desc'
}

export interface DashboardMetrics {
  total: number
  open: number
  inProgress: number
  overdue: number
  resolvedThisWeek: number
}
