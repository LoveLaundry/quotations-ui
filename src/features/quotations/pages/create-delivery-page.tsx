import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, ArrowLeft, Search, X, AlertCircle, Check, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/ui/error-state'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { deliveries } from '../services/delivery.service'
import { useCreateDelivery } from '../hooks/useDeliveries'
import type { PendingGatePass } from '../services/delivery.service'

interface SelectedItem {
    gate_pass_id: string
    gate_pass_number: string
    client_name: string
    item_name: string
    specification: string
    category: string
    pending_qty: number
    quantity: number
}

const inputClass =
    'h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10 shadow-sm transition'
const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] mb-1.5'

export default function CreateDeliveryPage() {
    const navigate = useNavigate()
    const createDelivery = useCreateDelivery()

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0])
    const [deliveredBy, setDeliveredBy] = useState('')
    const [receivedBy, setReceivedBy] = useState('')
    const [notes, setNotes] = useState('')
    const [step, setStep] = useState<'select' | 'fill'>('select')

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
        return () => clearTimeout(t)
    }, [search])

    const { data: pendingGPs = [], isLoading, isError, error } = useQuery<PendingGatePass[]>({
        queryKey: ['pending-gatepasses', debouncedSearch],
        queryFn: () => deliveries.pendingGatePasses(debouncedSearch || undefined),
        staleTime: 30_000,
    })

    const selectedGPs = useMemo(
        () => pendingGPs.filter(gp => selectedIds.has(gp.gate_pass_id)),
        [pendingGPs, selectedIds],
    )

    // Build items from selected gate passes, sorted by pending_qty ascending (low → high)
    const allItems: SelectedItem[] = useMemo(() => {
        const items: SelectedItem[] = []
        for (const gp of selectedGPs) {
            for (const item of gp.items) {
                items.push({
                    gate_pass_id: gp.gate_pass_id,
                    gate_pass_number: gp.gate_pass_number,
                    client_name: gp.client_name,
                    item_name: item.item_name,
                    specification: item.specification,
                    category: item.category,
                    pending_qty: item.pending_qty,
                    quantity: 0,
                })
            }
        }
        items.sort((a, b) => a.pending_qty - b.pending_qty)
        return items
    }, [selectedGPs])

    const [items, setItems] = useState<SelectedItem[]>([])

    // Sync items when selection changes
    useEffect(() => {
        setItems(prev => {
            // Preserve existing quantities for items that are still selected
            const prevMap = new Map<string, number>()
            for (const p of prev) {
                const key = `${p.gate_pass_id}||${p.item_name}||${p.specification}`
                prevMap.set(key, p.quantity)
            }
            return allItems.map(item => {
                const key = `${item.gate_pass_id}||${item.item_name}||${item.specification}`
                return { ...item, quantity: prevMap.get(key) ?? 0 }
            })
        })
    }, [allItems])

    const toggleGP = useCallback((gpId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(gpId)) next.delete(gpId)
            else next.add(gpId)
            return next
        })
    }, [])

    const toggleAll = useCallback(() => {
        if (selectedIds.size === pendingGPs.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(pendingGPs.map(gp => gp.gate_pass_id)))
        }
    }, [pendingGPs, selectedIds.size])

    const updateItem = (idx: number, qty: number) => {
        setItems(prev => {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], quantity: Math.max(0, qty) }
            return updated
        })
    }

    const setMax = (idx: number) => {
        setItems(prev => {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], quantity: updated[idx].pending_qty }
            return updated
        })
    }

    const setMaxAll = (gpId: string) => {
        setItems(prev => prev.map(item =>
            item.gate_pass_id === gpId ? { ...item, quantity: item.pending_qty } : item
        ))
    }

    const activeItems = items.filter(i => i.quantity > 0)
    const totalPieces = activeItems.reduce((s, i) => s + i.quantity, 0)
    const itemCount = activeItems.length

    const isValid =
        selectedIds.size > 0 &&
        deliveryDate &&
        deliveredBy.trim() &&
        receivedBy.trim() &&
        activeItems.length > 0 &&
        activeItems.every(i => i.quantity <= i.pending_qty)

    // Group active items by gate_pass_id for submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        // Group items by gate_pass_id
        const byGP = new Map<string, { client_name: string; items: SelectedItem[] }>()
        for (const item of activeItems) {
            const existing = byGP.get(item.gate_pass_id)
            if (existing) {
                existing.items.push(item)
            } else {
                byGP.set(item.gate_pass_id, { client_name: item.client_name, items: [item] })
            }
        }

        // Create one delivery per gate pass
        const promises: Promise<any>[] = []
        for (const [gpId, data] of byGP) {
            promises.push(
                createDelivery.mutateAsync({
                    gate_pass_id: gpId,
                    client_name: data.client_name,
                    delivery_date: new Date(deliveryDate).toISOString(),
                    delivered_by: deliveredBy.trim(),
                    received_by: receivedBy.trim(),
                    notes: notes.trim() || undefined,
                    items: data.items.map(i => ({
                        item_name: i.item_name,
                        specification: i.specification || undefined,
                        quantity: Math.floor(i.quantity),
                    })),
                })
            )
        }

        await Promise.all(promises)
        navigate('/deliveries')
    }

    // Items grouped by gate pass for display
    const itemsByGP = useMemo(() => {
        const map = new Map<string, { client_name: string; gate_pass_number: string; items: SelectedItem[] }>()
        for (const item of items) {
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
    }, [items])

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Link to="/deliveries" className="mt-1 text-[#98A2B3] hover:text-[#374151] transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <Breadcrumb
                        items={[
                            { label: 'Dashboard', href: '/' },
                            { label: 'Deliveries', href: '/deliveries' },
                            { label: 'Record Delivery' },
                        ]}
                    />
                    <h1 className="text-dashboard-title mt-1">Record Delivery</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        {step === 'select'
                            ? 'Select gate passes with pending items to deliver'
                            : `Delivering ${totalPieces} pieces across ${itemCount} item${itemCount !== 1 ? 's' : ''} from ${selectedIds.size} gate pass${selectedIds.size !== 1 ? 'es' : ''}`
                        }
                    </p>
                </div>
                {step === 'select' && selectedIds.size > 0 && (
                    <Button onClick={() => setStep('fill')} className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2 cursor-pointer">
                        <Package size={16} /> Continue ({selectedIds.size} GP{selectedIds.size !== 1 ? 's' : ''})
                    </Button>
                )}
                {step === 'fill' && (
                    <Button variant="ghost" size="sm" onClick={() => setStep('select')} className="cursor-pointer">
                        ← Change Selection
                    </Button>
                )}
            </div>

            {/* Step 1: Select Gate Passes */}
            {step === 'select' && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="border-b border-[#F2F4F7] pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>Select Gate Passes</CardTitle>
                                {pendingGPs.length > 0 && (
                                    <button
                                        onClick={toggleAll}
                                        className="text-[12px] text-[#16A34A] hover:text-[#15803D] font-medium cursor-pointer"
                                    >
                                        {selectedIds.size === pendingGPs.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by client name…"
                                    className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10 shadow-sm"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] cursor-pointer">
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
                                <div className="py-8 text-center text-[13px] text-[#98A2B3]">
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
                                                        ? 'border-[#BBF7D0] bg-[#F0FDF4]'
                                                        : 'border-[#E4E7EC] bg-white hover:border-[#BBF7D0] hover:bg-[#F0FDF4]'
                                                }`}
                                            >
                                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#16A34A] text-white border-[#16A34A]'
                                                        : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] group-hover:bg-[#DBEAFE]'
                                                }`}>
                                                    {isSelected ? <Check size={16} /> : <span className="text-[11px] font-bold">GP</span>}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-semibold text-[#101828] truncate">{gp.client_name}</p>
                                                    <p className="text-[11px] text-[#98A2B3] font-mono">{gp.gate_pass_number} · {gp.receiving_date}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[13px] font-bold text-[#EA580C]">{gp.total_pending} pending</p>
                                                    <p className="text-[11px] text-[#98A2B3]">{gp.items.length} item type{gp.items.length !== 1 ? 's' : ''}</p>
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
            {step === 'fill' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Selected GP Summary */}
                    <Card className="border-[#BBF7D0] bg-[#F0FDF4]">
                        <CardContent className="pt-4">
                            <div className="flex flex-wrap gap-2">
                                {selectedGPs.map(gp => (
                                    <div key={gp.gate_pass_id} className="flex items-center gap-2 rounded-lg bg-white border border-[#BBF7D0] px-3 py-1.5 text-[12px]">
                                        <span className="font-semibold text-[#101828]">{gp.client_name}</span>
                                        <span className="font-mono text-[#6B7280]">{gp.gate_pass_number}</span>
                                        <span className="font-bold text-[#EA580C]">{gp.total_pending} pcs</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Details */}
                    <Card>
                        <CardHeader className="border-b border-[#F2F4F7] pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                                    <Truck className="h-4 w-4 text-[#16A34A]" />
                                </div>
                                <CardTitle>Delivery Details</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className={labelClass}>Delivery Date</label>
                                    <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Delivered By</label>
                                    <input type="text" value={deliveredBy} onChange={e => setDeliveredBy(e.target.value)} placeholder="Staff name" className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Received By</label>
                                    <input type="text" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Hotel / shop staff name" className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Notes</label>
                                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional…" className={inputClass} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items grouped by Gate Pass */}
                    <Card>
                        <CardHeader className="border-b border-[#F2F4F7] pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Items to Deliver</CardTitle>
                                    <p className="text-[12px] text-[#98A2B3] mt-0.5">Sorted by pending quantity (low to high) — fill starting from the smallest</p>
                                </div>
                                <div className="text-[12px] text-[#6B7280]">
                                    <span className="font-semibold text-[#16A34A]">{totalPieces}</span> pieces selected
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {itemsByGP.map(([gpId, group]) => {
                                return (
                                    <div key={gpId} className="rounded-xl border border-[#E4E7EC] overflow-hidden">
                                        <div className="flex items-center justify-between bg-[#F9FAFB] px-4 py-2.5 border-b border-[#E4E7EC]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-semibold text-[#101828]">{group.client_name}</span>
                                                <span className="font-mono text-[11px] text-[#98A2B3]">{group.gate_pass_number}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setMaxAll(gpId)}
                                                className="text-[11px] font-medium text-[#16A34A] hover:text-[#15803D] cursor-pointer"
                                            >
                                                Fill All Max
                                            </button>
                                        </div>
                                        <div className="divide-y divide-[#F2F4F7]">
                                            {group.items.map((item, _) => {
                                                const globalIdx = items.findIndex(i => i.gate_pass_id === item.gate_pass_id && i.item_name === item.item_name && i.specification === item.specification)
                                                return (
                                                    <div key={`${item.gate_pass_id}||${item.item_name}||${item.specification}`} className="flex items-center gap-3 px-4 py-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-medium text-[#101828] truncate">
                                                                {item.item_name}
                                                                {item.specification && (
                                                                    <span className="ml-2 inline-flex items-center rounded bg-[#FFF7ED] border border-[#FED7AA] px-1.5 py-0.5 text-[10px] font-semibold text-[#EA580C]">
                                                                        {item.specification}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-[11px] text-[#98A2B3]">Pending: {item.pending_qty}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={item.pending_qty}
                                                                value={item.quantity}
                                                                onChange={e => globalIdx >= 0 && updateItem(globalIdx, Number(e.target.value))}
                                                                className="h-9 w-20 rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-center text-[#101828] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => globalIdx >= 0 && setMax(globalIdx)}
                                                                className="text-[11px] font-medium text-[#16A34A] hover:text-[#15803D] cursor-pointer transition"
                                                            >
                                                                Max
                                                            </button>
                                                        </div>
                                                        {item.quantity > item.pending_qty && (
                                                            <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0" />
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

                    {/* Submit */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="text-[13px] text-[#6B7280]">
                                    Delivering{' '}
                                    <span className="font-semibold text-[#101828]">{totalPieces}</span>{' '}
                                    pieces across{' '}
                                    <span className="font-semibold text-[#101828]">{itemCount}</span>{' '}
                                    item{itemCount !== 1 ? 's' : ''} from{' '}
                                    <span className="font-semibold text-[#101828]">{selectedIds.size}</span>{' '}
                                    gate pass{selectedIds.size !== 1 ? 'es' : ''}
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Link to="/deliveries" className="flex-1 sm:flex-none">
                                        <Button variant="secondary" className="w-full cursor-pointer">Cancel</Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={!isValid || createDelivery.isPending}
                                        className="flex-1 sm:flex-none bg-[#16A34A] hover:bg-[#15803D] text-white disabled:opacity-40 cursor-pointer"
                                    >
                                        {createDelivery.isPending ? 'Saving…' : `Record Delivery (${selectedIds.size} GP${selectedIds.size !== 1 ? 's' : ''})`}
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
