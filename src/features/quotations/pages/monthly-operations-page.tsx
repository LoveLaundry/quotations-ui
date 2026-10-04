import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, CalendarDays, Info, PackageOpen, RefreshCw } from 'lucide-react'
import { useHotelScope } from '../../../context/HotelContext'
import {
    useActivateDelivery,
    useActivateGatePass,
    useCancelMonthlyDay,
    useConfirmMonthlyDay,
    useMonthlyMatrix,
    useSaveDayQuantities,
    type MonthlyMatrixParams,
} from '../hooks/useMonthly'
import { useDeliveries } from '../hooks/useDeliveries'
import { useGatePasses } from '../hooks/useGatePasses'
import { useQuotations } from '../hooks/useQuotations'
import { deliveries as deliveriesApi, type PendingGatePass } from '../services/delivery.service'
import { useQuery } from '@tanstack/react-query'
import {
    Badge,
    Button,
    Card,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    EmptyState,
    ErrorState,
    Field,
    Input,
    Notice,
    Select,
    Skeleton,
    Tabs,
    Textarea,
} from '../../../components/ui'
import { cn } from '../../../lib/utils'
import {
    MONTHLY_KINDS,
    MONTHLY_KIND_LABELS,
    MONTHLY_SOURCE_MODES,
    monthlyItemKey,
    type MonthlyDayState,
    type MonthlyItemRow,
    type MonthlyKind,
    type MonthlyMatrixResponse,
    type MonthlySourceMode,
} from '../../../types/monthly'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_HEAD = 'px-2 py-1.5 text-center text-[11px] font-semibold text-[var(--text-tertiary)] uppercase'
const CELL_BASE =
    'h-9 w-9 border-r border-b border-[var(--border)] text-center align-middle text-[12.5px] tabular-nums'

const DAY_TONE: Record<string, { head: string; badge: 'neutral' | 'info' | 'success' | 'danger' }> = {
    EMPTY: { head: 'bg-[var(--surface-2)]', badge: 'neutral' },
    DRAFT: { head: 'bg-[var(--info-soft)]', badge: 'info' },
    CONFIRMED: { head: 'bg-[var(--success-soft)]', badge: 'success' },
    CANCELLED: { head: 'bg-[var(--danger-soft)]', badge: 'danger' },
}

const MONTH_YEAR = (() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
})()

// ─────────────────────────────────────────────────────────────────────────────
// Day dialog
// ─────────────────────────────────────────────────────────────────────────────

interface DayDialogProps {
    params: MonthlyMatrixParams
    day: number
    dayState: MonthlyDayState | undefined
    rows: MonthlyItemRow[]
    onClose: () => void
}

/**
 * One day's quantities plus the three ways a day can leave DRAFT.
 *
 * Confirming is the only action that creates records, and what it creates
 * depends on the kind: a gate pass, deliveries off existing passes, or rewash
 * records. Activating a created record is deliberately a separate, explicit
 * step shown here - until it is pressed the record is invisible to every
 * balance in the system.
 */
