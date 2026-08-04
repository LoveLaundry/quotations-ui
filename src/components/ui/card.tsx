import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-[28px] border border-stone-200/80 bg-[rgba(255,255,255,0.9)] p-5 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-800 dark:bg-[rgba(15,23,42,0.9)]', className)} {...props} />
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('mb-5 flex items-center justify-between gap-3', className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('space-y-4', className)} {...props} />
}
