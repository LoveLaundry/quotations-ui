import { cn } from '../../lib/utils'

const CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PAID: { label: 'Paid', cls: 'bg-[emerald-50] text-[emerald-600] border-[emerald-200]', dot: '#16A34A' },
  PARTIALLY_PAID: { label: 'Partial', cls: 'bg-[amber-50] text-[amber-600] border-[amber-200]', dot: '#F59E0B' },
  PENDING: { label: 'Pending', cls: 'bg-[var(--red-50)] text-[var(--red-600)] border-[var(--red-100)]', dot: '#DC2626' },
  ISSUED: { label: 'Issued', cls: 'bg-[orange-50] text-[orange-700] border-[orange-200]', dot: '#F97316' },
  DRAFT: { label: 'Draft', cls: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]', dot: '#9CA3AF' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]', dot: '#6B7280' },
}

/**
 * Standardized payment-status indicator so paid / partially-paid / unpaid
 * bills are identifiable at a glance everywhere (list, detail, reports).
 */
export function BillStatusBadge({
  status,
  showDot = true,
  className,
}: {
  status?: string | null
  showDot?: boolean
  className?: string
}) {
  if (!status) return null
  const cfg = CONFIG[status] ?? { label: status, cls: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]', dot: '#9CA3AF' }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        cfg.cls,
        className,
      )}
    >
      {showDot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: cfg.dot }}
        />
      )}
      {cfg.label}
    </span>
  )
}

export const BILL_PAYMENT_STATUSES = ['PAID', 'PARTIALLY_PAID', 'PENDING', 'ISSUED', 'DRAFT', 'CANCELLED'] as const

export const BILL_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const
