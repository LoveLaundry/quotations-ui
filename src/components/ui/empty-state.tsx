import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-stone-300/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,247,249,0.85))] p-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <div className="mb-4 rounded-full bg-rose-100 p-3 text-rose-600 shadow-sm">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600">{description}</p>
    </div>
  )
}
