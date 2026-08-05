import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'success' | 'warning'
}

const variants = {
  default:   'border-red-200   bg-red-50    text-red-700',
  secondary: 'border-slate-200 bg-slate-100 text-slate-600',
  success:   'border-emerald-100 bg-emerald-50 text-emerald-700',
  warning:   'border-amber-100  bg-amber-50  text-amber-700',
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
