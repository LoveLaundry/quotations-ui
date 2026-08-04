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
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 p-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <RiErrorWarningLine className="h-5 w-5" />
      </div>
      <h3 className="text-card-title text-red-800">{title}</h3>
      <p className="mt-2 text-body text-red-600">{description}</p>
    </div>
  )
}