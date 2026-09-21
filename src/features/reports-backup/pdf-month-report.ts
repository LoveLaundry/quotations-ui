import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import iconUrl from '../../assets/icon.png'
import { dataTable, money } from './pdf-report'
import type { MonthlyReportSnapshot } from './types'

installVfs()

function installVfs() {
  const pdf = pdfMake as unknown as { vfs?: Record<string, string> }
  const mod = pdfFonts as unknown as {
    pdfMake?: { vfs?: Record<string, string> }
    vfs?: Record<string, string>
  }
  const vfs = mod.pdfMake?.vfs ?? mod.vfs
  if (vfs) pdf.vfs = vfs
}

const RED = '#C42127'
const DARK = '#1F2937'
const GRAY = '#6B7280'
const LIGHT = '#F3F4F6'
const GREEN = '#15803D'
const AMBER = '#B45309'

let loadedLogo: string | null = null

async function loadLogo(): Promise<string | null> {
  if (loadedLogo) return loadedLogo
  try {
    const res = await fetch(iconUrl)
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('logo read failed'))
      reader.readAsDataURL(blob)
    })
    loadedLogo = dataUrl
    return dataUrl
  } catch {
    return null
  }
}

function sectionTitle(index: number, title: string, subtitle?: string) {
  return {
    columns: [
      { text: [`${index}  `, { text: title.toUpperCase(), bold: true }], fontSize: 11, color: RED, bold: true },
      ...(subtitle
        ? [{ text: subtitle, alignment: 'right' as const, fontSize: 8, color: GRAY, margin: [0, 3, 0, 0] }]
        : []),
    ],
    margin: [0, 10, 0, 4] as [number, number, number, number],
  }
}

function noData(text: string) {
  return { text, italic: true, fontSize: 8.5, color: GRAY, margin: [0, 2, 0, 6] }
}

function sourceFailed(error?: string) {
  return {
    text: `Source unavailable — ${error ?? 'request failed'}`,
    fontSize: 8,
    color: AMBER,
    margin: [0, 2, 0, 6] as [number, number, number, number],
  }
}

function statusCell(value: string | number) {
  return { text: String(value), alignment: 'center' as const }
}

