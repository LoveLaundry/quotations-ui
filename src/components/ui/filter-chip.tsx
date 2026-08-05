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
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium',
        'transition-all duration-150 cursor-pointer',
        active
          ? 'border-red-500 bg-red-600 text-white shadow-[0_1px_3px_rgba(220,38,38,0.30)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-semibold',
            active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
