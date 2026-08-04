interface ErrorStateProps {
  title?: string
  description?: string
}

export function ErrorState({ title = 'Something went wrong', description = 'Please try again in a moment.' }: ErrorStateProps) {
  return (
    <div className="rounded-[28px] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,245,247,0.95),rgba(255,255,255,0.95))] p-6 text-center text-sm text-rose-700 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2">{description}</p>
    </div>
  )
}
