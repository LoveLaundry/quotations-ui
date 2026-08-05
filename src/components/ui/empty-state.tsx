import { RiInboxLine } from 'react-icons/ri'

interface EmptyStateProps { title: string; description: string; action?: React.ReactNode }

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAFA] p-12 text-center smooth-appear">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] border border-[#D1D5DB]">
        <RiInboxLine className="h-7 w-7 text-[#9CA3AF]" />
      </div>
      <p className="text-[16px] font-semibold text-[#374151]">{title}</p>
      <p className="mt-2 max-w-sm text-[14px] text-[#6B7280] leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
