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
        'text-[12px] font-medium transition-colors duration-100 cursor-pointer',
        active
          ? 'bg-[var(--red-600)] border-[var(--red-600)] text-white shadow-[0_1px_3px_rgba(220,38,38,0.25)]'
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-2)] hover:bg-[var(--surface-2)]',
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          'rounded px-1.5 py-0.5 text-[10px] font-semibold',
          active ? 'bg-[var(--surface)]/20 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]',
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
