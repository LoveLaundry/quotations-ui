import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'animate-pulse rounded-lg',
      'bg-gradient-to-r from-[#F3F4F6] via-[#E5E7EB] to-[#F3F4F6]',
      'bg-[length:200%_100%]',
      className,
    )} />
  )
}
