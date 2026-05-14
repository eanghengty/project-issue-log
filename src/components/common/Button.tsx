import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'border border-[#1f2a3a] bg-[#1f2a3a] text-white hover:bg-[#172130] hover:border-[#172130]',
  secondary:
    'border border-[var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-default)] hover:bg-[var(--surface-hover)]',
  ghost: 'border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-strong)]',
  danger: 'border border-[#b9381a] bg-[#b9381a] text-white hover:bg-[#9f2f14] hover:border-[#9f2f14]',
}

export function Button({
  children,
  className,
  variant = 'primary',
  fullWidth,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
