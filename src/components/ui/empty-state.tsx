import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-slate-50/50 p-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Inbox className="h-9 w-9" strokeWidth={1.5} />
      </div>
      <h3 className="text-card-title text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-body text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
