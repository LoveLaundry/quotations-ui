import { RiErrorWarningLine } from 'react-icons/ri'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 p-10 text-center smooth-appear">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200">
        <RiErrorWarningLine className="h-7 w-7" />
      </div>
      <p className="text-[16px] font-semibold text-red-900">{title}</p>
      <p className="mt-2 text-[14px] text-red-700/80 max-w-md leading-relaxed">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-[13px] font-medium text-red-700 hover:bg-red-50"
        >
          Try again
        </button>
      )}
    </div>
  )
}
