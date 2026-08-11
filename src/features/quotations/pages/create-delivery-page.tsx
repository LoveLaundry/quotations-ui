import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, ArrowLeft, Search, X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/ui/error-state'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { useGatePasses } from '../hooks/useGatePasses'
import { useCreateDelivery } from '../hooks/useDeliveries'
import type { GatePass } from '../../../types/operations'

interface DeliveryItem {
    item_name: string
    quantity: number
    available: number
}

export default function CreateDeliveryPage() {
    const navigate = useNavigate()
    const createDelivery = useCreateDelivery()

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedGP, setSelectedGP] = useState<GatePass | null>(null)
    const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0])
    const [deliveredBy, setDeliveredBy] = useState('')
    const [receivedBy, setReceivedBy] = useState('')
    const [notes, setNotes] = useState('')
    const [items, setItems] = useState<DeliveryItem[]>([])

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
        return () => clearTimeout(t)
    }, [search])

    const { data: allGPs = [], isLoading: gpsLoading, isError: gpsError, error: gpsErrorObj } = useGatePasses(
        selectedGP ? undefined : { client_name: debouncedSearch || undefined }
    )

    // Only show gate passes that can have deliveries
    const deliverableGPs = allGPs.filter((gp: any) =>
        !['DELIVERED', 'CANCELLED'].includes(gp.status)
    )

    const handleSelectGP = (gp: GatePass) => {
        setSelectedGP(gp)
        // Pre-populate items from gate pass with 0 qty
        setItems(
            gp.items.map(i => ({
                item_name: i.item_name,
                quantity: 0,
                available: i.received_qty, // simplified; real app would subtract prior deliveries
            }))
        )
    }

    const updateItem = (index: number, quantity: number) => {
        setItems(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], quantity: Math.max(0, quantity) }
            return updated
        })
    }

    const setMax = (index: number) => {
        setItems(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], quantity: updated[index].available }
            return updated
        })
    }

    const activeItems = items.filter(i => i.quantity > 0)

    const isValid =
        selectedGP &&
        deliveryDate &&
        deliveredBy.trim() &&
        receivedBy.trim() &&
        activeItems.length > 0 &&
        activeItems.every(i => i.quantity <= i.available)

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!isValid || !selectedGP) return

        createDelivery.mutate(
            {
                gate_pass_id: selectedGP.id || (selectedGP as any)._id,
                client_name: selectedGP.client_name,
                delivery_date: new Date(deliveryDate).toISOString(),
                delivered_by: deliveredBy.trim(),
                received_by: receivedBy.trim(),
                notes: notes.trim() || undefined,
                items: activeItems.map(({ item_name, quantity }) => ({ item_name, quantity: Math.floor(Number(quantity)) })),
            },
            { onSuccess: () => navigate('/deliveries') },
        )
    }

    const inputClass =
        'h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10 shadow-sm transition'
    const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] mb-1.5'

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Link to="/deliveries" className="mt-1 text-[#98A2B3] hover:text-[#374151] transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <Breadcrumb
                        items={[
                            { label: 'Dashboard', href: '/' },
                            { label: 'Deliveries', href: '/deliveries' },
                            { label: 'Record Delivery' },
                        ]}
                    />
                    <h1 className="text-dashboard-title mt-1">Record Delivery</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        {selectedGP ? `Delivering for ${selectedGP.client_name}` : 'Select a gate pass to record delivery against'}
                    </p>
                </div>
            </div>

            {/* Step 1: Gate Pass Selection */}
            {!selectedGP ? (
                <Card>
                    <CardHeader className="border-b border-[#F2F4F7] pb-3">
                        <CardTitle>Select Gate Pass</CardTitle>
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

                        {gpsLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i}><Skeleton className="h-16" /></div>)}
                            </div>
                        ) : gpsError ? (
                            <ErrorState description={gpsErrorObj instanceof Error ? gpsErrorObj.message : 'Failed to load gate passes'} />
                        ) : deliverableGPs.length === 0 ? (
                            <div className="py-8 text-center text-[13px] text-[#98A2B3]">
                                No gate passes available for delivery
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {deliverableGPs.map((gp: any) => {
                                    const totalPcs = gp.items.reduce((s: number, i: any) => s + i.received_qty, 0)
                                    return (
                                        <button
                                            key={gp.id || (gp as any)._id}
                                            type="button"
                                            onClick={() => handleSelectGP(gp)}
                                            className="group flex w-full items-center gap-3 rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 text-left hover:border-[#BBF7D0] hover:bg-[#F0FDF4] transition cursor-pointer"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] group-hover:bg-[#DBEAFE] transition-colors">
                                                <span className="text-[11px] font-bold">GP</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-semibold text-[#101828] truncate">{gp.client_name}</p>
                                                <p className="text-[11px] text-[#98A2B3] font-mono">{gp.gate_pass_number}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[12px] font-semibold text-[#374151]">{totalPcs} pcs</p>
                                                <p className="text-[11px] text-[#98A2B3]">{gp.status.replace(/_/g, ' ')}</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Selected GP Banner */}
                    <Card className="border-[#BBF7D0] bg-[#F0FDF4]">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                                        <span className="text-[11px] font-bold">GP</span>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#101828]">{selectedGP.client_name}</p>
                                        <p className="text-[11px] font-mono text-[#6B7280]">{selectedGP.gate_pass_number}</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedGP(null); setItems([]) }}
                                    className="text-[#6B7280]"
                                >
                                    Change
                                </Button>
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
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={e => setDeliveryDate(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Delivered By</label>
                                    <input
                                        type="text"
                                        value={deliveredBy}
                                        onChange={e => setDeliveredBy(e.target.value)}
                                        placeholder="Staff name"
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Received By (Hotel)</label>
                                    <input
                                        type="text"
                                        value={receivedBy}
                                        onChange={e => setReceivedBy(e.target.value)}
                                        placeholder="Hotel staff name"
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Notes</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Optional…"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items to Deliver */}
                    <Card>
                        <CardHeader className="border-b border-[#F2F4F7] pb-3">
                            <CardTitle>Items to Deliver</CardTitle>
                            <p className="text-[12px] text-[#98A2B3] mt-0.5">Enter 0 for items not being delivered in this trip</p>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            <AnimatePresence initial={false}>
                                {items.map((item, idx) => (
                                    <motion.div
                                        key={item.item_name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-[#FAFAFA] px-4 py-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-[#101828] truncate">{item.item_name}</p>
                                            <p className="text-[11px] text-[#98A2B3]">Available: {item.available}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <input
                                                type="number"
                                                min={0}
                                                max={item.available}
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, Number(e.target.value))}
                                                className="h-9 w-20 rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-center text-[#101828] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMax(idx)}
                                                className="text-[11px] font-medium text-[#16A34A] hover:text-[#15803D] cursor-pointer transition"
                                            >
                                                Max
                                            </button>
                                        </div>
                                        {item.quantity > item.available && (
                                            <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0" />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="text-[13px] text-[#6B7280]">
                                    Delivering{' '}
                                    <span className="font-semibold text-[#101828]">
                                        {activeItems.reduce((s, i) => s + i.quantity, 0)}
                                    </span>{' '}
                                    pieces across{' '}
                                    <span className="font-semibold text-[#101828]">{activeItems.length}</span>{' '}
                                    item type{activeItems.length !== 1 ? 's' : ''}
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Link to="/deliveries" className="flex-1 sm:flex-none">
                                        <Button variant="secondary" className="w-full">Cancel</Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={!isValid || createDelivery.isPending}
                                        className="flex-1 sm:flex-none bg-[#16A34A] hover:bg-[#15803D] text-white disabled:opacity-40"
                                    >
                                        {createDelivery.isPending ? 'Saving…' : 'Record Delivery'}
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
