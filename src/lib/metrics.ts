import { isAfter, isBefore, parseISO, startOfWeek } from 'date-fns'
import type { DashboardMetrics, Issue } from '../types/models'

export function computeDashboardMetrics(issues: Issue[]): DashboardMetrics {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  return {
    total: issues.length,
    open: issues.filter((issue) => issue.status === 'Open').length,
    inProgress: issues.filter((issue) => issue.status === 'In Progress').length,
    overdue: issues.filter((issue) => {
      if (!issue.dueDate || issue.status === 'Resolved' || issue.status === 'Closed') {
        return false
      }
      return isBefore(parseISO(issue.dueDate), now)
    }).length,
    resolvedThisWeek: issues.filter((issue) => {
      if (!issue.resolvedAt) {
        return false
      }
      return isAfter(parseISO(issue.resolvedAt), weekStart)
    }).length,
  }
}

export function countByStatus(issues: Issue[]) {
  const map = new Map<string, number>()
  for (const issue of issues) {
    map.set(issue.status, (map.get(issue.status) ?? 0) + 1)
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }))
}

export function countByPriority(issues: Issue[]) {
  const order: Issue['priority'][] = ['Low', 'Medium', 'High', 'Critical']
  const map = new Map<Issue['priority'], number>(order.map((item) => [item, 0]))
  for (const issue of issues) {
    map.set(issue.priority, (map.get(issue.priority) ?? 0) + 1)
  }

  return order.map((priority) => ({ name: priority, value: map.get(priority) ?? 0 }))
}

export function countByProject(issues: Issue[], projectNames: Record<number, string>) {
  const map = new Map<number, number>()
  for (const issue of issues) {
    map.set(issue.projectId, (map.get(issue.projectId) ?? 0) + 1)
  }

  return [...map.entries()].map(([id, value]) => ({
    id,
    name: projectNames[id] ?? `Project ${id}`,
    value,
  }))
}
