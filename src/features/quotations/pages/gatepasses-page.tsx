import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ClipboardList, X, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useGatePasses } from '../hooks/useGatePasses'
import type { GatePass } from '../../../types/operations'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    RECEIVED: { label: 'Received', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', dot: '#3B82F6' },
    PROCESSING: { label: 'Processing', bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', dot: '#F97316' },
    READY_FOR_DELIVERY: { label: 'Ready', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
    PARTIALLY_DELIVERED: { label: 'Partial Delivery', bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' },
    DELIVERED: { label: 'Delivered', bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', dot: '#16A34A' },
    CANCELLED: { label: 'Cancelled', bg: '#F9FAFB', text: '#6B7280', border: '#E4E7EC', dot: '#9CA3AF' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.RECEIVED
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
            style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    )
}

function GatePassCard({ gp }: { gp: GatePass }) {
    const totalItems = gp.items.reduce((s, i) => s + i.received_qty, 0)
    const mismatches = gp.items.filter(i => i.difference !== 0).length

    return (
        <Link to={`/gate-passes/${gp.id}`}>
            <Card hover className="cursor-pointer p-4 h-full group">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] group-hover:bg-[#DBEAFE] transition-colors">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#101828] truncate">{gp.client_name}</p>
                            <p className="text-[11px] text-[#98A2B3] font-mono mt-0.5">{gp.gate_pass_number}</p>
                        </div>
                    </div>
                    <StatusBadge status={gp.status} />
                </div>

                <div className="flex items-center gap-4 text-[12px] text-[#6B7280] border-t border-[#F2F4F7] pt-3">
                    <span><span className="font-semibold text-[#374151]">{gp.items.length}</span> types</span>
                    <span><span className="font-semibold text-[#374151]">{totalItems}</span> pcs</span>
                    {mismatches > 0 && (
                        <span className="text-[#D97706]">⚠ {mismatches} mismatch{mismatches > 1 ? 'es' : ''}</span>
                    )}
                    <span className="ml-auto">{formatDate(gp.receiving_date)}</span>
                </div>
            </Card>
        </Link>
    )
}

export default function GatePassesPage() {
    const [searchInput, setSearchInput] = useState('')
    const [clientName, setClientName] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setClientName(searchInput.trim()), 350)
        return () => clearTimeout(t)
    }, [searchInput])

    const { data: gatePasses = [], isLoading, isError, error } = useGatePasses({
        client_name: clientName || undefined,
        status: statusFilter || undefined,
    })

    const hasFilters = Boolean(searchInput || statusFilter)

    const clearFilters = () => {
        setSearchInput('')
        setClientName('')
        setStatusFilter('')
    }

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Gate Passes' }]} />
                    <h1 className="text-dashboard-title mt-1">Gate Passes</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        {isLoading ? 'Loading…' : `${gatePasses.length} record${gatePasses.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <Link to="/gate-passes/new">
                    <Button className="shadow-lg shadow-blue-600/20 bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                        <Plus className="h-4 w-4" /> New Gate Pass
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search by client name…"
                        className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] text-[#101828] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-sm"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => setSearchInput('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98A2B3]" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-10 appearance-none rounded-lg border border-[#E4E7EC] bg-white pl-8 pr-8 text-[13px] text-[#101828] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-sm cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            {ALL_STATUSES.map(s => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                        </select>
                    </div>

                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-28" />
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
                                    <Plus className="h-4 w-4" /> New Gate Pass
                                </Button>
                            </Link>
                        )
                    }
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gatePasses.map((gp: any, i: number) => (
                        <motion.div
                            key={gp.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <GatePassCard gp={gp} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
