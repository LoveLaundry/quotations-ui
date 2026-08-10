import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Trash2, AlertCircle, ArrowLeft, Link2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { useCreateGatePass } from '../hooks/useGatePasses'
import { useQuotations } from '../hooks/useQuotations'
import type { GatePassItem } from '../../../types/operations'
import type { Quotation } from '../../../types/quotation'
import { Link } from 'react-router-dom'

const EMPTY_ITEM: GatePassItem = {
    item_name: '',
    category: '',
    client_qty: 0,
    received_qty: 0,
    difference: 0,
    mismatch_reason: '',
    mismatch_notes: '',
}

const MISMATCH_REASONS = [
    'SHORT_RECEIVED',
    'DAMAGED',
    'EXTRA_RECEIVED',
    'COUNTING_ERROR',
    'OTHER',
]

export default function CreateGatePassPage() {
    const navigate = useNavigate()
    const createGatePass = useCreateGatePass()
    const { data: quotations = [], isLoading: quotationsLoading } = useQuotations()

    const [gatePassNumber, setGatePassNumber] = useState(() => {
        const now = new Date()
        return `GP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    })
    const [clientName, setClientName] = useState('')
    const [receivingDate, setReceivingDate] = useState(() => new Date().toISOString().split('T')[0])
    const [receivedBy, setReceivedBy] = useState('')
    const [notes, setNotes] = useState('')
    const [items, setItems] = useState<GatePassItem[]>([{ ...EMPTY_ITEM }])

    // Quotation linking
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
    const [quotationSearch, setQuotationSearch] = useState('')
    const [showQuotationPicker, setShowQuotationPicker] = useState(false)

    const filteredQuotations = quotations.filter(q => {
        const term = quotationSearch.trim().toLowerCase()
        if (!term) return true
        return [q.client_name, q.quotation_title ?? ''].join(' ').toLowerCase().includes(term)
    })

    const handleSelectQuotation = (q: Quotation) => {
        setSelectedQuotation(q)
        // Auto-fill client name from quotation if not already entered
        if (!clientName.trim()) setClientName(q.client_name)
        setShowQuotationPicker(false)
        setQuotationSearch('')
    }

    const updateItem = (index: number, field: keyof GatePassItem, value: string | number) => {
        setItems(prev => {
            const updated = [...prev]
            const item = { ...updated[index], [field]: value } as GatePassItem
            if (field === 'client_qty' || field === 'received_qty') {
                const cq = field === 'client_qty' ? Number(value) : item.client_qty
                const rq = field === 'received_qty' ? Number(value) : item.received_qty
                item.difference = rq - cq
            }
            updated[index] = item
            return updated
        })
    }

    const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])

    const removeItem = (index: number) =>
        setItems(prev => prev.filter((_, i) => i !== index))

    const isValid =
        gatePassNumber.trim() &&
        clientName.trim() &&
        receivingDate &&
        receivedBy.trim() &&
        items.length > 0 &&
        items.every(it => it.item_name.trim() && it.received_qty >= 0)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        createGatePass.mutate(
            {
                gate_pass_number: gatePassNumber.trim(),
                client_name: clientName.trim(),
                receiving_date: receivingDate,
                received_by: receivedBy.trim(),
                notes: notes.trim() || undefined,
                items,
                ...(selectedQuotation ? { quotation_id: String(selectedQuotation.id) } : {}),
            },
            { onSuccess: () => navigate('/gate-passes') },
        )
    }

    const inputClass =
        'h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-sm transition'

    const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] mb-1.5'

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/gate-passes" className="text-[#98A2B3] hover:text-[#374151] transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <Breadcrumb
                        items={[
                            { label: 'Dashboard', href: '/' },
                            { label: 'Gate Passes', href: '/gate-passes' },
                            { label: 'New Gate Pass' },
                        ]}
                    />
                    <h1 className="text-dashboard-title mt-1">New Gate Pass</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        Record laundry items received from a hotel client
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quotation Linking Card */}
                <Card>
                    <CardHeader className="border-b border-[#F2F4F7] pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF7ED] border border-[#FED7AA]">
                                <Link2 className="h-4 w-4 text-[#EA580C]" />
                            </div>
                            <div>
                                <CardTitle>Link to Quotation</CardTitle>
                                <p className="text-[11px] text-[#98A2B3] mt-0.5">Optional — link this gate pass to a client quotation for billing reference</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {selectedQuotation ? (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3">
                                <div>
                                    <p className="text-[13px] font-semibold text-[#101828]">{selectedQuotation.client_name}</p>
                                    <p className="text-[11px] text-[#EA580C]">{selectedQuotation.quotation_title || 'Price List'} · {selectedQuotation.line_items?.length ?? 0} items</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedQuotation(null); setShowQuotationPicker(false) }}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#EA580C] hover:bg-[#FED7AA] transition-colors cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : showQuotationPicker ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={quotationSearch}
                                        onChange={e => setQuotationSearch(e.target.value)}
                                        placeholder="Search by client or title…"
                                        className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 shadow-sm transition"
                                        autoFocus
                                    />
                                </div>
                                {quotationsLoading ? (
                                    <div className="py-4 text-center text-[12px] text-[#98A2B3]">Loading quotations…</div>
                                ) : filteredQuotations.length === 0 ? (
                                    <div className="py-4 text-center text-[12px] text-[#98A2B3]">No quotations found</div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                        {filteredQuotations.map(q => (
                                            <button
                                                key={q.id}
                                                type="button"
                                                onClick={() => handleSelectQuotation(q)}
                                                className="group flex w-full items-center gap-3 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2.5 text-left hover:border-[#FED7AA] hover:bg-[#FFF7ED] transition cursor-pointer"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-semibold text-[#101828] truncate">{q.client_name}</p>
                                                    <p className="text-[11px] text-[#98A2B3] truncate">{q.quotation_title || 'Price List'} · {q.line_items?.length ?? 0} items</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setShowQuotationPicker(false); setQuotationSearch('') }}
                                    className="text-[12px] text-[#6B7280] hover:text-[#374151] cursor-pointer transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowQuotationPicker(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#FED7AA] py-3 text-[13px] font-medium text-[#EA580C] hover:border-[#EA580C] hover:bg-[#FFF7ED]/50 transition cursor-pointer"
                            >
                                <Link2 className="h-4 w-4" /> Link a Quotation
                            </button>
                        )}
                    </CardContent>
                </Card>

                {/* Basic Info Card */}
                <Card>
                    <CardHeader className="border-b border-[#F2F4F7] pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                                <ClipboardList className="h-4 w-4 text-[#2563EB]" />
                            </div>
                            <CardTitle>Receiving Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className={labelClass}>Gate Pass No.</label>
                                <input
                                    type="text"
                                    value={gatePassNumber}
                                    onChange={e => setGatePassNumber(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Client / Hotel Name</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    placeholder="e.g. Hilton Colombo"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Receiving Date</label>
                                <input
                                    type="date"
                                    value={receivingDate}
                                    onChange={e => setReceivingDate(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Received By</label>
                                <input
                                    type="text"
                                    value={receivedBy}
                                    onChange={e => setReceivedBy(e.target.value)}
                                    placeholder="Staff name"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Notes (optional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Any additional remarks…"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Card */}
                <Card>
                    <CardHeader className="border-b border-[#F2F4F7] pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle>Linen Items</CardTitle>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={addItem}
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <AnimatePresence initial={false}>
                            {items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="rounded-xl border border-[#E4E7EC] bg-[#FAFAFA] p-3.5 space-y-3"
                                >
                                    {/* Row 1: Name, Category, ClientQty, ReceivedQty */}
                                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className={labelClass}>Item Name</label>
                                            <input
                                                type="text"
                                                value={item.item_name}
                                                onChange={e => updateItem(idx, 'item_name', e.target.value)}
                                                placeholder="e.g. Bed Sheet"
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Category</label>
                                            <input
                                                type="text"
                                                value={item.category ?? ''}
                                                onChange={e => updateItem(idx, 'category', e.target.value)}
                                                placeholder="Linen type"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Client Qty</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={item.client_qty}
                                                onChange={e => updateItem(idx, 'client_qty', Number(e.target.value))}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Received Qty</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={item.received_qty}
                                                onChange={e => updateItem(idx, 'received_qty', Number(e.target.value))}
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Difference badge & mismatch fields */}
                                    <div className="flex items-start gap-3 flex-wrap">
                                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${item.difference === 0
                                            ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
                                            : item.difference > 0
                                                ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                                                : 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                                            }`}>
                                            {item.difference === 0 ? '✓ Matched' : item.difference > 0 ? `+${item.difference} extra` : `${item.difference} short`}
                                        </div>

                                        {item.difference !== 0 && (
                                            <div className="flex flex-1 gap-3 flex-wrap min-w-0">
                                                <div className="w-48">
                                                    <label className={labelClass}>Mismatch Reason</label>
                                                    <select
                                                        value={item.mismatch_reason ?? ''}
                                                        onChange={e => updateItem(idx, 'mismatch_reason', e.target.value)}
                                                        className={inputClass + ' cursor-pointer'}
                                                    >
                                                        <option value="">Select reason…</option>
                                                        {MISMATCH_REASONS.map(r => (
                                                            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1 min-w-32">
                                                    <label className={labelClass}>Mismatch Notes</label>
                                                    <input
                                                        type="text"
                                                        value={item.mismatch_notes ?? ''}
                                                        onChange={e => updateItem(idx, 'mismatch_notes', e.target.value)}
                                                        placeholder="Additional notes…"
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="ml-auto flex items-center gap-1 text-[12px] text-[#EF4444] hover:text-[#DC2626] cursor-pointer transition"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Remove
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button
                            type="button"
                            onClick={addItem}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E4E7EC] py-3 text-[13px] font-medium text-[#6B7280] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#EFF6FF]/30 transition cursor-pointer"
                        >
                            <Plus className="h-4 w-4" /> Add another item
                        </button>
                    </CardContent>
                </Card>

                {/* Summary & Submit */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="text-[13px] text-[#6B7280]">
                                <span className="font-semibold text-[#101828]">{items.length}</span> item type{items.length !== 1 ? 's' : ''} · {' '}
                                <span className="font-semibold text-[#101828]">
                                    {items.reduce((s, i) => s + i.received_qty, 0)}
                                </span> pieces total
                                {items.some(i => i.difference !== 0) && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-[#D97706]">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {items.filter(i => i.difference !== 0).length} mismatch{items.filter(i => i.difference !== 0).length > 1 ? 'es' : ''}
                                    </span>
                                )}
                                {selectedQuotation && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-[#EA580C]">
                                        <Link2 className="h-3.5 w-3.5" />
                                        Linked to {selectedQuotation.client_name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Link to="/gate-passes" className="flex-1 sm:flex-none">
                                    <Button variant="secondary" className="w-full">Cancel</Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={!isValid || createGatePass.isPending}
                                    className="flex-1 sm:flex-none bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-40"
                                >
                                    {createGatePass.isPending ? 'Saving…' : 'Create Gate Pass'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
