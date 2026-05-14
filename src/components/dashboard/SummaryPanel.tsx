import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, XAxis, YAxis, Bar, CartesianGrid } from 'recharts'
import type { DashboardMetrics, IssuePriority, IssueStatus } from '../../types/models'
import { MetricCard } from './MetricCard'

const statusColors = ['#2e63d5', '#d9873a', '#d05f4a', '#2f8a5f', '#718197']

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid var(--border-soft)',
  background: 'var(--surface-primary)',
  boxShadow: 'var(--shadow-soft)',
}

interface SummaryPanelProps {
  metrics: DashboardMetrics
  statusData: Array<{ name: string; value: number }>
  priorityData: Array<{ name: string; value: number }>
  projectData: Array<{ id: number; name: string; value: number }>
  createdTodayCounts: {
    total: number
    open: number
    inProgress: number
    overdue: number
    resolvedThisWeek: number
  }
  activeSummaryFilter: {
    status?: IssueStatus
    priority?: IssuePriority
    projectId?: number
    special?: 'overdue' | 'resolvedThisWeek'
  }
  onTotalSelect: () => void
  onStatusSelect: (status: IssueStatus) => void
  onPrioritySelect: (priority: IssuePriority) => void
  onProjectSelect: (projectId: number) => void
  onSpecialSelect: (special: 'overdue' | 'resolvedThisWeek') => void
}

export function SummaryPanel({
  metrics,
  statusData,
  priorityData,
  projectData,
  createdTodayCounts,
  activeSummaryFilter,
  onTotalSelect,
  onStatusSelect,
  onPrioritySelect,
  onProjectSelect,
  onSpecialSelect,
}: SummaryPanelProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Issues"
          value={metrics.total}
          detail="All records across active projects"
          badgeCount={createdTodayCounts.total}
          badgeTone="neutral"
          active={
            !activeSummaryFilter.status &&
            !activeSummaryFilter.priority &&
            !activeSummaryFilter.projectId &&
            !activeSummaryFilter.special
          }
          onClick={onTotalSelect}
        />
        <MetricCard
          label="Open"
          value={metrics.open}
          detail="Awaiting first resolution actions"
          badgeCount={createdTodayCounts.open}
          badgeTone="neutral"
          active={activeSummaryFilter.status === 'Open'}
          onClick={() => onStatusSelect('Open')}
        />
        <MetricCard
          label="In Progress"
          value={metrics.inProgress}
          detail="Currently assigned and in-flight"
          badgeCount={createdTodayCounts.inProgress}
          badgeTone="neutral"
          active={activeSummaryFilter.status === 'In Progress'}
          onClick={() => onStatusSelect('In Progress')}
        />
        <MetricCard
          label="Overdue"
          value={metrics.overdue}
          tone="danger"
          detail="Past due and not resolved"
          badgeCount={createdTodayCounts.overdue}
          badgeTone="danger"
          active={activeSummaryFilter.special === 'overdue'}
          onClick={() => onSpecialSelect('overdue')}
        />
        <MetricCard
          label="Resolved This Week"
          value={metrics.resolvedThisWeek}
          tone="positive"
          detail="Closed since the start of the week"
          badgeCount={createdTodayCounts.resolvedThisWeek}
          badgeTone="neutral"
          active={activeSummaryFilter.special === 'resolvedThisWeek'}
          onClick={() => onSpecialSelect('resolvedThisWeek')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-strong)]">Issues by Status</h3>
          <p className="mb-3 text-xs text-[var(--text-muted)]">Distribution across current workflow states.</p>
          <div className="h-56 min-h-[14rem] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                  onClick={(entry: { name?: string }) => {
                    if (!entry.name) {
                      return
                    }
                    onStatusSelect(entry.name as IssueStatus)
                  }}
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-strong)]">Issues by Priority</h3>
          <p className="mb-3 text-xs text-[var(--text-muted)]">Helps prioritize triage and delivery planning.</p>
          <div className="h-56 min-h-[14rem] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  fontSize={12}
                  tick={{ fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="value"
                  fill="#256747"
                  radius={[5, 5, 0, 0]}
                  onClick={(entry: { payload?: { name?: string } }) => {
                    if (!entry.payload?.name) {
                      return
                    }
                    onPrioritySelect(entry.payload.name as IssuePriority)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-strong)]">Issues by Project</h3>
          <p className="mb-3 text-xs text-[var(--text-muted)]">Relative load for each project portfolio.</p>
          <div className="h-56 min-h-[14rem] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  fontSize={12}
                  tick={{ fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="value"
                  fill="#2e63d5"
                  radius={[5, 5, 0, 0]}
                  onClick={(entry: { payload?: { id?: number } }) => {
                    if (!entry.payload?.id) {
                      return
                    }
                    onProjectSelect(entry.payload.id)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
