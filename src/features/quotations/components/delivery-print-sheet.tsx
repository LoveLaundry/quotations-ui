import React from 'react'
import {
    balanceAdjustmentReasonLabel,
    balanceItemKey,
} from '../../../lib/balance-adjustments'
import type {
    BalanceAdjustment,
    Delivery,
    DeliveryBalanceReport,
    DeliveryItem,
    GatePass,
} from '../../../types/operations'

const deliveryPrintStyles = `
  @media print {
    .dls-page { margin: 0; padding: 0; width: 100%; min-height: auto; }
    @page { size: A4; margin: 0; }
    @page :first { margin: 0; }
    .no-print { display: none !important; }
  }
  @page { size: A4; margin: 0; }
  @page :first { margin: 0; }
  .dls-page {
    font-family: "Spectral", Georgia, serif;
    color: #000;
    background: #fff;
  }
  .dls-sheet {
    width: 210mm;
    min-height: 297mm;
    padding: 12mm;
    box-sizing: border-box;
    font-size: 13px;
    line-height: 1.4;
  }
  .dls-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
  .dls-logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
    border: 2px solid #DC2626;
    border-radius: 50%;
    padding: 4px;
  }
  .dls-company-center { text-align: center; flex: 1; }
  .dls-company-name {
    font-size: 28px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 3px;
    line-height: 1.2;
    margin: 0;
  }
  .dls-company-tagline {
    font-size: 16px;
    font-weight: 600;
    margin: 2px 0 0 0;
  }
  .dls-services {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 11px;
    font-weight: 700;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .dls-service-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #000;
    display: inline-block;
    margin-right: 4px;
  }
  .dls-contact {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .dls-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border: 2px solid #000;
    padding: 8px 10px;
    margin-bottom: 10px;
  }
  .dls-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0;
  }
  .dls-title-meta {
    font-size: 12px;
    font-weight: 700;
    text-align: right;
  }
  .dls-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 700;
  }
  .dls-detail-left { width: 58%; }
  .dls-detail-right { width: 40%; text-align: right; }
  .dls-detail-line { display: flex; margin-bottom: 3px; }
  .dls-detail-label { width: 110px; flex-shrink: 0; }
  .dls-detail-value {
    flex: 1;
    border-bottom: 1px dotted #000;
    padding-left: 4px;
    font-weight: 600;
  }
  .dls-items-table {
    width: 100%;
    /* Fixed layout so the declared column widths are honoured. With auto layout
       five balance columns plus a long item name pushed the table wider than
       the 210mm sheet, and the right-hand Balance column was cut off by the
       page edge on exactly the notes that needed it most. */
    table-layout: fixed;
    border-collapse: collapse;
    border: 2px solid #000;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .dls-items-table th,
  .dls-items-table td {
    border: 1px solid #000;
    padding: 4px 5px;
    overflow-wrap: anywhere;
  }
  .dls-items-table th {
    text-align: left;
    background: #f5f5f5;
  }
  .dls-items-table td {
    height: 22px;
  }
  .dls-col-no { width: 24px; text-align: center; }
  .dls-col-spec { width: 18%; }
  .dls-col-qty { width: 62px; text-align: center; }
  /* Five of these at A4 portrait leaves room for the item name; wider columns
     did not. */
  .dls-col-bal { width: 13%; text-align: center; }
  .dls-items-table thead th.dls-col-bal {
    font-size: 9.5px;
    line-height: 1.15;
    letter-spacing: 0.1px;
  }
  /* A figure that could not be read must look unreadable, not look like zero. */
  .dls-missing { color: #9ca3af; font-weight: 600; }
  .dls-row-total td {
    font-weight: 800;
    background: #f5f5f5;
  }
  .dls-adj-credit { color: #166534; }
  .dls-adj-debit { color: #991b1b; }
  .dls-notes { margin-top: 6px; font-size: 11px; }
  .dls-note-line { margin: 0 0 2px; }
  .dls-totals {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 16px;
  }
  .dls-signatures {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 40px;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
  }
  .dls-sig-box { width: 150px; }
  .dls-sig-line {
    border-top: 2px dotted #000;
    padding-top: 4px;
  }
`

