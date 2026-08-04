import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-[28px] border border-rose-100/80 bg-white/80 p-6 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/75', className)} {...props} />
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('mb-4 flex items-center justify-between', className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('space-y-4', className)} {...props} />
}
