import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, ArrowLeft, Search, X, AlertCircle, Check, Package, Wand2, Hand, FileClock, RotateCcw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/ui/error-state'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { deliveries } from '../services/delivery.service'
import { useCreateDelivery } from '../hooks/useDeliveries'
import { useDataGrid } from '../../../hooks/use-data-grid'
import { useEnterFlow } from '../../../hooks/use-enter-flow'
import { useDefaults, useDraft, hasDraft } from '../../../components/ops'
import type { PendingGatePass } from '../services/delivery.service'

interface SelectedItem {
    gate_pass_id: string
    gate_pass_number: string
    client_name: string
    receiving_date: string
    item_name: string
    specification: string
    category: string
    pending_qty: number
    quantity: number
}

interface AutoItemTotal {
    item_key: string
    item_name: string
    specification: string
    category: string
    total_pending: number
    total_qty: number
}

/** Per-row quantity key: one GP + one item type = one row in manual mode. */
function rowKey(gpId: string, name: string, spec: string) {
    return `${gpId}||${name}||${spec}`
}

// ── Draft shape (refresh-safe, auto-saved) ───────────────────────────────────
interface DeliveryDraft {
    step: 'select' | 'fill'
    selectedIds: string[]
    deliveryDate: string
    deliveredBy: string
    receivedBy: string
    notes: string
    fillMode: 'manual' | 'auto'
    autoTotals: Record<string, number>
    manualQty: Record<string, number>
}

