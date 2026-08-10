import { useState, type ElementType, type SyntheticEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, BarChart3, Users, Package, ClipboardList, DollarSign, History } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/ui/error-state'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { reports } from '../services/reports.service'

type ReportTab = 'client' | 'item' | 'gatepass' | 'billing' | 'audit'

const TABS: { id: ReportTab; label: string; icon: ElementType }[] = [
    { id: 'client', label: 'Client-Wise', icon: Users },
    { id: 'item', label: 'Item-Wise', icon: Package },
    { id: 'gatepass', label: 'Gate Pass', icon: ClipboardList },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'audit', label: 'Audit Log', icon: History },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function ClientSearch() {
    const [input, setInput] = useState('')
    const [search, setSearch] = useState('')

    const { data, isLoading, isError } = useQuery({
        queryKey: ['reports', 'client-summary', search],
        queryFn: () => reports.clientSummary(search),
        enabled: Boolean(search),
    })

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch(input.trim())
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Enter client / hotel name…"
                        className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 shadow-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-[#DC2626] text-white text-[13px] font-medium hover:bg-[#B91C1C] transition cursor-pointer"
                >
                    Search
                </button>
            </form>

            {isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-48" />
                </div>
            )}

            {isError && <ErrorState description="Failed to load client summary" />}

            {data && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {[
                            { label: 'Gate Passes', value: data.stats.total_gate_passes },
                            { label: 'Items Received', value: data.stats.total_items_received },
                            { label: 'Items Delivered', value: data.stats.total_items_delivered },
                            { label: 'Pending Items', value: data.stats.pending_items },
                            { label: 'Open Mismatches', value: data.stats.open_mismatches },
                            { label: 'Pending Bills', value: data.stats.pending_bills },
                            { label: 'Total Billed', value: `LKR ${data.stats.total_billed.toLocaleString()}` },
                            { label: 'Outstanding', value: `LKR ${data.stats.outstanding_amount.toLocaleString()}` },
                        ].map(({ label, value }) => (
                            <Card key={label} className="p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-1">{label}</p>
                                <p className="text-[18px] font-bold text-[#101828]">{value}</p>
                            </Card>
                        ))}
                    </div>

                    {/* Pending Balances */}
                    {data.pending_balances.length > 0 && (
                        <Card>
                            <CardHeader className="border-b border-[#F2F4F7] pb-3">
                                <CardTitle>Pending Item Balances</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="divide-y divide-[#F9FAFB]">
                                    {data.pending_balances.map((b: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between py-3 text-[13px]">
                                            <span className="font-medium text-[#101828]">{b.item_name}</span>
                                            <div className="flex gap-4 text-[#6B7280]">
                                                <span>Recv: <span className="font-semibold text-[#374151]">{b.received}</span></span>
                                                <span>Del: <span className="font-semibold text-[#374151]">{b.delivered}</span></span>
                                                <span className="text-[#D97706] font-semibold">Pend: {b.pending}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            )}

            {!data && !isLoading && !isError && (
                <div className="py-12 text-center text-[13px] text-[#98A2B3]">
                    Enter a client name to view their complete summary
                </div>
            )}
        </div>
    )
}

function GenericTable({ queryKey, queryFn, columns }: {
    queryKey: string[]
    queryFn: () => Promise<object[]>
    columns: { key: string; label: string; format?: (v: unknown) => string }[]
}) {
    const { data = [], isLoading, isError } = useQuery({ queryKey, queryFn })

    if (isLoading) return <div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i}><Skeleton className="h-12" /></div>)}</div>
    if (isError) return <ErrorState description="Failed to load report data" />
    if ((data as object[]).length === 0) return (
        <div className="py-12 text-center text-[13px] text-[#98A2B3]">No data available</div>
    )

    return (
        <div className="overflow-x-auto rounded-xl border border-[#E4E7EC]">
            <table className="w-full text-[13px]">
                <thead className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                    <tr>
                        {columns.map(c => (
                            <th key={c.key} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F9FAFB] bg-white">
                    {(data as Record<string, unknown>[]).map((row, i) => (
                        <motion.tr
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="hover:bg-[#F9FAFB] transition-colors"
                        >
                            {columns.map(c => (
                                <td key={c.key} className="px-4 py-3 text-[#374151]">
                                    {c.format ? c.format(row[c.key]) : String(row[c.key] ?? '—')}
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function BillingReport() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['reports', 'billing'],
        queryFn: reports.billing,
    })

    if (isLoading) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map(i => <div key={i}><Skeleton className="h-24" /></div>)}</div>
    if (isError) return <ErrorState description="Failed to load billing report" />
    if (!data) return null

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
                { label: 'Total Revenue', value: `LKR ${data.total_sales?.toLocaleString() ?? 0}`, accent: '#DC2626' },
                { label: 'Paid', value: `LKR ${data.paid_bills_amount?.toLocaleString() ?? 0}`, accent: '#16A34A' },
                { label: 'Pending', value: `LKR ${data.pending_bills_amount?.toLocaleString() ?? 0}`, accent: '#D97706' },
                { label: 'Outstanding', value: `LKR ${data.outstanding_amount?.toLocaleString() ?? 0}`, accent: '#2563EB' },
            ].map(({ label, value, accent }) => (
                <Card key={label} className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-2">{label}</p>
                    <p className="text-[20px] font-bold" style={{ color: accent }}>{value}</p>
                </Card>
            ))}
        </div>
    )
}

function AuditLog() {
    return (
        <GenericTable
            queryKey={['reports', 'audit']}
            queryFn={() => reports.auditLogs(50) as Promise<object[]>}
            columns={[
                { key: 'timestamp', label: 'Time', format: v => v ? new Date(v as string).toLocaleString() : '—' },
                { key: 'user_id', label: 'User' },
                { key: 'action', label: 'Action' },
                { key: 'entity', label: 'Entity' },
                { key: 'entity_id', label: 'Entity ID', format: v => v ? String(v).slice(-8) : '—' },
            ]}
        />
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('client')

    return (
        <div className="space-y-5 pb-10">
            <div>
                <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Reports' }]} />
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF1F1] border border-[#FECACA]">
                        <BarChart3 className="h-4 w-4 text-[#DC2626]" />
                    </div>
                    <div>
                        <h1 className="text-dashboard-title">Reports</h1>
                        <p className="text-[13px] text-[#98A2B3] mt-0.5">Business analytics & audit trail</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hidden">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={[
                            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition cursor-pointer',
                            activeTab === id
                                ? 'bg-[#DC2626] text-white shadow-sm'
                                : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]',
                        ].join(' ')}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                {activeTab === 'client' && <ClientSearch />}

                {activeTab === 'item' && (
                    <GenericTable
                        queryKey={['reports', 'item-wise']}
                        queryFn={reports.itemWise as () => Promise<object[]>}
                        columns={[
                            { key: 'item_name', label: 'Item Name' },
                            { key: 'total_received', label: 'Total Received' },
                            { key: 'total_delivered', label: 'Total Delivered' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'client_count', label: 'Clients' },
                        ]}
                    />
                )}

                {activeTab === 'gatepass' && (
                    <GenericTable
                        queryKey={['reports', 'gatepass-wise']}
                        queryFn={reports.gatepassWise as () => Promise<object[]>}
                        columns={[
                            { key: 'gate_pass_number', label: 'GP No.' },
                            { key: 'client_name', label: 'Client' },
                            { key: 'receiving_date', label: 'Date', format: v => v ? new Date(v as string).toLocaleDateString() : '—' },
                            { key: 'status', label: 'Status' },
                            { key: 'total_received', label: 'Received' },
                            { key: 'total_delivered', label: 'Delivered' },
                        ]}
                    />
                )}

                {activeTab === 'billing' && <BillingReport />}

                {activeTab === 'audit' && <AuditLog />}
            </motion.div>
        </div>
    )
}
