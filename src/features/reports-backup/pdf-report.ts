import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import iconUrl from '../../assets/icon.png'
import type { DailyReportSnapshot } from './types'

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

// ── Brand colours (paysheet / legacy-invoice palette) ────────────────────
const RED = '#C42127'
const DARK = '#1F2937'
const GRAY = '#6B7280'
const LIGHT = '#F3F4F6'
const BORDER = '#E5E7EB'
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

function money(n: number): string {
  return `Rs. ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface TableOptions {
  header: string[]
  widths: (string | number)[]
  body: (string | number | { text: string; bold?: boolean; color?: string; alignment?: string })[][]
  alignments?: string[]
}

function dataTable(opts: TableOptions) {
  const body = [
    opts.header.map(text => ({
      text,
      bold: true,
      fontSize: 7.5,
      color: '#FFFFFF',
      margin: [4, 4, 4, 4] as [number, number, number, number],
    })),
    ...opts.body.map(row =>
      row.map((cell, c) => ({
        text: cell,
        fontSize: 8,
        color: DARK,
        alignment: (opts.alignments?.[c] ?? 'left') as 'left' | 'right' | 'center',
        margin: [4, 3, 4, 3] as [number, number, number, number],
      }))
    ),
  ]
  return {
    layout: {
      hLineWidth: (i: number) => (i === 0 || i === body.length ? 0.8 : 0.4),
      vLineWidth: () => 0,
      hLineColor: () => BORDER,
      paddingLeft: () => 2,
      paddingRight: () => 2,
    },
    table: {
      headerRows: 1,
      widths: opts.widths,
      body,
    },
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

function noData(upper: boolean) {
  return { text: upper ? 'No records found for this date.' : '—', italic: true, fontSize: 8.5, color: GRAY, margin: [0, 2, 0, 6] }
}

function sourceFailed(error?: string) {
  return {
    text: `Source unavailable — ${error ?? 'request failed'}`,
    fontSize: 8,
    color: AMBER,
    margin: [0, 2, 0, 6] as [number, number, number, number],
  }
}

function attendanceCounts(records: DailyReportSnapshot['attendance']) {
  const present = records.filter(r => ['PRESENT', 'HALF_DAY', 'HALFDAY', 'HALF'].includes(r.status)).length
  const leave = records.filter(r => r.status.includes('LEAVE')).length
  const holiday = records.filter(r => r.status === 'HOLIDAY').length
  const other = Math.max(0, records.length - present - leave - holiday)
  return { present, leave, holiday, other }
}

function residencyMonths(date: string): string {
  const [y, m] = date.split('-').map(Number)
  const monthName = new Date(y, (m || 1) - 1, 1).toLocaleString('en-GB', { month: 'long' })
  return `${monthName} ${y}`
}

export async function generateReportPdf(snapshot: DailyReportSnapshot): Promise<Blob> {
  const logo = await loadLogo()
  const { company, totals, meta } = snapshot
  const date = meta.report_date
  const att = attendanceCounts(snapshot.attendance)
  const attOk = snapshot.sources.find(s => s.key === 'attendance')?.ok ?? true
  const incomeSource = snapshot.sources.find(s => s.key === 'income')
  const expenseSource = snapshot.sources.find(s => s.key === 'expenses')
  const failedSources = snapshot.sources.filter(s => !s.ok)

  const billsTotal = snapshot.bills.reduce((sum, b) => sum + b.total, 0)
  const billsBalance = snapshot.bills.reduce((sum, b) => sum + b.balance, 0)

  const content: unknown[] = [
    // ── Header ────────────────────────────────────────────────────────────
    {
      table: {
        widths: ['auto', '*', 'auto'],
        body: [
          [
            {
              stack: [
                logo ? { image: logo, width: 44, height: 44, fit: [44, 44] } : {},
                logo ? { text: '', fontSize: 1 } : {},
              ],
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
                company.registration_no
                  ? { text: `Reg No: ${company.registration_no}`, fontSize: 8, color: GRAY }
                  : {},
              ],
              alignment: 'left',
            },
            {
              stack: [
                { text: 'DAILY REPORT', fontSize: 11, bold: true, color: '#FFFFFF', alignment: 'center' },
                { text: date, fontSize: 12, bold: true, color: '#FFFFFF', alignment: 'center' },
                { text: residencyMonths(date), fontSize: 8.5, color: '#FFFFFF', alignment: 'center' },
                { text: `Generated ${meta.generated_at.slice(0, 19).replace('T', ' ')}`, fontSize: 7.5, color: '#FFFFFF', alignment: 'center' },
                { text: 'Backup v1', fontSize: 7.5, color: '#FFFFFF', alignment: 'center', margin: [0, 4, 0, 0] },
              ],
              fillColor: RED,
              margin: [0, 0, 0, 0],
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

    { text: 'Financial summary is derived from ledger income & expenses. Bill / payment / linen figures below are operational activity and are not added to the accounting net.', fontSize: 7, color: GRAY, italics: true, margin: [0, 0, 0, 8] },
  ]

  // ── Income ───────────────────────────────────────────────────────────────
  content.push(sectionTitle(1, 'Income (Ledger)'))
  if (!incomeSource?.ok) {
    content.push(sourceFailed(incomeSource?.error))
  } else if (snapshot.income.length === 0) {
    content.push(noData(true))
  } else {
    content.push(
      dataTable({
        header: ['No', 'Customer', 'Description', 'Source', 'Method', 'Amount'],
        widths: [24, '*', '*', 70, 70, 70],
        alignments: ['left', 'left', 'left', 'left', 'left', 'right'],
        body: snapshot.income.map((r, i) => [
          String(i + 1),
          r.customer ?? '—',
          r.description ?? '—',
          r.source ?? '—',
          r.payment_method ?? '—',
          money(r.amount),
        ]),
      }),
      { text: `${snapshot.income.length} income entry(ies)`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Expenses ─────────────────────────────────────────────────────────────
  content.push(sectionTitle(2, 'Expenses'))
  if (!expenseSource?.ok) {
    content.push(sourceFailed(expenseSource?.error))
  } else if (snapshot.expenses.length === 0) {
    content.push(noData(true))
  } else {
    content.push(
      dataTable({
        header: ['No', 'Category', 'Description', 'Payee', 'Method', 'Amount'],
        widths: [24, '*', '*', 110, 70, 70],
        alignments: ['left', 'left', 'left', 'left', 'left', 'right'],
        body: snapshot.expenses.map((r, i) => [
          String(i + 1),
          r.category ?? '—',
          r.description ?? '—',
          r.payee ?? '—',
          r.payment_method ?? '—',
          money(r.amount),
        ]),
      }),
      { text: `${snapshot.expenses.length} expense(s)   •   Total ${money(totals.expenses)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Attendance ───────────────────────────────────────────────────────────
  content.push(sectionTitle(3, 'Attendance'))
  if (!attOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'attendance')?.error))
  } else if (snapshot.attendance.length === 0) {
    content.push(noData(true))
  } else {
    const box = (num: number, labelText: string, color: string) => ({
      stack: [
        { text: String(num), bold: true, fontSize: 14, color, alignment: 'center' },
        { text: labelText, fontSize: 7.5, color: GRAY, alignment: 'center', bold: true, characterSpacing: 1 },
      ],
      fillColor: LIGHT,
      margin: [0, 6, 0, 6],
    })
    content.push(
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [[box(att.present, 'PRESENT', GREEN), box(att.leave, 'LEAVE', AMBER), box(att.holiday, 'HOLIDAY', GRAY), box(att.other, 'OTHER', RED)]],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [0, 0, 0, 6],
      },
      dataTable({
        header: ['#', 'Employee', 'Status', 'OT (hrs)'],
        widths: [24, '*', 120, 70],
        alignments: ['left', 'left', 'center', 'right'],
        body: snapshot.attendance.map((r, i) => [String(i + 1), r.employee_name, r.status, r.overtime_hours ? String(r.overtime_hours) : '—']),
      })
    )
  }

  // ── Payroll ──────────────────────────────────────────────────────────────
  content.push(sectionTitle(4, 'Payroll — salary slips paid / raised'))
  const payOk = snapshot.sources.find(s => s.key === 'salary')?.ok ?? true
  if (!payOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'salary')?.error))
  } else if (snapshot.salary_slips.length === 0) {
    content.push(noData(true))
  } else {
    const payTotal = snapshot.salary_slips.reduce((sum, s) => sum + s.net, 0)
    content.push(
      dataTable({
        header: ['No', 'Employee', 'Period', 'Gross', 'Deductions', 'Net', 'Status'],
        widths: [24, '*', 140, 70, 70, 70, 80],
        alignments: ['left', 'left', 'left', 'right', 'right', 'right', 'center'],
        body: snapshot.salary_slips.map((r, i) => [
          String(i + 1),
          r.employee_name,
          r.period_start && r.period_end ? `${r.period_start} → ${r.period_end}` : '—',
          money(r.gross),
          money(r.deductions),
          money(r.net),
          r.status,
        ]),
      }),
      { text: `${snapshot.salary_slips.length} slip(s)   •   Net paid ${money(payTotal)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Bills ────────────────────────────────────────────────────────────────
  content.push(sectionTitle(5, 'Bills'))
  const billsOk = snapshot.sources.find(s => s.key === 'bills')?.ok ?? true
  if (!billsOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'bills')?.error))
  } else if (snapshot.bills.length === 0) {
    content.push(noData(true))
  } else {
    content.push(
      dataTable({
        header: ['Bill No', 'Client', 'Items', 'Total', 'Balance', 'Status'],
        widths: ['*', '*', 40, 70, 70, 80],
        alignments: ['left', 'left', 'right', 'right', 'right', 'center'],
        body: snapshot.bills.map(b => [b.bill_id || '—', b.client_name, String(b.items_count), money(b.total), money(b.balance), b.payment_status || '—']),
      }),
      {
        columns: [
          { text: `${snapshot.bills.length} bill(s)   •   Raised ${money(billsTotal)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] },
          { text: `Balance outstanding ${money(billsBalance)}`, fontSize: 7.5, color: AMBER, bold: true, alignment: 'right', margin: [0, 4, 0, 0] },
        ],
      }
    )
  }

  // ── Payments received (mgmt) ─────────────────────────────────────────────
  content.push(sectionTitle(6, 'Payments Received'))
  const payRecOk = snapshot.sources.find(s => s.key === 'payments')?.ok ?? true
  if (!payRecOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'payments')?.error))
  } else if (snapshot.payments.length === 0) {
    content.push(noData(true))
  } else {
    const payRecTotal = snapshot.payments.reduce((sum, p) => sum + p.amount, 0)
    content.push(
      dataTable({
        header: ['No', 'Customer', 'Method', 'Reference', 'Amount'],
        widths: [24, '*', 100, 120, 80],
        alignments: ['left', 'left', 'left', 'left', 'right'],
        body: snapshot.payments.map((p, i) => [String(i + 1), p.customer ?? '—', p.method ?? '—', p.ref ?? '—', money(p.amount)]),
      }),
      { text: `${snapshot.payments.length} payment(s)   •   Total ${money(payRecTotal)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Shop bills ───────────────────────────────────────────────────────────
  content.push(sectionTitle(7, 'Shop Bills'))
  const shopOk = snapshot.sources.find(s => s.key === 'shop_bills')?.ok ?? true
  if (!shopOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'shop_bills')?.error))
  } else if (snapshot.shop_bills.length === 0) {
    content.push(noData(true))
  } else {
    const shopTotal = snapshot.shop_bills.reduce((sum, b) => sum + b.total, 0)
    content.push(
      dataTable({
        header: ['Bill No', 'Client', 'Total', 'Balance', 'Status'],
        widths: ['*', '*', 70, 70, 90],
        alignments: ['left', 'left', 'right', 'right', 'center'],
        body: snapshot.shop_bills.map(b => [b.bill_id || '—', b.client_name, money(b.total), money(b.balance), b.status || '—']),
      }),
      { text: `${snapshot.shop_bills.length} shop bill(s)   •   Total ${money(shopTotal)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Legacy invoices ──────────────────────────────────────────────────────
  content.push(sectionTitle(8, 'Legacy Invoices'))
  const legacyOk = snapshot.sources.find(s => s.key === 'legacy_invoices')?.ok ?? true
  if (!legacyOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'legacy_invoices')?.error))
  } else if (snapshot.legacy_invoices.length === 0) {
    content.push(noData(true))
  } else {
    const legacyTotal = snapshot.legacy_invoices.reduce((sum, b) => sum + b.total, 0)
    content.push(
      dataTable({
        header: ['Invoice No', 'Client', 'Total', 'Status'],
        widths: ['*', '*', 80, 90],
        alignments: ['left', 'left', 'right', 'center'],
        body: snapshot.legacy_invoices.map(b => [b.invoice_id || '—', b.client_name, money(b.total), b.status ?? '—']),
      }),
      { text: `${snapshot.legacy_invoices.length} legacy invoice(s)   •   Total ${money(legacyTotal)}`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  // ── Linen activity ───────────────────────────────────────────────────────
  content.push(sectionTitle(9, 'Linen Activity'))
  const gpOk = snapshot.sources.find(s => s.key === 'gatepasses')?.ok ?? true
  content.push({ text: 'Gate Passes Received', bold: true, fontSize: 9, color: DARK, characterSpacing: 1, margin: [0, 2, 0, 4] })
  if (!gpOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'gatepasses')?.error))
  } else if (snapshot.gatepasses.length === 0) {
    content.push(noData(false))
  } else {
    const gpPieces = snapshot.gatepasses.reduce((sum, g) => sum + g.total_pieces, 0)
    content.push(
      dataTable({
        header: ['GP No', 'Customer', 'Pieces', 'Delivered'],
        widths: ['*', '*', 60, 90],
        alignments: ['left', 'left', 'right', 'center'],
        body: snapshot.gatepasses.map(g => [g.gp_id || '—', g.customer, String(g.total_pieces), g.delivered ? 'Yes' : 'No']),
      }),
      { text: `${snapshot.gatepasses.length} gate pass(es)   •   ${gpPieces} pieces received`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  content.push({ text: 'Deliveries', bold: true, fontSize: 9, color: DARK, characterSpacing: 1, margin: [0, 10, 0, 4] })
  const delOk = snapshot.sources.find(s => s.key === 'deliveries')?.ok ?? true
  if (!delOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'deliveries')?.error))
  } else if (snapshot.deliveries.length === 0) {
    content.push(noData(false))
  } else {
    const delPieces = snapshot.deliveries.reduce((sum, d) => sum + d.total_pieces, 0)
    content.push(
      dataTable({
        header: ['Delivery No', 'Gate Pass', 'Customer', 'Pieces'],
        widths: ['*', 90, '*', 60],
        alignments: ['left', 'left', 'left', 'right'],
        body: snapshot.deliveries.map(d => [d.delivery_id || '—', d.gp_id ?? '—', d.customer, String(d.total_pieces)]),
      }),
      { text: `${snapshot.deliveries.length} delivery(ies)   •   ${delPieces} pieces delivered`, fontSize: 7.5, color: GRAY, margin: [0, 4, 0, 0] }
    )
  }

  content.push({ text: 'Returns', bold: true, fontSize: 9, color: DARK, characterSpacing: 1, margin: [0, 10, 0, 4] })
  const retOk = snapshot.sources.find(s => s.key === 'returns')?.ok ?? true
  if (!retOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'returns')?.error))
  } else if (snapshot.returns.length === 0) {
    content.push(noData(false))
  } else {
    content.push(
      dataTable({
        header: ['Return No', 'Gate Pass', 'Customer', 'Items'],
        widths: ['*', 90, '*', '*'],
        alignments: ['left', 'left', 'left', 'left'],
        body: snapshot.returns.map(r => [r.return_id || '—', r.gp_id ?? '—', r.customer, r.items.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—']),
      })
    )
  }

  // ── Linen status ─────────────────────────────────────────────────────────
  content.push(sectionTitle(10, 'Linen Stock Status'))
  const linenOk = snapshot.sources.find(s => s.key === 'linen_status')?.ok ?? true
  if (!linenOk) {
    content.push(sourceFailed(snapshot.sources.find(s => s.key === 'linen_status')?.error))
  } else if (!snapshot.linen_status) {
    content.push(noData(false))
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
        ? { text: 'Snapshot limited to the first 1,000 linen records.', fontSize: 7, color: AMBER, margin: [0, 3, 0, 0] }
        : {}
    )
  }

  // ── Source health ────────────────────────────────────────────────────────
  if (failedSources.length > 0) {
    content.push(sectionTitle(11, 'Data Sources With Issues'))
    content.push(
      {
        text: failedSources.map(s => `• ${s.label}: ${s.error ?? 'failed'}`).join('\n'),
        fontSize: 8,
        color: AMBER,
        margin: [0, 0, 0, 6],
      }
    )
  }

  const doc: Record<string, unknown> = {
    pageSize: 'A4',
    pageMargins: [32, 30, 32, 44],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: DARK },
    content: content as unknown[],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `${company.name}  •  Daily Report ${date}`,
          fontSize: 7,
          color: GRAY,
          alignment: 'left',
          margin: [32, 0, 0, 0],
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          fontSize: 7,
          color: GRAY,
          alignment: 'right',
          margin: [0, 0, 32, 0],
        },
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

export { money, dataTable }