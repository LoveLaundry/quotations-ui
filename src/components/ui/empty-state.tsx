import { RiInboxLine } from 'react-icons/ri'

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-slate-50/50 p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <RiInboxLine className="h-6 w-6" />
      </div>
      <h3 className="text-card-title text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-body text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}