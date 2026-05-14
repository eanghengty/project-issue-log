interface MetricCardProps {
  label: string
  value: number
  tone?: 'neutral' | 'positive' | 'danger'
}

const toneMap: Record<NonNullable<MetricCardProps['tone']>, string> = {
  neutral: 'text-slate-800',
  positive: 'text-emerald-700',
  danger: 'text-red-700',
}

export function MetricCard({ label, value, tone = 'neutral' }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneMap[tone]}`}>{value}</p>
    </div>
  )
}
