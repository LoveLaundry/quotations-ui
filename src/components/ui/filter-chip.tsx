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
        'inline-flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-[20px] font-bold transition-all duration-200 cursor-pointer shadow-xs',
        active
          ? 'border-red-600 bg-red-600 text-white shadow-md shadow-red-600/20'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            'rounded-xl px-2.5 py-0.5 text-[16px] font-bold',
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
