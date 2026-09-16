import { cn } from '../../lib/utils'

interface FilterBarProps {
  children: React.ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn(
      'flex flex-wrap items-end gap-3',
      className,
    )}>
      {children}
    </div>
  )
}
