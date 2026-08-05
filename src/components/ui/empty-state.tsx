import { RiInboxLine } from 'react-icons/ri'

interface EmptyStateProps { title: string; description: string; action?: React.ReactNode }

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#FAFAFA] p-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#9CA3AF] border border-[#E4E7EC]">
        <RiInboxLine className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-semibold text-[#374151]">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] text-[#98A2B3] leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
