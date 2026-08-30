import { useState, useMemo, Fragment } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    ArrowLeft, ClipboardList, Calendar, User, AlertCircle,
    ChevronDown, Truck, CheckCircle2, Pencil, X, Check, Receipt,
    Plus, Save, Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useGatePass, useUpdateGatePassStatus, useAdjustGatePass, useUpdateGatePassDate, useCreateBillFromGatePass, useUpdateGatePass } from '../hooks/useGatePasses'
import { useDeliveries } from '../hooks/useDeliveries'
import { useQuotation } from '../hooks/useQuotations'
import { ItemNameInput } from './create-gatepass-page'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    RECEIVED: { label: 'Received', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', dot: '#3B82F6' },
    PROCESSING: { label: 'Processing', bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', dot: '#F97316' },
    READY_FOR_DELIVERY: { label: 'Ready', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
    PARTIALLY_DELIVERED: { label: 'Partial Delivery', bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' },
    DELIVERED: { label: 'Delivered', bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', dot: '#16A34A' },
    CANCELLED: { label: 'Cancelled', bg: '#F9FAFB', text: '#6B7280', border: '#E4E7EC', dot: '#9CA3AF' },
}

const TRANSITION_STATUSES = ['RECEIVED', 'PROCESSING', 'READY_FOR_DELIVERY', 'CANCELLED']

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

export default function GatePassDetailPage() {
    const { id } = useParams()
    
    const { data: gp, isLoading, isError, error } = useGatePass(id)
    const { data: deliveries = [] } = useDeliveries({ gate_pass_id: id })
    const updateStatus = useUpdateGatePassStatus()
    const adjust = useAdjustGatePass()

    const [statusOpen, setStatusOpen] = useState(false)
    const [adjustingItem, setAdjustingItem] = useState<string | null>(null)
    const [adjustQty, setAdjustQty] = useState(0)
    const [adjustReason, setAdjustReason] = useState('')

    const updateDate = useUpdateGatePassDate()
    const [editingDate, setEditingDate] = useState(false)
    const [dateValue, setDateValue] = useState('')
    const [dateReason, setDateReason] = useState('')

    const createBill = useCreateBillFromGatePass()
    const [billingOpen, setBillingOpen] = useState(false)
    const [instantBill, setInstantBill] = useState(false)
    const [billNotes, setBillNotes] = useState('')

    const updateGatePass = useUpdateGatePass()
    const [editing, setEditing] = useState(false)
    const [editClientName, setEditClientName] = useState('')
    const [editReceivedBy, setEditReceivedBy] = useState('')
    const [editNotes, setEditNotes] = useState('')
    const [editItems, setEditItems] = useState<any[]>([])

    // Optional: pick items from the linked quotation while editing
    const quotationQuery = useQuotation(gp?.quotation_id)
    const quotationItemList = useMemo(
        () => (quotationQuery.data?.line_items ?? []).map(li => ({
            item_name: li.item_name,
            category: li.category,
            specifications: li.specifications,
        })),
        [quotationQuery.data],
    )
    const allQuotationItemNames = useMemo(
        () => new Set(quotationItemList.map(qi => qi.item_name.toLowerCase())),
        [quotationItemList],
    )
    const isEditCustomItem = (name: string) =>
        !!quotationQuery.data && name.trim() !== '' &&
        !allQuotationItemNames.has(name.trim().toLowerCase())

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
        return <ErrorState description={error instanceof Error ? error.message : 'Unable to load gate pass'} />
    }

    if (!gp) {
        return <EmptyState title="Gate pass not found" description="It may have been deleted." />
    }

    const totalReceived = gp.items.reduce((s: number, i: any) => s + i.received_qty, 0)
    const mismatches = gp.items.filter((i: any) => i.difference !== 0)

    const handleAdjust = (itemName: string) => {
        const item = gp.items.find((i: any) => i.item_name === itemName)
        if (!item) return
        setAdjustingItem(itemName)
        setAdjustQty(item.received_qty)
        setAdjustReason('')
    }

    const submitAdjust = () => {
        if (!id || !adjustingItem || !adjustReason) return
        adjust.mutate(
            { id, item_name: adjustingItem, corrected_qty: adjustQty, reason: adjustReason },
            { onSuccess: () => setAdjustingItem(null) },
        )
    }

    const startEditDate = () => {
        setDateValue((gp.receiving_date || '').slice(0, 10))
        setDateReason('')
        setEditingDate(true)
    }

    const submitDate = () => {
        if (!id || !dateValue) return
        updateDate.mutate(
            { id, receiving_date: dateValue, reason: dateReason },
            { onSuccess: () => setEditingDate(false) },
        )
    }

    const submitBill = () => {
        if (!id) return
        createBill.mutate(
            {
                gate_pass_id: id,
                instant: instantBill,
                notes: billNotes,
                quotation_id: gp.quotation_id,
                client_name: gp.client_name,
            },
            {
                onSuccess: () => {
                    setBillingOpen(false)
                    setBillNotes('')
                    setInstantBill(false)
                },
            },
        )
    }

    const canEdit = !['DELIVERED', 'CANCELLED'].includes(gp.status)

    const startEdit = () => {
        setEditClientName(gp.client_name)
        setEditReceivedBy(gp.received_by)
        setEditNotes(gp.notes ?? '')
        setEditItems(gp.items.map((i: any) => ({ ...i })))
        setEditing(true)
    }

    const updateEditItem = (idx: number, field: 'item_name' | 'category' | 'specification' | 'client_qty' | 'received_qty', value: string | number) => {
        setEditItems(prev => {
            const next = prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
            return next
        })
    }

    const updateEditItemName = (idx: number, name: string, category?: string, specification?: string) => {
        setEditItems(prev => prev.map((it, i) => (i === idx ? {
            ...it,
            item_name: name,
            ...(category !== undefined ? { category } : {}),
            ...(specification !== undefined ? { specification } : {}),
        } : it)))
    }

    const addEditItem = () => {
        setEditItems(prev => [
            ...prev,
            {
                item_name: '',
                category: '',
                client_qty: 0,
                received_qty: 0,
                difference: 0,
                specification: null,
                mismatch_reason: null,
                mismatch_notes: null,
            },
        ])
    }

    const removeEditItem = (idx: number) => {
        setEditItems(prev => prev.filter((_, i) => i !== idx))
    }

    const submitEdit = () => {
        if (!id || editItems.length === 0) return
        const items = editItems
            .filter((it: any) => it.item_name && it.item_name.trim())
            .map((it: any) => ({
                item_name: it.item_name.trim(),
                category: it.category?.trim() || null,
                specification: it.specification?.trim() || null,
                client_qty: Number(it.client_qty) || 0,
                received_qty: Number(it.received_qty) || 0,
                mismatch_reason: it.mismatch_reason || null,
                mismatch_notes: it.mismatch_notes || null,
            }))
        if (items.length === 0) return
        updateGatePass.mutate(
            {
                id,
                payload: {
                    client_name: editClientName.trim() || undefined,
                    received_by: editReceivedBy.trim() || undefined,
                    notes: editNotes.trim() || undefined,
                    items,
                },
            },
            { onSuccess: () => setEditing(false) },
        )
    }

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link to="/gate-passes" className="mt-1 text-[#98A2B3] hover:text-[#374151] transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <Breadcrumb
                            items={[
                                { label: 'Dashboard', href: '/' },
                                { label: 'Gate Passes', href: '/gate-passes' },
                                { label: gp.client_name },
                            ]}
                        />
                        <h1 className="text-dashboard-title mt-1">{gp.client_name}</h1>
                        <p className="font-mono text-[12px] text-[#98A2B3] mt-0.5">{gp.gate_pass_number}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={gp.status} />

                    {/* Status Transition Dropdown */}
                    {!['PARTIALLY_DELIVERED', 'DELIVERED'].includes(gp.status) && (
                        <div className="relative">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setStatusOpen(o => !o)}
                                disabled={updateStatus.isPending}
                            >
                                Update Status <ChevronDown className="h-3.5 w-3.5 ml-1" />
                            </Button>
                            <AnimatePresence>
                                {statusOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-[#E4E7EC] bg-white shadow-lg shadow-black/5 py-1"
                                    >
                                        {TRANSITION_STATUSES.filter(s => s !== gp.status).map(s => {
                                            const cfg = STATUS_CONFIG[s]
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        updateStatus.mutate({ id: id!, status: s })
                                                        setStatusOpen(false)
                                                    }}
                                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#374151] hover:bg-[#F9FAFB] cursor-pointer transition"
                                                >
                                                    <span className="h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
                                                    {cfg.label}
                                                </button>
                                            )
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {canEdit &&
                        (editing ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={submitEdit}
                                    disabled={updateGatePass.isPending || editItems.filter((i: any) => i.item_name?.trim()).length === 0}
                                    className="bg-[#16A34A] hover:bg-[#15803D] text-white"
                                >
                                    <Save className="h-3.5 w-3.5" /> Save Items
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                                    <X className="h-3.5 w-3.5" /> Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" variant="secondary" onClick={startEdit}>
                                <Pencil className="h-3.5 w-3.5" /> Edit Items
                            </Button>
                        ))}

                    <Link to="/deliveries/new">
                        <Button size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                            <Truck className="h-3.5 w-3.5" /> Record Delivery
                        </Button>
                    </Link>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setBillingOpen(o => !o)}
                        disabled={createBill.isPending}
                    >
                        <Receipt className="h-3.5 w-3.5" /> Create Bill
                    </Button>
                </div>
            </div>

            {/* Info Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Received date — editable to correct human error */}
                <Card className="p-3">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#98A2B3]" />
                            <p className="text-[11px] text-[#98A2B3] font-medium uppercase tracking-wide">Received</p>
                        </div>
                        {!editingDate && !['DELIVERED', 'CANCELLED'].includes(gp.status) && (
                            <button
                                onClick={startEditDate}
                                className="text-[#6B7280] hover:text-[#2563EB] transition"
                                title="Correct receiving date"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    {editingDate ? (
                        <div className="flex flex-col gap-2">
                            <input
                                type="date"
                                value={dateValue}
                                onChange={e => setDateValue(e.target.value)}
                                className="h-9 w-full rounded-lg border border-[#BFDBFE] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                            />
                            <input
                                type="text"
                                value={dateReason}
                                onChange={e => setDateReason(e.target.value)}
                                placeholder="Reason (optional)"
                                className="h-9 w-full rounded-lg border border-[#BFDBFE] bg-white px-3 text-[12px] outline-none focus:border-[#2563EB]"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={submitDate}
                                    disabled={!dateValue || updateDate.isPending}
                                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                >
                                    <Check className="h-3.5 w-3.5" /> Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingDate(false)}>
                                    <X className="h-3.5 w-3.5" /> Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[13px] font-semibold text-[#101828]">{formatDate(gp.receiving_date)}</p>
                    )}
                </Card>

                {[
                    { icon: User, label: 'Received By', value: gp.received_by },
                    { icon: ClipboardList, label: 'Items', value: `${gp.items.length} types · ${totalReceived} pcs` },
                    { icon: AlertCircle, label: 'Mismatches', value: mismatches.length > 0 ? `${mismatches.length} item${mismatches.length > 1 ? 's' : ''}` : 'None' },
                ].map(({ icon: Icon, label, value }) => (
                    <Card key={label} className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-3.5 w-3.5 text-[#98A2B3]" />
                            <p className="text-[11px] text-[#98A2B3] font-medium uppercase tracking-wide">{label}</p>
                        </div>
                        <p className="text-[13px] font-semibold text-[#101828]">{value}</p>
                    </Card>
                ))}
            </div>

            {/* Create Bill from Gate Pass */}
            {billingOpen && (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[13px] font-semibold text-[#101828]">Create Bill from this Gate Pass</p>
                        <button
                            onClick={() => setBillingOpen(false)}
                            className="text-[#6B7280] hover:text-[#374151] transition"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="flex items-center gap-2 text-[13px] text-[#374151] whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={instantBill}
                                onChange={e => setInstantBill(e.target.checked)}
                                className="h-4 w-4 rounded border-[#D0D5DD]"
                            />
                            Instant (paid now)
                        </label>
                        <input
                            type="text"
                            value={billNotes}
                            onChange={e => setBillNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            className="h-9 flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                        />
                        <Button
                            size="sm"
                            onClick={submitBill}
                            disabled={createBill.isPending}
                            className="bg-[#16A34A] hover:bg-[#15803D] text-white"
                        >
                            <Check className="h-3.5 w-3.5" /> {instantBill ? 'Create & Mark Paid' : 'Create Bill'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Notes */}
            {gp.notes && (
                <Card className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-1">Notes</p>
                    <p className="text-[13px] text-[#374151]">{gp.notes}</p>
                </Card>
            )}

            {/* Edit Mode */}
            {editing && (
                <Card>
                    <CardHeader className="border-b border-[#F2F4F7] pb-3 flex flex-row items-center justify-between">
                        <CardTitle>Edit Gate Pass</CardTitle>
                        <p className="text-[11px] text-[#16A34A] font-medium">Editable because not fully delivered</p>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Client Name</label>
                                <input
                                    value={editClientName}
                                    onChange={e => setEditClientName(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Received By</label>
                                <input
                                    value={editReceivedBy}
                                    onChange={e => setEditReceivedBy(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Notes</label>
                                <input
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Items</p>
                                {quotationItemList.length > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 text-[10px] font-medium text-[#2563EB]">
                                        Linked to quotation · {quotationItemList.length} items
                                    </span>
                                )}
                            </div>
                            <Button type="button" variant="secondary" size="sm" onClick={addEditItem}>
                                <Plus className="h-3.5 w-3.5" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {editItems.map((item: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-[#E4E7EC] bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_74px_74px_36px] items-center">
                                    <div>
                                        <ItemNameInput
                                            value={item.item_name}
                                            onChange={(name, category, specification) => updateEditItemName(idx, name, category, specification)}
                                            quotationItems={quotationItemList}
                                            inputClass="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                            labelClass="block text-[10px] text-[#98A2B3] mb-0.5"
                                            isCustom={isEditCustomItem(item.item_name)}
                                            hasQuotation={!!quotationQuery.data}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-[#98A2B3] mb-0.5">Category</label>
                                        <input
                                            value={item.category ?? ''}
                                            onChange={e => updateEditItem(idx, 'category', e.target.value)}
                                            placeholder="e.g. Bed Linen"
                                            className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-[#98A2B3] mb-0.5">Spec</label>
                                        <input
                                            value={item.specification ?? ''}
                                            onChange={e => updateEditItem(idx, 'specification', e.target.value)}
                                            placeholder="e.g. Red, XL"
                                            className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-[#98A2B3] mb-0.5">Client Qty</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={item.client_qty}
                                            onChange={e => updateEditItem(idx, 'client_qty', e.target.value)}
                                            className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-[#98A2B3] mb-0.5">Received</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={item.received_qty}
                                            onChange={e => updateEditItem(idx, 'received_qty', e.target.value)}
                                            className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeEditItem(idx)}
                                            disabled={editItems.length === 1}
                                            aria-label="Remove item"
                                            className="text-[#DC2626] hover:bg-[#FFF1F1] disabled:opacity-20"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Items Table */}
            {!editing && (
            <Card>
                <CardHeader className="border-b border-[#F2F4F7] pb-3">
                    <CardTitle>Item Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-[#F2F4F7]">
                                    {['Item', 'Spec', 'Category', 'Client Qty', 'Received', 'Diff', 'Reason', ''].map(h => (
                                        <th key={h} className="py-3 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] first:pl-0">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F9FAFB]">
                                {gp.items.map((item: any) => (
                                    <Fragment key={item.item_name}>
                                        <tr key={item.item_name} className="group">
                                            <td className="py-3 pr-3 font-medium text-[#101828]">{item.item_name}</td>
                                            <td className="py-3 pr-3">
                                                {item.specification ? (
                                                    <span className="inline-flex items-center rounded bg-[#FFF7ED] border border-[#FED7AA] px-1.5 py-0.5 text-[11px] font-semibold text-[#EA580C]">
                                                        {item.specification}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#D0D5DD]">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 pr-3 text-[#6B7280]">{item.category || '—'}</td>
                                            <td className="py-3 pr-3 text-[#6B7280]">{item.client_qty}</td>
                                            <td className="py-3 pr-3 font-semibold text-[#101828]">{item.received_qty}</td>
                                            <td className="py-3 pr-3">
                                                <span className={`font-semibold ${item.difference === 0 ? 'text-[#16A34A]' :
                                                        item.difference > 0 ? 'text-[#2563EB]' : 'text-[#C2410C]'
                                                    }`}>
                                                    {item.difference > 0 ? `+${item.difference}` : item.difference}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-3 text-[#6B7280] text-[12px]">
                                                {item.mismatch_reason?.replace(/_/g, ' ') || '—'}
                                            </td>
                                            <td className="py-3 text-right">
                                                {!['DELIVERED', 'CANCELLED'].includes(gp.status) && (
                                                    <button
                                                        onClick={() => handleAdjust(item.item_name)}
                                                        className="opacity-0 group-hover:opacity-100 text-[#6B7280] hover:text-[#2563EB] transition"
                                                        title="Adjust quantity"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Inline adjustment row */}
                                        <AnimatePresence>
                                            {adjustingItem === item.item_name && (
                                                <tr key={`${item.item_name}-adj`}>
                                                    <td colSpan={8} className="pb-3">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-end"
                                                        >
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Corrected Qty</label>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={adjustQty}
                                                                    onChange={e => setAdjustQty(Number(e.target.value))}
                                                                    className="h-9 w-24 rounded-lg border border-[#BFDBFE] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                                                />
                                                            </div>
                                                            <div className="flex-1 w-full sm:w-auto">
                                                                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Reason</label>
                                                                <input
                                                                    type="text"
                                                                    value={adjustReason}
                                                                    onChange={e => setAdjustReason(e.target.value)}
                                                                    placeholder="Reason for adjustment…"
                                                                    className="h-9 w-full rounded-lg border border-[#BFDBFE] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={submitAdjust}
                                                                    disabled={!adjustReason || adjust.isPending}
                                                                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                                                >
                                                                    <Check className="h-3.5 w-3.5" /> Save
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setAdjustingItem(null)}
                                                                >
                                                                    <X className="h-3.5 w-3.5" /> Cancel
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            )}

            {/* Deliveries for this Gate Pass */}
            {deliveries.length > 0 && (
                <Card>
                    <CardHeader className="border-b border-[#F2F4F7] pb-3">
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-[#2563EB]" />
                            <CardTitle>Deliveries ({deliveries.length})</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-3 divide-y divide-[#F9FAFB]">
                        {deliveries.map((d: any) => (
                            <Link key={d.id} to={`/deliveries/${d.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-70 transition">
                                <div>
                                    <p className="text-[13px] font-medium text-[#101828]">
                                        {d.items.reduce((s: number, i: any) => s + i.quantity, 0)} pieces delivered
                                    </p>
                                    <p className="text-[12px] text-[#98A2B3]">{formatDate(d.delivery_date)} · by {d.delivered_by}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#16A34A] text-[12px] font-medium">
                                    <CheckCircle2 className="h-4 w-4" /> Delivered
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
