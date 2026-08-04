import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'success' | 'warning'
}

const variants = {
  default: 'border-brand-100 bg-brand-50 text-brand-700',
  secondary: 'border-slate-200 bg-slate-50 text-slate-600',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
