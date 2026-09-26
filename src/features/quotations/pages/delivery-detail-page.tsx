import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck, Calendar, User, Package, Pencil, X, Check, Scale, Undo2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { DATE_CORRECTION_REASONS, dateCorrectionReasonLabel } from '../../../lib/date-corrections'
import {
    BALANCE_ADJUSTMENT_DIRECTION_HINT,
    BALANCE_ADJUSTMENT_REASONS,
    BALANCE_ADJUSTMENT_VOID_REASONS,
    balanceAdjustmentDirection,
    balanceAdjustmentReasonLabel,
    balanceItemKey,
    type BalanceAdjustmentReason,
    type BalanceAdjustmentVoidReason,
} from '../../../lib/balance-adjustments'
import type { DeliveryBalanceItem, GatePassBalanceItem } from '../../../types/operations'
import {
    useCreateBalanceAdjustment,
    useDelivery,
    useDeliveryAdjustments,
    useDeliveryBalanceReport,
    useUpdateDeliveryDate,
    useVoidBalanceAdjustment,
} from '../hooks/useDeliveries'
import { useGatePassBalance } from '../hooks/useGatePasses'

type EditingRow = { itemKey: string; itemName: string; specification: string | null } | null

export default function DeliveryDetailPage() {
    const { id } = useParams()
    const { data: delivery, isLoading, isError, error } = useDelivery(id)
    const updateDeliveryDate = useUpdateDeliveryDate()
    const { data: report } = useDeliveryBalanceReport(id)
    // Every correction on the GATE PASS, not just the ones attached to this
    // delivery. A correction posted against the pass as a whole moves this
    // delivery's running balance (it is folded into the "previous" column), so
    // listing only the delivery-scoped ones showed a balance that no visible
    // correction accounted for.
    const { data: adjustments } = useDeliveryAdjustments({
        gate_pass_id: delivery?.gate_pass_id,
        delivery_id: id ?? '',
    })
    // The LIVE balance for the pass. The report below is a historical statement
    // about this one note; showing its "current" column as the outstanding
    // quantity went stale the moment the client was served again.
    const { data: liveBalance } = useGatePassBalance(delivery?.gate_pass_id)
    const createAdjustment = useCreateBalanceAdjustment()
    const voidAdjustment = useVoidBalanceAdjustment()

    const [editingDate, setEditingDate] = useState(false)
    const [dateValue, setDateValue] = useState('')
    const [dateReason, setDateReason] = useState('')

    const [editingRow, setEditingRow] = useState<EditingRow>(null)
    const [adjustmentQty, setAdjustmentQty] = useState('')
    const [adjustmentReason, setAdjustmentReason] = useState<BalanceAdjustmentReason | ''>('')
    const [adjustmentNotes, setAdjustmentNotes] = useState('')

    const [voidingId, setVoidingId] = useState<string | null>(null)
    const [voidReason, setVoidReason] = useState<BalanceAdjustmentVoidReason | ''>('')

    const liveAdjustments = useMemo(
        () => (adjustments ?? []).filter(a => a.status === 'POSTED'),
        [adjustments],
    )

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-32" />
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (isError) {
        return <ErrorState description={error instanceof Error ? error.message : 'Unable to load delivery'} />
    }

    if (!delivery) {
        return <EmptyState title="Delivery not found" description="It may have been removed." />
    }

    const totalPieces = delivery.items.reduce((s: number, i: any) => s + i.quantity, 0)
    const balanceByKey = new Map<string, DeliveryBalanceItem>(
        (report?.items ?? []).map(row => [row.item_key, row]),
    )
    const liveByKey = new Map<string, GatePassBalanceItem>(
        (liveBalance?.items ?? []).map((row: GatePassBalanceItem) => [row.item_key, row]),
    )
    const thisDeliveryId = delivery.id
    const liveOutstandingTotal = liveBalance?.totals.outstanding_delivery_qty ?? null

    const startEditDate = () => {
        setDateValue((delivery.delivery_date || '').slice(0, 10))
        setDateReason('')
        setEditingDate(true)
    }

    const submitDate = () => {
        if (!id || !dateValue) return
        updateDeliveryDate.mutate(
            { id, delivery_date: dateValue, reason: dateReason },
            { onSuccess: () => setEditingDate(false) },
        )
    }

    const startAdjustment = (item: any) => {
        setEditingRow({
            itemKey: balanceItemKey(item.item_name, item.specification),
            itemName: item.item_name,
            specification: item.specification,
        })
        setAdjustmentQty('')
        setAdjustmentReason('')
        setAdjustmentNotes('')
    }

    const direction = balanceAdjustmentDirection(adjustmentReason)
    // The reason decides the sign, so a correction can never be aimed at the
    // client by accident. The magnitude stays the only thing typed by hand.
    const signedQty = (() => {
        const magnitude = Math.abs(Number(adjustmentQty))
        if (!magnitude || Number.isNaN(magnitude) || !direction) return 0
        return direction === 'credit' ? magnitude : -magnitude
    })()

    const submitAdjustment = () => {
        if (!id || !editingRow || !adjustmentReason || !signedQty) return
        createAdjustment.mutate(
            {
                gate_pass_id: delivery.gate_pass_id,
                delivery_id: id,
                item_name: editingRow.itemName,
                specification: editingRow.specification,
                quantity: signedQty,
                reason: adjustmentReason,
                notes: adjustmentNotes || null,
            },
            { onSuccess: () => setEditingRow(null) },
        )
    }

    return (
        <div className="space-y-5 pb-10">
            <div className="flex items-start gap-3">
                <Link to="/deliveries" className="mt-1 text-[#98A2B3] hover:text-[#374151] transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <Breadcrumb
                        items={[
                            { label: 'Dashboard', href: '/' },
                            { label: 'Deliveries', href: '/deliveries' },
                            { label: delivery.client_name },
                        ]}
                    />
                    <h1 className="text-dashboard-title mt-1">{delivery.client_name}</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        Gate Pass: <span className="font-mono">{delivery.gate_pass_id}</span>
                    </p>
                </div>
            </div>

            {/* Info Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Delivery date — editable to correct human error */}
                <Card className="p-3">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#98A2B3]" />
                            <p className="text-[11px] text-[#98A2B3] font-medium uppercase tracking-wide">Delivery Date</p>
                        </div>
                        {!editingDate && (
                            <button
                                onClick={startEditDate}
                                className="cursor-pointer text-[#6B7280] transition hover:text-[#2563EB]"
                                title="Correct delivery date"
                                aria-label="Correct the delivery date"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    {editingDate ? (
                        /* The date card grows three fields tall while its three
                           neighbours stay one line. On a phone the grid is two
                           columns, so it takes the full width rather than
                           leaving a hole beside a stretched neighbour. */
                        <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
                            <input
                                type="date"
                                aria-label="Delivery date"
                                value={dateValue}
                                onChange={e => setDateValue(e.target.value)}
                                className="h-9 w-full rounded-lg border border-[#BFDBFE] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                            />
                            <select
                                aria-label="Reason for the date correction"
                                value={dateReason}
                                onChange={e => setDateReason(e.target.value)}
                                className="h-9 w-full cursor-pointer rounded-lg border border-[#BFDBFE] bg-white px-3 text-[12.5px] outline-none focus:border-[#2563EB]"
                            >
                                <option value="">Reason required…</option>
                                {DATE_CORRECTION_REASONS.map(r => (
                                    <option key={r} value={r}>{dateCorrectionReasonLabel(r)}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <Button
                                    onClick={submitDate}
                                    disabled={!dateValue || !dateReason || updateDeliveryDate.isPending}
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    {updateDeliveryDate.isPending ? 'Saving…' : 'Save date'}
                                </Button>
                                <Button variant="ghost" onClick={() => setEditingDate(false)}>
                                    <X className="h-3.5 w-3.5" /> Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[13px] font-semibold text-[#101828]">{formatDate(delivery.delivery_date)}</p>
                    )}
                </Card>

                {[
                    { icon: User, label: 'Delivered By', value: delivery.delivered_by },
                    { icon: User, label: 'Received By', value: delivery.received_by },
                    { icon: Package, label: 'Total Pieces', value: `${totalPieces} pcs` },
                ].map(({ icon: Icon, label, value }) => (
                    <Card key={label} className="p-3">
                        <div className="mb-1 flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-[#98A2B3]" />
                            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">
                                {label}
                            </p>
                        </div>
                        <p className="truncate text-[13px] font-semibold text-[#101828]" title={value || '—'}>
                            {value || '—'}
                        </p>
                    </Card>
                ))}
            </div>

            {delivery.notes && (
                <Card className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-1">Notes</p>
                    <p className="text-[13px] text-[#374151]">{delivery.notes}</p>
                </Card>
            )}

            {/* Items */}
            <Card>
                <CardHeader className="border-b border-[#F2F4F7] pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                            <Truck className="h-4 w-4 text-[#16A34A]" />
                        </div>
                        <CardTitle>Delivered Items</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="divide-y divide-[#F9FAFB]">
                        {delivery.items.map((item: any, i: number) => {
                            const rowKey = balanceItemKey(item.item_name, item.specification)
                            const balance = balanceByKey.get(rowKey)
                            const live = liveByKey.get(rowKey)
                            const isEditing = editingRow?.itemKey === rowKey
                            // Outstanding NOW, for the whole gate pass. The note's
                            // own "current balance" is a historical figure for
                            // this one note and went stale as soon as the client
                            // was served again, so it is shown as a separate,
                            // clearly-labelled column rather than as the balance.
                            const outstanding = live?.outstanding_delivery_qty ?? 0
                            const outstandingKnown = live !== undefined
                            const noteBalance = balance?.current_balance_qty ?? 0
                            return (
                                <div key={i} className="py-3.5">
                                    <div className="flex items-start justify-between gap-3 sm:items-center">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="h-8 w-8 flex shrink-0 items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-bold text-[12px]">
                                                {item.item_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-medium text-[#101828]">
                                                    {item.item_name}
                                                    {item.specification && (
                                                        <span className="ml-2 inline-flex items-center rounded bg-[#FFF7ED] border border-[#FED7AA] px-1.5 py-0.5 text-[10px] font-semibold text-[#EA580C]">
                                                            {item.specification}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[#6B7280]">
                                                    {!outstandingKnown ? (
                                                        <span className="text-[#98A2B3]">Loading balance…</span>
                                                    ) : outstanding > 0 ? (
                                                        <>
                                                            <span className="font-semibold text-[#B45309] tabular-nums">
                                                                {outstanding}
                                                            </span>{' '}
                                                            pcs still outstanding on this pass
                                                        </>
                                                    ) : (
                                                        <>Nothing outstanding on this pass</>
                                                    )}
                                                </p>
                                                {balance && noteBalance !== outstanding && (
                                                    <p className="mt-0.5 text-[11px] text-[#98A2B3]">
                                                        {noteBalance} pcs were outstanding when this note was cut
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="text-[14px] font-semibold tabular-nums text-[#101828]">
                                                {item.quantity} pcs
                                            </span>
                                            <button
                                                onClick={() => (isEditing ? setEditingRow(null) : startAdjustment(item))}
                                                className="text-[#6B7280] hover:text-[#2563EB] transition cursor-pointer"
                                                title="Correct this balance"
                                                aria-label={`Correct the balance for ${item.item_name}`}
                                            >
                                                {isEditing ? <X className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3">
                                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]">
                                                Correct balance — {item.item_name}
                                            </p>
                                            {/* Every control is 36px so the row of
                                                fields and the row of buttons share
                                                one baseline. The number field is
                                                absolutely positioned against its
                                                sign badge so the badge can never
                                                shift the input as the typed value
                                                changes width. */}
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <label className="block min-w-0">
                                                    <span className="mb-1 block text-[11px] font-medium text-[#475467]">
                                                        Why
                                                    </span>
                                                    <select
                                                        value={adjustmentReason}
                                                        onChange={e => setAdjustmentReason(e.target.value as BalanceAdjustmentReason)}
                                                        className="h-9 w-full cursor-pointer rounded-lg border border-[#BFDBFE] bg-white px-3 text-[12.5px] text-[#101828] outline-none focus:border-[#2563EB]"
                                                    >
                                                        <option value="">Select a reason…</option>
                                                        {BALANCE_ADJUSTMENT_REASONS.map(r => (
                                                            <option key={r} value={r}>
                                                                {balanceAdjustmentReasonLabel(r)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="block min-w-0">
                                                    <span className="mb-1 block text-[11px] font-medium text-[#475467]">
                                                        Pieces
                                                    </span>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            step={1}
                                                            inputMode="numeric"
                                                            value={adjustmentQty}
                                                            onChange={e => setAdjustmentQty(e.target.value)}
                                                            placeholder="0"
                                                            className="h-9 w-full rounded-lg border border-[#BFDBFE] bg-white px-3 text-[13px] tabular-nums outline-none focus:border-[#2563EB]"
                                                        />
                                                        {direction && (
                                                            <span
                                                                className={`pointer-events-none absolute inset-y-0 right-2 my-auto flex h-6 items-center rounded px-1.5 text-[11px] font-bold tabular-nums ${
                                                                    direction === 'credit'
                                                                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                                                                        : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                                                                }`}
                                                            >
                                                                {signedQty > 0 ? `+${signedQty}` : signedQty}
                                                            </span>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                            <label className="mt-2 block">
                                                <span className="mb-1 block text-[11px] font-medium text-[#475467]">
                                                    Notes <span className="font-normal text-[#98A2B3]">(optional)</span>
                                                </span>
                                                <input
                                                    value={adjustmentNotes}
                                                    onChange={e => setAdjustmentNotes(e.target.value)}
                                                    placeholder="Anything the next person needs to know"
                                                    className="h-9 w-full rounded-lg border border-[#BFDBFE] bg-white px-3 text-[12.5px] outline-none focus:border-[#2563EB]"
                                                />
                                            </label>
                                            {direction ? (
                                                <p className="mt-2 text-[11.5px] text-[#475467]">
                                                    {BALANCE_ADJUSTMENT_DIRECTION_HINT[direction]}
                                                </p>
                                            ) : (
                                                <p className="mt-2 text-[11.5px] text-[#6B7280]">
                                                    Pick a reason — it decides whether the balance goes up or down.
                                                </p>
                                            )}
                                            <p className="mt-1 text-[11px] text-[#6B7280]">
                                                Pieces only — this never changes the bill.
                                            </p>
                                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                                <Button
                                                    onClick={submitAdjustment}
                                                    disabled={!adjustmentReason || !signedQty || createAdjustment.isPending}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    {createAdjustment.isPending ? 'Posting…' : 'Post correction'}
                                                </Button>
                                                <Button variant="ghost" onClick={() => setEditingRow(null)}>
                                                    <X className="h-3.5 w-3.5" /> Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="border-t border-t-[#E4E7EC] mt-2 pt-3 flex items-center justify-between">
                        <span className="text-[13px] text-[#6B7280]">Total on this note</span>
                        <span className="text-[15px] font-bold tabular-nums text-[#101828]">{totalPieces} pieces</span>
                    </div>
                    {liveOutstandingTotal !== null && (
                        <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[13px] text-[#6B7280]">Outstanding on the gate pass</span>
                            <span
                                className={`text-[15px] font-bold tabular-nums ${
                                    liveOutstandingTotal > 0 ? 'text-[#B45309]' : 'text-[#16A34A]'
                                }`}
                            >
                                {liveOutstandingTotal} pieces
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Corrections on the gate pass. Pass-level ones count here too: a
                correction with no delivery attached still moves this delivery's
                previous balance, so hiding it made the note's arithmetic
                impossible to account for on screen. */}
            {adjustments && adjustments.length > 0 && (
                <Card>
                    <CardHeader className="border-b border-[#F2F4F7] pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
                                <Scale className="h-4 w-4 text-[#D97706]" />
                            </div>
                            <CardTitle>Balance Corrections</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="divide-y divide-[#F9FAFB]">
                            {adjustments.map(adj => {
                                const onThisDelivery = adj.delivery_id === thisDeliveryId
                                return (
                                <div key={adj.id} className="flex items-start justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-medium text-[#101828]">
                                            {adj.item_name}
                                            {adj.specification && (
                                                <span className="ml-2 text-[11px] text-[#6B7280]">{adj.specification}</span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-[#6B7280]">
                                            {balanceAdjustmentReasonLabel(adj.reason)}
                                            {adj.notes ? ` — ${adj.notes}` : ''}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-[#98A2B3]">
                                            {adj.created_by} · {formatDate(adj.created_at)}
                                            {' · '}
                                            {onThisDelivery ? 'this note' : 'whole gate pass'}
                                        </p>
                                        {adj.status === 'VOID' && adj.void_reason && (
                                            <p className="mt-0.5 text-[11px] text-[#98A2B3]">
                                                Voided: {balanceAdjustmentReasonLabel(adj.void_reason)}
                                                {adj.voided_by ? ` by ${adj.voided_by}` : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span
                                            className={`text-[13px] font-bold tabular-nums ${
                                                adj.status === 'VOID'
                                                    ? 'text-[#98A2B3] line-through'
                                                    : adj.quantity > 0
                                                      ? 'text-[#16A34A]'
                                                      : 'text-[#DC2626]'
                                            }`}
                                        >
                                            {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                                        </span>
                                        {adj.status === 'POSTED' && (
                                            <button
                                                onClick={() => {
                                                    setVoidingId(adj.id)
                                                    setVoidReason('')
                                                }}
                                                className="cursor-pointer text-[#6B7280] transition hover:text-[#DC2626]"
                                                title="Void this correction"
                                                aria-label={`Void the correction for ${adj.item_name}`}
                                            >
                                                <Undo2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                        {liveAdjustments.length === 0 && (
                            <p className="py-3 text-[12px] text-[#98A2B3]">
                                Every correction on this gate pass has been voided.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Link to Gate Pass. Styled as the link it is — a <button> nested
                inside the anchor gave the card two competing focus targets and
                an interactive element inside a link. */}
            <Card className="border-[#BFDBFE] bg-[#EFF6FF] p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="mb-0.5 text-[12px] font-semibold uppercase tracking-wide text-[#2563EB]">
                            Associated Gate Pass
                        </p>
                        <p className="truncate font-mono text-[13px] text-[#374151]">{delivery.gate_pass_id}</p>
                    </div>
                    <Link
                        to={`/gate-passes/${delivery.gate_pass_id}`}
                        className="shrink-0 text-[13px] font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
                    >
                        View gate pass →
                    </Link>
                </div>
            </Card>

            {/* Void a correction. This reverses it rather than deleting it, so
                the original stays on record and the balance returns to what it
                was. */}
            <Dialog
                open={!!voidingId}
                onOpenChange={open => {
                    if (!open) setVoidingId(null)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void this correction</DialogTitle>
                        <DialogDescription>
                            The correction stays on record but stops counting towards the balance.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <label
                            htmlFor="void-reason"
                            className="mb-1 block text-[12px] font-medium text-[#475467]"
                        >
                            Reason required
                        </label>
                        <select
                            id="void-reason"
                            value={voidReason}
                            onChange={e => setVoidReason(e.target.value as BalanceAdjustmentVoidReason)}
                            className="h-9 w-full cursor-pointer rounded-lg border border-[#BFDBFE] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                        >
                            <option value="">Select a reason…</option>
                            {BALANCE_ADJUSTMENT_VOID_REASONS.map(r => (
                                <option key={r} value={r}>
                                    {balanceAdjustmentReasonLabel(r)}
                                </option>
                            ))}
                        </select>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setVoidingId(null)}
                            disabled={voidAdjustment.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (!voidingId || !voidReason) return
                                voidAdjustment.mutate(
                                    { id: voidingId, reason: voidReason },
                                    { onSuccess: () => setVoidingId(null) },
                                )
                            }}
                            disabled={!voidReason || voidAdjustment.isPending}
                        >
                            {voidAdjustment.isPending ? 'Voiding…' : 'Void correction'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
