import React from 'react'
import { type Bill } from '../../../types/bill'
import { formatDate } from '../../../lib/utils'
import { COMPANY } from '../../../config/company'

interface ConsolidatedInvoiceTemplateProps {
  bills: Bill[]
  dateFrom?: string
  dateTo?: string
}

const printStyles = `
  @media print {
    .invoice-print-page { margin: 0; padding: 0; width: 100%; min-height: auto; }
    .invoice-print-page * { display: inherit !important; }
    @page { size: A4; margin: 0; }
    @page :first { margin: 0; }
    @page :left { margin: 0; }
    @page :right { margin: 0; }
    .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
    .no-print { display: none !important; }
  }
  @page { size: A4; margin: 0; }
  @page :first { margin: 0; }
`

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
        className="invoice-print-page"
        style={{
          fontFamily: '"Spectral", Georgia, serif',
          color: '#000',
          background: '#fff',
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />

        <div
          style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '15mm', boxSizing: 'border-box', fontSize: '13px', background: '#fff', color: '#000' }}
        >
          {/* Header — matches quotation print */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px double #000', paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img
                src="/icon.png"
                alt="Love Laundry Logo"
                style={{ width: 80, height: 80, objectFit: 'contain', border: '2px solid #000', borderRadius: 0, padding: 4, background: '#fafafa' }}
              />
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, lineHeight: 1.2, margin: '0 0 4px 0', fontFamily: '"Spectral", Georgia, serif' }}>
                {COMPANY.name}
              </h1>
              <h2 style={{ fontSize: 14, fontWeight: 500, fontStyle: 'italic', margin: 0, color: '#333', fontFamily: '"Spectral", Georgia, serif' }}>
                {COMPANY.tagline}
              </h2>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', border: '1px solid #000', padding: '6px 12px', background: '#f9f9f9', borderRadius: 0 }}>
              Reg. No: {COMPANY.registrationNo}
            </div>
          </div>

          {/* Services row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, fontWeight: 600, borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {['Dry Cleaning', 'Free Pickup & Delivery', 'Wash & Pressed', 'Wash & Fold', 'Laundered Pressed'].map(s => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
                {s}
              </span>
            ))}
          </div>

          {/* Contact row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0 }}>Tel: {COMPANY.phone.primary} / {COMPANY.phone.secondary}</p>
              <p style={{ margin: 0 }}>Email: {COMPANY.email}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0 }}>{COMPANY.address.line1}</p>
              <p style={{ margin: 0 }}>{COMPANY.address.line2}</p>
            </div>
          </div>

          {/* Title */}
          <h3 style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', margin: '0 0 16px 0', fontFamily: '"Spectral", Georgia, serif' }}>
            CONSOLIDATED INVOICE
          </h3>

          {/* Invoice meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontWeight: 700, margin: '0 0 2px 0' }}>Invoice Period</p>
              <p style={{ margin: 0 }}>{dateFrom || '—'} to {dateTo || '—'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700, margin: '0 0 2px 0' }}>Generated</p>
              <p style={{ margin: 0 }}>{formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Bills summary table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#DC2626', color: '#fff' }}>
                {['Bill No.', 'Client', 'Date', 'Amount', 'Paid', 'Outstanding'].map(h => (
                  <th key={h} style={{ border: '1px solid #DC2626', padding: '6px 8px', textAlign: h === 'Bill No.' || h === 'Client' || h === 'Date' ? 'left' : 'right', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unpaid.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ border: '1px solid #D1D5DB', padding: 12, textAlign: 'center', color: '#6B7280' }}>
                    No unpaid bills in the selected period.
                  </td>
                </tr>
              )}
              {unpaid.map((b, i) => (
                <tr key={b.id} style={{ background: i % 2 ? '#F9FAFB' : '#fff' }}>
                  <td style={{ border: '1px solid #D1D5DB', padding: '5px 8px', fontWeight: 500 }}>{b.id.slice(0, 10).toUpperCase()}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '5px 8px' }}>{b.client_name}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '5px 8px' }}>{formatDate(b.created_at)}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '5px 8px', textAlign: 'right' }}>{g(b.grand_total ?? b.total_amount)}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '5px 8px', textAlign: 'right' }}>{g(b.paid_amount ?? 0)}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{g(b.outstanding_amount ?? (b.grand_total ?? b.total_amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F9FAFB', fontWeight: 700 }}>
                <td colSpan={3} style={{ border: '1px solid #D1D5DB', padding: '6px 8px', textAlign: 'right' }}>TOTALS</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '6px 8px', textAlign: 'right' }}>{g(totalBilled)}</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '6px 8px', textAlign: 'right' }}>{g(unpaid.reduce((s, b) => s + (b.paid_amount ?? 0), 0))}</td>
                <td style={{ border: '1px solid #DC2626', padding: '6px 8px', textAlign: 'right', color: '#DC2626' }}>{g(totalOutstanding)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Outstanding notice */}
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid #DC2626', background: '#FFF1F1', padding: '12px 20px', borderRadius: 4 }}>
            <div>
              <p style={{ fontWeight: 800, textTransform: 'uppercase', color: '#DC2626', fontSize: 13, margin: 0 }}>Total Outstanding</p>
              <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4, margin: '4px 0 0 0' }}>This amount is due across {unpaid.length} unpaid bill{unpaid.length === 1 ? '' : 's'} in the selected period.</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#DC2626', margin: 0 }}>LKR {g(totalOutstanding)}</p>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 24, fontSize: 10, color: '#6B7280', lineHeight: 1.6, borderTop: '1px solid #D1D5DB', paddingTop: 12 }}>
            <p style={{ fontWeight: 700, color: '#000', margin: '0 0 4px 0' }}>Notes:</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Payments received after the generated date are not reflected on this invoice.</li>
              <li>Any complaints regarding the quality of cleaning should be made within 24 hours of delivery.</li>
              <li>Garments should be collected within 10 days from the date of delivery, after which the management will not be responsible for any loss or damage.</li>
            </ul>
          </div>

          {/* Signature */}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
            <div style={{ width: 192, borderTop: '2px dotted #000', paddingTop: 4 }}>Authorized Signature</div>
            <div style={{ width: 192, borderTop: '2px dotted #000', paddingTop: 4 }}>Received Signature</div>
          </div>
        </div>
      </div>
    )
  },
)

ConsolidatedInvoiceTemplate.displayName = 'ConsolidatedInvoiceTemplate'
