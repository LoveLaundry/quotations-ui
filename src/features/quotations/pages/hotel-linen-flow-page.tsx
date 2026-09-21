import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowRight,
    Building2,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Search,
    Truck,
    X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { SyncStatusBar } from '../../../components/ui/sync-status-bar'
import { formatDate } from '../../../lib/utils'
import { useGatePasses } from '../hooks/useGatePasses'
import { useDeliveries } from '../hooks/useDeliveries'
import type { GatePass, Delivery } from '../../../types/operations'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    RECEIVED: { label: 'Received', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', dot: '#3B82F6' },
    PROCESSING: { label: 'Processing', bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', dot: '#F97316' },
    READY_FOR_DELIVERY: { label: 'Ready', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
    PARTIALLY_DELIVERED: { label: 'Partial Delivery', bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' },
    DELIVERED: { label: 'Delivered', bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', dot: '#16A34A' },
    CANCELLED: { label: 'Cancelled', bg: '#F9FAFB', text: '#6B7280', border: '#E4E7EC', dot: '#9CA3AF' },
}

type Period = 'all' | 'month' | 'quarter' | 'year'

interface GpNode {
    gp: GatePass
    received: number
    delivered: number
    deliveries: Delivery[]
}

interface HotelNode {
    name: string
    gatePasses: GpNode[]
    unlinked: Delivery[]
    received: number
    delivered: number
}

function statusBadge(status?: string) {
    const cfg = STATUS_CONFIG[status ?? ''] ?? STATUS_CONFIG.RECEIVED
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
            style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    )
}

function pieces(items: { item_name?: string; quantity?: number; received_qty?: number }[]) {
    return (items ?? []).reduce((sum, i) => sum + Number(i.quantity ?? i.received_qty ?? 0), 0)
}

function gpKey(gp: GatePass) {
    return gp?.id || (gp as any)?.gate_pass_id || (gp as any)?._id || ''
}

function Chevron({ open }: { open: boolean }) {
    return open
        ? <ChevronDown className="h-4 w-4 text-[#98A2B3]" />
        : <ChevronRight className="h-4 w-4 text-[#98A2B3]" />
}

function CollapseButton({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
    return (
        <Button variant="ghost" size="sm" onClick={onClick}>
            <Chevron open={open} />
            {open ? `Collapse ${label}` : `Expand ${label}`}
        </Button>
    )
}

export default function HotelLinenFlowPage() {
    const [searchInput, setSearchInput] = useState('')
    const [hotelSearch, setHotelSearch] = useState('')
    const [period, setPeriod] = useState<Period>('all')
    const [openHotels, setOpenHotels] = useState<Set<string>>(new Set())
    const [openGps, setOpenGps] = useState<Set<string>>(new Set())

    const { data: rawGatePasses = [], isLoading: gpLoading, isError: gpError, error: gpErrorObj } = useGatePasses()
    const { data: rawDeliveries = [], isLoading: delLoading, isError: delError, error: delErrorObj } = useDeliveries()

    const isLoading = gpLoading || delLoading
    const isError = gpError || delError
    const errorMessage = (gpErrorObj ?? delErrorObj) instanceof Error
        ? ((gpErrorObj ?? delErrorObj) as Error).message
        : 'Unable to load linen flow data'

    const hotels = useMemo<HotelNode[]>(() => {
        let cutoff = ''
        if (period !== 'all') {
            const now = new Date()
            const year = now.getFullYear()
            const month = now.getMonth()
            const start =
                period === 'month'
                    ? new Date(year, month, 1)
                    : period === 'quarter'
                        ? new Date(year, Math.floor(month / 3) * 3, 1)
                        : new Date(year, 0, 1)
            cutoff = start.toISOString().slice(0, 10)
        }
        const inPeriod = (date: string) => {
            const day = (date ?? '').slice(0, 10)
            return !day || !cutoff || day >= cutoff
        }

        const byHotel = new Map<string, HotelNode>()
        const pushHotel = (name: string) => {
            const key = name || 'Unknown'
            if (!byHotel.has(key)) {
                byHotel.set(key, { name: key, gatePasses: [], unlinked: [], received: 0, delivered: 0 })
            }
            return byHotel.get(key)!
        }

        const gpById = new Map<string, GatePass>()
        for (const gp of rawGatePasses) {
            if (!inPeriod(gp.receiving_date)) continue
            gpById.set(gpKey(gp), gp)
        }

        for (const d of rawDeliveries) {
            const gp = gpById.get(d.gate_pass_id)
            if (gp) {
                const hotel = pushHotel(gp.client_name)
                const node = hotel.gatePasses.find(n => gpKey(n.gp) === d.gate_pass_id)
                if (node) {
                    node.deliveries.push(d)
                }
            } else if (inPeriod(d.delivery_date)) {
                const hotel = pushHotel(d.client_name)
                hotel.unlinked.push(d)
                hotel.delivered += pieces(d.items)
            }
        }

        for (const gp of gpById.values()) {
            const hotel = pushHotel(gp.client_name)
            const received = pieces(gp.items)
            const deliveries = rawDeliveries.filter(d => d.gate_pass_id === gpKey(gp))
            const delivered = pieces([]) + deliveries.reduce((sum, d) => sum + pieces(d.items), 0)
            hotel.gatePasses.push({ gp, received, delivered, deliveries })
            hotel.received += received
            hotel.delivered += delivered
        }

        const list = [...byHotel.values()]
        for (const hotel of list) {
            hotel.gatePasses.sort((a, b) => (b.gp.receiving_date ?? '').localeCompare(a.gp.receiving_date ?? ''))
            for (const node of hotel.gatePasses) {
                node.deliveries.sort((a, b) => (a.delivery_date ?? '').localeCompare(b.delivery_date ?? ''))
            }
            hotel.unlinked.sort((a, b) => (a.delivery_date ?? '').localeCompare(b.delivery_date ?? ''))
        }
        return list.sort((a, b) => a.name.localeCompare(b.name))
    }, [rawGatePasses, rawDeliveries, period])

    const query = hotelSearch.trim().toLowerCase()
    const filteredHotels = query
        ? hotels.filter(h => h.name.toLowerCase().includes(query))
        : hotels

    const totals = useMemo(() => {
        let gatePassCount = 0
        let received = 0
        let delivered = 0
        for (const h of filteredHotels) {
            gatePassCount += h.gatePasses.length
            received += h.received
            delivered += h.delivered
        }
        return { gatePassCount, received, delivered, pending: received - delivered }
    }, [filteredHotels])

    const toggleHotel = (name: string) => {
        setOpenHotels(prev => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const toggleGp = (key: string) => {
        setOpenGps(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const allHotelsOpen = filteredHotels.every(h => openHotels.has(h.name))
    const toggleAllHotels = () => {
        setOpenHotels(allHotelsOpen ? new Set() : new Set(filteredHotels.map(h => h.name)))
    }

    const allGpsOpen = filteredHotels.every(h =>
        h.gatePasses.length === 0 || h.gatePasses.every(n => openGps.has(gpKey(n.gp))))
    const toggleAllGps = () => {
        setOpenGps(allGpsOpen ? new Set() : new Set(filteredHotels.flatMap(h => h.gatePasses.map(n => gpKey(n.gp)))))
    }

    const daysInPeriod =
        period === 'month' ? 'This month' : period === 'quarter' ? 'Last 3 months' : period === 'year' ? 'This year' : 'All time'

    return (
        <div className="space-y-5 pb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Hotel Linen Flow' }]} />
                    <h1 className="text-dashboard-title mt-1">Hotel Linen Flow</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        {isLoading
                            ? 'Loading…'
                            : `${filteredHotels.length} hotel${filteredHotels.length !== 1 ? 's' : ''} · ${totals.gatePassCount} gate passes · ${daysInPeriod}`}
                    </p>
                    <SyncStatusBar queryKey={['gatepasses']} label="Gate passes" className="mt-2" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <CollapseButton open={allHotelsOpen} onClick={toggleAllHotels} label="hotels" />
                    <CollapseButton open={allGpsOpen} onClick={toggleAllGps} label="gate passes" />
                </div>
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {[
                    { label: 'Hotels', value: filteredHotels.length, color: '#2563EB', bg: '#EFF6FF' },
                    { label: 'Gate Passes', value: totals.gatePassCount, color: '#7C3AED', bg: '#F5F3FF' },
                    { label: 'Pcs Received', value: totals.received, color: '#15803D', bg: '#F0FDF4' },
                    { label: 'Pcs Remaining', value: Math.max(totals.pending, 0), color: totals.pending > 0 ? '#D97706' : '#16A34A', bg: totals.pending > 0 ? '#FFFBEB' : '#F0FDF4' },
                ].map(stat => (
                    <Card key={stat.label} className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold" style={{ background: stat.bg, color: stat.color }}>
                                {stat.value}
                            </div>
                            <p className="text-[12px] font-medium text-[#667085]">{stat.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyUp={e => {
                            if (e.key === 'Enter') setHotelSearch(searchInput.trim())
                        }}
                        placeholder="Search hotel…"
                        className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] text-[#101828] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-sm"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => { setSearchInput(''); setHotelSearch('') }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <select
                    value={period}
                    onChange={e => setPeriod(e.target.value as Period)}
                    className="h-10 appearance-none rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-sm cursor-pointer"
                >
                    <option value="all">All time</option>
                    <option value="month">This month</option>
                    <option value="quarter">Last 3 months</option>
                    <option value="year">This year</option>
                </select>
            </div>

            {isLoading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            ) : isError ? (
                <ErrorState description={errorMessage} />
            ) : filteredHotels.length === 0 ? (
                <EmptyState
                    title={query ? 'No hotels match your search' : 'No gate passes or deliveries yet'}
                    description={query ? 'Try a different hotel name.' : 'Record a gate pass when laundry is received from a hotel.'}
                    action={
                        !query && (
                            <Link to="/gate-passes/new">
                                <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                                    <ClipboardList className="h-4 w-4" /> New Gate Pass
                                </Button>
                            </Link>
                        )
                    }
                />
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {filteredHotels.map((hotel, i) => {
                        const hotelOpen = openHotels.has(hotel.name)
                        const pending = hotel.received - hotel.delivered
                        return (
                            <motion.div
                                key={hotel.name}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <HotelCard
                                    hotel={hotel}
                                    open={hotelOpen}
                                    pending={pending}
                                    onToggleHotel={() => toggleHotel(hotel.name)}
                                    openGps={openGps}
                                    onToggleGp={toggleGp}
                                />
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function HotelCard({
    hotel,
    open,
    pending,
    onToggleHotel,
    openGps,
    onToggleGp,
}: {
    hotel: HotelNode
    open: boolean
    pending: number
    onToggleHotel: () => void
    openGps: Set<string>
    onToggleGp: (key: string) => void
}) {
    const links: Array<{ label: string; to: string }> = []
    for (const node of hotel.gatePasses) {
        links.push({ label: `GP ${node.gp.gate_pass_number || '—'}`, to: `/gate-passes/${gpKey(node.gp)}` })
    }
    for (const d of hotel.unlinked) {
        links.push({ label: `Delivery ${d.id?.slice(0, 8) || '—'}`, to: `/deliveries/${d.id}` })
    }

    return (
        <Card className="overflow-hidden">
            <button
                type="button"
                onClick={onToggleHotel}
                className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-[#F9FAFB]"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#101828] truncate">{hotel.name}</p>
                    <p className="text-[11px] text-[#98A2B3]">
                        {hotel.gatePasses.length} gate pass{hotel.gatePasses.length !== 1 ? 'es' : ''}
                        {' · '}{hotel.received} pcs in
                        {' · '}{hotel.delivered} pcs delivered
                        {' · '}
                        <span className={pending > 0 ? 'text-[#D97706] font-semibold' : 'text-[#16A34A] font-semibold'}>
                            {Math.max(pending, 0)} remaining
                        </span>
                    </p>
                </div>
                <Chevron open={open} />
            </button>

            {open && (
                <div className="border-t border-[#F2F4F7] px-4 py-3">
                    <div className="ml-[18px] border-l-2 border-[#E4E7EC] pl-4 space-y-2">
                        {hotel.gatePasses.length === 0 && hotel.unlinked.length === 0 && (
                            <p className="text-[12px] text-[#98A2B3]">Nothing in this period.</p>
                        )}

                        {hotel.gatePasses.map(node => {
                            const key = gpKey(node.gp)
                            const gpOpen = openGps.has(key)
                            const gpPending = node.received - node.delivered
                            return (
                                <div key={key} className="rounded-lg border border-[#E4E7EC] bg-[#FCFCFD]">
                                    <button
                                        type="button"
                                        onClick={() => onToggleGp(key)}
                                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer hover:bg-white"
                                    >
                                        <ClipboardList className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12.5px] font-semibold text-[#101828] truncate">
                                                {node.gp.gate_pass_number || 'Gate pass'}
                                                <span className="ml-2 font-normal text-[#98A2B3]">{formatDate(node.gp.receiving_date)}</span>
                                            </p>
                                        </div>
                                        <span className="text-[11px] text-[#667085] whitespace-nowrap">
                                            {node.received} in · {node.delivered} out
                                            {gpPending > 0 && <span className="text-[#D97706] font-semibold"> · {gpPending} left</span>}
                                        </span>
                                        {statusBadge(node.gp.status)}
                                        <Chevron open={gpOpen} />
                                    </button>

                                    {gpOpen && (
                                        <div className="px-3 pb-3">
                                            <div className="ml-[14px] border-l-2 border-[#E4E7EC] pl-3 space-y-2">
                                                <div className="rounded-md bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-2">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2563EB] mb-1.5 flex items-center gap-1">
                                                        <ArrowRight className="h-3 w-3" /> Received items
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(node.gp.items ?? []).length === 0 && (
                                                            <span className="text-[11px] text-[#98A2B3]">—</span>
                                                        )}
                                                        {(node.gp.items ?? []).map(item => (
                                                            <span key={`${item.item_name}-${item.specification ?? ''}`} className="inline-flex items-center gap-1 rounded-md border border-[#DBEAFE] bg-white px-2 py-0.5 text-[11px] text-[#374151]">
                                                                {item.item_name}
                                                                {item.specification && <span className="text-[#98A2B3]">({item.specification})</span>}
                                                                <span className="font-semibold text-[#2563EB]">×{item.received_qty}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {node.deliveries.length > 0 && (
                                                    <div className="space-y-2">
                                                        {node.deliveries.map(d => (
                                                            <Link
                                                                key={d.id}
                                                                to={`/deliveries/${d.id}`}
                                                                className="block rounded-md bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2 hover:bg-[#DCFCE7] transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <Truck className="h-3 w-3 text-[#16A34A]" />
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#15803D] flex items-center gap-2">
                                                                        Delivery
                                                                        <span className="normal-case font-normal text-[#667085]">{formatDate(d.delivery_date)}</span>
                                                                        {d.delivered_by && <span className="normal-case font-normal text-[#667085]">by {d.delivered_by}</span>}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {(d.items ?? []).map(item => (
                                                                        <span key={`${item.item_name}-${item.specification ?? ''}`} className="inline-flex items-center gap-1 rounded-md border border-[#DCFCE7] bg-white px-2 py-0.5 text-[11px] text-[#374151]">
                                                                            {item.item_name}
                                                                            {item.specification && <span className="text-[#98A2B3]">({item.specification})</span>}
                                                                            <span className="font-semibold text-[#16A34A]">×{item.quantity}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {hotel.unlinked.length > 0 && (
                            <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB]">
                                <div className="px-3 py-2.5 space-y-1.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#D97706] flex items-center gap-1">
                                        <Truck className="h-3 w-3" /> Deliveries without gate pass
                                    </p>
                                    {hotel.unlinked.map(d => (
                                        <Link key={d.id} to={`/deliveries/${d.id}`} className="block text-[11.5px] text-[#374151] hover:text-[#D97706] transition-colors">
                                            {formatDate(d.delivery_date)} — {(d.items ?? []).map(i => `${i.item_name} ×${i.quantity}`).join(', ') || '—'}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {links.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#F2F4F7] flex flex-wrap gap-1.5">
                            {links.map(l => (
                                <Link key={l.to} to={l.to} className="rounded-md border border-[#E4E7EC] bg-white px-2 py-1 text-[11px] text-[#2563EB] hover:bg-[#EFF6FF] transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}