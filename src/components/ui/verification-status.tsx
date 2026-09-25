import { cn } from '../../lib/utils'

export type VerificationStatusValue = 'VERIFIED' | 'SYNCING' | 'PENDING' | 'FAILED'

interface VerificationStatusProps {
  status?: VerificationStatusValue | string
  className?: string
  showLabel?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; className: string }> = {
  VERIFIED: {
    label: 'Verified',
    icon: '✓',
    className: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  },
  SYNCING: {
    label: 'Syncing',
    icon: '⏳',
    className: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  },
  PENDING: {
    label: 'Pending',
    icon: '⏳',
    className: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  },
  FAILED: {
    label: 'Sync Failed',
    icon: '⚠',
    className: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
  },
}

export function VerificationStatus({ status, className, showLabel = true }: VerificationStatusProps) {
  const key = (status || 'PENDING').toUpperCase()
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.PENDING

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        config.className,
        className
      )}
      title={`${config.label} — Main/Secondary sync state`}
    >
      <span aria-hidden>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}