function DayDialog({ params, day, dayState, rows, onClose }: DayDialogProps) {
    const status = dayState?.status ?? 'EMPTY'
    const isConfirmed = status === 'CONFIRMED'
    const [quantities, setQuantities] = useState<Record<string, number>>(() => ({ ...(dayState?.quantities ?? {}) }))
    const [receivedBy, setReceivedBy] = useState('')
    const [deliveredBy, setDeliveredBy] = useState('')
    const [notes, setNotes] = useState(dayState?.notes ?? '')
    const [chargeable, setChargeable] = useState(false)
    const [sourceMode, setSourceMode] = useState<MonthlySourceMode>('same_day')
    const [manual, setManual] = useState<Record<string, boolean>>({})
    const [manualQtys, setManualQtys] = useState<Record<string, number>>({})

    const save = useSaveDayQuantities(params)
    const confirm = useConfirmMonthlyDay(params)
    const cancelDay = useCancelMonthlyDay(params)
    const activateGp = useActivateGatePass()
    const activateDlv = useActivateDelivery()

    // Record statuses drive whether "Activate" is offered at all.
    const { data: gatePassList = [] } = useGatePasses(params.clientName ? { client_name: params.clientName } : undefined)
    const { data: deliveryList = [] } = useDeliveries(params.clientName ? { client_name: params.clientName } : undefined)
    const gpStatus = useMemo(() => new Map(gatePassList.map((g) => [g.id, g.status])), [gatePassList])
    const dlvStatus = useMemo(() => new Map(deliveryList.map((d) => [d.id, d.status])), [deliveryList])

    const { data: pending = [], isLoading: pendingLoading } = useQuery<PendingGatePass[]>({
        queryKey: ['monthly', 'pending-sources', params.clientName],
        queryFn: () => deliveriesApi.pendingGatePasses(params.clientName),
        enabled: params.kind === 'delivery' && sourceMode === 'manual' && Boolean(params.clientName),
    })

    const total = Object.values(quantities).reduce((sum, q) => sum + (Number(q) || 0), 0)
    const busy = save.isPending || confirm.isPending || cancelDay.isPending

    const setQty = (key: string, raw: string) => {
        const n = parseInt(raw, 10)
        setQuantities((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }))
    }

    const payload = () => {
        const clean: Record<string, number> = {}
        for (const [key, qty] of Object.entries(quantities)) {
            const n = Number(qty) || 0
            if (n > 0) clean[key] = n
        }
        return clean
    }

    const manualSources = () => {
        const sources = pending
            .filter((p) => manual[p.gate_pass_id])
            .map((p) => ({
                gate_pass_id: p.gate_pass_id,
                items: p.items
                    .map((it) => ({
                        item_name: it.item_name,
                        specification: it.specification,
                        category: it.category,
                        quantity: Number(manualQtys[`${p.gate_pass_id}||${it.item_name}||${it.specification}`] ?? it.pending_qty) || 0,
                    }))
                    .filter((it) => it.quantity > 0),
            }))
            .filter((s) => s.items.length > 0)
        return sources
    }

    const confirmDay = () => {
        if (sourceMode === 'manual' && manualSources().length === 0) {
            toast.error('Choose at least one gate pass with a quantity')
            return
        }
        confirm.mutate(
            {
                day,
                payload: {
                    quotation_id: params.quotationId ?? null,
                    received_by: params.kind === 'receiving' ? receivedBy || null : null,
                    delivered_by: params.kind === 'delivery' ? deliveredBy || null : null,
                    source_mode: params.kind === 'delivery' ? sourceMode : null,
                    sources: params.kind === 'delivery' && sourceMode === 'manual' ? manualSources() : null,
                    chargeable: params.kind === 'rewash' ? chargeable : null,
                    notes: notes || null,
                },
            },
            {
                onSuccess: () => {
                    // Refetch so the record lists below reflect the new IDs.
                    onClose()
                },
            },
        )
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {params.kind === 'receiving' ? 'Receiving' : params.kind === 'delivery' ? 'Deliveries' : 'Rewash'} · {day} {MONTH_NAMES[params.month - 1]} {params.year}
                    </DialogTitle>
                    <DialogDescription>
                        {isConfirmed
                            ? 'Confirmed. Its records are live - corrections happen on the records themselves.'
                            : 'Enter quantities, then save as a draft or confirm to create records.'}
                    </DialogDescription>
                </DialogHeader>

                <DialogBody className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={DAY_TONE[status].badge} dot>{status === 'EMPTY' ? 'Not started' : status}</Badge>
                        <Badge tone="neutral">Total {total} pcs</Badge>
                        {dayState?.confirmed_at && (
                            <span className="text-[12px] text-[var(--text-faint)]">
                                Confirmed {new Date(dayState.confirmed_at).toLocaleString()}
                            </span>
                        )}
                    </div>

                    {isConfirmed && (
                        <Notice tone="info" title="Locked">
                            This day is confirmed. To reverse it, cancel the {dayState?.gate_pass_ids.length || dayState?.delivery_ids.length || dayState?.rewash_ids.length || 0} record(s) below from their own pages — the
                            monthly grid will not edit live quantities.
                        </Notice>
                    )}

                    <div className="overflow-hidden rounded border border-[var(--border)]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[var(--surface-2)]">
                                    <th className="border-b border-[var(--border)] px-3 py-1.5 text-left text-[11px] font-semibold uppercase text-[var(--text-tertiary)]">Item</th>
                                    <th className="w-24 border-b border-[var(--border)] px-2 py-1.5 text-right text-[11px] font-semibold uppercase text-[var(--text-tertiary)]">Price</th>
                                    <th className="w-24 border-b border-[var(--border)] px-2 py-1.5 text-center text-[11px] font-semibold uppercase text-[var(--text-tertiary)]">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => {
                                    const key = monthlyItemKey(row.item_name, row.specification)
                                    return (
                                        <tr key={key}>
                                            <td className="border-b border-[var(--border)] px-3 py-1 text-[13px] text-[var(--text-primary)]">
                                                {row.item_name}
                                                {row.specification && <span className="text-[var(--text-faint)]"> · {row.specification}</span>}
                                            </td>
                                            <td className="border-b border-[var(--border)] px-2 py-1 text-right text-[12.5px] tabular-nums text-[var(--text-tertiary)]">
                                                {row.has_price ? row.unit_price.toFixed(2) : '—'}
                                            </td>
                                            <td className="border-b border-[var(--border)] p-0 text-center">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    disabled={isConfirmed}
                                                    value={quantities[key] ?? 0}
                                                    onChange={(e) => setQty(key, e.target.value)}
                                                    className="h-8 w-20 bg-transparent text-center text-[13px] tabular-nums outline-none focus:bg-[var(--brand-soft)] disabled:text-[var(--text-faint)]"
                                                />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {!isConfirmed && (
                        <>
                            {params.kind === 'receiving' && (
                                <Field label="Received by" hint="Optional - appears on the generated gate pass.">
                                    <Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="e.g. Nimal" />
                                </Field>
                            )}

                            {params.kind === 'delivery' && (
                                <Field label="Source of stock" hint={MONTHLY_SOURCE_MODES.find((m) => m.value === sourceMode)?.hint}>
                                    <Select value={sourceMode} onChange={(e) => setSourceMode(e.target.value as MonthlySourceMode)}>
                                        {MONTHLY_SOURCE_MODES.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </Select>
                                </Field>
                            )}

                            {params.kind === 'delivery' && sourceMode === 'manual' && (
                                <div className="space-y-2">
                                    <p className="text-[12.5px] font-medium text-[var(--text-secondary)]">Pending gate passes</p>
                                    {pendingLoading && <Skeleton className="h-16" />}
                                    {!pendingLoading && pending.length === 0 && (
                                        <Notice tone="warning" title="Nothing pending">
                                            No gate pass has stock left to deliver for this hotel.
                                        </Notice>
                                    )}
                                    {pending.map((p: PendingGatePass) => (
                                        <label key={p.gate_pass_id} className="flex cursor-pointer items-start gap-2 rounded border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-hover)]">
                                            <Checkbox
                                                checked={Boolean(manual[p.gate_pass_id])}
                                                onChange={(e) => setManual((prev) => ({ ...prev, [p.gate_pass_id]: e.target.checked }))}
                                                className="mt-0.5"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)]">
                                                    {p.gate_pass_number}
                                                    <span className="text-[12px] font-normal text-[var(--text-faint)]">{String(p.receiving_date).slice(0, 10)}</span>
                                                </span>
                                                <span className="mt-1 flex flex-wrap gap-2">
                                                    {p.items.filter((it) => it.pending_qty > 0).map((it) => {
                                                        const mkey = `${p.gate_pass_id}||${it.item_name}||${it.specification}`
                                                        return (
                                                            <span key={mkey} className="inline-flex items-center gap-1 text-[12px] text-[var(--text-tertiary)]">
                                                                {it.item_name}
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    disabled={!manual[p.gate_pass_id]}
                                                                    value={manualQtys[mkey] ?? it.pending_qty}
                                                                    onChange={(e) => setManualQtys((prev) => ({ ...prev, [mkey]: parseInt(e.target.value, 10) || 0 }))}
                                                                    className="h-6 w-14 rounded border border-[var(--border)] bg-[var(--surface)] px-1 text-center text-[12px] tabular-nums outline-none focus:border-[var(--brand)] disabled:opacity-50"
                                                                />
                                                                <span className="text-[var(--text-faint)]">/ {it.pending_qty}</span>
                                                            </span>
                                                        )
                                                    })}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {params.kind === 'delivery' && (
                                <Field label="Delivered by" hint="Optional.">
                                    <Input value={deliveredBy} onChange={(e) => setDeliveredBy(e.target.value)} placeholder="e.g. Saman" />
                                </Field>
                            )}

                            {params.kind === 'rewash' && (
                                <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--border)] px-3 py-2">
                                    <Checkbox checked={chargeable} onChange={(e) => setChargeable(e.target.checked)} className="mt-0.5" />
                                    <span className="text-[13px] text-[var(--text-primary)]">
                                        Chargeable rewash
                                        <span className="mt-0.5 block text-[12px] text-[var(--text-faint)]">
                                            Off by default — rewashed linen is re-processed, not billed, until you tick this.
                                        </span>
                                    </span>
                                </label>
                            )}

                            <Field label="Notes" hint="Optional - stored on the day and its records.">
                                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </Field>
                        </>
                    )}

                    {/* Generated records */}
                    {params.kind === 'receiving' && dayState && dayState.gate_pass_ids.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[12.5px] font-medium text-[var(--text-secondary)]">Gate pass</p>
                            {dayState.gate_pass_ids.map((id) => {
                                const st = gpStatus.get(id)
                                return (
                                    <div key={id} className="flex items-center justify-between gap-2 rounded border border-[var(--border)] px-3 py-2">
                                        <Link to={`/gate-passes/${id}`} className="truncate text-[13px] text-[var(--brand-text)] hover:underline">
                                            {gatePassList.find((g) => g.id === id)?.gate_pass_number ?? id}
                                        </Link>
                                        {st === 'DRAFT' ? (
                                            <Button size="xs" variant="primary" loading={activateGp.isPending} onClick={() => activateGp.mutate(id)}>
                                                Activate
                                            </Button>
                                        ) : (
                                            <Badge tone={st === 'RECEIVED' ? 'success' : 'neutral'}>{st ?? 'unknown'}</Badge>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {params.kind === 'delivery' && dayState && dayState.delivery_ids.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[12.5px] font-medium text-[var(--text-secondary)]">Deliveries</p>
                            {dayState.delivery_ids.map((id) => {
                                const st = dlvStatus.get(id)
                                return (
                                    <div key={id} className="flex items-center justify-between gap-2 rounded border border-[var(--border)] px-3 py-2">
                                        <Link to={`/deliveries/${id}`} className="truncate text-[13px] text-[var(--brand-text)] hover:underline">
                                            DLV-{id.slice(-6)}
                                        </Link>
                                        {st === 'DRAFT' ? (
                                            <Button size="xs" variant="primary" loading={activateDlv.isPending} onClick={() => activateDlv.mutate(id)}>
                                                Activate
                                            </Button>
                                        ) : (
                                            <Badge tone={st === 'DELIVERED' ? 'success' : 'neutral'}>{st ?? 'unknown'}</Badge>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {params.kind === 'rewash' && dayState && dayState.rewash_ids.length > 0 && (
                        <Notice tone="success" title={`${dayState.rewash_ids.length} rewash record(s) created`}>
                            Recorded and counted in stock immediately.
                        </Notice>
                    )}
                </DialogBody>

                <DialogFooter>
                    {!isConfirmed && status !== 'EMPTY' && (
                        <Button
                            variant="danger-ghost"
                            disabled={busy}
                            onClick={() => cancelDay.mutate(day, { onSuccess: onClose })}
                        >
                            Clear day
                        </Button>
                    )}
                    <div className="flex-1" />
                    {!isConfirmed && (
                        <>
                            <Button variant="secondary" loading={save.isPending} disabled={busy} onClick={() => save.mutate({ day, payload: { quantities: payload() } }, { onSuccess: onClose })}>
                                Save draft
                            </Button>
                            <Button
                                variant="primary"
                                loading={confirm.isPending}
                                disabled={busy || total <= 0}
                                onClick={confirmDay}
                            >
                                Confirm day
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Matrix
// ─────────────────────────────────────────────────────────────────────────────

function Matrix({
    data,
    onOpenDay,
}: {
    data: MonthlyMatrixResponse
    onOpenDay: (day: number) => void
}) {
    const dayByNumber = useMemo(() => new Map(data.days.map((d) => [d.day, d])), [data.days])

    const rowTotals = useMemo(() => {
        const totals: Record<string, number> = {}
        for (const row of data.rows) {
            const key = monthlyItemKey(row.item_name, row.specification)
            let sum = 0
            for (let d = 1; d <= data.month_length; d += 1) sum += data.cells[key]?.[String(d)] ?? 0
            totals[key] = sum
        }
        return totals
    }, [data])

    const dayTotals = useMemo(() => {
        const totals: Record<number, number> = {}
        for (let d = 1; d <= data.month_length; d += 1) {
            let sum = 0
            for (const row of data.rows) {
                const key = monthlyItemKey(row.item_name, row.specification)
                sum += data.cells[key]?.[String(d)] ?? 0
            }
            totals[d] = sum
        }
        return totals
    }, [data])

    const grandTotal = useMemo(
        () => Object.values(rowTotals).reduce((a, b) => a + b, 0),
        [rowTotals],
    )

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="sticky left-0 z-10 min-w-[220px] border-b border-r border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-left text-[11px] font-semibold uppercase text-[var(--text-tertiary)]">
                            Item
                        </th>
                        {Array.from({ length: data.month_length }, (_, i) => i + 1).map((d) => {
                            const st = dayByNumber.get(d)?.status ?? 'EMPTY'
                            return (
                                <th key={d} className={cn(DAY_HEAD, DAY_TONE[st].head)}>
                                    <button
                                        type="button"
                                        onClick={() => onOpenDay(d)}
                                        className="flex w-full flex-col items-center gap-0.5 hover:text-[var(--brand-text)]"
                                        title={`Open day ${d}`}
                                    >
                                        <span>{d}</span>
                                    </button>
                                </th>
                            )
                        })}
                        <th className={cn(DAY_HEAD, 'w-16 bg-[var(--surface-2)]')}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map((row) => {
                        const key = monthlyItemKey(row.item_name, row.specification)
                        return (
                            <tr key={key} className="hover:bg-[var(--surface-hover)]">
                                <td className="sticky left-0 z-10 border-b border-r border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
                                    <span className="block text-[13px] font-medium text-[var(--text-primary)]">{row.item_name}</span>
                                    {(row.specification || row.category) && (
                                        <span className="block text-[11.5px] text-[var(--text-faint)]">
                                            {[row.specification, row.category].filter(Boolean).join(' · ')}
                                        </span>
                                    )}
                                </td>
                                {Array.from({ length: data.month_length }, (_, i) => i + 1).map((d) => {
                                    const qty = data.cells[key]?.[String(d)] ?? 0
                                    const st = dayByNumber.get(d)?.status ?? 'EMPTY'
                                    const locked = st === 'CONFIRMED'
                                    return (
                                        <td key={d} className={cn(CELL_BASE, locked ? 'bg-[var(--surface-2)]' : 'cursor-pointer', 'hover:bg-[var(--brand-soft)]')} onClick={() => onOpenDay(d)}>
                                            <span className={cn(qty > 0 && (locked ? 'text-[var(--text-primary)]' : 'text-[var(--brand-text)]'), qty === 0 && 'text-[var(--text-faint)]')}>
                                                {qty > 0 ? qty : ''}
                                            </span>
                                        </td>
                                    )
                                })}
                                <td className={cn(CELL_BASE, 'bg-[var(--surface-2)] font-semibold')}>{rowTotals[key] || ''}</td>
                            </tr>
                        )
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="sticky left-0 z-10 border-t border-r border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[12px] font-semibold uppercase text-[var(--text-tertiary)]">
                            Day total
                        </td>
                        {Array.from({ length: data.month_length }, (_, i) => i + 1).map((d) => {
                            const st = dayByNumber.get(d)?.status ?? 'EMPTY'
                            return (
                                <td key={d} className={cn(CELL_BASE, DAY_TONE[st].head, 'font-semibold')}>
                                    {dayTotals[d] > 0 ? dayTotals[d] : ''}
                                </td>
                            )
                        })}
                        <td className={cn(CELL_BASE, 'bg-[var(--surface-3)] font-bold')}>{grandTotal}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MonthlyOperationsPage() {
    const { hotel, showAllHotels } = useHotelScope()
    const [kind, setKind] = useState<MonthlyKind>('receiving')
    const [year, setYear] = useState(MONTH_YEAR.year)
    const [month, setMonth] = useState(MONTH_YEAR.month)
    const [quotationId, setQuotationId] = useState('')
    const [openDay, setOpenDay] = useState<number | null>(null)

    const params = useMemo<MonthlyMatrixParams>(
        () => ({ kind, clientName: hotel ?? '', year, month, quotationId: quotationId || null }),
        [kind, hotel, year, month, quotationId],
    )

    const { data, isLoading, isFetching, isError, error, refetch } = useMonthlyMatrix(params)
    const { data: quotations = [] } = useQuotations()

    const hotelQuotations = useMemo(
        () => quotations.filter((q) => hotel && q.client_name === hotel),
        [quotations, hotel],
    )

    // Changing hotel or month must not leave a quotation from the old pair
    // selected — the server would price the new rows from the wrong contract.
    useEffect(() => {
        setQuotationId((current) => (current && hotelQuotations.some((q) => String(q.id) === current) ? current : ''))
    }, [hotelQuotations])

    const openDayState = openDay === null ? undefined : data?.days.find((d) => d.day === openDay)
    const draftDays = data?.days.filter((d) => d.status === 'DRAFT').length ?? 0
    const confirmedDays = data?.days.filter((d) => d.status === 'CONFIRMED').length ?? 0

    if (!hotel) {
        return (
            <div className="space-y-4">
                <h1 className="text-[18px] font-semibold">Monthly Operations</h1>
                <EmptyState
                    title={showAllHotels ? 'Pick a hotel' : 'No hotel selected'}
                    description="Monthly entry is per hotel, so one hotel must be selected before the grid can load. Use the hotel selector in the top bar."
                />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">Monthly Operations</h1>
                    <p className="text-[12.5px] text-[var(--text-muted)]">
                        {hotel} · {MONTH_NAMES[month - 1]} {year} — enter the month, then confirm each day.
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => void refetch()} loading={isFetching}>
                    <RefreshCw /> Refresh
                </Button>
            </div>

            <Tabs
                items={MONTHLY_KINDS.map((k) => ({ value: k, label: MONTHLY_KIND_LABELS[k] }))}
                value={kind}
                onValueChange={(v) => setKind(v as MonthlyKind)}
                aria-label="Monthly operation type"
            />

            <Card className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Month">
                        <Select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
                            {MONTH_NAMES.map((name, i) => (
                                <option key={name} value={i + 1}>{name}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Year">
                        <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || MONTH_YEAR.year)} />
                    </Field>
                    <Field
                        label="Quotation"
                        hint="Prices the rows and travels onto every record this month creates."
                        className="lg:col-span-2"
                    >
                        <Select value={quotationId} onChange={(e) => setQuotationId(e.target.value)}>
                            <option value="">No quotation — show items from history</option>
                            {hotelQuotations.map((q) => (
                                <option key={String(q.id)} value={String(q.id)}>
                                    {q.quotation_title || `Quotation ${q.id}`}
                                    {q.status ? ` · ${q.status}` : ''} · {q.line_items?.length ?? 0} items
                                </option>
                            ))}
                        </Select>
                    </Field>
                </div>

                {hotelQuotations.length === 0 && (
                    <Notice tone="info" title="No quotations for this hotel">
                        <span className="inline-flex items-center gap-1">
                            Rows fall back to the items this hotel has received in the last 90 days, with no price.
                            <Link to="/quotations/new" className="inline-flex items-center gap-0.5 text-[var(--brand-text)] hover:underline">
                                Create one <ArrowRight className="size-3" />
                            </Link>
                        </span>
                    </Notice>
                )}
            </Card>

            {data && (
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
                    <Badge tone="info" dot>{draftDays} draft</Badge>
                    <Badge tone="success" dot>{confirmedDays} confirmed</Badge>
                    <span className="inline-flex items-center gap-1">
                        <Info className="size-3.5" />
                        DRAFT days create records that stay invisible to stock until you activate them.
                    </span>
                </div>
            )}

            {isLoading && (
                <div className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}

            {isError && (
                <ErrorState
                    title="Could not load the month"
                    description={error instanceof Error ? error.message : 'Unexpected error'}
                    action={<Button variant="secondary" onClick={() => void refetch()}>Try again</Button>}
                />
            )}

            {!isLoading && !isError && data && data.rows.length === 0 && (
                <EmptyState
                    title="No items to show"
                    description="This grid lists the items from the selected quotation, or from what this hotel recently received. Pick a quotation to get started."
                    action={<Button variant="primary" onClick={() => setOpenDay(1)}>Enter day 1</Button>}
                />
            )}

            {!isLoading && !isError && data && data.rows.length > 0 && (
                <Card className="overflow-hidden p-0">
                    <Matrix data={data} onOpenDay={setOpenDay} />
                </Card>
            )}

            <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-faint)]">
                <PackageOpen className="size-3.5" />
                Click any day to enter quantities, then confirm it to create gate passes, deliveries or rewash records.
                <CalendarDays className="size-3.5" />
            </p>

            {openDay !== null && data && (
                <DayDialog
                    params={params}
                    day={openDay}
                    dayState={openDayState}
                    rows={data.rows}
                    onClose={() => setOpenDay(null)}
                />
            )}
        </div>
    )
}
