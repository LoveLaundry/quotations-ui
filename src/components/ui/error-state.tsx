import { RiErrorWarningLine } from 'react-icons/ri'

interface ErrorStateProps { title?: string; description?: string }

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-[#FFF8F8] p-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100">
        <RiErrorWarningLine className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-semibold text-[#7F1D1D]">{title}</p>
      <p className="mt-1 text-[13px] text-[#DC2626]/70">{description}</p>
    </div>
  )
}
