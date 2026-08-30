import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl',
        'bg-gradient-to-r from-[var(--skeleton-from)] via-[var(--skeleton-via)] to-[var(--skeleton-to)]',
        'bg-[length:200%_100%]',
        'shadow-sm',
        'animate-shimmer',
        className,
      )}
    />
  )
}