export async function generateMonthReportPdf(snapshot: MonthlyReportSnapshot): Promise<Blob> {
  const logo = await loadLogo()
  const { company, totals, meta, daily } = snapshot
  const period = meta.period
  const failedSources = snapshot.sources.filter(s => !s.ok)

  const content: unknown[] = [
    // ── Header ────────────────────────────────────────────────────────────
    {
      table: {
        widths: ['auto', '*', 'auto'],
        body: [
          [
            {
              stack: [logo ? { image: logo, width: 44, height: 44, fit: [44, 44] } : {}],
              alignment: 'left',
            },
            {
              stack: [
                { text: company.name.toUpperCase(), fontSize: 17, bold: true, color: RED, characterSpacing: 1.5 },
                { text: company.tagline ?? '', fontSize: 9, color: GRAY, italic: true },
                { text: company.address ?? '', fontSize: 8, color: DARK, margin: [0, 3, 0, 0] },
                {
                  text: `${company.phone ?? ''}${company.email ? `   •   ${company.email}` : ''}`,
                  fontSize: 8,
                  color: DARK,
                },
                company.registration_no ? { text: `Reg No: ${company.registration_no}`, fontSize: 8, color: GRAY } : {},
              ],
              alignment: 'left',
            },
            {
              stack: [
                { text: 'MONTHLY REPORT', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center' },
                { text: meta.month_name.toUpperCase(), fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center' },
                { text: period, fontSize: 12, bold: true, color: '#FFFFFF', alignment: 'center' },
                { text: `Generated ${meta.generated_at.slice(0, 19).replace('T', ' ')}`, fontSize: 7.5, color: '#FFFFFF', alignment: 'center' },
                { text: 'Backup v1', fontSize: 7.5, color: '#FFFFFF', alignment: 'center', margin: [0, 4, 0, 0] },
              ],
              fillColor: RED,
            },
          ],
        ],
      },
      layout: { hLineWidth: () => 0.6, vLineWidth: () => 0, hLineColor: () => RED, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 2, paddingBottom: () => 2 },
      margin: [0, 0, 0, 8],
    },

    // ── Financial summary ─────────────────────────────────────────────────
    {
      table: {
        widths: ['*', '*', '*'],
        body: [
          [
            { text: 'INCOME', bold: true, fontSize: 8, color: GRAY, alignment: 'center', fillColor: LIGHT, margin: [0, 6, 0, 2] },
            { text: 'EXPENSES', bold: true, fontSize: 8, color: GRAY, alignment: 'center', fillColor: LIGHT, margin: [0, 6, 0, 2] },
            { text: 'NET', bold: true, fontSize: 8, color: '#FFFFFF', alignment: 'center', fillColor: RED, margin: [0, 6, 0, 2] },
          ],
          [
            { text: money(totals.income), bold: true, fontSize: 13, color: totals.income >= 0 ? GREEN : RED, alignment: 'center', fillColor: LIGHT, margin: [0, 2, 0, 6] },
            { text: money(totals.expenses), bold: true, fontSize: 13, color: RED, alignment: 'center', fillColor: LIGHT, margin: [0, 2, 0, 6] },
            { text: money(totals.net), bold: true, fontSize: 13, color: totals.net >= 0 ? '#FFFFFF' : '#FFE4E6', alignment: 'center', fillColor: RED, margin: [0, 2, 0, 6] },
          ],
        ],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 6],
    },

    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: `Bills raised\n${money(totals.bills)}`, alignment: 'center', fontSize: 8.5, fillColor: LIGHT, margin: [0, 5, 0, 5] },
            { text: `Unpaid balance\n${money(totals.bill_balance)}`, alignment: 'center', fontSize: 8.5, fillColor: LIGHT, margin: [0, 5, 0, 5] },
            { text: `Payments received\n${money(totals.payments)}`, alignment: 'center', fontSize: 8.5, fillColor: LIGHT, margin: [0, 5, 0, 5] },
            { text: `Salary paid\n${money(totals.salary_paid)}`, alignment: 'center', fontSize: 8.5, fillColor: LIGHT, margin: [0, 5, 0, 5] },
          ],
        ],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 8],
    },

    { text: 'Financial summary is derived from ledger income & expenses. Bill / payment / salary / linen figures are operational activity and are not added to the accounting net.', fontSize: 7, color: GRAY, italics: true, margin: [0, 0, 0, 8] },
  ]

  // ── Daily activity ──────────────────────────────────────────────────────
  content.push(sectionTitle(1, 'Day-by-Day Activity', `${daily.length} active day(s)`))
  if (daily.length === 0) {
    content.push(noData('No activity recorded for this month.'))
  } else {
    content.push(
      dataTable({
        header: ['Date', 'Income', 'Expenses', 'Net', 'Bills', 'Payments', 'GP Pcs', 'Del Pcs', 'Present'],
        widths: [62, 62, 62, 62, 62, 62, 52, 52, 46],
        alignments: ['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'center'],
        body: daily.map(d => [
          d.date,
          money(d.income),
          money(d.expenses),
          money(d.income - d.expenses),
          money(d.bills),
          money(d.payments),
          String(d.gatepass_pieces),
          String(d.deliveries_pieces),
          String(d.present),
        ]),
      })
    )
  }

  // ── Income ──────────────────────────────────────────────────────────────
  content.push(sectionTitle(2, 'Income (Ledger)', `${snapshot.income.length} entries • ${money(totals.income)}`))
  const incomeOk = snapshot.sources.find(s => s.key === 'income')?.ok ?? true
  if (!incomeOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'income')?.error))
  } else if (snapshot.income.length === 0) {
    content.push(noData('No income recorded this month.'))
  } else {
    content.push(
      dataTable({
        header: ['No', 'Date', 'Customer', 'Description', 'Source', 'Amount'],
        widths: [24, 62, '*', '*', 60, 70],
        alignments: ['left', 'left', 'left', 'left', 'left', 'right'],
        body: snapshot.income.map((r, i) => [
          String(i + 1),
          r.date,
          r.customer ?? '—',
          r.description ?? '—',
          r.source ?? '—',
          money(r.amount),
        ]),
      })
    )
  }

  // ── Expenses ────────────────────────────────────────────────────────────
  content.push(sectionTitle(3, 'Expenses', `${snapshot.expenses.length} entries • ${money(totals.expenses)}`))
  const expenseOk = snapshot.sources.find(s => s.key === 'expenses')?.ok ?? true
  if (!expenseOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'expenses')?.error))
  } else if (snapshot.expenses.length === 0) {
    content.push(noData('No expenses recorded this month.'))
  } else {
    content.push(
      dataTable({
        header: ['No', 'Date', 'Category', 'Description', 'Payee', 'Amount'],
        widths: [24, 62, '*', '*', 90, 70],
        alignments: ['left', 'left', 'left', 'left', 'left', 'right'],
        body: snapshot.expenses.map((r, i) => [
          String(i + 1),
          r.date,
          r.category ?? '—',
          r.description ?? '—',
          r.payee ?? '—',
          money(r.amount),
        ]),
      })
    )
  }

  // ── Attendance ──────────────────────────────────────────────────────────
  content.push(sectionTitle(4, 'Attendance', `${snapshot.attendance.length} record(s)`))
  const attOk = snapshot.sources.find(s => s.key === 'attendance')?.ok ?? true
  if (!attOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'attendance')?.error))
  } else if (snapshot.attendance.length === 0) {
    content.push(noData('No attendance recorded this month.'))
  } else {
    const present = snapshot.attendance.filter(r => r.status.includes('PRESENT') || ['HALF_DAY', 'HALFDAY', 'HALF'].includes(r.status)).length
    const leave = snapshot.attendance.filter(r => r.status.includes('LEAVE')).length
    const holiday = snapshot.attendance.filter(r => r.status === 'HOLIDAY').length
    content.push(
      dataTable({
        header: ['Date', 'Employee', 'Status', 'OT (hrs)'],
        widths: [62, '*', 110, 60],
        alignments: ['left', 'left', 'center', 'right'],
        body: snapshot.attendance.map(r => [
          r.date,
          r.employee_name,
          r.status,
          r.overtime_hours ? String(r.overtime_hours) : '—',
        ]),
      }),
      { text: `Present ${present}   •   Leave ${leave}   •   Holiday ${holiday}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Payroll ─────────────────────────────────────────────────────────────
  content.push(sectionTitle(5, 'Payroll — salary slips paid in month', `${snapshot.salary_slips.length} slip(s) • ${money(totals.salary_paid)}`))
  const payOk = snapshot.sources.find(s => s.key === 'salary')?.ok ?? true
  if (!payOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'salary')?.error))
  } else if (snapshot.salary_slips.length === 0) {
    content.push(noData('No salary slips paid in this month.'))
  } else {
    content.push(
      dataTable({
        header: ['No', 'Employee', 'Period', 'Gross', 'Deductions', 'Net', 'Paid'],
        widths: [24, '*', 130, 60, 60, 60, 62],
        alignments: ['left', 'left', 'left', 'right', 'right', 'right', 'left'],
        body: snapshot.salary_slips.map((r, i) => [
          String(i + 1),
          r.employee_name,
          r.period_start && r.period_end ? `${r.period_start} → ${r.period_end}` : '—',
          money(r.gross),
          money(r.deductions),
          money(r.net),
          r.paid_date ?? '—',
        ]),
      })
    )
  }

  // ── Bills ───────────────────────────────────────────────────────────────
  content.push(sectionTitle(6, 'Bills', `${snapshot.bills.length} bill(s) • ${money(totals.bills)}`))
  const billsOk = snapshot.sources.find(s => s.key === 'bills')?.ok ?? true
  if (!billsOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'bills')?.error))
  } else if (snapshot.bills.length === 0) {
    content.push(noData('No bills raised this month.'))
  } else {
    content.push(
      dataTable({
        header: ['Date', 'Bill No', 'Client', 'Items', 'Total', 'Balance', 'Status'],
        widths: [62, '*', '*', 36, 60, 60, 64],
        alignments: ['left', 'left', 'left', 'right', 'right', 'right', 'center'],
        body: snapshot.bills.map(b => [b.date, b.bill_id || '—', b.client_name, String(b.items_count), money(b.total), money(b.balance), statusCell(b.payment_status || '—')]),
      }),
      { text: `Outstanding balance ${money(totals.bill_balance)}`, fontSize: 7.5, color: AMBER, bold: true, margin: [0, 4, 0, 0] }
    )
  }

  // ── Payments received ───────────────────────────────────────────────────
  content.push(sectionTitle(7, 'Payments Received', `${snapshot.payments.length} payment(s) • ${money(totals.payments)}`))
  const payRecOk = snapshot.sources.find(s => s.key === 'payments')?.ok ?? true
  if (!payRecOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'payments')?.error))
  } else if (snapshot.payments.length === 0) {
    content.push(noData('No payments received this month.'))
  } else {
    content.push(
      dataTable({
        header: ['Date', 'Customer', 'Method', 'Reference', 'Amount'],
        widths: [62, '*', 90, 120, 70],
        alignments: ['left', 'left', 'left', 'left', 'right'],
        body: snapshot.payments.map(p => [p.date, p.customer ?? '—', p.method ?? '—', p.ref ?? '—', money(p.amount)]),
      })
    )
  }

  // ── Shop bills ──────────────────────────────────────────────────────────
  content.push(sectionTitle(8, 'Shop Bills', `${snapshot.shop_bills.length} bill(s)`))
  const shopOk = snapshot.sources.find(s => s.key === 'shop_bills')?.ok ?? true
  if (!shopOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'shop_bills')?.error))
  } else if (snapshot.shop_bills.length === 0) {
    content.push(noData('No shop bills this month.'))
  } else {
    const shopTotal = snapshot.shop_bills.reduce((s, b) => s + b.total, 0)
    content.push(
      dataTable({
        header: ['Date', 'Bill No', 'Client', 'Total', 'Balance', 'Status'],
        widths: [62, '*', '*', 60, 60, 74],
        alignments: ['left', 'left', 'left', 'right', 'right', 'center'],
        body: snapshot.shop_bills.map(b => [b.date, b.bill_id || '—', b.client_name, money(b.total), money(b.balance), statusCell(b.status || '—')]),
      }),
      { text: `${snapshot.shop_bills.length} shop bill(s)   •   Total ${money(shopTotal)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Legacy invoices ─────────────────────────────────────────────────────
  content.push(sectionTitle(9, 'Legacy Invoices', `${snapshot.legacy_invoices.length} invoice(s)`))
  const legacyOk = snapshot.sources.find(s => s.key === 'legacy_invoices')?.ok ?? true
  if (!legacyOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'legacy_invoices')?.error))
  } else if (snapshot.legacy_invoices.length === 0) {
    content.push(noData('No legacy invoices this month.'))
  } else {
    const legacyTotal = snapshot.legacy_invoices.reduce((s, b) => s + b.total, 0)
    content.push(
      dataTable({
        header: ['Date', 'Invoice No', 'Shop', 'Total', 'Status'],
        widths: [62, '*', '*', 70, 70],
        alignments: ['left', 'left', 'left', 'right', 'center'],
        body: snapshot.legacy_invoices.map(b => [b.date, b.invoice_id || '—', b.client_name, money(b.total), b.status ?? '—']),
      }),
      { text: `${snapshot.legacy_invoices.length} legacy invoice(s)   •   Total ${money(legacyTotal)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Linen activity ──────────────────────────────────────────────────────
  content.push(sectionTitle(10, 'Linen Activity'))
  const gpOk = snapshot.sources.find(s => s.key === 'gatepasses')?.ok ?? true
  content.push({ text: `Gate Passes Received • ${totals.gatepass_pieces} pieces`, bold: true, fontSize: 9, color: DARK, characterSpacing: 1, margin: [0, 2, 0, 4] })
  if (!gpOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'gatepasses')?.error))
  } else if (snapshot.gatepasses.length === 0) {
    content.push(noData('—'))
  } else {
    content.push(
      dataTable({
        header: ['Date', 'GP No', 'Customer', 'Pieces', 'Delivered'],
        widths: [62, '*', '*', 60, 70],
        alignments: ['left', 'left', 'left', 'right', 'center'],
        body: snapshot.gatepasses.map(g => [g.receiving_date, g.gp_id || '—', g.customer, String(g.total_pieces), g.delivered ? 'Yes' : 'No']),
      })
    )
  }

  content.push({ text: `Deliveries • ${totals.deliveries_pieces} pieces`, bold: true, fontSize: 9, color: DARK, characterSpacing: 1, margin: [0, 10, 0, 4] })
  const delOk = snapshot.sources.find(s => s.key === 'deliveries')?.ok ?? true
  if (!delOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'deliveries')?.error))
  } else if (snapshot.deliveries.length === 0) {
    content.push(noData('—'))
  } else {
    content.push(
      dataTable({
        header: ['Date', 'Delivery No', 'Gate Pass', 'Customer', 'Pieces'],
        widths: [62, '*', 90, '*', 60],
        alignments: ['left', 'left', 'left', 'left', 'right'],
        body: snapshot.deliveries.map(d => [d.delivery_date, d.delivery_id || '—', d.gp_id ?? '—', d.customer, String(d.total_pieces)]),
      })
    )
  }

  content.push({ text: 'Returns', bold: true, fontSize: 9, color: DARK, characterSpacing: 1, margin: [0, 10, 0, 4] })
  const retOk = snapshot.sources.find(s => s.key === 'returns')?.ok ?? true
  if (!retOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'returns')?.error))
  } else if (snapshot.returns.length === 0) {
    content.push(noData('—'))
  } else {
    content.push(
      dataTable({
        header: ['Date', 'Return No', 'Gate Pass', 'Customer', 'Items'],
        widths: [62, '*', 90, '*', '*'],
        alignments: ['left', 'left', 'left', 'left', 'left'],
        body: snapshot.returns.map(r => [r.date, r.return_id || '—', r.gp_id ?? '—', r.customer, r.items.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—']),
      })
    )
  }

  // ── Linen status ────────────────────────────────────────────────────────
  content.push(sectionTitle(11, 'Linen Stock Status'))
  const linenOk = snapshot.sources.find(s => s.key === 'linen_status')?.ok ?? true
  if (!linenOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'linen_status')?.error))
  } else if (!snapshot.linen_status) {
    content.push(noData('—'))
  } else {
    const ls = snapshot.linen_status
    content.push(
      dataTable({
        header: ['In Stock', 'In Use', 'In Wash', 'Retired', 'Lost', 'Total'],
        widths: ['*', '*', '*', '*', '*', '*'],
        alignments: ['center', 'center', 'center', 'center', 'center', 'center'],
        body: [[String(ls.in_stock), String(ls.in_use), String(ls.in_wash), String(ls.retired), String(ls.lost), String(ls.total)]],
      }),
      ls.truncated
        ? { text: 'Snapshot limited to the first 5,000 linen records.', fontSize: 7, color: AMBER, margin: [0, 3, 0, 0] }
        : {}
    )
  }

  // ── Source health ───────────────────────────────────────────────────────
  if (failedSources.length > 0) {
    content.push(sectionTitle(12, 'Data Sources With Issues'))
    content.push({
      text: failedSources.map(s => `• ${s.label}: ${s.error ?? 'failed'}`).join('\n'),
      fontSize: 8,
      color: AMBER,
      margin: [0, 0, 0, 6],
    })
  }

  const doc: Record<string, unknown> = {
    pageSize: 'A4',
    pageMargins: [32, 30, 32, 44],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: DARK },
    content: content as unknown[],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `${company.name}  •  Monthly Report ${period}`, fontSize: 7, color: GRAY, alignment: 'left', margin: [32, 0, 0, 0] },
        { text: `Page ${currentPage} of ${pageCount}`, fontSize: 7, color: GRAY, alignment: 'right', margin: [0, 0, 32, 0] },
      ],
      margin: [0, 10, 0, 0],
    }),
  }

  return new Promise<Blob>((resolve, reject) => {
    const pdf = pdfMake.createPdf(doc as unknown as Parameters<typeof pdfMake.createPdf>[0])
    pdf.getBlob(blob => {
      if (blob && blob.size > 0) resolve(blob)
      else reject(new Error('PDF generation returned an empty blob'))
    })
  })
}