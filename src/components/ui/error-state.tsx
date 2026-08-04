interface ErrorStateProps {
  title?: string
  description?: string
}

export function ErrorState({ title = 'Something went wrong', description = 'Please try again in a moment.' }: ErrorStateProps) {
  return (
    <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2">{description}</p>
    </div>
  )
}
