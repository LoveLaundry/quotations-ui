import { RiInboxLine } from 'react-icons/ri'

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <RiInboxLine className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