function todayLocal(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const inputClass =
    'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[emerald-600] focus:ring-2 focus:ring-[emerald-600]/10 transition'
const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5'

function itemKey(name: string, spec: string) {
    return spec ? `${name}||${spec}` : name
}

export default function CreateDeliveryPage() {
    const navigate = useNavigate()
    const createDelivery = useCreateDelivery()
    const defaults = useDefaults()

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // ── Draft is the single source of truth (restores on refresh) ────────────
    const { value: form, set: setForm, clear: clearDraft, dirty } = useDraft<DeliveryDraft>('delivery-create', {
        step: 'select',
        selectedIds: [],
        deliveryDate: todayLocal(),
        deliveredBy: defaults.get('gp_delivered_by') ?? '',
        receivedBy: defaults.get('gp_received_by') ?? '',
        notes: '',
        fillMode: 'manual',
        autoTotals: {},
        manualQty: {},
    })
    const [restoredDraft] = useState(() => hasDraft('delivery-create'))

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
        return () => clearTimeout(t)
    }, [search])

    const { data: pendingGPs = [], isLoading, isError, error } = useQuery<PendingGatePass[]>({
        queryKey: ['pending-gatepasses', debouncedSearch],
        queryFn: () => deliveries.pendingGatePasses(debouncedSearch || undefined),
        staleTime: 30_000,
    })

    const selectedIds = useMemo(() => new Set(form.selectedIds), [form.selectedIds])

    const selectedGPs = useMemo(
        () => pendingGPs.filter(gp => selectedIds.has(gp.gate_pass_id)),
        [pendingGPs, selectedIds],
    )

    // ── All items from selected GPs (sorted oldest first) ────────────────────
    const allItems: SelectedItem[] = useMemo(() => {
        const items: SelectedItem[] = []
        for (const gp of selectedGPs) {
            for (const item of gp.items) {
                items.push({
                    gate_pass_id: gp.gate_pass_id,
                    gate_pass_number: gp.gate_pass_number,
                    client_name: gp.client_name,
                    receiving_date: gp.receiving_date,
                    item_name: item.item_name,
                    specification: item.specification,
                    category: item.category,
                    pending_qty: item.pending_qty,
                    quantity: 0,
                })
            }
        }
        items.sort((a, b) => a.receiving_date.localeCompare(b.receiving_date) || a.pending_qty - b.pending_qty)
        return items
    }, [selectedGPs])

    // ── Auto-fill: unique item types across all selected GPs ──────────────────
    const autoItemTotals: AutoItemTotal[] = useMemo(() => {
        const map = new Map<string, AutoItemTotal>()
        for (const item of allItems) {
            const key = itemKey(item.item_name, item.specification)
            const existing = map.get(key)
            if (existing) {
                existing.total_pending += item.pending_qty
            } else {
                map.set(key, {
                    item_key: key,
                    item_name: item.item_name,
                    specification: item.specification,
                    category: item.category,
                    total_pending: item.pending_qty,
                    total_qty: 0,
                })
            }
        }
        return Array.from(map.values()).sort((a, b) => a.item_name.localeCompare(b.item_name))
    }, [allItems])

    // ── Manual quantities (derived from the draft so they survive refresh) ────
    const items: SelectedItem[] = useMemo(
        () => allItems.map(it => ({
            ...it,
            quantity: form.manualQty[rowKey(it.gate_pass_id, it.item_name, it.specification)] ?? 0,
        })),
        [allItems, form.manualQty],
    )

    // ── Auto-fill distribution (FIFO: oldest GP first) ───────────────────────
    const autoDistributed = useMemo(() => {
        if (form.fillMode !== 'auto') return []
        // Start with all items at 0
        const distributed = allItems.map(i => ({ ...i, quantity: 0 }))
        // For each item type, distribute from oldest GP to newest
        for (const total of autoItemTotals) {
            let remaining = form.autoTotals[total.item_key] ?? 0
            for (const item of distributed) {
                if (itemKey(item.item_name, item.specification) !== total.item_key) continue
                if (remaining <= 0) break
                const give = Math.min(remaining, item.pending_qty)
                item.quantity = give
                remaining -= give
            }
        }
        return distributed
    }, [form.fillMode, form.autoTotals, allItems, autoItemTotals])

    // Effective items based on mode
    const effectiveItems = form.fillMode === 'auto' ? autoDistributed : items
    const activeItems = effectiveItems.filter(i => i.quantity > 0)
    const totalPieces = activeItems.reduce((s, i) => s + i.quantity, 0)
    const itemCount = activeItems.length

    // ── Handlers ──────────────────────────────────────────────────────────────
    const toggleGP = useCallback((gpId: string) => {
        setForm(prev => {
            const next = new Set(prev.selectedIds)
            if (next.has(gpId)) next.delete(gpId)
            else next.add(gpId)
            return { ...prev, selectedIds: Array.from(next) }
        })
    }, [setForm])

    const toggleAll = useCallback(() => {
        setForm(prev => {
            const all = prev.selectedIds.length === pendingGPs.length && pendingGPs.length > 0
            return {
                ...prev,
                selectedIds: all ? [] : pendingGPs.map(gp => gp.gate_pass_id),
            }
        })
    }, [pendingGPs, setForm])

    const updateItem = (idx: number, qty: number) => {
        const it = items[idx]
        if (!it) return
        const safe = Math.max(0, qty)
        setForm(prev => {
            const m = { ...prev.manualQty }
            const key = rowKey(it.gate_pass_id, it.item_name, it.specification)
            if (safe <= 0) delete m[key]
            else m[key] = safe
            return { ...prev, manualQty: m }
        })
    }

    const setMax = (idx: number) => {
        const it = items[idx]
        if (!it) return
        setForm(prev => ({
            ...prev,
            manualQty: { ...prev.manualQty, [rowKey(it.gate_pass_id, it.item_name, it.specification)]: it.pending_qty },
        }))
    }

    const setMaxAll = (gpId: string) => {
        setForm(prev => {
            const m = { ...prev.manualQty }
            for (const item of allItems) {
                if (item.gate_pass_id !== gpId) continue
                m[rowKey(item.gate_pass_id, item.item_name, item.specification)] = item.pending_qty
            }
            return { ...prev, manualQty: m }
        })
    }

    const updateAutoTotal = (itemKeyValue: string, qty: number) => {
        setForm(prev => {
            const t = { ...prev.autoTotals }
            if (qty <= 0) delete t[itemKeyValue]
            else t[itemKeyValue] = qty
            return { ...prev, autoTotals: t }
        })
    }

    const setAutoMax = (itemKeyValue: string, totalPending: number) => {
        setForm(prev => ({
            ...prev,
            autoTotals: { ...prev.autoTotals, [itemKeyValue]: totalPending },
        }))
    }

    const setAutoMaxAll = () => {
        setForm(prev => ({
            ...prev,
            autoTotals: Object.fromEntries(autoItemTotals.map(t => [t.item_key, t.total_pending])),
        }))
    }

    // ── Validation ────────────────────────────────────────────────────────────
    const isValid =
        form.selectedIds.length > 0 &&
        form.deliveryDate &&
        form.deliveredBy.trim() &&
        form.receivedBy.trim() &&
        activeItems.length > 0 &&
        activeItems.every(i => i.quantity <= i.pending_qty)

    // ── Submission ────────────────────────────────────────────────────────────
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        const byGP = new Map<string, { client_name: string; items: SelectedItem[] }>()
        for (const item of activeItems) {
            const existing = byGP.get(item.gate_pass_id)
            if (existing) {
                existing.items.push(item)
            } else {
                byGP.set(item.gate_pass_id, { client_name: item.client_name, items: [item] })
            }
        }

        const promises: Promise<any>[] = []
        for (const [gpId, data] of byGP) {
            promises.push(
                createDelivery.mutateAsync({
                    gate_pass_id: gpId,
                    client_name: data.client_name,
                    delivery_date: new Date(form.deliveryDate).toISOString(),
                    delivered_by: form.deliveredBy.trim(),
                    received_by: form.receivedBy.trim(),
                    notes: form.notes.trim() || undefined,
                    items: data.items.map(i => ({
                        item_name: i.item_name,
                        specification: i.specification || undefined,
                        quantity: Math.floor(i.quantity),
                    })),
                })
            )
        }

        try {
            const created = await Promise.all(promises)
            defaults.set('gp_delivered_by', form.deliveredBy.trim())
            defaults.set('gp_received_by', form.receivedBy.trim())
            clearDraft()
            const createdIds = created
                .map((r: any) => (r && r.id != null ? String(r.id) : ''))
                .filter(Boolean)
            if (createdIds.length === 1) navigate(`/deliveries/${createdIds[0]}`)
            else navigate('/deliveries')
        } catch (err) {
            console.error('Delivery creation failed', err)
        }
    }

    // ── Items grouped by gate pass for manual display ─────────────────────────
    const itemsByGP = useMemo(() => {
        const source = form.fillMode === 'auto' ? autoDistributed : items
        const map = new Map<string, { client_name: string; gate_pass_number: string; items: SelectedItem[] }>()
        for (const item of source) {
            if (item.quantity <= 0) continue
            const existing = map.get(item.gate_pass_id)
            if (existing) {
                existing.items.push(item)
            } else {
                map.set(item.gate_pass_id, {
                    client_name: item.client_name,
                    gate_pass_number: item.gate_pass_number,
                    items: [item],
                })
            }
        }
        return Array.from(map.entries())
    }, [form.fillMode, autoDistributed, items])

    // ── Keyboard data-entry grids ─────────────────────────────────────────────
    // Manual mode: one qty input per rendered item row (row index = flat order).
    const manualRowIndex = useMemo(() => {
        const m = new Map<string, number>()
        let i = 0
        for (const [, group] of itemsByGP) {
            for (const item of group.items) {
                m.set(`${item.gate_pass_id}||${item.item_name}||${item.specification}`, i++)
            }
        }
        return m
    }, [itemsByGP])

    const manualGrid = useDataGrid({ columns: 1, rows: manualRowIndex.size })
    const autoGrid = useDataGrid({ columns: 1, rows: autoItemTotals.length })

    // Step-2 header fields flow (delivery date → delivered by → received by → notes)
    const flow = useEnterFlow<HTMLDivElement>()

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Link to="/deliveries" className="mt-1 text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <Breadcrumb
                        items={[
                            { label: 'Today', href: '/today' },
                            { label: 'Deliveries', href: '/deliveries' },
                            { label: 'Record Delivery' },
                        ]}
                    />
                    <h1 className="text-dashboard-title mt-1">Record Delivery</h1>
                    <p className="text-[13px] text-[var(--text-faint)] mt-0.5">
                        {form.step === 'select'
                            ? 'Select gate passes with pending items to deliver'
                            : `Delivering ${totalPieces} pieces across ${itemCount} item${itemCount !== 1 ? 's' : ''} from ${form.selectedIds.length} gate pass${form.selectedIds.length !== 1 ? 'es' : ''} · ${form.fillMode === 'auto' ? 'Auto-fill (FIFO)' : 'Manual'}`
                        }
                    </p>
                </div>
                {form.step === 'select' && form.selectedIds.length > 0 && (
                    <Button onClick={() => setForm(prev => ({ ...prev, step: 'fill' }))} className="bg-[emerald-600] hover:bg-[emerald-700] text-white gap-2 cursor-pointer">
                        <Package size={16} /> Continue ({form.selectedIds.length} GP{form.selectedIds.length !== 1 ? 's' : ''})
                    </Button>
                )}
                {form.step === 'fill' && (
                    <Button variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, step: 'select' }))} className="cursor-pointer">
                        ← Change Selection
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
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

            {/* Step 1: Select Gate Passes */}
            {form.step === 'select' && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="border-b border-[var(--border)] pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>Select Gate Passes</CardTitle>
                                {pendingGPs.length > 0 && (
                                    <button
                                        onClick={toggleAll}
                                        className="text-[12px] text-[emerald-600] hover:text-[emerald-700] font-medium cursor-pointer"
                                    >
                                        {form.selectedIds.length === pendingGPs.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by client name…"
                                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-8 text-[13px] outline-none focus:border-[emerald-600] focus:ring-2 focus:ring-[emerald-600]/10"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] cursor-pointer">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                                </div>
                            ) : isError ? (
                                <ErrorState description={error instanceof Error ? error.message : 'Failed to load gate passes'} />
                            ) : pendingGPs.length === 0 ? (
                                <div className="py-8 text-center text-[13px] text-[var(--text-faint)]">
                                    No gate passes with pending items {search ? `for "${search}"` : ''}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pendingGPs.map(gp => {
                                        const isSelected = selectedIds.has(gp.gate_pass_id)
                                        return (
                                            <button
                                                key={gp.gate_pass_id}
                                                type="button"
                                                onClick={() => toggleGP(gp.gate_pass_id)}
                                                className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[emerald-200] bg-[emerald-50]'
                                                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[emerald-200] hover:bg-[emerald-50]'
                                                }`}
                                            >
                                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                                    isSelected
                                                        ? 'bg-[emerald-600] text-white border-[emerald-600]'
                                                        : 'bg-[blue-50] text-[blue-600] border-[blue-200] group-hover:bg-[blue-100]'
                                                }`}>
                                                    {isSelected ? <Check size={16} /> : <span className="text-[11px] font-bold">GP</span>}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{gp.client_name}</p>
                                                    <p className="text-[11px] text-[var(--text-faint)] font-mono">{gp.gate_pass_number} · {gp.receiving_date}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[13px] font-bold tex-orange-600">{gp.total_pending} pending</p>
                                                    <p className="text-[11px] text-[var(--text-faint)]">{gp.items.length} item type{gp.items.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 2: Fill Delivery */}
            {form.step === 'fill' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Selected GP Summary */}
                    <Card className="border-[emerald-200] bg-[emerald-50]">
                        <CardContent className="pt-4">
                            <div className="flex flex-wrap gap-2">
                                {selectedGPs.map(gp => (
                                    <div key={gp.gate_pass_id} className="flex items-center gap-2 rounded-lg bg-[var(--surface)] border border-[emerald-200] px-3 py-1.5 text-[12px]">
                                        <span className="font-semibold text-[var(--text-primary)]">{gp.client_name}</span>
                                        <span className="font-mono text-[var(--text-muted)]">{gp.gate_pass_number}</span>
                                        <span className="font-bold tex-orange-600">{gp.total_pending} pcs</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Details */}
                    <Card>
                        <CardHeader className="border-b border-[var(--border)] pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[emerald-50] border border-[emerald-200]">
                                    <Truck className="h-4 w-4 text-[emerald-600]" />
                                </div>
                                <CardTitle>Delivery Details</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div ref={flow.ref} onKeyDown={flow.handleKeyDown} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className={labelClass}>Delivery Date</label>
                                    <input type="date" value={form.deliveryDate} onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Delivered By</label>
                                    <input type="text" value={form.deliveredBy} onChange={e => setForm(p => ({ ...p, deliveredBy: e.target.value }))} placeholder="Staff name" className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Received By</label>
                                    <input type="text" value={form.receivedBy} onChange={e => setForm(p => ({ ...p, receivedBy: e.target.value }))} placeholder="Hotel / shop staff name" className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Notes</label>
                                    <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional…" className={inputClass} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fill Mode Toggle */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Fill Mode</span>
                                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, fillMode: 'manual' }))}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium transition cursor-pointer ${
                                            form.fillMode === 'manual'
                                                ? 'bg-[emerald-600] text-white'
                                                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                                        }`}
                                    >
                                        <Hand size={14} /> Manual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, fillMode: 'auto' }))}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium transition cursor-pointer ${
                                            form.fillMode === 'auto'
                                                ? 'bg-[emerald-600] text-white'
                                                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                                        }`}
                                    >
                                        <Wand2 size={14} /> Auto-fill (FIFO)
                                    </button>
                                </div>
                                <p className="text-[11px] text-[var(--text-faint)]">
                                    {form.fillMode === 'auto'
                                        ? 'Enter totals per item — system fills from oldest gate pass first'
                                        : 'Fill quantities manually for each gate pass item'
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── AUTO MODE: Item totals ──────────────────────────────── */}
                    {form.fillMode === 'auto' && (
                        <Card>
                            <CardHeader className="border-b border-[var(--border)] pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Item Totals</CardTitle>
                                        <p className="text-[12px] text-[var(--text-faint)] mt-0.5">
                                            Enter how many of each item to deliver — auto-distributed from oldest GP
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={setAutoMaxAll}
                                        className="text-[11px] font-medium text-[emerald-600] hover:text-[emerald-700] cursor-pointer"
                                    >
                                        Fill All Max
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-2" onKeyDown={autoGrid.handleKeyDown}>
                                {autoItemTotals.map((total, ti) => {
                                    const entered = form.autoTotals[total.item_key] ?? 0
                                    const over = entered > total.total_pending
                                    return (
                                        <div key={total.item_key} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                                                    {total.item_name}
                                                    {total.specification && (
                                                        <span className="ml-2 inline-flex items-center rounded bg-[orange-50] border border-[orange-200] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--red-600)]">
                                                            {total.specification}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-faint)]">
                                                    Available: {total.total_pending} across {allItems.filter(i => itemKey(i.item_name, i.specification) === total.item_key).length} GP{allItems.filter(i => itemKey(i.item_name, i.specification) === total.item_key).length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <input
                                                    ref={autoGrid.registerCell(ti, 0)}
                                                    type="number"
                                                    min={0}
                                                    max={total.total_pending}
                                                    value={entered || ''}
                                                    onChange={e => updateAutoTotal(total.item_key, Number(e.target.value))}
                                                    placeholder="0"
                                                    className="h-9 w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-center text-[var(--text-primary)] outline-none focus:border-[emerald-600] focus:ring-2 focus:ring-[emerald-600]/10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setAutoMax(total.item_key, total.total_pending)}
                                                    className="text-[11px] font-medium text-[emerald-600] hover:text-[emerald-700] cursor-pointer"
                                                >
                                                    Max
                                                </button>
                                            </div>
                                            {over && <AlertCircle className="h-4 w-4 text-[var(--red-600)] shrink-0" />}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── AUTO MODE: Live distribution preview ────────────────── */}
                    {form.fillMode === 'auto' && activeItems.length > 0 && (
                        <Card className="border-[blue-200] bg-[blue-50]">
                            <CardHeader className="border-b border-[blue-200] pb-3">
                                <CardTitle className="text-[14px] text-[blue-800]">Live Distribution Preview</CardTitle>
                                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Auto-filled from oldest gate pass to newest</p>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {itemsByGP.map(([gpId, group]) => (
                                    <div key={gpId} className="rounded-lg border border-[blue-200] bg-[var(--surface)] overflow-hidden">
                                        <div className="flex items-center justify-between bg-[blue-50] px-4 py-2 border-b border-[blue-200]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{group.client_name}</span>
                                                <span className="font-mono text-[11px] text-[var(--text-muted)]">{group.gate_pass_number}</span>
                                            </div>
                                            <span className="text-[11px] font-medium text-[blue-600]">
                                                {group.items.reduce((s, i) => s + i.quantity, 0)} pcs
                                            </span>
                                        </div>
                                        <div className="divide-y divide-[var(--border)]">
                                            {group.items.map(item => (
                                                <div key={`${item.gate_pass_id}||${item.item_name}||${item.specification}`} className="flex items-center gap-3 px-4 py-2.5">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                                                            {item.item_name}
                                                            {item.specification && (
                                                                <span className="ml-2 inline-flex items-center rounded bg-[orange-50] border border-[orange-200] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--red-600)]">
                                                                    {item.specification}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 text-[12px]">
                                                        <span className="text-[var(--text-faint)]">Pending: {item.pending_qty}</span>
                                                        <span className="font-semibold text-[emerald-600]">→ Sending: {item.quantity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── MANUAL MODE: Items per GP ──────────────────────────── */}
                    {form.fillMode === 'manual' && (
                        <Card>
                            <CardHeader className="border-b border-[var(--border)] pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Items to Deliver</CardTitle>
                                        <p className="text-[12px] text-[var(--text-faint)] mt-0.5">Fill quantities for each gate pass item</p>
                                    </div>
                                    <div className="text-[12px] text-[var(--text-muted)]">
                                        <span className="font-semibold text-[emerald-600]">{totalPieces}</span> pieces selected
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4" onKeyDown={manualGrid.handleKeyDown}>
                                {itemsByGP.map(([gpId, group]) => {
                                    return (
                                        <div key={gpId} className="rounded-xl border border-[var(--border)] overflow-hidden">
                                            <div className="flex items-center justify-between bg-[var(--surface-2)] px-4 py-2.5 border-b border-[var(--border)]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{group.client_name}</span>
                                                    <span className="font-mono text-[11px] text-[var(--text-faint)]">{group.gate_pass_number}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setMaxAll(gpId)}
                                                    className="text-[11px] font-medium text-[emerald-600] hover:text-[emerald-700] cursor-pointer"
                                                >
                                                    Fill All Max
                                                </button>
                                            </div>
                                            <div className="divide-y divide-[var(--border)]">
                                                {group.items.map(item => {
                                                    const globalIdx = items.findIndex(i => i.gate_pass_id === item.gate_pass_id && i.item_name === item.item_name && i.specification === item.specification)
                                                    const rowKeyStr = `${item.gate_pass_id}||${item.item_name}||${item.specification}`
                                                    const rIdx = manualRowIndex.get(rowKeyStr) ?? 0
                                                    return (
                                                        <div key={rowKeyStr} className="flex items-center gap-3 px-4 py-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                                                                    {item.item_name}
                                                                    {item.specification && (
                                                                        <span className="ml-2 inline-flex items-center rounded bg-[orange-50] border border-[orange-200] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--red-600)]">
                                                                            {item.specification}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-[11px] text-[var(--text-faint)]">Pending: {item.pending_qty}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <input
                                                                    ref={manualGrid.registerCell(rIdx, 0)}
                                                                    type="number"
                                                                    min={0}
                                                                    max={item.pending_qty}
                                                                    value={item.quantity}
                                                                    onChange={e => globalIdx >= 0 && updateItem(globalIdx, Number(e.target.value))}
                                                                    className="h-9 w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-center text-[var(--text-primary)] outline-none focus:border-[emerald-600] focus:ring-2 focus:ring-[emerald-600]/10"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => globalIdx >= 0 && setMax(globalIdx)}
                                                                    className="text-[11px] font-medium text-[emerald-600] hover:text-[emerald-700] cursor-pointer transition"
                                                                >
                                                                    Max
                                                                </button>
                                                            </div>
                                                            {item.quantity > item.pending_qty && (
                                                                <AlertCircle className="h-4 w-4 text-[var(--red-600)] shrink-0" />
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Submit */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="text-[13px] text-[var(--text-muted)]">
                                    Delivering{' '}
                                    <span className="font-semibold text-[var(--text-primary)]">{totalPieces}</span>{' '}
                                    pieces across{' '}
                                    <span className="font-semibold text-[var(--text-primary)]">{itemCount}</span>{' '}
                                    item{itemCount !== 1 ? 's' : ''} from{' '}
                                    <span className="font-semibold text-[var(--text-primary)]">{form.selectedIds.length}</span>{' '}
                                    gate pass{form.selectedIds.length !== 1 ? 'es' : ''}
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Link to="/deliveries" className="flex-1 sm:flex-none">
                                        <Button variant="secondary" className="w-full cursor-pointer">Cancel</Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={!isValid || createDelivery.isPending}
                                        className="flex-1 sm:flex-none bg-[emerald-600] hover:bg-[emerald-700] text-white disabled:opacity-40 cursor-pointer"
                                    >
                                        {createDelivery.isPending ? 'Saving…' : `Record Delivery (${form.selectedIds.length} GP${form.selectedIds.length !== 1 ? 's' : ''})`}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            )}
        </div>
    )
}