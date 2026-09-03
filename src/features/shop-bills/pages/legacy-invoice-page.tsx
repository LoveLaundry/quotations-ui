import { useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { COMPANY } from '../../../config/company'

interface InvoiceRow {
  id: string
  date: string
  billNumber: string
  amount: number
}

const inputClass = 'h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] focus:ring-2 focus:[#DC2626]/10 transition'

function makeRow(): InvoiceRow {
  return { id: crypto.randomUUID(), date: '', billNumber: '', amount: 0 }
}

export default function LegacyInvoicePage() {
  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState<InvoiceRow[]>([makeRow()])

  const updateRow = (id: string, field: keyof InvoiceRow, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, makeRow()])
  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const grandTotal = useMemo(() => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0), [rows])

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${shopName || 'Legacy'}`,
  })

  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const invoiceNo = `INV-${nowStr}-LEGACY`

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Shop Bills', href: '/shop-bills' }, { label: 'Legacy Invoice' }]} />
          <h1 className="text-dashboard-title mt-1">Legacy Invoice</h1>
          <p className="text-[13px] text-[#98A2B3] mt-0.5">
            Create a consolidated invoice from old bills — just date, bill number, and amount.
          </p>
        </div>
        <Button onClick={handlePrint} disabled={!shopName.trim() || grandTotal === 0} className="gap-2 cursor-pointer">
          <Printer size={16} /> Print Invoice
        </Button>
      </div>

      {/* Editable Form */}
      <div className="space-y-4 print:hidden">
        <Card className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] mb-1.5">Shop / Hotel Name *</label>
              <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Enter shop or hotel name" className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] mb-1.5">Description (optional)</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Laundry services for July 2026" className={inputClass} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-[#101828]">Bill Entries</h3>
            <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5 cursor-pointer">
              <Plus size={14} /> Add Row
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E4E7EC]">
                  <th className="py-2 pr-3 text-left font-semibold text-[#6B7280] w-[40px]">#</th>
                  <th className="py-2 pr-3 text-left font-semibold text-[#6B7280]">Date</th>
                  <th className="py-2 pr-3 text-left font-semibold text-[#6B7280]">Bill Number</th>
                  <th className="py-2 pr-3 text-right font-semibold text-[#6B7280]">Amount (Rs.)</th>
                  <th className="py-2 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-[#F2F4F7]">
                    <td className="py-2 pr-3 text-[#98A2B3]">{idx + 1}</td>
                    <td className="py-2 pr-3">
                      <input type="date" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)} className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-2 text-[13px] outline-none focus:border-[#DC2626] transition" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="text" value={row.billNumber} onChange={e => updateRow(row.id, 'billNumber', e.target.value)} placeholder="e.g. BL-001" className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-2 text-[13px] outline-none focus:border-[#DC2626] transition" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min="0" step="0.01" value={row.amount || ''} onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0.00" className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-2 text-[13px] text-right outline-none focus:border-[#DC2626] transition" />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeRow(row.id)} disabled={rows.length <= 1} className="p-1.5 text-[#98A2B3] hover:text-[#DC2626] disabled:opacity-30 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#101828]">
                  <td colSpan={3} className="py-3 pr-3 text-right font-bold text-[#101828]">Grand Total</td>
                  <td className="py-3 pr-3 text-right font-bold text-[#101828]">Rs. {grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* Printable Invoice */}
      <div ref={printRef} className="hidden print:block">
        <div className="p-8 font-sans text-[12px] text-[#101828]">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-bold text-[#DC2626]">{COMPANY.name}</h1>
              <p className="text-[11px] text-[#6B7280]">{COMPANY.tagline}</p>
              <p className="text-[11px] text-[#6B7280] mt-1">{COMPANY.address.line1}</p>
              <p className="text-[11px] text-[#6B7280]">{COMPANY.address.line2}</p>
              <p className="text-[11px] text-[#6B7280]">Reg: {COMPANY.registrationNo}</p>
            </div>
            <div className="text-right">
              <h2 className="text-[18px] font-bold text-[#101828]">INVOICE</h2>
              <p className="text-[11px] text-[#6B7280] mt-1">{invoiceNo}</p>
              <p className="text-[11px] text-[#6B7280]">Date: {new Date().toLocaleDateString('en-LK')}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6 p-4 bg-[#F9FAFB] rounded-lg">
            <p className="text-[10px] font-semibold uppercase text-[#98A2B3] mb-1">Bill To</p>
            <p className="text-[14px] font-bold text-[#101828]">{shopName}</p>
            {description && <p className="text-[12px] text-[#6B7280] mt-0.5">{description}</p>}
          </div>

          {/* Table */}
          <table className="w-full text-[12px] mb-6">
            <thead>
              <tr className="bg-[#F9FAFB] border-y border-[#E4E7EC]">
                <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">#</th>
                <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">Date</th>
                <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">Bill Number</th>
                <th className="py-2 px-3 text-right font-semibold text-[#6B7280]">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {rows.filter(r => r.billNumber || r.amount > 0).map((row, idx) => (
                <tr key={row.id} className="border-b border-[#F2F4F7]">
                  <td className="py-2 px-3 text-[#98A2B3]">{idx + 1}</td>
                  <td className="py-2 px-3">{row.date ? new Date(row.date).toLocaleDateString('en-LK') : '—'}</td>
                  <td className="py-2 px-3 font-medium">{row.billNumber || '—'}</td>
                  <td className="py-2 px-3 text-right">{(Number(row.amount) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#101828] font-bold">
                <td colSpan={3} className="py-3 px-3 text-right">Grand Total</td>
                <td className="py-3 px-3 text-right text-[14px]">Rs. {grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-[#E4E7EC] text-center text-[10px] text-[#98A2B3]">
            <p>{COMPANY.name} · {COMPANY.address.line1}, {COMPANY.address.line2}</p>
            <p>Tel: {COMPANY.phone.primary} · {COMPANY.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
