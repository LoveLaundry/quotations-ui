import { useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Printer, Save, Search, RotateCcw, CheckCircle2, FileText } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { ConfirmDialog } from '../../../components/ui/confirm-dialog'
import { SyncStatusBar } from '../../../components/ui/sync-status-bar'
import { useDataGrid } from '../../../hooks/use-data-grid'
import { COMPANY } from '../../../config/company'
import {
  useCreateLegacyInvoice,
  useDeleteLegacyInvoice,
  useLegacyInvoices,
} from '../hooks/useLegacyInvoices'
import type { LegacyInvoice } from '../../../types/shop-bill'
import { formatDate } from '../../../lib/utils'

interface InvoiceRow {
  id: string
  date: string
  billNumber: string
  amount: number
}

const inputClass = 'h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition'
const cellInputClass = 'h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-2 text-[13px] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition'

const fmtMoney = (v: number) => `Rs. ${(Number(v) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const legacyPrintStyles = `
  @media print {
    .li-print-sheet { margin: 0; padding: 0; width: 100%; min-height: auto; }
    @page { size: A4; margin: 0; }
    @page :first { margin: 0; }
  }
  @page { size: A4; margin: 0; }
  @page :first { margin: 0; }

  .li-print-sheet { font-family: "Spectral", Georgia, serif; color: #000; background: #fff; }
  .li-sheet { width: 210mm; min-height: 297mm; padding: 12mm; box-sizing: border-box; font-size: 13px; line-height: 1.4; }
  .li-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
  .li-logo { width: 80px; height: 80px; object-fit: contain; border: 2px solid #DC2626; border-radius: 50%; padding: 4px; box-sizing: border-box; }
  .li-company-center { text-align: center; flex: 1; }
  .li-company-name { font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; line-height: 1.2; margin: 0; font-family: "Spectral", Georgia, serif; }
  .li-company-tagline { font-size: 16px; font-weight: 600; margin: 2px 0 0 0; font-family: "Spectral", Georgia, serif; }
  .li-invoice-box { width: 170px; border: 2px solid #000; font-size: 12px; text-align: center; padding: 4px 6px; }
  .li-invoice-box .t { font-weight: 700; font-size: 12px; }
  .li-invoice-box .v { border-bottom: 2px dotted #000; margin: 3px 0; padding: 1px 4px; font-weight: 700; }
  .li-services { display: flex; justify-content: center; gap: 20px; font-size: 11px; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .li-service-dot { width: 5px; height: 5px; border-radius: 50%; background: #000; display: inline-block; margin-right: 4px; }
  .li-contact { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 12px; }
  .li-customer-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; font-weight: 700; }
  .li-customer-left { width: 55%; }
  .li-detail-line { display: flex; margin-bottom: 3px; }
  .li-detail-label { width: 90px; flex-shrink: 0; }
  .li-detail-value { flex: 1; border-bottom: 1px dotted #000; padding-left: 4px; }
  .li-items-table { width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
  .li-items-table th, .li-items-table td { border: 2px solid #000; padding: 4px 6px; }
  .li-items-table th { font-weight: 700; text-align: left; }
  .li-items-table td { height: 22px; }
  .li-conditions { font-size: 10px; font-weight: 700; line-height: 1.3; margin-top: 14px; }
  .li-conditions p { margin: 0 0 3px 0; }
  .li-conditions ul { margin: 0; padding-left: 16px; }
  .li-conditions li { margin-bottom: 1px; }
  .li-signatures { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; font-size: 12px; font-weight: 700; text-align: center; }
  .li-sig-box { width: 150px; }
  .li-sig-line { border-top: 2px dotted #000; padding-top: 4px; }
  .li-id-line { border-bottom: 2px dotted #000; padding-bottom: 2px; margin-bottom: 4px; padding-left: 10px; padding-right: 10px; }
`

function makeRow(): InvoiceRow {
  return { id: crypto.randomUUID(), date: '', billNumber: '', amount: 0 }
}

export default function LegacyInvoicePage() {
  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState<InvoiceRow[]>([makeRow()])
  const [saved, setSaved] = useState<LegacyInvoice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LegacyInvoice | null>(null)
  const [searchInput, setSearchInput] = useState('')

  const updateRow = (id: string, field: keyof InvoiceRow, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, makeRow()])
  const grid = useDataGrid({ columns: 3, rows: rows.length, onAppendRow: addRow })
  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const verticalRows = useMemo(() => rows.filter(r => r.billNumber.trim() || r.amount > 0), [rows])
  const grandTotal = useMemo(() => verticalRows.reduce((s, r) => s + (Number(r.amount) || 0), 0), [verticalRows])

  const saveInvoice = useCreateLegacyInvoice()
  const deleteInvoice = useDeleteLegacyInvoice()

  const canSave = shopName.trim().length > 0 && verticalRows.length > 0 && grandTotal > 0 && !saveInvoice.isPending

  const handleSave = () => {
    if (!canSave) return
    saveInvoice.mutate(
      {
        shop_name: shopName.trim(),
        description: description.trim() || undefined,
        entries: verticalRows.map(r => ({
          date: r.date || undefined,
          bill_number: r.billNumber.trim() || undefined,
          amount: Number(r.amount) || 0,
        })),
      },
      {
        onSuccess: invoice => {
          setSaved(invoice)
          setShopName('')
          setDescription('')
          setRows([makeRow()])
        },
      },
    )
  }

  const handleNew = () => {
    setSaved(null)
    setShopName('')
    setDescription('')
    setRows([makeRow()])
  }

  const handleLoad = (invoice: LegacyInvoice) => {
    setSaved(invoice)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteInvoice.mutate(deleteTarget.id, {
      onSuccess: () => {
        if (saved?.id === deleteTarget.id) setSaved(null)
        setDeleteTarget(null)
      },
    })
  }

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${saved?.shop_name || shopName || 'Invoice'}`,
  })

  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const previewNumber = saved?.invoice_number ?? `INV-${nowStr}-LEGACY`

  const printEntries = saved?.entries ?? verticalRows.map(r => ({ date: r.date, bill_number: r.billNumber, amount: r.amount }))
  const printTotal = saved?.grand_total ?? grandTotal

  const { data: listData, isLoading: listLoading, isError: listError, error: listErr } = useLegacyInvoices({
    search: searchInput.trim() || undefined,
    limit: 50,
  })

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="print:hidden">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Shop Bills', href: '/shop-bills' }, { label: 'Legacy Invoice' }]} />
        <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-[#E4E7EC] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full border-2 border-[#DC2626] bg-white p-1 flex items-center justify-center">
              <img src="/icon.png" alt="Love Laundry" className="h-full w-full rounded-full object-contain" />
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold uppercase tracking-[2px] text-[#101828] leading-tight">Love Laundry</h1>
              <p className="text-[11px] font-semibold text-[#6B7280]">and dry cleaning experts</p>
              <p className="mt-0.5 text-[12px] text-[#98A2B3]">Legacy Invoice — aggregate old paper bills, save, then print.</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handlePrint} disabled={!shopName.trim() && !saved} className="gap-2 cursor-pointer">
                <Printer size={16} /> Print
              </Button>
              <Button onClick={handleSave} disabled={!canSave} className="gap-2 cursor-pointer">
                <Save size={16} /> {saveInvoice.isPending ? 'Saving…' : 'Save Invoice'}
              </Button>
            </div>
            <SyncStatusBar queryKey={['legacy-invoices']} label="Invoices" />
          </div>
        </div>
      </div>

      {/* Saved confirmation banner */}
      {saved && (
        <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#16A34A]/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#15803D]">Invoice {saved.invoice_number} saved</p>
              <p className="text-[11px] text-[#16A34A]/80">
                {saved.shop_name} · {saved.total_entries} entr{saved.total_entries === 1 ? 'y' : 'ies'} · {fmtMoney(saved.grand_total)} · {formatDate(saved.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 cursor-pointer">
              <Printer size={14} /> Print {saved.invoice_number}
            </Button>
            <Button size="sm" variant="outline" onClick={handleNew} className="gap-1.5 cursor-pointer">
              <RotateCcw size={14} /> New Invoice
            </Button>
          </div>
        </div>
      )}

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
            <div>
              <h3 className="text-[13px] font-semibold text-[#101828]">Bill Entries</h3>
              <p className="text-[11px] text-[#98A2B3] mt-0.5">Old bill date, number and amount — press Enter to go to the next field, Enter on the last row adds one.</p>
            </div>
            <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5 cursor-pointer">
              <Plus size={14} /> Add Row
            </Button>
          </div>

          <div className="overflow-x-auto" onKeyDown={grid.handleKeyDown}>
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
                  <tr key={row.id} className="border-b border-[#F2F4F7] hover:bg-[#F9FAFB]/60">
                    <td className="py-2 pr-3 text-[#98A2B3]">{idx + 1}</td>
                    <td className="py-2 pr-3">
                      <input type="date" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)} className={cellInputClass} ref={grid.registerCell(idx, 0)} />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="text" value={row.billNumber} onChange={e => updateRow(row.id, 'billNumber', e.target.value)} placeholder="e.g. BL-001" className={cellInputClass} ref={grid.registerCell(idx, 1)} />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min="0" step="0.01" value={row.amount || ''} onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0.00" className={`${cellInputClass} text-right`} ref={grid.registerCell(idx, 2)} />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeRow(row.id)} disabled={rows.length <= 1 || Boolean(saved)} className="p-1.5 text-[#98A2B3] hover:text-[#DC2626] disabled:opacity-30 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#101828]">
                  <td colSpan={3} className="py-3 pr-3 text-right font-bold text-[#101828]">Grand Total</td>
                  <td className="py-3 pr-3 text-right font-bold text-[#101828]">{fmtMoney(grandTotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* Saved Invoices */}
      <div className="space-y-3 print:hidden">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-[#101828]">Saved Invoices</h2>
            <p className="text-[11px] text-[#98A2B3]">Every legacy invoice you create is stored and can be reprinted anytime.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by shop / hotel…"
              className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-sm"
            />
          </div>
        </div>

        {listLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : listError ? (
          <ErrorState
            title="Unable to load saved invoices"
            description={listErr instanceof Error ? listErr.message : 'Failed to fetch saved invoices.'}
          />
        ) : !listData || listData.items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No saved invoices"
            description={searchInput.trim() ? 'Nothing matches that shop / hotel name.' : 'Invoices you save will appear here.'}
          />
        ) : (
          <div className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#F9FAFB]">
                  <th className="py-2.5 px-4 text-left font-semibold text-[#6B7280]">Invoice No.</th>
                  <th className="py-2.5 px-4 text-left font-semibold text-[#6B7280]">Shop / Hotel</th>
                  <th className="py-2.5 px-4 text-center font-semibold text-[#6B7280]">Entries</th>
                  <th className="py-2.5 px-4 text-right font-semibold text-[#6B7280]">Grand Total</th>
                  <th className="py-2.5 px-4 text-left font-semibold text-[#6B7280]">Created</th>
                  <th className="py-2.5 px-4 w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {listData.items.map((inv: LegacyInvoice) => (
                  <tr key={inv.id} className="border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB]/60">
                    <td className="py-2.5 px-4 font-semibold text-[#2563EB] whitespace-nowrap">{inv.invoice_number}</td>
                    <td className="py-2.5 px-4 text-[#101828] font-medium">{inv.shop_name}</td>
                    <td className="py-2.5 px-4 text-center text-[#6B7280]">{inv.total_entries}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-[#101828]">{fmtMoney(inv.grand_total)}</td>
                    <td className="py-2.5 px-4 text-[#98A2B3] whitespace-nowrap">{formatDate(inv.created_at)}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleLoad(inv)} className="gap-1.5 cursor-pointer">
                          <Printer size={14} /> View / Print
                        </Button>
                        <button onClick={() => setDeleteTarget(inv)} className="p-2 text-[#98A2B3] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg cursor-pointer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {listData.total > listData.items.length && (
              <p className="px-4 py-2.5 text-[11px] text-[#98A2B3] border-t border-[#F2F4F7]">
                Showing {listData.items.length} of {listData.total} — refine the search to narrow down.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Printable Invoice */}
      <div ref={printRef} className="hidden print:block">
        <style dangerouslySetInnerHTML={{ __html: legacyPrintStyles }} />
        <div className="li-print-sheet">
          <div className="li-sheet">
            {/* Header */}
            <div className="li-header">
              <div>
                <img src="/icon.png" alt="Love Laundry" className="li-logo" />
              </div>
              <div className="li-company-center">
                <h1 className="li-company-name">Love Laundry</h1>
                <h2 className="li-company-tagline">and dry cleaning experts</h2>
              </div>
              <div className="li-invoice-box">
                <div className="t">INVOICE</div>
                <div className="v">{previewNumber}</div>
                <div>{new Date().toLocaleDateString('en-LK')}</div>
              </div>
            </div>

            {/* Services */}
            <div className="li-services">
              {['Dry Cleaning', 'Free Pickup & Delivery', 'Wash & Pressed', 'Wash & Fold', 'Laundered Pressed'].map(s => (
                <span key={s}><span className="li-service-dot" />{s}</span>
              ))}
            </div>

            {/* Contact */}
            <div className="li-contact">
              <div>
                <p style={{ margin: 0 }}>Tel: {COMPANY.phone.primary} / {COMPANY.phone.secondary}</p>
                <p style={{ margin: 0 }}>Email: {COMPANY.email}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0 }}>{COMPANY.address.line1}, {COMPANY.address.line2}</p>
                <p style={{ margin: 0 }}>Reg: {COMPANY.registrationNo}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="li-customer-row">
              <div className="li-customer-left">
                <div className="li-detail-line">
                  <span className="li-detail-label">Name:</span>
                  <span className="li-detail-value">{saved?.shop_name || shopName}</span>
                </div>
                <div className="li-detail-line">
                  <span className="li-detail-label">Address:</span>
                  <span className="li-detail-value">{saved?.description || description || ''}</span>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <table className="li-items-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>No.</th>
                  <th style={{ width: 100 }}>Bill Date</th>
                  <th>Bill Number</th>
                  <th style={{ width: 100, textAlign: 'right' }}>Amount (Rs.)</th>
                  <th style={{ width: 50, textAlign: 'center' }}>CTs.</th>
                </tr>
              </thead>
              <tbody>
                {printEntries.map((entry, index) => {
                  const amt = Number(entry.amount) || 0
                  const whole = amt > 0 ? Math.floor(amt) : ''
                  const cts = amt > 0 ? Math.round((amt % 1) * 100).toString().padStart(2, '0') : ''
                  return (
                    <tr key={index}>
                      <td style={{ textAlign: 'center' }}>{index + 1}.</td>
                      <td>{entry.date ? formatDate(entry.date) : ''}</td>
                      <td>{entry.bill_number || ''}</td>
                      <td style={{ textAlign: 'right' }}>{whole}</td>
                      <td style={{ textAlign: 'center' }}>{cts}</td>
                    </tr>
                  )
                })}
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right' }}>Grand Total:</td>
                  <td style={{ textAlign: 'right' }}>{Math.floor(printTotal)}</td>
                  <td style={{ textAlign: 'center' }}>{Math.round((printTotal % 1) * 100).toString().padStart(2, '0')}</td>
                </tr>
              </tbody>
            </table>

            {/* Conditions */}
            <div className="li-conditions">
              <p>CONDITIONS:</p>
              <ul>
                <li>Garments will only be returned on production of the bill, in case of loss of the bill National card of the customer should be produced.</li>
                <li>Garments should be collected within 10 days from the date of delivery, after which the management will not be responsible for any loss or damage.</li>
                <li>The management is not responsible for any shrinkage or color fading of garments after cleaning.</li>
                <li>Any complaints regarding the quality of cleaning should be made within 24 hours of delivery.</li>
                <li>The management reserves the right to change the terms and conditions without prior notice.</li>
              </ul>
            </div>

            {/* Signatures */}
            <div className="li-signatures">
              <div className="li-sig-box">
                <div className="li-sig-line">Cashier Signature</div>
              </div>
              <div className="li-sig-box">
                <div className="li-id-line">{previewNumber}</div>
                <div>Invoice Number</div>
              </div>
              <div className="li-sig-box">
                <div className="li-id-line">{new Date().toLocaleDateString('en-LK')}</div>
                <div>Date</div>
              </div>
              <div className="li-sig-box">
                <div className="li-sig-line">Customer Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteInvoice.isPending}
        title="Delete Invoice"
        description={`Are you sure you want to delete ${deleteTarget?.invoice_number ?? 'this invoice'} for ${deleteTarget?.shop_name ?? ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}