export const DeliveryPrintSheet = React.forwardRef<
    HTMLDivElement,
    {
        delivery: Delivery
        gp?: GatePass
        report?: DeliveryBalanceReport | null
        adjustments?: BalanceAdjustment[]
    }
>(({ delivery, gp, report, adjustments }, ref) => {
        const items = delivery.items ?? []
        const totalPieces = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        const gatePassNumber = gp?.gate_pass_number ?? delivery.gate_pass_id.slice(-8).toUpperCase()

        // The running balance is per item and keyed the same way the engine keys
        // it, so a line only carries figures it actually has.
        const balanceByKey = new Map((report?.items ?? []).map(r => [r.item_key, r]))
        const balanceFor = (item: DeliveryItem) =>
            balanceByKey.get(balanceItemKey(item.item_name, item.specification))
        const showBalance = Boolean(report)
        const columnCount = showBalance ? 8 : 4
        const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)
        // A voided correction is history, not a figure on a signed note.
        const liveAdjustmentNotes = (adjustments ?? []).filter(a => a.status === 'POSTED')

        return (
            <div ref={ref} className="dls-page">
                <style dangerouslySetInnerHTML={{ __html: deliveryPrintStyles }} />
                <div className="dls-sheet">
                    <div className="dls-header">
                        <div>
                            <img src="/icon.png" alt="Love Laundry" className="dls-logo" />
                        </div>
                        <div className="dls-company-center">
                            <h1 className="dls-company-name">Love Laundry</h1>
                            <h2 className="dls-company-tagline">and dry cleaning experts</h2>
                        </div>
                    </div>

                    <div className="dls-services">
                        {['Dry Cleaning', 'Free Pickup & Delivery', 'Wash & Pressed', 'Wash & Fold', 'Laundered Pressed'].map(s => (
                            <span key={s}><span className="dls-service-dot" />{s}</span>
                        ))}
                    </div>

                    <div className="dls-contact">
                        <div>
                            <p style={{ margin: 0 }}>Tel: +94 77 4200 919 / 070 243 3566</p>
                            <p style={{ margin: 0 }}>Email: lovelaundry01@gmail.com</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0 }}>Hotel Housekeeping Outerwear / Linen</p>
                            <p style={{ margin: 0 }}>Machine Washable Textiles</p>
                        </div>
                    </div>

                    <div className="dls-title-row">
                        <p className="dls-title">Delivery Note</p>
                        <div className="dls-title-meta">
                            <div>Ref: DLV-{delivery.id.slice(-8).toUpperCase()}</div>
                            <div>Gate Pass: {gatePassNumber}</div>
                        </div>
                    </div>

                    <div className="dls-details">
                        <div className="dls-detail-left">
                            <div className="dls-detail-line">
                                <span className="dls-detail-label">Delivered To:</span>
                                <span className="dls-detail-value">{delivery.client_name || ''}</span>
                            </div>
                            <div className="dls-detail-line">
                                <span className="dls-detail-label">Delivered By:</span>
                                <span className="dls-detail-value">{delivery.delivered_by || ''}</span>
                            </div>
                            <div className="dls-detail-line">
                                <span className="dls-detail-label">Received By:</span>
                                <span className="dls-detail-value">{delivery.received_by || ''}</span>
                            </div>
                        </div>
                        <div className="dls-detail-right">
                            <div className="dls-detail-line">
                                <span className="dls-detail-label">Delivery Date:</span>
                                <span className="dls-detail-value">{delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : ''}</span>
                            </div>
                            <div className="dls-detail-line">
                                <span className="dls-detail-label">Item Types:</span>
                                <span className="dls-detail-value">{items.length}</span>
                            </div>
                        </div>
                    </div>

                    <table className="dls-items-table">
                        <thead>
                            <tr>
                                <th className="dls-col-no">No.</th>
                                <th>Item</th>
                                <th className="dls-col-spec">Specification</th>
                                {showBalance ? (
                                    <>
                                        <th className="dls-col-bal">Prev. Bal.</th>
                                        <th className="dls-col-bal">Received</th>
                                        <th className="dls-col-bal">Delivered</th>
                                        <th className="dls-col-bal">Adj.</th>
                                        <th className="dls-col-bal">Balance</th>
                                    </>
                                ) : (
                                    <th className="dls-col-qty">Quantity</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => {
                                const bal = balanceFor(item)
                                return (
                                    <tr key={`${item.item_name}-${index}`}>
                                        <td className="dls-col-no">{index + 1}</td>
                                        <td>{item.item_name}</td>
                                        <td className="dls-col-spec">{item.specification || ''}</td>
                                        {showBalance ? (
                                            <>
                                                <td className="dls-col-bal">{bal?.previous_balance_qty ?? ''}</td>
                                                <td className="dls-col-bal">{bal?.received_qty ?? ''}</td>
                                                <td className="dls-col-bal">{bal?.delivered_qty ?? item.quantity ?? ''}</td>
                                                <td
                                                    className={`dls-col-bal ${
                                                        (bal?.balance_adjustment_qty ?? 0) > 0
                                                            ? 'dls-adj-credit'
                                                            : (bal?.balance_adjustment_qty ?? 0) < 0
                                                              ? 'dls-adj-debit'
                                                              : ''
                                                    }`}
                                                >
                                                    {bal?.balance_adjustment_qty
                                                        ? signed(bal.balance_adjustment_qty)
                                                        : ''}
                                                </td>
                                                <td className="dls-col-bal">{bal?.current_balance_qty ?? ''}</td>
                                            </>
                                        ) : (
                                            <td className="dls-col-qty">{item.quantity ?? ''}</td>
                                        )}
                                    </tr>
                                )
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={columnCount}>No items</td>
                                </tr>
                            )}
                            {showBalance && items.length > 0 && (
                                <tr className="dls-row-total">
                                    <td className="dls-col-no" />
                                    <td>Total</td>
                                    <td className="dls-col-spec" />
                                    <td className="dls-col-bal">{report?.totals.previous_balance_qty ?? ''}</td>
                                    <td className="dls-col-bal">{report?.totals.received_qty ?? ''}</td>
                                    <td className="dls-col-bal">{report?.totals.delivered_qty ?? ''}</td>
                                    <td className="dls-col-bal">
                                        {report?.totals.balance_adjustment_qty
                                            ? signed(report.totals.balance_adjustment_qty)
                                            : ''}
                                    </td>
                                    <td className="dls-col-bal">{report?.totals.current_balance_qty ?? ''}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {showBalance && (
                        <div className="dls-notes">
                            <p className="dls-note-line">
                                <strong>Prev. Bal.</strong> pieces still held before this delivery.{' '}
                                <strong>Balance</strong> pieces still held after it. Corrections are pieces only
                                and do not change the invoice.
                            </p>
                            {liveAdjustmentNotes.length > 0 && (
                                <div>
                                    <p className="dls-note-line" style={{ marginTop: 4 }}>
                                        <strong>Corrections on this delivery:</strong>
                                    </p>
                                    {liveAdjustmentNotes.map(adj => (
                                        <p className="dls-note-line" key={adj.id}>
                                            {adj.item_name}
                                            {adj.specification ? ` (${adj.specification})` : ''}:{' '}
                                            {signed(adj.quantity)} pcs —{' '}
                                            {balanceAdjustmentReasonLabel(adj.reason)}
                                            {adj.notes ? ` — ${adj.notes}` : ''}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="dls-totals">
                        <span>Total Item Types: {items.length}</span>
                        <span>Total Pieces: {totalPieces}</span>
                    </div>

                    <div className="dls-signatures">
                        <div className="dls-sig-box">
                            <div className="dls-sig-line">Delivered By</div>
                        </div>
                        <div className="dls-sig-box">
                            <div className="dls-sig-line">Received By Client</div>
                        </div>
                        <div className="dls-sig-box">
                            <div className="dls-sig-line">Authorized Signature</div>
                        </div>
                    </div>
                </div>
            </div>
    )
})