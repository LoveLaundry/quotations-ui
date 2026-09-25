import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Check, ChevronDown, Layers } from 'lucide-react'
import { useHotel } from '../../context/HotelContext'

export function HotelSelector() {
    const { hotels, selectedHotel, setSelectedHotel, showAllHotels } = useHotel()
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

    const label = selectedHotel || (showAllHotels ? 'All Hotels' : 'Select Hotel')

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                title="Hotel talk: your records are scoped to the selected hotel"
                className="flex h-9 max-w-[240px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text-muted)] transition-colors duration-100 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-2)]"
            >
                <Building2 size={15} className="shrink-0 text-emerald-50" />
                <span className="hidden lg:inline text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                    Hotel
                </span>
                <span className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                    {label}
                </span>
                <ChevronDown size={13} className="shrink-0" />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -6 }}
                            transition={{ duration: 0.14 }}
                            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_40px_-4px_rgba(16,24,40,0.18)]"
                        >
                            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                                    Hotel scope
                                </p>
                                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                                    {hotels.length} hotel{hotels.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {showAllHotels && (
                                <button
                                    type="button"
                                    onClick={() => { setSelectedHotel(''); setOpen(false) }}
                                    className="flex w-full cursor-pointer items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-left text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-[var(--surface-hover)]"
                                >
                                    <Layers size={15} />
                                    All Hotels
                                    <Check size={15} className="ml-auto" />
                                </button>
                            )}

                            <div className="max-h-64 overflow-y-auto p-1.5">
                                {hotels.length === 0 && (
                                    <p className="px-3 py-6 text-center text-[12px] text-[var(--text-faint)]">
                                        No hotels found yet
                                    </p>
                                )}
                                {hotels.map(hotel => (
                                    <button
                                        key={hotel}
                                        type="button"
                                        onClick={() => { setSelectedHotel(hotel); setOpen(false) }}
                                        title={hotel}
                                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                                            selectedHotel === hotel
                                                ? 'bg-[var(--surface-2)] text-[var(--text-primary)]'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                        }`}
                                    >
                                        <Building2 size={14} className="shrink-0 text-[var(--text-faint)]" />
                                        <span className="truncate">{hotel}</span>
                                        {selectedHotel === hotel && (
                                            <Check size={14} className="ml-auto shrink-0 text-emerald-50" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}