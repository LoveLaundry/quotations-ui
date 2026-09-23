import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface RowAction {
    label: string
    icon?: ReactNode
    onClick?: () => void
    danger?: boolean
}

export function RowActionsMenu({ actions, size = 16 }: { actions: RowAction[]; size?: number }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onDown = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    return (
        <div ref={ref} className="relative" onClick={event => event.stopPropagation()}>
            <button
                type="button"
                aria-label="More actions"
                onClick={event => {
                    event.stopPropagation()
                    setOpen(value => !value)
                }}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-transparent text-[#98A2B3] transition hover:border-[#E4E7EC] hover:bg-[#F9FAFB] hover:text-[#475467]"
            >
                <MoreVertical size={size} />
            </button>
            {open && (
                <div className="absolute right-0 top-9 z-30 min-w-[168px] overflow-hidden rounded-xl border border-[#E4E7EC] bg-white p-1 shadow-lg">
                    {actions.map(action => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={event => {
                                event.stopPropagation()
                                setOpen(false)
                                action.onClick?.()
                            }}
                            className={cn(
                                'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition',
                                action.danger
                                    ? 'text-[#DC2626] hover:bg-red-50'
                                    : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#101828]',
                            )}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}