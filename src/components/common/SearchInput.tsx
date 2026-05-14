import { Search } from 'lucide-react'
import clsx from 'clsx'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search...', hint, className }: SearchInputProps) {
  return (
    <div className={clsx('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3 top-2.5 text-[var(--text-faint)]" size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] pl-9 pr-14 text-sm text-[var(--text-default)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
      {hint ? (
        <span className="pointer-events-none absolute right-2 top-2 inline-flex h-6 items-center rounded-md border border-[var(--border-soft)] bg-[var(--surface-sunken)] px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          {hint}
        </span>
      ) : null}
    </div>
  )
}
