import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'success' | 'warning'
}

const v = {
  default:   'border-[var(--red-100)] bg-[var(--red-50)] text-[var(--red-600)]',
  secondary: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]',
  success:   'border-emerald-100 bg-emerald-50 text-emerald-700',
  warning:   'border-amber-100  bg-amber-50  text-amber-700',
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5',
      'text-[11px] font-medium tracking-wide',
      v[variant],
      className,
    )}>
      {children}
    </span>
  )
}
