import { RiErrorWarningLine } from 'react-icons/ri'

interface ErrorStateProps {
  title?: string
  description?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/40 p-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
        <RiErrorWarningLine className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-semibold text-red-800">{title}</p>
      <p className="mt-1 text-[13px] text-red-500">{description}</p>
    </div>
  )
}
