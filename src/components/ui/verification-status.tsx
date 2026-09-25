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
    className: 'bg-[emerald-50] text-[emerald-600] border-[emerald-200]',
  },
  SYNCING: {
    label: 'Syncing',
    icon: '⏳',
    className: 'bg-[blue-50] text-[blue-600] border-[blue-200]',
  },
  PENDING: {
    label: 'Pending',
    icon: '⏳',
    className: 'bg-[amber-50] text-[amber-600] border-[amber-200]',
  },
  FAILED: {
    label: 'Sync Failed',
    icon: '⚠',
    className: 'bg-[var(--red-50)] text-[var(--red-600)] border-[var(--red-100)]',
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