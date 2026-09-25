import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'default' | 'secondary'
}

const variantMap: Record<string, string> = {
  default: 'border-[var(--red-100)] bg-[var(--red-50)] text-[var(--red-600)]',
  secondary: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  danger: 'border-red-100 bg-red-50 text-red-700',
  info: 'border-blue-100 bg-blue-50 text-blue-700',
  neutral: 'border-gray-200 bg-gray-100 text-gray-600',
  purple: 'border-purple-100 bg-purple-50 text-purple-700',
}

export function Badge({ children, className, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5',
      'text-[11px] font-semibold tracking-wide',
      variantMap[variant],
      className,
    )}>
      {children}
    </span>
  )
}
