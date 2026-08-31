import { AlertTriangle } from 'lucide-react'
import { Button } from './button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmClass = variant === 'danger'
    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
    : 'bg-[#D97706] hover:bg-[#B45309] text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-lg p-6 max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-[#FEE2E2]' : 'bg-[#FEF3C7]'}`}>
            <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-[#DC2626]' : 'text-[#D97706]'}`} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button size="sm" className={confirmClass} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
