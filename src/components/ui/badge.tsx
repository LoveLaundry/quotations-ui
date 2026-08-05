import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'success' | 'warning'
}

const v = {
  default:   'border-[#FECACA] bg-[#FFF1F1] text-[#DC2626]',
  secondary: 'border-[#E4E7EC] bg-[#F9FAFB] text-[#374151]',
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
