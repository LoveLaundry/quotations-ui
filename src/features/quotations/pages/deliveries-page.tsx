import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Truck, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useDeliveries } from '../hooks/useDeliveries'
import type { Delivery } from '../../../types/operations'

function DeliveryCard({ d }: { d: Delivery }) {
    const totalPieces = d.items.reduce((s, i) => s + i.quantity, 0)
    return (
        <Link to={`/deliveries/${d.id}`}>
            <Card hover className="cursor-pointer p-4 h-full group">
                <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] group-hover:bg-[#DCFCE7] transition-colors">
                        <Truck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#101828] truncate">{d.client_name}</p>
                        <p className="text-[11px] text-[#98A2B3] mt-0.5 truncate">
                            GP: <span className="font-mono">{d.gate_pass_id.slice(-8)}</span>
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 text-[11px] font-semibold text-[#16A34A] whitespace-nowrap">
                        {totalPieces} pcs
                    </span>
                </div>

                <div className="flex items-center justify-between border-t border-[#F2F4F7] pt-3 text-[12px] text-[#6B7280]">
                    <span>{d.items.length} item type{d.items.length !== 1 ? 's' : ''}</span>
                    <span>{formatDate(d.delivery_date)}</span>
                </div>
            </Card>
        </Link>
    )
}

export default function DeliveriesPage() {
    const [searchInput, setSearchInput] = useState('')
    const [clientName, setClientName] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setClientName(searchInput.trim()), 350)
        return () => clearTimeout(t)
    }, [searchInput])

    const { data: deliveries = [], isLoading, isError, error } = useDeliveries({
        client_name: clientName || undefined,
    })

    return (
        <div className="space-y-5 pb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Deliveries' }]} />
                    <h1 className="text-dashboard-title mt-1">Deliveries</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        {isLoading ? 'Loading…' : `${deliveries.length} delivery record${deliveries.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <Link to="/deliveries/new">
                    <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg shadow-green-600/20">
                        <Plus className="h-4 w-4" /> Record Delivery
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search by client name…"
                    className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] text-[#101828] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10 shadow-sm"
                />
                {searchInput && (
                    <button
                        onClick={() => setSearchInput('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] cursor-pointer"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            ) : isError ? (
                <ErrorState description={error instanceof Error ? error.message : 'Unable to load deliveries'} />
            ) : deliveries.length === 0 ? (
                <EmptyState
                    title="No deliveries yet"
                    description={
                        clientName
                            ? `No deliveries found for "${clientName}".`
                            : 'Record a delivery when laundry is returned to a hotel client.'
                    }
                    action={
                        !clientName && (
                            <Link to="/deliveries/new">
                                <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white">
                                    <Plus className="h-4 w-4" /> Record Delivery
                                </Button>
                            </Link>
                        )
                    }
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {deliveries.map((d: any, i: number) => (
                        <motion.div
                            key={d.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <DeliveryCard d={d} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
