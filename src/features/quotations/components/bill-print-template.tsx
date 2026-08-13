import React from 'react'
import { type Bill } from '../../../types/bill'

interface BillPrintTemplateProps {
  bill: Bill
  contactNo?: string
  address?: string
  receivedDate?: string
  deliveryDate?: string
  gatePass?: string
}

export const BillPrintTemplate = React.forwardRef<HTMLDivElement, BillPrintTemplateProps>(
  ({ bill, contactNo, address, receivedDate, deliveryDate, gatePass }, ref) => {
    // We render exactly 15 rows for the table as per format, padding with empty if needed
    const paddedItems = [...bill.items]
    while (paddedItems.length < 15) {
      paddedItems.push({ item_name: '', quantity: 0, unit_price: 0, line_total: 0 })
    }
    const displayItems = paddedItems.slice(0, 15)

    return (
      <div ref={ref} className="bg-white text-black p-8 font-sans" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '14px' }}>
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
          <div className="flex items-center gap-4">
            {/* Logo Placeholder */}
            <div className="w-24 h-24 border-2 border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold italic text-3xl">
              L<br /><span className="text-sm">Love Laundry</span>
            </div>
          </div>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-extrabold uppercase tracking-widest">Love Laundry</h1>
            <h2 className="text-2xl font-bold">and dry cleaning experts</h2>
          </div>
        </div>

        {/* Services List */}
        <div className="flex justify-center gap-6 font-bold text-sm mb-4 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full inline-block"></span> Dry Cleaning</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full inline-block"></span> Free Pickup & Delivery</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full inline-block"></span> Wash & Pressed</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full inline-block"></span> Wash & Fold</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full inline-block"></span> Laundered Pressed</div>
        </div>

        {/* Contact Info */}
        <div className="flex justify-between text-sm font-bold mb-4">
          <div>
            <p>Tel: 077-2400919 / 071-2978922</p>
            <p>Email: lovelaundry01@gmail.com</p>
          </div>
          <div className="text-right">
            <p>Kuda bingiriya, Panirendawa.</p>
          </div>
        </div>

        {/* Customer Details & Dates */}
        <div className="flex justify-between mb-4 font-bold text-sm">
          <div className="space-y-1 w-1/2">
            <div className="flex"><span className="w-24">Name:</span><span className="border-b border-dotted border-black flex-1">{bill.client_name}</span></div>
            <div className="flex"><span className="w-24">Address:</span><span className="border-b border-dotted border-black flex-1">{address || ''}</span></div>
            <div className="flex"><span className="w-24">Contact No:</span><span className="border-b border-dotted border-black flex-1">{contactNo || ''}</span></div>
          </div>
          <div className="w-1/3">
            <table className="w-full border-collapse border-2 border-black">
              <tbody>
                <tr>
                  <td className="border-2 border-black p-1">Received</td>
                  <td className="border-2 border-black p-1 text-center">{receivedDate || ''}</td>
                </tr>
                <tr>
                  <td className="border-2 border-black p-1">Delivery</td>
                  <td className="border-2 border-black p-1 text-center">{deliveryDate || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full border-collapse border-2 border-black mb-2 text-sm font-bold">
          <thead>
            <tr>
              <th className="border-2 border-black p-1 text-left w-12">No.</th>
              <th className="border-2 border-black p-1 text-left">Description of Item</th>
              <th className="border-2 border-black p-1 text-center w-16">QTY</th>
              <th className="border-2 border-black p-1 text-right w-20">Rate</th>
              <th className="border-2 border-black p-1 text-right w-24">Amount</th>
              <th className="border-2 border-black p-1 text-center w-12">CTs.</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => {
              const amountWhole = item.line_total > 0 ? Math.floor(item.line_total) : '';
              const amountCts = item.line_total > 0 ? Math.round((item.line_total % 1) * 100).toString().padStart(2, '0') : '';
              return (
                <tr key={index}>
                  <td className="border-2 border-black p-1 text-center">{index + 1}.</td>
                  <td className="border-2 border-black p-1">{item.item_name}</td>
                  <td className="border-2 border-black p-1 text-center">{item.quantity || ''}</td>
                  <td className="border-2 border-black p-1 text-right">{item.unit_price > 0 ? item.unit_price.toFixed(2) : ''}</td>
                  <td className="border-2 border-black p-1 text-right">{amountWhole}</td>
                  <td className="border-2 border-black p-1 text-center">{amountCts}</td>
                </tr>
              )
            })}
            <tr>
              <td colSpan={2} className="border-2 border-black p-1 text-right">Total:</td>
              <td className="border-2 border-black p-1 text-center">{bill.total_quantity || ''}</td>
              <td className="border-2 border-black p-1"></td>
              <td className="border-2 border-black p-1 text-right">{Math.floor(bill.total_amount)}</td>
              <td className="border-2 border-black p-1 text-center">{Math.round((bill.total_amount % 1) * 100).toString().padStart(2, '0')}</td>
            </tr>
          </tbody>
        </table>

        {/* Conditions */}
        <div className="text-xs font-bold leading-tight mb-8">
          <p>CONDITIONS:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Garments will only be returned on production of the bill, in case of loss of the bill National card of the customer should be produced.</li>
            <li>Garments should be collected within 10 days from the date of delivery, after which the management will not be responsible for any loss or damage.</li>
            <li>The management is not responsible for any shrinkage or color fading of garments after cleaning.</li>
            <li>Any complaints regarding the quality of cleaning should be made within 24 hours of delivery.</li>
            <li>The management reserves the right to change the terms and conditions without prior notice.</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-12 text-sm font-bold text-center">
          <div className="w-40 border-t-2 border-dotted border-black pt-1">Cashier Signature</div>
          <div>
            <div className="border-b-2 border-dotted border-black mb-1 px-4">{bill.id.slice(0, 10).toUpperCase()}</div>
            <div>Bill Number</div>
          </div>
          <div>
            <div className="border-b-2 border-dotted border-black mb-1 px-4">{gatePass || 'N/A'}</div>
            <div>Gate Pass</div>
          </div>
          <div className="w-40 border-t-2 border-dotted border-black pt-1">Customer Signature</div>
        </div>
      </div>
    )
  }
)

BillPrintTemplate.displayName = 'BillPrintTemplate'
