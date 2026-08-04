import { cn } from '../../lib/utils'

interface FilterChipProps {
  label: string
  active?: boolean
  count?: number
  onClick?: () => void
}

export function FilterChip({ label, active, count, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-body font-medium transition-all duration-200',
        active
          ? 'border-brand-200 bg-brand-50 text-brand-700'
          : 'border-surface-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-sm',
            active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
