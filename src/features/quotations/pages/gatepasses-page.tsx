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
    Pencil,
    SlidersHorizontal,
    CalendarDays,
    Inbox,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
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
import { useGatePasses } from '../hooks/useGatePasses'
import { GATE_PASS_STATUSES, GatePassStatusPill } from '../components/operations-status'
import { CompactMetrics, type MetricItem } from '../components/compact-metrics'
import { RowActionsMenu } from '../components/row-actions-menu'
import { GatePassPrintSheet } from '../components/gate-pass-print-sheet'
import type { GatePass } from '../../../types/operations'

const PAGE_SIZE = 12

export default function GatePassesPage() {
    const navigate = useNavigate()
    const [searchInput, setSearchInput] = useState('')
    const [clientName, setClientName] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [showMore, setShowMore] = useState(false)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => setClientName(searchInput.trim()), 350)
        return () => clearTimeout(timer)
    }, [searchInput])

    const { data: gatePasses = [], isLoading, isError, error } = useGatePasses({
        client_name: clientName || undefined,
        status: statusFilter || undefined,
    })

    useEffect(() => {
        setOffset(0)
    }, [searchInput, statusFilter, dateFrom, dateTo])

    const hasFilters = Boolean(searchInput || statusFilter || dateFrom || dateTo)

    const clearFilters = () => {
        setSearchInput('')
        setClientName('')
        setStatusFilter('')
        setDateFrom('')
        setDateTo('')
        setOffset(0)
    }

    const clientNames = useMemo(
        () => [...new Set(gatePasses.map(gp => gp.client_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [gatePasses],
    )

    const kpis: MetricItem[] = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10)
        return [
            { id: 'total', label: 'Total Gate Passes', value: gatePasses.length, icon: <ClipboardList size={15} />, tone: 'blue' },
            { id: 'today', label: "Today's Receipts", value: gatePasses.filter(gp => String(gp.receiving_date || '').slice(0, 10) === today).length, icon: <CalendarDays size={15} />, tone: 'blue' },
            { id: 'pending', label: 'Pending', value: gatePasses.filter(gp => gp.status !== 'DELIVERED' && gp.status !== 'CANCELLED').length, icon: <Clock size={15} />, tone: 'amber' },
            { id: 'received', label: 'Received', value: gatePasses.filter(gp => gp.status === 'RECEIVED').length, icon: <Inbox size={15} />, tone: 'gray' },
            { id: 'mismatch', label: 'Mismatched', value: gatePasses.filter(gp => (gp.items ?? []).some(item => item.difference !== 0)).length, icon: <AlertTriangle size={15} />, tone: 'red' },
            { id: 'completed', label: 'Completed', value: gatePasses.filter(gp => gp.status === 'DELIVERED').length, icon: <CheckCircle2 size={15} />, tone: 'green' },
        ]
    }, [gatePasses])

    const displayRows = useMemo(
        () =>
            gatePasses.filter(gp => {
                const date = String(gp.receiving_date || '').slice(0, 10)
                if (dateFrom && date < dateFrom) return false
                if (dateTo && date > dateTo) return false
                return true
            }),
        [gatePasses, dateFrom, dateTo],
    )

    const pageRows = useMemo(
        () => displayRows.slice(offset, offset + PAGE_SIZE),
        [displayRows, offset],
    )

    const printRef = useRef<HTMLDivElement>(null)
    const [printTarget, setPrintTarget] = useState<GatePass | null>(null)
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: printTarget ? `Gate-Pass-${printTarget.gate_pass_number}` : 'Gate-Pass',
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

    const requestPrint = (gp: GatePass) => setPrintTarget(gp)

    const renderActions = (gp: GatePass) => (
        <div className="flex items-center justify-end gap-1" onClick={event => event.stopPropagation()}>
            <Link
                to={`/gate-passes/${gp.id}`}
                title="View"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#98A2B3] transition hover:bg-[#F9FAFB] hover:text-[#2563EB]"
            >
                <Eye size={14} />
            </Link>
            <Link
                to={`/gate-passes/${gp.id}`}
                title="Edit"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#98A2B3] transition hover:bg-[#F9FAFB] hover:text-[#2563EB]"
            >
                <Pencil size={14} />
            </Link>
            <button
                type="button"
                title="Print"
                onClick={() => requestPrint(gp)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#98A2B3] transition hover:bg-[#F9FAFB] hover:text-[#2563EB]"
            >
                <Printer size={14} />
            </button>
            <RowActionsMenu
                actions={[
                    { label: 'View details', icon: <Eye size={14} />, onClick: () => navigate(`/gate-passes/${gp.id}`) },
                    { label: 'Edit items', icon: <Pencil size={14} />, onClick: () => navigate(`/gate-passes/${gp.id}`) },
                    { label: 'Print', icon: <Printer size={14} />, onClick: () => requestPrint(gp) },
                ]}
            />
        </div>
    )

    const columns = [
        {
            key: 'gate_pass_number',
            header: 'Gate Pass',
            render: (gp: GatePass) => (
                <Link to={`/gate-passes/${gp.id}`} className="group flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]">
                        <ClipboardList size={13} />
                    </span>
                    <span className="font-mono text-[12px] font-semibold text-[#101828] transition-colors group-hover:text-[#2563EB]">
                        {gp.gate_pass_number}
                    </span>
                </Link>
            ),
        },
        {
            key: 'client_name',
            header: 'Hotel',
            render: (gp: GatePass) => (
                <span className="block max-w-[220px] truncate font-medium text-[#101828]">{gp.client_name || '—'}</span>
            ),
        },
        {
            key: 'receiving_date',
            header: 'Date',
            render: (gp: GatePass) => (
                <span className="whitespace-nowrap text-[12px] text-[#475467]">{formatDateOnly(gp.receiving_date)}</span>
            ),
        },
        {
            key: 'items',
            header: 'Items',
            align: 'center' as const,
            render: (gp: GatePass) => (
                <span className="text-[13px] text-[#475467]">
                    {gp.items.length} type{gp.items.length !== 1 ? 's' : ''}
                </span>
            ),
        },
        {
            key: 'quantity',
            header: 'Quantity',
            align: 'center' as const,
            render: (gp: GatePass) => {
                const total = (gp.items ?? []).reduce((sum, item) => sum + (item.received_qty || 0), 0)
                return <span className="font-semibold text-[#374151]">{total} pcs</span>
            },
        },
        {
            key: 'status',
            header: 'Status',
            render: (gp: GatePass) => {
                const mismatches = (gp.items ?? []).filter(item => item.difference !== 0).length
                return (
                    <div className="flex flex-col items-start gap-1">
                        <GatePassStatusPill status={gp.status} />
                        {mismatches > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#D97706]">
                                <AlertTriangle size={10} />
                                {mismatches} mismatch{mismatches > 1 ? 'es' : ''}
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (gp: GatePass) => renderActions(gp),
        },
    ]

    const renderMobileCard = (gp: GatePass) => {
        const total = (gp.items ?? []).reduce((sum, item) => sum + (item.received_qty || 0), 0)
        const mismatches = (gp.items ?? []).filter(item => item.difference !== 0).length
        return (
            <motion.div
                key={gp.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 }}
            >
                <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]">
                                <ClipboardList size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-[#101828]">{gp.client_name || '—'}</p>
                                <p className="mt-0.5 font-mono text-[11px] text-[#98A2B3]">{gp.gate_pass_number}</p>
                            </div>
                        </div>
                        <GatePassStatusPill status={gp.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#F2F4F7] pt-3 text-[12px] text-[#6B7280]">
                        <span><span className="font-semibold text-[#374151]">{gp.items.length}</span> types</span>
                        <span><span className="font-semibold text-[#374151]">{total}</span> pcs</span>
                        {mismatches > 0 && (
                            <span className="text-[#D97706]">⚠ {mismatches} mismatch{mismatches > 1 ? 'es' : ''}</span>
                        )}
                        <span>{formatDateOnly(gp.receiving_date)}</span>
                    </div>
                    <div className="mt-2 flex justify-end">{renderActions(gp)}</div>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Gate Passes' }]} />
                    <h1 className="text-dashboard-title mt-1">Gate Passes</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        Track incoming laundry from hotels and shops — receipts, mismatches, and delivery readiness.
                    </p>
                    <div className="mt-1.5">
                        <span className="text-[12px] font-medium text-[#6B7280]">
                            {isLoading ? 'Loading…' : `${gatePasses.length} gate pass${gatePasses.length !== 1 ? 'es' : ''}`}
                        </span>
                        <SyncStatusBar queryKey={['gatepasses']} label="Gate passes" className="mt-2" />
                    </div>
                </div>
                <Link to="/gate-passes/new" className="shrink-0">
                    <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-blue-600/20">
                        <Plus className="h-4 w-4" /> Create Gate Pass
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
                            className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
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
                            onChange={event => setStatusFilter(event.target.value)}
                            className="h-10 cursor-pointer appearance-none rounded-lg border border-[#E4E7EC] bg-white pl-3 pr-8 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                        >
                            <option value="">All Statuses</option>
                            {Object.keys(GATE_PASS_STATUSES).map(status => (
                                <option key={status} value={status}>{GATE_PASS_STATUSES[status].label}</option>
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
                            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                            <select
                                value={clientNames.includes(searchInput.trim()) ? searchInput.trim() : ''}
                                onChange={event => setSearchInput(event.target.value)}
                                className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                            >
                                <option value="">All Hotels / Shops</option>
                                {clientNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={event => setDateFrom(event.target.value)}
                                aria-label="Received from"
                                className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                            />
                        </div>
                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={event => setDateTo(event.target.value)}
                                aria-label="Received to"
                                className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] shadow-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
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
                <ErrorState description={error instanceof Error ? error.message : 'Unable to load gate passes'} />
            ) : gatePasses.length === 0 ? (
                <EmptyState
                    title="No gate passes found"
                    description={
                        hasFilters
                            ? 'No gate passes match your search or filter.'
                            : 'Record your first gate pass when laundry is received from a hotel.'
                    }
                    action={
                        !hasFilters && (
                            <Link to="/gate-passes/new">
                                <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                                    <Plus className="h-4 w-4" /> Create Gate Pass
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
                            rowKey={(gp: GatePass) => gp.id}
                            onRowClick={gp => navigate(`/gate-passes/${gp.id}`)}
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
                    <GatePassPrintSheet ref={printRef} gp={printTarget} />
                </div>
            )}
        </div>
    )
}