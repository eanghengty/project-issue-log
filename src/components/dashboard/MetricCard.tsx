interface MetricCardProps {
  label: string
  value: number
  tone?: 'neutral' | 'positive' | 'danger'
  detail?: string
  badgeCount?: number
  badgeTone?: 'neutral' | 'danger'
  active?: boolean
  onClick?: () => void
}

const toneMap: Record<NonNullable<MetricCardProps['tone']>, { value: string; chip: string }> = {
  neutral: {
    value: 'text-[var(--text-strong)]',
    chip: 'bg-[#eaf1fe] text-[#1f4ba5]',
  },
  positive: {
    value: 'text-[#256747]',
    chip: 'bg-[#e7f6ee] text-[#256747]',
  },
  danger: {
    value: 'text-[#b33a2a]',
    chip: 'bg-[#fde7e4] text-[#b33a2a]',
  },
}

export function MetricCard({
  label,
  value,
  tone = 'neutral',
  detail,
  badgeCount = 0,
  badgeTone = 'neutral',
  active = false,
  onClick,
}: MetricCardProps) {
  const badgeClass =
    badgeTone === 'danger'
      ? 'bg-[#fde7e4] text-[#b33a2a]'
      : 'bg-[#1f2a3a] text-white'

  return (
    <button
      type="button"
      className={[
        'w-full rounded-xl border bg-[var(--surface-primary)] p-4 text-left shadow-[var(--shadow-soft)] transition',
        onClick ? 'cursor-pointer hover:border-[var(--border-strong)]' : 'cursor-default',
        active ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]' : 'border-[var(--border-soft)]',
      ].join(' ')}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">{label}</p>
        {badgeCount > 0 ? (
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badgeClass}`}>
            +{badgeCount}
          </span>
        ) : (
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneMap[tone].chip}`}>
            Live
          </span>
        )}
      </div>
      <p className={`mt-3 text-3xl font-semibold leading-none ${toneMap[tone].value}`}>{value}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{detail ?? 'Updated from active issue dataset'}</p>
    </button>
  )
}
