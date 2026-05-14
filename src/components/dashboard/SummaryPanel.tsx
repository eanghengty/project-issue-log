import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, XAxis, YAxis, Bar, CartesianGrid } from 'recharts'
import type { DashboardMetrics } from '../../types/models'
import { MetricCard } from './MetricCard'

const statusColors = ['#0EA5E9', '#F59E0B', '#EF4444', '#22C55E', '#64748B']

interface SummaryPanelProps {
  metrics: DashboardMetrics
  statusData: Array<{ name: string; value: number }>
  priorityData: Array<{ name: string; value: number }>
  projectData: Array<{ name: string; value: number }>
}

export function SummaryPanel({ metrics, statusData, priorityData, projectData }: SummaryPanelProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Open" value={metrics.open} />
        <MetricCard label="In Progress" value={metrics.inProgress} />
        <MetricCard label="Overdue" value={metrics.overdue} tone="danger" />
        <MetricCard label="Resolved This Week" value={metrics.resolvedThisWeek} tone="positive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Issues by Status</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80}>
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Issues by Priority</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Issues by Project</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#9333EA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
