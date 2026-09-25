import { Eye, ArrowUpRight, Pencil, Printer, Trash2 } from 'lucide-react'

interface EntityCardActionsProps {
    onQuickView?: () => void
    onOpen?: () => void
    onEdit?: () => void
    onDelete?: () => void
    onPrint?: () => void
}

const iconBtn =
    'flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-faint)] transition cursor-pointer hover:bg-[var(--surface-2)]'

/**
 * Consistent row-action grammar across gate passes, deliveries and bills:
 *  - Eye       → Quick View (popup, never navigates)
 *  - Arrow ↗   → Open full page
 *  - Pencil    → Edit
 *  - Printer   → Print
 *  - Trash     → Delete (with confirmation handled by the caller)
 * Only the actions the caller wires up are rendered.
 */
export function EntityCardActions({ onQuickView, onOpen, onEdit, onDelete, onPrint }: EntityCardActionsProps) {
    if (!onQuickView && !onOpen && !onEdit && !onDelete && !onPrint) return null
    return (
        <div className="flex items-center justify-end gap-0.5" onClick={e => e.stopPropagation()}>
            {onQuickView && (
                <button type="button" title="Quick view" aria-label="Quick view" onClick={onQuickView} className={`${iconBtn} hover:text-[blue-600]`}>
                    <Eye size={14} />
                </button>
            )}
            {onOpen && (
                <button type="button" title="Open full page" aria-label="Open full page" onClick={onOpen} className={`${iconBtn} hover:text-[blue-600]`}>
                    <ArrowUpRight size={14} />
                </button>
            )}
            {onEdit && (
                <button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className={`${iconBtn} hover:text-[blue-600]`}>
                    <Pencil size={14} />
                </button>
            )}
            {onPrint && (
                <button type="button" title="Print" aria-label="Print" onClick={onPrint} className={`${iconBtn} hover:text-[blue-600]`}>
                    <Printer size={14} />
                </button>
            )}
            {onDelete && (
                <button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className={`${iconBtn} hover:bg-red-50 hover:text-[var(--red-600)]`}>
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    )
}