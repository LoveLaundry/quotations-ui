import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ClipboardList, Plus, Trash2, AlertCircle, ArrowLeft, Link2, X, Sparkles, History, FileClock, RotateCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { SearchableSelect, type SearchableOption } from '../../../components/ui'
import { useDataGrid, mergeRefs } from '../../../hooks/use-data-grid'
import { useEnterFlow } from '../../../hooks/use-enter-flow'
import { useCreateGatePass, useGatePasses } from '../hooks/useGatePasses'
import { useQuotations } from '../hooks/useQuotations'
import { useDefaults, useDraft, hasDraft } from '../../../components/ops'
import type { GatePassItem } from '../../../types/operations'
import type { Quotation } from '../../../types/quotation'
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
    rewashed: false,
}

const MISMATCH_REASONS = [
    'SHORT_RECEIVED',
    'DAMAGED',
    'EXTRA_RECEIVED',
    'COUNTING_ERROR',
    'OTHER',
]

// Keep existing-data helpers at the shared module level — the duplication check
// and repeat-last both need the same shape.
interface LastItemSeed {
    item_name: string
    category?: string
    specification?: string
}

function todayLocal(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function genGatePassNumber(): string {
    const now = new Date()
    return `GP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

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

interface GatePassDraft {
    gate_pass_number: string
    client_name: string
    receiving_date: string
    received_by: string
    notes: string
    items: GatePassItem[]
    quotation_id?: string
}

export default function CreateGatePassPage() {
    const navigate = useNavigate()
    const createGatePass = useCreateGatePass()
    const { data: gatepasses = [] } = useGatePasses()
    const { data: quotations = [], isLoading: quotationsLoading } = useQuotations()
    const defaults = useDefaults()

    const { value: form, set: setForm, clear: clearDraft, dirty } = useDraft<GatePassDraft>('gate-pass-create', {
        gate_pass_number: genGatePassNumber(),
        client_name: defaults.get('gp_client') ?? '',
        receiving_date: todayLocal(),
        received_by: defaults.get('gp_received_by') ?? '',
        notes: '',
        items: [{ ...EMPTY_ITEM }],
    })
    const [restoredDraft] = useState(() => hasDraft('gate-pass-create'))

    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
    const [quotationSearch, setQuotationSearch] = useState('')
    const [showQuotationPicker, setShowQuotationPicker] = useState(false)

    // Link a quotation once it finishes loading if a draft carried its id.
    useEffect(() => {
        const quotaId = form.quotation_id
        if (!quotaId || selectedQuotation) return
        const match = quotations.find(q => String(q.id ?? '') === String(quotaId))
        if (match) {
            setSelectedQuotation(match)
            setForm(prev => {
                const { quotation_id: _drop, ...rest } = prev
                return rest
            })
        }
    }, [quotations, form.quotation_id, selectedQuotation, setForm])

    const filteredQuotations = quotations.filter(q => {
        const term = quotationSearch.trim().toLowerCase()
        if (!term) return true
        return [q.client_name, q.quotation_title ?? ''].join(' ').toLowerCase().includes(term)
    })

    const getQuotationId = (q: Quotation) => String(q.id || (q as any).id || '')

    // Selecting a quotation: only link it + set client name — do NOT populate items
    const handleSelectQuotation = (q: Quotation) => {
        setSelectedQuotation(q)
        setForm(p => ({ ...p, client_name: q.client_name, quotation_id: String(q.id ?? '') }))
        setShowQuotationPicker(false)
        setQuotationSearch('')
    }

    const removeQuotationLink = () => {
        setSelectedQuotation(null)
        setForm(prev => {
            const { quotation_id: _drop, ...rest } = prev
            return rest
        })
        setShowQuotationPicker(false)
    }

    // Quotation item names for autocomplete & custom detection
    const quotationItemList = selectedQuotation?.line_items ?? []

    const quotationItemOptions = useMemo(() => toQuotationOptions(quotationItemList), [quotationItemList])

    const hasQuotation = !!selectedQuotation
    const quotationItemNames = new Set(quotationItemList.map(li => li.item_name.toLowerCase()))

    const isCustomItem = (item_name: string) =>
        !!selectedQuotation && item_name.trim() !== '' && !quotationItemNames.has(item_name.trim().toLowerCase())

    const customItemCount = form.items.filter(it => isCustomItem(it.item_name)).length

    // ── Duplicate identity guard ──────────────────────────────────────────────
    const duplicatePass = useMemo(() => {
        const number = form.gate_pass_number.trim().toLowerCase()
        if (!number) return null
        return gatepasses.find(
            gp => gp.status !== 'CANCELLED' && gp.gate_pass_number.trim().toLowerCase() === number,
        ) ?? null
    }, [gatepasses, form.gate_pass_number])

    // ── Repeat-last helpers ────────────────────────────────────────────────────
    const lastItems = useMemo<LastItemSeed[]>(() => {
        const raw = defaults.get('gp_last_items')
        if (!raw) return []
        try {
            const parsed = JSON.parse(raw) as unknown
            return Array.isArray(parsed) ? (parsed as LastItemSeed[]) : []
        } catch {
            return []
        }
    }, [defaults])

    const seedRow = (seed: LastItemSeed): GatePassItem => ({
        ...EMPTY_ITEM,
        item_name: seed.item_name ?? '',
        category: seed.category ?? '',
        specification: seed.specification ?? '',
    })

    /** Append one row per distinct seed item (keeps a repeated pass's rows). */
    const applyLastItems = () => {
        setForm(prev => {
            const merged = [...prev.items]
            for (const seed of lastItems) {
                if (!seed.item_name) continue
                merged.push(seedRow(seed))
            }
            return {
                ...prev,
                client_name: prev.client_name || defaults.get('gp_client') || '',
                received_by: prev.received_by || defaults.get('gp_received_by') || '',
                items: merged,
            }
        })
    }

    /** Copy the current last row as a new row — fastest way to enter a long stack. */
    const repeatLastRow = () => {
        setForm(prev => {
            const last = prev.items[prev.items.length - 1]
            if (!last) return prev
            return {
                ...prev,
                items: [...prev.items, {
                    ...EMPTY_ITEM,
                    item_name: last.item_name,
                    category: last.category,
                    specification: last.specification,
                }],
            }
        })
    }

    const updateItem = (index: number, field: keyof GatePassItem, value: string | number | boolean) => {
        setForm(prev => {
            const updated = [...prev.items]
            const item = { ...updated[index], [field]: value } as GatePassItem
            if (field === 'client_qty' || field === 'received_qty') {
                const cq = field === 'client_qty' ? Number(value) : item.client_qty
                const rq = field === 'received_qty' ? Number(value) : item.received_qty
                item.difference = rq - cq
            }
            updated[index] = item
            return { ...prev, items: updated }
        })
    }

    const updateItemName = (index: number, name: string, category?: string, specification?: string) => {
        setForm(prev => {
            const updated = [...prev.items]
            const item = { ...updated[index], item_name: name }
            if (category !== undefined) item.category = category
            if (specification !== undefined) (item as any).specification = specification
            updated[index] = item
            return { ...prev, items: updated }
        })
    }

    const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }))

    const removeItem = (index: number) =>
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))

    // ── Grid: Item(0) → ClientQty(1) → ReceivedQty(2) → (mismatch) Reason(3) → Notes(4) ──
    const grid = useDataGrid({
        columns: 5,
        rows: form.items.length,
        onAppendRow: addItem,
    })

    const flow = useEnterFlow<HTMLDivElement>()

    const isValid =
        form.gate_pass_number.trim() &&
        form.client_name.trim() &&
        form.receiving_date &&
        form.received_by.trim() &&
        form.items.length > 0 &&
        form.items.every(it => it.item_name.trim() && it.received_qty >= 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        if (selectedQuotation && customItemCount > 0) {
            const newItems = form.items.filter(it => isCustomItem(it.item_name))
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
                gate_pass_number: form.gate_pass_number.trim(),
                client_name: form.client_name.trim(),
                receiving_date: new Date(form.receiving_date).toISOString(),
                received_by: form.received_by.trim(),
                notes: form.notes.trim() || undefined,
                items: form.items,
                ...(selectedQuotation ? { quotation_id: String(selectedQuotation.id) } : {}),
            },
            {
                onSuccess: record => {
                    defaults.set('gp_received_by', form.received_by.trim())
                    defaults.set('gp_client', form.client_name.trim())
                    defaults.set(
                        'gp_last_items',
                        JSON.stringify(
                            form.items
                                .filter(it => it.item_name.trim())
                                .map(it => ({
                                    item_name: it.item_name,
                                    category: it.category ?? '',
                                    specification: it.specification ?? '',
                                })),
                        ),
                    )
                    clearDraft()
                    const recordId = record && record.id != null ? String(record.id) : ''
                    navigate(recordId ? `/gate-passes/${recordId}` : '/gate-passes')
                },
            },
        )
    }

    const inputClass =
        'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[blue-600] focus:ring-2 focus:ring-[blue-600]/10 transition'

    const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5'

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/gate-passes" className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <Breadcrumb
                        items={[
                            { label: 'Today', href: '/today' },
                            { label: 'Gate Passes', href: '/gate-passes' },
                            { label: 'New Gate Pass' },
                        ]}
                    />
                    <h1 className="text-dashboard-title mt-1">New Gate Pass</h1>
                    <p className="text-[13px] text-[var(--text-faint)] mt-0.5">
                        Record laundry items received from a hotel client
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {dirty && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                            <FileClock className="h-3 w-3" /> Autosaved draft
                        </span>
                    )}
                    {restoredDraft && (
                        <Button variant="outline" size="sm" onClick={clearDraft} type="button">
                            <RotateCcw className="h-3.5 w-3.5" /> Discard draft
                        </Button>
                    )}
                </div>
            </div>

            {duplicatePass && (
                <div className="flex items-start gap-3 rounded-xl border border-[var(--red-100)] bg-[var(--red-50)] px-4 py-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-[var(--red-600)] mt-0.5" />
                    <div className="flex-1">
                        <p className="text-[13px] font-semibold tex-red-800">
                            This gate pass number already exists
                        </p>
                        <p className="text-[12px] text-[var(--red-700)]">
                            #{duplicatePass.gate_pass_number} · {duplicatePass.client_name}
                        </p>
                    </div>
                    <Link to={`/gate-passes/${duplicatePass.id}`}>
                        <Button size="sm" variant="outline" className="text-[var(--red-600)]">View existing</Button>
                    </Link>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quotation Linking Card */}
                <Card>
                    <CardHeader className="border-b border-[var(--border)] pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[orange-50] border border-[orange-200]">
                                <Link2 className="h-4 w-4 tex-orange-600" />
                            </div>
                            <div>
                                <CardTitle>Link to Quotation</CardTitle>
                                <p className="text-[11px] text-[var(--text-faint)] mt-0.5">Optional — link this gate pass to a client quotation for billing reference</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {selectedQuotation ? (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-[orange-200] bg-[orange-50] px-4 py-3">
                                <div>
                                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{selectedQuotation.client_name}</p>
                                    <p className="text-[11px] tex-orange-600">{selectedQuotation.quotation_title || 'Price List'} · {selectedQuotation.line_items?.length ?? 0} items</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeQuotationLink}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--red-600)] hover:bg-[orange-200] transition-colors cursor-pointer"
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
                                        className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-red-200 focus:ring-2 focus:ring-[var(--ring)]/10 transition"
                                        autoFocus
                                    />
                                </div>
                                {quotationsLoading ? (
                                    <div className="py-4 text-center text-[12px] text-[var(--text-faint)]">Loading quotations…</div>
                                ) : filteredQuotations.length === 0 ? (
                                    <div className="py-4 text-center text-[12px] text-[var(--text-faint)]">No quotations found</div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                        {filteredQuotations.map(q => (
                                            <button
                                                key={q.id}
                                                type="button"
                                                onClick={() => handleSelectQuotation(q)}
                                                className="group flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left hover:border-[orange-200] hover:bg-[orange-50] transition cursor-pointer"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{q.client_name}</p>
                                                    <p className="text-[11px] text-[var(--text-faint)] truncate">{q.quotation_title || 'Price List'} · {q.line_items?.length ?? 0} items</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setShowQuotationPicker(false); setQuotationSearch('') }}
                                    className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowQuotationPicker(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[orange-200] py-3 text-[13px] font-medium text-[var(--red-600)] hover:border-red-200 hover:bg-[orange-50]/50 transition cursor-pointer"
                            >
                                <Link2 className="h-4 w-4" /> Link a Quotation
                            </button>
                        )}
                    </CardContent>
                </Card>

                {/* Basic Info Card */}
                <Card>
                    <CardHeader className="border-b border-[var(--border)] pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[blue-50] border border-[blue-200]">
                                <ClipboardList className="h-4 w-4 text-[blue-600]" />
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
                                    value={form.gate_pass_number}
                                    onChange={e => setForm({ gate_pass_number: e.target.value })}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Client / Hotel Name</label>
                                <input
                                    type="text"
                                    value={form.client_name}
                                    onChange={e => setForm({ client_name: e.target.value })}
                                    placeholder="e.g. Hilton Colombo"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Receiving Date</label>
                                <input
                                    type="date"
                                    value={form.receiving_date}
                                    onChange={e => setForm({ receiving_date: e.target.value })}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Received By</label>
                                <input
                                    type="text"
                                    value={form.received_by}
                                    onChange={e => setForm({ received_by: e.target.value })}
                                    placeholder="Staff name"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Notes (optional)</label>
                                <input
                                    type="text"
                                    value={form.notes}
                                    onChange={e => setForm({ notes: e.target.value })}
                                    placeholder="Any additional remarks…"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Card */}
                <Card>
                    <CardHeader className="border-b border-[var(--border)] pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Linen Items</CardTitle>
                                {selectedQuotation ? (
                                    <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
                                        Select from <span className="font-semibold tex-orange-600">{selectedQuotation.client_name}</span>'s quotation, or type a new one
                                    </p>
                                ) : lastItems.length > 0 ? (
                                    <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
                                        Last gate pass had {lastItems.length} item type{lastItems.length !== 1 ? 's' : ''} — repeat them below.
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                                {lastItems.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={applyLastItems}
                                        title="Bring forward the items from the last gate pass for this client"
                                    >
                                        <History className="h-3.5 w-3.5" /> Repeat last
                                    </Button>
                                )}
                                <Button type="button" variant="ghost" size="sm" onClick={repeatLastRow}>
                                    <Plus className="h-3.5 w-3.5" /> Repeat last row
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={addItem}
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Item
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3" onKeyDown={grid.handleKeyDown}>
                        <AnimatePresence initial={false}>
                            {form.items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className={`rounded-xl border p-3.5 space-y-3 ${
                                        isCustomItem(item.item_name)
                                            ? 'border-[blue-200] bg-[blue-50]/40'
                                            : 'border-[var(--border)] bg-[var(--surface-2)]'
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
                                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[blue-50] border border-[blue-200] px-2 py-0.5 text-[10px] font-semibold text-[blue-600]">
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
                                                value={item.specification ?? ''}
                                                onChange={e => updateItem(idx, 'specification', e.target.value)}
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
                                            ? 'bg-[emerald-50] text-[emerald-600] border-[emerald-200]'
                                            : item.difference > 0
                                                ? 'bg-[blue-50] text-[blue-600] border-[blue-200]'
                                                : 'bg-[orange-50] text-[orange-700] border-[orange-200]'
                                            }`}>
                                            {item.difference === 0 ? '✓ Matched' : item.difference > 0 ? `+${item.difference} extra` : `${item.difference} short`}
                                        </div>

                                        <label className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer select-none transition ${
                                            item.rewashed
                                                ? 'bg-[var(--red-50)] text-[orange-700] border-red-200'
                                                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-faint)] hover:borde-pink-200'
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={!!item.rewashed}
                                                onChange={e => updateItem(idx, 'rewashed', e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-[var(--border-2)] accen-pink-600"
                                            />
                                            Rewashed · not billed
                                        </label>

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

                                        {form.items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="ml-auto flex items-center gap-1 text-[12px] text-[var(--red-600)] hover:text-[var(--red-600)] cursor-pointer transition"
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
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] py-3 text-[13px] font-medium text-[var(--text-muted)] hover:border-[blue-600] hover:text-[blue-600] hover:bg-[blue-50]/30 transition cursor-pointer"
                        >
                            <Plus className="h-4 w-4" /> Add another item
                        </button>
                    </CardContent>
                </Card>

                {/* Summary & Submit */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="text-[13px] text-[var(--text-muted)] flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span><span className="font-semibold text-[var(--text-primary)]">{form.items.length}</span> item type{form.items.length !== 1 ? 's' : ''}</span>
                                <span className="text-[var(--text-faint)]">·</span>
                                <span><span className="font-semibold text-[var(--text-primary)]">{form.items.reduce((s, i) => s + i.received_qty, 0)}</span> pieces total</span>
                                {form.items.some(i => i.difference !== 0) && (
                                    <span className="inline-flex items-center gap-1 text-[amber-600]">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {form.items.filter(i => i.difference !== 0).length} mismatch{form.items.filter(i => i.difference !== 0).length > 1 ? 'es' : ''}
                                    </span>
                                )}
                                {form.items.some(i => i.rewashed) && (
                                    <span className="inline-flex items-center gap-1 tex-pink-600">
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        {form.items.filter(i => i.rewashed).reduce((s, i) => s + i.received_qty, 0)} pcs rewashed · not billed
                                    </span>
                                )}
                                {selectedQuotation && (
                                    <span className="inline-flex items-center gap-1 tex-orange-600">
                                        <Link2 className="h-3.5 w-3.5" />
                                        Linked to {selectedQuotation.client_name}
                                    </span>
                                )}
                                {customItemCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[blue-600]">
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
                                    className="flex-1 sm:flex-none bg-[blue-600] hover:bg-[blue-700] text-white disabled:opacity-40"
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