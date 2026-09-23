import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useReactToPrint } from 'react-to-print'
import {
    Plus,
    Search,
    X,
    Printer,
    Eye,
    SlidersHorizontal,
    CalendarDays,
    Truck,
    AlertTriangle,
    CheckCircle2,
    PackageCheck,
    Clock,
    Building2,
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { SyncStatusBar } from '../../../components/ui/sync-status-bar'
import { DataTable } from '../../../components/ui/data-table'
import { Pagination } from '../../../components/ui/pagination'
import { formatDateOnly } from '../../../lib/utils'
import { useDeliveries } from '../hooks/useDeliveries'
import { useGatePasses } from '../hooks/useGatePasses'
import {
    DELIVERY_STATUSES,
    DELIVERY_STATUS_ORDER,
    DeliveryStatusPill,
    deriveDeliveryStatus,
    type DeliveryStatus,
} from '../components/operations-status'
import { CompactMetrics, type MetricItem } from '../components/compact-metrics'
import { RowActionsMenu } from '../components/row-actions-menu'
import { DeliveryPrintSheet } from '../components/delivery-print-sheet'
import type { Delivery, GatePass } from '../../../types/operations'

const PAGE_SIZE = 12

type DeliveryRow = { delivery: Delivery; status: DeliveryStatus }

function progressFor(delivery: Delivery, gp: GatePass | undefined, deliveredByGp: Map<string, number>) {
    const expected = (gp?.items ?? []).reduce((sum, item) => sum + (item.received_qty || 0), 0)
    if (gp?.status === 'DELIVERED') {
        return { delivered: expected, expected, pct: expected > 0 ? 100 : 0 }
    }
    const delivered = deliveredByGp.get(delivery.gate_pass_id)
        ?? (delivery.items ?? []).reduce((sum, item) => sum + (item.quantity || 0), 0)
    const pct = expected > 0 ? Math.min(100, Math.round((delivered / expected) * 100)) : 0
    return { delivered, expected, pct }
}

export default function DeliveriesPage() {
    const navigate = useNavigate()
    const [searchInput, setSearchInput] = useState('')
    const [clientName, setClientName] = useState('')
    const [statusFilter, setStatusFilter] = useState<'' | DeliveryStatus>('')
    const [gpFilter, setGpFilter] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [showMore, setShowMore] = useState(false)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => setClientName(searchInput.trim()), 350)
        return () => clearTimeout(timer)
    }, [searchInput])

    const { data: deliveries = [], isLoading, isError, error } = useDeliveries({
        client_name: clientName || undefined,
    })
    const { data: gatePasses = [] } = useGatePasses()

    useEffect(() => {
        setOffset(0)
    }, [searchInput, statusFilter, gpFilter, dateFrom, dateTo])

    const hasFilters = Boolean(searchInput || statusFilter || gpFilter || dateFrom || dateTo)

    const clearFilters = () => {
        setSearchInput('')
        setClientName('')
        setStatusFilter('')
        setGpFilter('')
        setDateFrom('')
        setDateTo('')
        setOffset(0)
    }

    const gpMap = useMemo(() => new Map(gatePasses.map(gp => [gp.id, gp])), [gatePasses])

    const gpOptions = useMemo(
        () =>
            [...gpMap.values()]
                .filter(gp => deliveries.some(d => d.gate_pass_id === gp.id))
                .sort((a, b) => a.gate_pass_number.localeCompare(b.gate_pass_number)),
        [gpMap, deliveries],
    )

    const deliveredByGp = useMemo(() => {
        const map = new Map<string, number>()
        for (const delivery of deliveries) {
            const qty = (delivery.items ?? []).reduce((sum, item) => sum + (item.quantity || 0), 0)
            map.set(delivery.gate_pass_id, (map.get(delivery.gate_pass_id) ?? 0) + qty)
        }
        return map
    }, [deliveries])

    const withStatus = useMemo(
        () =>
            deliveries.map(delivery => ({
                delivery,
                status: deriveDeliveryStatus(delivery, gpMap.get(delivery.gate_pass_id)),
            })),
        [deliveries, gpMap],
    )

    const kpis: MetricItem[] = useMemo(() => {
        const counts: Record<DeliveryStatus, number> = {
            DELIVERED: 0,
            PARTIALLY_DELIVERED: 0,
            READY: 0,
            IN_PROGRESS: 0,
            PENDING: 0,
            CANCELLED: 0,
        }
        for (const row of withStatus) counts[row.status] += 1
        return [
            { id: 'total', label: 'Total Deliveries', value: deliveries.length, icon: <Truck size={15} />, tone: 'green' },
            { id: 'completed', label: 'Completed', value: counts.DELIVERED, icon: <CheckCircle2 size={15} />, tone: 'green' },
            { id: 'ready', label: 'Ready', value: counts.READY, icon: <PackageCheck size={15} />, tone: 'blue' },
            { id: 'inprogress', label: 'In Progress', value: counts.IN_PROGRESS, icon: <Clock size={15} />, tone: 'amber' },
            { id: 'partial', label: 'Partial', value: counts.PARTIALLY_DELIVERED, icon: <AlertTriangle size={15} />, tone: 'amber' },
            { id: 'pending', label: 'Awaiting Confirmation', value: counts.PENDING, icon: <Building2 size={15} />, tone: 'gray' },
        ]
    }, [deliveries, withStatus])

    const displayRows = useMemo(
        () =>
            withStatus.filter(row => {
                if (statusFilter && row.status !== statusFilter) return false
                if (gpFilter && row.delivery.gate_pass_id !== gpFilter) return false
                const date = String(row.delivery.delivery_date || '').slice(0, 10)
                if (dateFrom && date < dateFrom) return false
                if (dateTo && date > dateTo) return false
                return true
            }),
        [withStatus, statusFilter, gpFilter, dateFrom, dateTo],
    )

    const pageRows = useMemo(
        () => displayRows.slice(offset, offset + PAGE_SIZE),
        [displayRows, offset],
    )

    const printRef = useRef<HTMLDivElement>(null)
    const [printTarget, setPrintTarget] = useState<Delivery | null>(null)
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: printTarget ? `Delivery-${printTarget.id}` : 'Delivery',
    })
    const handlePrintRef = useRef<() => void>(() => {})
    useEffect(() => {
        handlePrintRef.current = handlePrint
    }, [handlePrint])

    useEffect(() => {
        if (!printTarget) return
        const timer = setTimeout(() => {
            handlePrintRef.current()
            setPrintTarget(null)
        }, 120)
        return () => clearTimeout(timer)
    }, [printTarget])

    const requestPrint = (delivery: Delivery) => setPrintTarget(delivery)

    const renderProgress = (delivery: Delivery) => {
        const gp = gpMap.get(delivery.gate_pass_id)
        const { delivered, expected, pct } = progressFor(delivery, gp, deliveredByGp)
        return (
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E4E7EC]">
                    <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${pct}%` }} />
                </div>
                <span className="whitespace-nowrap text-[11px] font-medium text-[#6B7280]">
                    {delivered} / {expected} pcs
                </span>
            </div>
        )
    }

    const renderActions = (delivery: Delivery) => (
        <div className="flex items-center justify-end gap-1" onClick={event => event.stopPropagation()}>
            <Link
                to={`/deliveries/${delivery.id}`}
                title="View"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#98A2B3] transition hover:bg-[#F9FAFB] hover:text-[#16A34A]"
            >
                <Eye size={14} />
            </Link>
            <RowActionsMenu
                actions={[
                    { label: 'Print', icon: <Printer size={14} />, onClick: () => requestPrint(delivery) },
                    {
                        label: 'View gate pass',
                        icon: <PackageCheck size={14} />,
                        onClick: () => navigate(`/gate-passes/${delivery.gate_pass_id}`),
                    },
                ]}
            />
        </div>
    )

    const renderGatePassCell = (delivery: Delivery) => {
        const gp = gpMap.get(delivery.gate_pass_id)
        if (gp) {
            return (
                <Link to={`/gate-passes/${gp.id}`} className="font-mono text-[12px] font-semibold text-[#10B981] transition-colors hover:text-[#047857]">
                    {gp.gate_pass_number}
                </Link>
            )
        }
        const short = delivery.gate_pass_id.slice(-8).toUpperCase()
        return <span className="font-mono text-[12px] text-[#98A2B3]">GP-{short}</span>
    }

    const columns = [
        {
            key: 'id',
            header: 'Delivery',
            render: (row: DeliveryRow) => (
                <Link to={`/deliveries/${row.delivery.id}`} className="group flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]">
                        <Truck size={13} />
                    </span>
                    <span className="font-mono text-[12px] font-semibold text-[#101828] transition-colors group-hover:text-[#16A34A]">
                        DLV-{row.delivery.id.slice(-8).toUpperCase()}
                    </span>
                </Link>
            ),
        },
        {
            key: 'client_name',
            header: 'Hotel',
            render: (row: DeliveryRow) => (
                <span className="block max-w-[200px] truncate font-medium text-[#101828]">{row.delivery.client_name || '—'}</span>
            ),
        },
        {
            key: 'delivery_date',
            header: 'Date',
            render: (row: DeliveryRow) => (
                <span className="whitespace-nowrap text-[12px] text-[#475467]">{formatDateOnly(row.delivery.delivery_date)}</span>
            ),
        },
        {
            key: 'gate_pass',
            header: 'Gate Pass',
            render: (row: DeliveryRow) => renderGatePassCell(row.delivery),
        },
        {
            key: 'items',
            header: 'Items',
            align: 'center' as const,
            render: (row: DeliveryRow) => (
                <span className="text-[13px] text-[#475467]">
                    {row.delivery.items.length} type{row.delivery.items.length !== 1 ? 's' : ''}
                </span>
            ),
        },
        {
            key: 'progress',
            header: 'Progress',
            render: (row: DeliveryRow) => renderProgress(row.delivery),
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: DeliveryRow) => (
                <DeliveryStatusPill status={row.status} />
            ),
        },
        {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (row: DeliveryRow) => renderActions(row.delivery),
        },
    ]

    const renderMobileCard = (row: DeliveryRow) => {
        const delivery = row.delivery
        const gp = gpMap.get(delivery.gate_pass_id)
        const progress = progressFor(delivery, gp, deliveredByGp)
        return (
            <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 }}
            >
                <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]">
                                <Truck size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-[#101828]">{delivery.client_name || '—'}</p>
                                <p className="mt-0.5 font-mono text-[11px] text-[#98A2B3]">
                                    DLV-{delivery.id.slice(-8).toUpperCase()}
                                    {' · '}
                                    {renderGatePassCell(delivery)}
                                </p>
                            </div>
                        </div>
                        <DeliveryStatusPill status={row.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[#F2F4F7] pt-3">
                        <div className="text-[12px] text-[#6B7280]">
                            <span><span className="font-semibold text-[#374151]">{delivery.items.length}</span> types</span>
                            <span className="mx-2 text-[#E4E7EC]">|</span>
                            <span>{formatDateOnly(delivery.delivery_date)}</span>
                        </div>
                        <span className="rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                            {progress.delivered} / {progress.expected} pcs
                        </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex-1">{renderProgress(delivery)}</div>
                        {renderActions(delivery)}
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Deliveries' }]} />
                    <h1 className="text-dashboard-title mt-1">Deliveries</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        Track outgoing laundry returned to hotels — quantities against each gate pass, from dispatch
                        to confirmation.
                    </p>
                    <div className="mt-1.5">
                        <span className="text-[12px] font-medium text-[#6B7280]">
                            {isLoading ? 'Loading…' : `${deliveries.length} delivery record${deliveries.length !== 1 ? 's' : ''}`}
                        </span>
                        <SyncStatusBar queryKey={['deliveries']} label="Deliveries" className="mt-2" />
                    </div>
                </div>
                <Link to="/deliveries/new" className="shrink-0">
                    <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg shadow-green-600/20">
                        <Plus className="h-4 w-4" /> Record Delivery
                    </Button>
                </Link>
            </div>

            {/* Compact summary */}
            <CompactMetrics items={kpis} />

            {/* Filters */}
            <div className="rounded-xl border border-[#E4E7EC] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={event => setSearchInput(event.target.value)}
                            placeholder="Search by hotel / shop name…"
                            className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => setSearchInput('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#98A2B3] hover:text-[#374151]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={event => setStatusFilter(event.target.value as '' | DeliveryStatus)}
                            className="h-10 cursor-pointer appearance-none rounded-lg border border-[#E4E7EC] bg-white pl-3 pr-8 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10"
                        >
                            <option value="">All Statuses</option>
                            {DELIVERY_STATUS_ORDER.map(status => (
                                <option key={status} value={status}>{DELIVERY_STATUSES[status].label}</option>
                            ))}
                        </select>

                        <Button variant="secondary" size="sm" onClick={() => setShowMore(value => !value)}>
                            <SlidersHorizontal size={14} />
                            More Filters
                        </Button>

                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X size={14} /> Clear
                            </Button>
                        )}
                    </div>
                </div>

                {showMore && (
                    <div className="mt-3 grid gap-2.5 border-t border-[#F2F4F7] pt-3 sm:grid-cols-3">
                        <div className="relative">
                            <PackageCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                            <select
                                value={gpFilter}
                                onChange={event => setGpFilter(event.target.value)}
                                className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10"
                            >
                                <option value="">All Gate Passes</option>
                                {gpOptions.map(gp => (
                                    <option key={gp.id} value={gp.id}>{gp.gate_pass_number} · {gp.client_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={event => setDateFrom(event.target.value)}
                                aria-label="Delivered from"
                                className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10"
                            />
                        </div>
                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={event => setDateTo(event.target.value)}
                                aria-label="Delivered to"
                                className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="h-14" />
                    ))}
                </div>
            ) : isError ? (
                <ErrorState description={error instanceof Error ? error.message : 'Unable to load deliveries'} />
            ) : deliveries.length === 0 ? (
                <EmptyState
                    title="No deliveries yet"
                    description={
                        hasFilters
                            ? 'No deliveries match your search or filter.'
                            : 'Record a delivery when laundry is returned to a hotel client.'
                    }
                    action={
                        !hasFilters && (
                            <Link to="/deliveries/new">
                                <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white">
                                    <Plus className="h-4 w-4" /> Record Delivery
                                </Button>
                            </Link>
                        )
                    }
                />
            ) : displayRows.length === 0 ? (
                <EmptyState
                    title="Nothing matches these filters"
                    description="Try widening the date range or clearing the filters."
                    action={
                        <Button variant="secondary" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    }
                />
            ) : (
                <>
                    {/* Mobile card list */}
                    <div className="space-y-3 md:hidden">{pageRows.map(renderMobileCard)}</div>

                    {/* Desktop table */}
                    <div className="hidden md:block">
                        <DataTable
                            columns={columns}
                            data={pageRows}
                            rowKey={(row: { delivery: Delivery; status: DeliveryStatus }) => row.delivery.id}
                            onRowClick={row => navigate(`/deliveries/${row.delivery.id}`)}
                        />
                    </div>

                    {displayRows.length > PAGE_SIZE && (
                        <Pagination
                            total={displayRows.length}
                            limit={PAGE_SIZE}
                            offset={offset}
                            onChange={setOffset}
                            className="px-1"
                        />
                    )}
                </>
            )}

            {/* Hidden print sheet */}
            {printTarget && (
                <div style={{ display: 'none' }}>
                    <DeliveryPrintSheet
                        ref={printRef}
                        delivery={printTarget}
                        gp={gpMap.get(printTarget.gate_pass_id)}
                    />
                </div>
            )}
        </div>
    )
}