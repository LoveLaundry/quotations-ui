import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-8 py-14 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-faint)]">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] text-[var(--text-muted)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
