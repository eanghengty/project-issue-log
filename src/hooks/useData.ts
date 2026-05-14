import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useProjects() {
  return (
    useLiveQuery(() => db.projects.orderBy('name').toArray(), [], []) ?? []
  )
}

export function useSites() {
  return useLiveQuery(() => db.sites.orderBy('siteName').toArray(), [], []) ?? []
}

export function useOwners() {
  return useLiveQuery(() => db.owners.orderBy('name').toArray(), [], []) ?? []
}

export function useCustomers() {
  return useLiveQuery(() => db.customers.orderBy('name').toArray(), [], []) ?? []
}

export function useProjectOwnerLinks() {
  return useLiveQuery(() => db.projectOwnerLinks.toArray(), [], []) ?? []
}

export function useProjectCustomerLinks() {
  return useLiveQuery(() => db.projectCustomerLinks.toArray(), [], []) ?? []
}

export function useIssues() {
  return useLiveQuery(() => db.issues.orderBy('updatedAt').reverse().toArray(), [], []) ?? []
}

export function useIssue(id: number | undefined) {
  return useLiveQuery(() => (id ? db.issues.get(id) : undefined), [id])
}

export function useComments(issueId: number | undefined) {
  return (
    useLiveQuery(
      () => (issueId ? db.comments.where('issueId').equals(issueId).sortBy('createdAt') : []),
      [issueId],
      [],
    ) ?? []
  )
}

export function useActivities(issueId: number | undefined) {
  return (
    useLiveQuery(
      () => (issueId ? db.activities.where('issueId').equals(issueId).reverse().sortBy('createdAt') : []),
      [issueId],
      [],
    ) ?? []
  )
}

export function useAttachments(issueId: number | undefined) {
  return (
    useLiveQuery(
      () => (issueId ? db.attachments.where('issueId').equals(issueId).reverse().sortBy('createdAt') : []),
      [issueId],
      [],
    ) ?? []
  )
}

export function useNotifications() {
  return useLiveQuery(() => db.notifications.orderBy('createdAt').reverse().toArray(), [], []) ?? []
}
