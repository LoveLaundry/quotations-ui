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
  const [selectedItemId, setSelectedItemId] = useState<string | number>(
    defaultQuotationId ?? (quotations[0]?.id || ''),
  )
  const [quantity, setQuantity] = useState(2)
  const [expressService, setExpressService] = useState(true)

  if (!open) return null

  const selectedItem = quotations.find((q) => String(q.id) === String(selectedItemId)) || quotations[0]
  const optionsEntries = selectedItem ? Object.entries(selectedItem.unit_price_with_options) : []
  const basePrice = optionsEntries.length > 0 ? optionsEntries[0][1] : 0
  const subtotal = basePrice * quantity
  const expressSurcharge = expressService ? subtotal * 0.25 : 0
  const tax = (subtotal + expressSurcharge) * 0.1
  const grandTotal = subtotal + expressSurcharge + tax

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl my-8"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
                <Printer className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-card-title text-slate-900 font-bold">Print Hotel Guest Receipt</h3>
                <p className="text-[18px] text-slate-500 font-medium">Love Laundry Guest Account System</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-3 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-8 w-8" />
            </button>
          </div>

          <div className="grid gap-8 p-8 lg:grid-cols-12">
            {/* Left Controls Column */}
            <div className="space-y-6 lg:col-span-5">
              <div className="space-y-2">
                <label className="text-input-label text-slate-800">Room Number</label>
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 408"
                />
              </div>

              <div className="space-y-2">
                <label className="text-input-label text-slate-800">Guest Full Name</label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-input-label text-slate-800">Laundry Item</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full h-16 rounded-2xl border border-slate-200 bg-white px-5 text-input-entry text-slate-900 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-500/15 shadow-sm"
                >
                  {quotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.item_name} ({q.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-input-label text-slate-800">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-input-label text-slate-800">Express +25%</label>
                  <button
                    type="button"
                    onClick={() => setExpressService(!expressService)}
                    className={`w-full h-16 rounded-2xl border px-4 flex items-center justify-center gap-2 text-[20px] font-bold transition cursor-pointer ${
                      expressService
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {expressService ? <Check className="h-6 w-6" /> : null}
                    {expressService ? 'Express' : 'Standard'}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button size="lg" className="w-full font-bold text-[22px]" onClick={handlePrint}>
                  <Printer className="h-7 w-7 mr-2" /> Print Official Bill
                </Button>
              </div>
            </div>

            {/* Right Receipt Preview Column */}
            <div className="lg:col-span-7">
              <div 
                id="printable-receipt"
                className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 space-y-6 font-sans shadow-sm"
              >
                {/* Receipt Header */}
                <div className="text-center space-y-2 border-b border-slate-200 pb-6">
                  <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">LOVE LAUNDRY GUEST ACCOUNTS</h2>
                  <p className="text-[18px] font-bold text-red-600 uppercase tracking-widest">LUXURY HOTEL LAUNDRY BILL</p>
                  <p className="text-[16px] text-slate-500 font-medium">Printed: {formatDate(new Date().toISOString())}</p>
                </div>

                {/* Guest Details Row */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-5 border border-slate-200 text-[18px]">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[15px] uppercase">GUEST NAME</span>
                    <span className="font-bold text-slate-900">{guestName || 'Valued Guest'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[15px] uppercase">ROOM / SUITE</span>
                    <span className="font-bold text-slate-900">Room #{roomNumber || '---'}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[17px] font-bold text-slate-400 border-b border-slate-200 pb-2 uppercase">
                    <span>Item & Service</span>
                    <span>Qty × Rate</span>
                    <span>Total</span>
                  </div>

                  {selectedItem ? (
                    optionsEntries.map(([svcName, svcPrice]) => (
                      <div key={svcName} className="flex justify-between items-center text-[20px] font-semibold text-slate-800 py-1">
                        <div>
                          <p className="font-bold text-slate-900">{selectedItem.item_name}</p>
                          <p className="text-[16px] font-medium text-slate-500">{selectedItem.category} • {svcName}</p>
                        </div>
                        <div className="text-[18px] font-medium text-slate-600">
                          {quantity} × {formatCurrency(svcPrice)}
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatCurrency(svcPrice * quantity)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-[18px]">No item selected</p>
                  )}
                </div>

                {/* Calculation Summary */}
                <div className="border-t border-slate-200 pt-4 space-y-2 text-[19px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>

                  {expressService ? (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Express Turnaround (+25%)</span>
                      <span>+{formatCurrency(expressSurcharge)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between text-slate-600">
                    <span>Govt Tax / VAT (10%)</span>
                    <span className="font-semibold">+{formatCurrency(tax)}</span>
                  </div>

                  <div className="flex justify-between border-t-2 border-slate-900 pt-3 text-[26px] font-extrabold text-slate-900">
                    <span>Total Bill</span>
                    <span className="text-red-600">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Signature Box */}
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="h-12 border-b-2 border-slate-300 w-48 mb-2" />
                      <span className="text-[15px] font-bold text-slate-400 uppercase">Guest Signature</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[15px] font-bold text-slate-400 block uppercase">Folio Code</span>
                      <span className="text-[17px] font-mono font-bold text-slate-800">LL-GUEST-{roomNumber}-2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
