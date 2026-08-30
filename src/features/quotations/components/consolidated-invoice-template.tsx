import React from 'react'
import { type Bill } from '../../../types/bill'
import { formatDate } from '../../../lib/utils'

interface ConsolidatedInvoiceTemplateProps {
  bills: Bill[]
  dateFrom?: string
  dateTo?: string
}

export const ConsolidatedInvoiceTemplate = React.forwardRef<HTMLDivElement, ConsolidatedInvoiceTemplateProps>(
  ({ bills, dateFrom, dateTo }, ref) => {
    const unpaid = bills.filter(b => b.payment_status !== 'PAID' && b.payment_status !== 'CANCELLED')
    const totalOutstanding = unpaid.reduce(
      (sum, b) => sum + (b.outstanding_amount ?? (b.grand_total ?? b.total_amount)),
      0,
    )
    const totalBilled = unpaid.reduce((sum, b) => sum + (b.grand_total ?? b.total_amount), 0)
    const g = (n: number) => n.toFixed(2)

    return (
      <div
        ref={ref}
        className="bg-white text-black p-10 font-sans"
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '13px' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-[#DC2626] pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#DC2626]">
              <div className="text-center leading-none">
                <span className="block text-3xl font-extrabold italic text-[#DC2626]">L</span>
                <span className="text-[9px] font-bold text-[#DC2626]">LOVE</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-wide leading-none">Love Laundry</h1>
              <p className="text-[12px] font-semibold text-[#6B7280]">and dry cleaning experts</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-extrabold uppercase tracking-widest mb-1">Consolidated Invoice</h2>
            <p className="text-[11px]">Tel: 077-2400919 / 071-2978922</p>
            <p className="text-[11px]">Email: lovelaundry01@gmail.com</p>
            <p className="text-[11px]">Kuda bingiriya, Panirendawa.</p>
          </div>
        </div>

        {/* Invoice meta */}
        <div className="mt-5 flex justify-between text-sm">
          <div className="space-y-1">
            <p className="font-bold">Invoice Period</p>
            <p>{dateFrom || '—'} to {dateTo || '—'}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-bold">Generated</p>
            <p>{formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Bills summary table */}
        <table className="w-full border-collapse mt-6 text-sm">
          <thead>
            <tr className="bg-[#DC2626] text-white">
              <th className="border border-[#DC2626] p-2 text-left">Bill No.</th>
              <th className="border border-[#DC2626] p-2 text-left">Client</th>
              <th className="border border-[#DC2626] p-2 text-left">Date</th>
              <th className="border border-[#DC2626] p-2 text-right">Amount</th>
              <th className="border border-[#DC2626] p-2 text-right">Paid</th>
              <th className="border border-[#DC2626] p-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {unpaid.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-[#D1D5DB] p-4 text-center text-[#6B7280]">
                  No unpaid bills in the selected period.
                </td>
              </tr>
            )}
            {unpaid.map((b, i) => (
              <tr key={b.id} className={i % 2 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                <td className="border border-[#D1D5DB] p-2 font-medium">{b.id.slice(0, 10).toUpperCase()}</td>
                <td className="border border-[#D1D5DB] p-2">{b.client_name}</td>
                <td className="border border-[#D1D5DB] p-2">{formatDate(b.created_at)}</td>
                <td className="border border-[#D1D5DB] p-2 text-right">{g(b.grand_total ?? b.total_amount)}</td>
                <td className="border border-[#D1D5DB] p-2 text-right">{g(b.paid_amount ?? 0)}</td>
                <td className="border border-[#D1D5DB] p-2 text-right font-semibold">{g(b.outstanding_amount ?? (b.grand_total ?? b.total_amount))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#F9FAFB] font-bold">
              <td colSpan={3} className="border border-[#D1D5DB] p-2 text-right">TOTALS</td>
              <td className="border border-[#D1D5DB] p-2 text-right">{g(totalBilled)}</td>
              <td className="border border-[#D1D5DB] p-2 text-right">{g(unpaid.reduce((s, b) => s + (b.paid_amount ?? 0), 0))}</td>
              <td className="border border-[#DC2626] p-2 text-right text-[#DC2626]">{g(totalOutstanding)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Outstanding notice */}
        <div className="mt-8 flex items-center justify-between rounded-lg border-2 border-[#DC2626] bg-[#FFF1F1] px-5 py-4">
          <div>
            <p className="font-extrabold uppercase text-[#DC2626] text-sm">Total Outstanding</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">This amount is due across {unpaid.length} unpaid bill{unpaid.length === 1 ? '' : 's'} in the selected period.</p>
          </div>
          <p className="text-2xl font-extrabold text-[#DC2626]">LKR {g(totalOutstanding)}</p>
        </div>

        {/* Conditions */}
        <div className="mt-8 text-[10px] text-[#6B7280] leading-relaxed border-t border-[#D1D5DB] pt-4">
          <p className="font-bold text-black mb-1">Notes:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Payments received after the generated date are not reflected on this invoice.</li>
            <li>Any complaints regarding the quality of cleaning should be made within 24 hours of delivery.</li>
            <li>Garments should be collected within 10 days from the date of delivery, after which the management will not be responsible for any loss or damage.</li>
          </ul>
        </div>

        {/* Signature */}
        <div className="mt-12 flex justify-between items-end text-sm font-bold text-center">
          <div className="w-48 border-t-2 border-dotted border-black pt-1">Authorized Signature</div>
          <div className="w-48 border-t-2 border-dotted border-black pt-1">Received Signature</div>
        </div>
      </div>
    )
  },
)

ConsolidatedInvoiceTemplate.displayName = 'ConsolidatedInvoiceTemplate'
