import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Trash2, AlertCircle, ArrowLeft, Link2, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { SearchableSelect, type SearchableOption } from '../../../components/ui'
import { useDataGrid, mergeRefs } from '../../../hooks/use-data-grid'
import { useEnterFlow } from '../../../hooks/use-enter-flow'
import { useCreateGatePass } from '../hooks/useGatePasses'
import { useQuotations } from '../hooks/useQuotations'
import type { GatePassItem } from '../../../types/operations'
import type { Quotation } from '../../../types/quotation'
import { Link } from 'react-router-dom'
import { quotationService } from '../services/quotation.service'

const EMPTY_ITEM: GatePassItem = {
    item_name: '',
    category: '',
    specification: '',
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

// ─── Item Name Autocomplete ───────────────────────────────────────────────────
export interface ExpandedQuotationItem {
    item_name: string
    category?: string
    specification?: string
    label: string
}

export type QuotationItemSource = {
    item_name: string
    category?: string
    specifications?: Array<{ specification: string; unit_price: number }>
}

export interface QuotationOption extends SearchableOption {
    data: ExpandedQuotationItem
}

/** Expand a line item into one or more selectable entries (specs → individual rows) */
export function expandQuotationItems(items: QuotationItemSource[]): ExpandedQuotationItem[] {
    const expanded: ExpandedQuotationItem[] = []
    for (const li of items) {
        if (li.specifications && li.specifications.length > 0) {
            for (const spec of li.specifications) {
                expanded.push({
                    item_name: li.item_name,
                    category: li.category,
                    specification: spec.specification,
                    label: `${li.item_name} — ${spec.specification}`,
                })
            }
        } else {
            expanded.push({
                item_name: li.item_name,
                category: li.category,
                specification: undefined,
                label: li.item_name,
            })
        }
    }
    return expanded
}

/** Map expanded quotation items to SearchableSelect options (value = name+spec). */
export function toQuotationOptions(items: QuotationItemSource[]): QuotationOption[] {
    return expandQuotationItems(items).map((qi) => ({
        value: qi.item_name + (qi.specification ?? ''),
        label: qi.label,
        sub: qi.category,
        hint: qi.specification,
        data: qi,
    }))
}

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

    const getQuotationId = (q: Quotation) => String(q.id || (q as any).id || '')

    // Selecting a quotation: only link it + set client name — do NOT populate items
    const handleSelectQuotation = (q: Quotation) => {
        setSelectedQuotation(q)
        setClientName(q.client_name)
        setShowQuotationPicker(false)
        setQuotationSearch('')
    }

    // Quotation item names for autocomplete & custom detection
    const quotationItemList = selectedQuotation?.line_items ?? []

    const quotationItemOptions = useMemo(() => toQuotationOptions(quotationItemList), [quotationItemList])

    const hasQuotation = !!selectedQuotation
    const quotationItemNames = new Set(quotationItemList.map(li => li.item_name.toLowerCase()))

    const isCustomItem = (item_name: string) =>
        !!selectedQuotation && item_name.trim() !== '' && !quotationItemNames.has(item_name.trim().toLowerCase())

    const customItemCount = items.filter(it => isCustomItem(it.item_name)).length

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

    const updateItemName = (index: number, name: string, category?: string, specification?: string) => {
        setItems(prev => {
            const updated = [...prev]
            const item = { ...updated[index], item_name: name }
            if (category !== undefined) item.category = category
            if (specification !== undefined) (item as any).specification = specification
            updated[index] = item
            return updated
        })
    }

    const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])

    const removeItem = (index: number) =>
        setItems(prev => prev.filter((_, i) => i !== index))

    // ── Grid: Item(0) → ClientQty(1) → ReceivedQty(2) → (mismatch) Reason(3) → Notes(4) ──
    // Reason/Notes (cols 3–4) only exist when a row has a mismatch; for clean rows the
    // received qty cell is also registered under cols 3–4 so Enter keeps flowing to the
    // next row instead of getting stuck.
    const grid = useDataGrid({
        columns: 5,
        rows: items.length,
        onAppendRow: addItem,
    })

    // Header fields flow (gate pass no → client → date → received by → notes)
    const flow = useEnterFlow<HTMLDivElement>()

    const isValid =
        gatePassNumber.trim() &&
        clientName.trim() &&
        receivingDate &&
        receivedBy.trim() &&
        items.length > 0 &&
        items.every(it => it.item_name.trim() && it.received_qty >= 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        // Auto-add custom items (not in quotation) to the linked quotation
        if (selectedQuotation && customItemCount > 0) {
            const newItems = items.filter(it => isCustomItem(it.item_name))
            try {
                const payload = {
                    client_name: selectedQuotation.client_name,
                    quotation_title: selectedQuotation.quotation_title,
                    line_items: [
                        ...(selectedQuotation.line_items || []),
                        ...newItems.map(it => ({
                            item_name: it.item_name,
                            category: it.category || '',
                            unit_price: 0,
                            notes: 'Auto-added from gate pass',
                        })),
                    ],
                }
                await quotationService.updateQuotation(getQuotationId(selectedQuotation), payload)
            } catch (err) {
                console.error('Failed to update quotation with custom items', err)
            }
        }

        createGatePass.mutate(
            {
                gate_pass_number: gatePassNumber.trim(),
                client_name: clientName.trim(),
                receiving_date: new Date(receivingDate).toISOString(),
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
                        <div ref={flow.ref} onKeyDown={flow.handleKeyDown} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                            <div>
                                <CardTitle>Linen Items</CardTitle>
                                {selectedQuotation && (
                                    <p className="text-[11px] text-[#98A2B3] mt-0.5">
                                        Select from <span className="font-semibold text-[#EA580C]">{selectedQuotation.client_name}</span>'s quotation, or type a new one
                                    </p>
                                )}
                            </div>
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
                    <CardContent className="pt-4 space-y-3" onKeyDown={grid.handleKeyDown}>
                        <AnimatePresence initial={false}>
                            {items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className={`rounded-xl border p-3.5 space-y-3 ${
                                        isCustomItem(item.item_name)
                                            ? 'border-[#BFDBFE] bg-[#EFF6FF]/40'
                                            : 'border-[#E4E7EC] bg-[#FAFAFA]'
                                    }`}
                                >
                                    {/* Row 1: Name, Category, Spec, ClientQty, ReceivedQty */}
                                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className={labelClass}>Item Name</label>
                                            <SearchableSelect
                                                ref={grid.registerCell(idx, 0)}
                                                value={item.item_name}
                                                onValueChange={text => updateItemName(idx, text)}
                                                options={quotationItemOptions}
                                                onSelect={opt => {
                                                    const data = (opt as QuotationOption).data
                                                    updateItemName(idx, data.item_name, data.category, data.specification)
                                                }}
                                                onCreate={text => updateItemName(idx, text)}
                                                onAdvance={() => grid.advance(idx, 0)}
                                                placeholder={hasQuotation ? 'Select or type item…' : 'e.g. Bed Sheet'}
                                                className={inputClass + ' pr-8'}
                                                required
                                            />
                                            {hasQuotation && item.item_name.trim() && isCustomItem(item.item_name) && (
                                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">
                                                    <Sparkles className="h-2.5 w-2.5" /> New · will be added to quotation
                                                </div>
                                            )}
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
                                            <label className={labelClass}>Spec</label>
                                            <input
                                                type="text"
                                                value={(item as any).specification ?? ''}
                                                onChange={e => (updateItem as any)(idx, 'specification', e.target.value)}
                                                placeholder="e.g. Red, XL"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Client Qty</label>
                                            <input
                                                ref={grid.registerCell(idx, 1)}
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
                                                ref={mergeRefs(
                                                    grid.registerCell(idx, 2),
                                                    item.difference === 0 ? grid.registerCell(idx, 3) : undefined,
                                                    item.difference === 0 ? grid.registerCell(idx, 4) : undefined,
                                                )}
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
                                                        ref={grid.registerCell(idx, 3)}
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
                                                        ref={grid.registerCell(idx, 4)}
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
                            <div className="text-[13px] text-[#6B7280] flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span><span className="font-semibold text-[#101828]">{items.length}</span> item type{items.length !== 1 ? 's' : ''}</span>
                                <span className="text-[#E4E7EC]">·</span>
                                <span><span className="font-semibold text-[#101828]">{items.reduce((s, i) => s + i.received_qty, 0)}</span> pieces total</span>
                                {items.some(i => i.difference !== 0) && (
                                    <span className="inline-flex items-center gap-1 text-[#D97706]">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {items.filter(i => i.difference !== 0).length} mismatch{items.filter(i => i.difference !== 0).length > 1 ? 'es' : ''}
                                    </span>
                                )}
                                {selectedQuotation && (
                                    <span className="inline-flex items-center gap-1 text-[#EA580C]">
                                        <Link2 className="h-3.5 w-3.5" />
                                        Linked to {selectedQuotation.client_name}
                                    </span>
                                )}
                                {customItemCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[#2563EB]">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {customItemCount} new item{customItemCount > 1 ? 's' : ''} will be added to quotation
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
