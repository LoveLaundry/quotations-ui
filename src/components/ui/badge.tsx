import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-stone-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm', className)}>
      {children}
    </span>
  )
}
