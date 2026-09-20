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

  const { data: listData, isLoading: listLoading, isError: listError, error: listErr } = useLegacyInvoices({
    search: searchInput.trim() || undefined,
    limit: 50,
  })

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Shop Bills', href: '/shop-bills' }, { label: 'Legacy Invoice' }]} />
          <h1 className="text-dashboard-title mt-1">Legacy Invoice</h1>
          <p className="text-[13px] text-[#98A2B3] mt-0.5">
            Aggregate old paper bills into one invoice — every invoice is saved, then printed.
          </p>
          <SyncStatusBar queryKey={['legacy-invoices']} label="Invoices" className="mt-2" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={!shopName.trim() && !saved} className="gap-2 cursor-pointer">
            <Printer size={16} /> Print
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="gap-2 cursor-pointer">
            <Save size={16} /> {saveInvoice.isPending ? 'Saving…' : 'Save Invoice'}
          </Button>
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
              <p className="text-[11px] text-[#6B7280] mt-1">{previewNumber}</p>
              <p className="text-[11px] text-[#6B7280]">Date: {new Date().toLocaleDateString('en-LK')}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6 p-4 bg-[#F9FAFB] rounded-lg">
            <p className="text-[10px] font-semibold uppercase text-[#98A2B3] mb-1">Bill To</p>
            <p className="text-[14px] font-bold text-[#101828]">{saved?.shop_name || shopName}</p>
            {(saved?.description || description) && <p className="text-[12px] text-[#6B7280] mt-0.5">{saved?.description || description}</p>}
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
              {(saved?.entries ?? []).map((entry, idx) => (
                <tr key={idx} className="border-b border-[#F2F4F7]">
                  <td className="py-2 px-3 text-[#98A2B3]">{idx + 1}</td>
                  <td className="py-2 px-3">{entry.date ? formatDate(entry.date) : '—'}</td>
                  <td className="py-2 px-3 font-medium">{entry.bill_number || '—'}</td>
                  <td className="py-2 px-3 text-right">{fmtMoney(entry.amount)}</td>
                </tr>
              ))}
              {saved && (
                <tr className="border-b border-[#F2F4F7]">
                  <td colSpan={4} className="py-2 px-3 text-[#98A2B3] italic">
                    {saved.description || 'Legacy invoice'}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#101828] font-bold">
                <td colSpan={3} className="py-3 px-3 text-right">Grand Total</td>
                <td className="py-3 px-3 text-right text-[14px]">{fmtMoney(saved ? saved.grand_total : grandTotal)}</td>
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