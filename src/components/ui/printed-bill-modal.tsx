import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, X, Check } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { useQuotations } from '../../features/quotations/hooks/useQuotations'
import { formatCurrency, formatDate } from '../../lib/utils'

interface PrintedBillModalProps {
  open: boolean
  onClose: () => void
  defaultQuotationId?: string | number
}

export function PrintedBillModal({ open, onClose, defaultQuotationId }: PrintedBillModalProps) {
  const { data: quotations = [] } = useQuotations()
  const [roomNumber, setRoomNumber] = useState('408')
  const [guestName, setGuestName] = useState('Alexander Wright')
  const [selectedItemId, setSelectedItemId] = useState<string | number>(defaultQuotationId ?? '')
  const [quantity, setQuantity] = useState(2)
  const [expressService, setExpressService] = useState(true)

  const resolvedId = selectedItemId || quotations[0]?.id || ''
  const selectedItem = quotations.find((q) => String(q.id) === String(resolvedId)) ?? quotations[0]
  const optionsEntries = selectedItem ? Object.entries(selectedItem.unit_price_with_options) : []
  const basePrice = optionsEntries[0]?.[1] ?? 0
  const subtotal = basePrice * quantity
  const expressSurcharge = expressService ? subtotal * 0.25 : 0
  const tax = (subtotal + expressSurcharge) * 0.1
  const grandTotal = subtotal + expressSurcharge + tax

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl my-4 sm:my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
                  <Printer className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">Print Guest Receipt</p>
                  <p className="text-[11px] text-slate-500">Love Laundry Guest Accounts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body — stacks on mobile, side-by-side on lg */}
            <div className="grid gap-5 p-5 lg:grid-cols-12">
              {/* Controls */}
              <div className="space-y-3 lg:col-span-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-input-label text-slate-700">Room</label>
                    <Input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="408" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-input-label text-slate-700">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-input-label text-slate-700">Guest Name</label>
                  <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Doe" />
                </div>

                <div className="space-y-1">
                  <label className="text-input-label text-slate-700">Laundry Item</label>
                  <select
                    value={resolvedId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 shadow-xs"
                  >
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>{q.item_name} ({q.category})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-input-label text-slate-700">Express +25%</label>
                  <button
                    type="button"
                    onClick={() => setExpressService(!expressService)}
                    className={`w-full h-9 rounded-lg border px-3 flex items-center justify-center gap-2 text-[13px] font-semibold transition cursor-pointer ${
                      expressService
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {expressService && <Check className="h-3.5 w-3.5" />}
                    {expressService ? 'Express Turnaround' : 'Standard Service'}
                  </button>
                </div>

                <Button size="lg" className="w-full" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print Official Bill
                </Button>
              </div>

              {/* Receipt preview */}
              <div className="lg:col-span-7">
                <div
                  id="printable-receipt"
                  className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 space-y-4"
                >
                  {/* Receipt header */}
                  <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                    <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight uppercase">
                      Love Laundry Guest Accounts
                    </h2>
                    <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest">
                      Luxury Hotel Laundry Bill
                    </p>
                    <p className="text-[11px] text-slate-400">Printed: {formatDate(new Date().toISOString())}</p>
                  </div>

                  {/* Guest details */}
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-white p-3 border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Guest</span>
                      <span className="text-[13px] font-semibold text-slate-900">{guestName || 'Valued Guest'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Room</span>
                      <span className="text-[13px] font-semibold text-slate-900">#{roomNumber || '---'}</span>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 border-b border-slate-200 pb-1.5 uppercase">
                      <span>Item & Service</span>
                      <span>Qty × Rate</span>
                      <span>Total</span>
                    </div>
                    {selectedItem ? (
                      optionsEntries.map(([svcName, svcPrice]) => (
                        <div key={svcName} className="flex justify-between items-start text-[12px] py-0.5">
                          <div>
                            <p className="font-semibold text-slate-900">{selectedItem.item_name}</p>
                            <p className="text-[11px] text-slate-500">{selectedItem.category} · {svcName}</p>
                          </div>
                          <span className="text-slate-500">{quantity}×{formatCurrency(svcPrice)}</span>
                          <span className="font-bold text-slate-900">{formatCurrency(svcPrice * quantity)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[12px] text-slate-400">No item selected</p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-slate-200 pt-3 space-y-1.5 text-[13px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {expressService && (
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Express (+25%)</span>
                        <span>+{formatCurrency(expressSurcharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>VAT (10%)</span>
                      <span className="font-medium">+{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-2 text-[15px] font-bold text-slate-900">
                      <span>Total Bill</span>
                      <span className="text-red-600">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="border-t border-slate-200 pt-3 flex items-end justify-between">
                    <div>
                      <div className="h-8 border-b-2 border-slate-300 w-32 mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Guest Signature</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Folio</span>
                      <span className="text-[11px] font-mono font-bold text-slate-700">LL-{roomNumber}-2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
