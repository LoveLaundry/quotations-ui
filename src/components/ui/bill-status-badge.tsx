import { cn } from '../../lib/utils'

const CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PAID: { label: 'Paid', cls: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]', dot: '#16A34A' },
  PARTIALLY_PAID: { label: 'Partial', cls: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]', dot: '#F59E0B' },
  PENDING: { label: 'Pending', cls: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]', dot: '#DC2626' },
  ISSUED: { label: 'Issued', cls: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]', dot: '#F97316' },
  DRAFT: { label: 'Draft', cls: 'bg-[#F9FAFB] text-[#374151] border-[#E5E7EB]', dot: '#9CA3AF' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]', dot: '#6B7280' },
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
  const cfg = CONFIG[status] ?? { label: status, cls: 'bg-[#F9FAFB] text-[#374151] border-[#E4E7EC]', dot: '#9CA3AF' }
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
