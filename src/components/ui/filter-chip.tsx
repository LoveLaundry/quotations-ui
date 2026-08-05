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
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5',
        'text-[12px] font-medium transition-all duration-100 cursor-pointer',
        active
          ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-[0_1px_3px_rgba(220,38,38,0.25)]'
          : 'bg-white border-[#E4E7EC] text-[#374151] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]',
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          'rounded px-1.5 py-0.5 text-[10px] font-semibold',
          active ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#6B7280]',
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
