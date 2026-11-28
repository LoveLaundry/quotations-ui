import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, RotateCcw, Printer } from 'lucide-react'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { formatCurrency } from '../../feature-pack/utils'
import {
  CAMELOT_MONTHLY_SHEETS,
  camelotCellKey,
  camelotComputeRow,
  camelotInitialEdits,
  camelotRateKey,
  type CamelotMonthId,
} from '../lib/camelot-monthly'

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)

type Edits = Record<CamelotMonthId, Record<string, string>>

function initialEdits(): Edits {
  return {
    october: camelotInitialEdits('october'),
    november: camelotInitialEdits('november'),
  }
}

/**
 * Editable Camelot monthly inventory. Day cells, totals, rates and costs start
 * from the workbook; totals and costs recalculate as staff type. Nothing is
 * saved to the quotation service here — this is a working sheet, while the
 * price-list page and quotation form own the stored rates.
 */
export default function CamelotMonthlyPage() {
  const [month, setMonth] = useState<CamelotMonthId>('october')
  const [editsByMonth, setEditsByMonth] = useState<Edits>(initialEdits)

  const edits = editsByMonth[month]
  const sheet = CAMELOT_MONTHLY_SHEETS.find((entry) => entry.id === month)!

  const setCell = (key: string, value: string) => {
    setEditsByMonth((previous) => ({
      ...previous,
      [month]: { ...previous[month], [key]: value },
    }))
  }

  const resetMonth = () => {
    setEditsByMonth((previous) => ({ ...previous, [month]: camelotInitialEdits(month) }))
  }

  const computed = useMemo(() => sheet.sections.map((section) => ({
    section,
    rows: section.items.map((item, rowIndex) => ({
      item,
      row: camelotComputeRow(item, month, section.id, rowIndex, edits),
    })),
  })), [sheet, month, edits])

  const totals = computed.reduce((sum, group) => {
    for (const { row } of group.rows) {
      sum.quantity += row.total
      sum.cost += row.cost
    }
    return sum
  }, { quantity: 0, cost: 0 })

  return (
    <div className="space-y-5 pb-10 select-none camelot-monthly-page">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          .no-print { display: none !important; }
          .camelot-monthly-page table { font-size: 8px; }
          .camelot-monthly-page thead { display: table-header-group; }
          .camelot-monthly-page tr { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/' },
              { label: 'Camelot 2026', href: '/price-lists/camelot-2026' },
              { label: 'Monthly Inventory' },
            ]}
          />
          <div className="mt-2 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[var(--danger-text)]" aria-hidden />
            <h1 className="text-dashboard-title">Camelot Monthly Inventory</h1>
          </div>
          <p className="text-[13px] text-[var(--text-faint)] mt-0.5">
            Daily quantities from the 2026 workbook. Edit any cell; Total, Rate and Cost recalculate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to="/price-lists/camelot-2026">
            <Button variant="secondary">
              <ArrowLeft className="h-3.5 w-3.5" /> Price list
            </Button>
          </Link>
          <Button variant="secondary" onClick={resetMonth}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset {sheet.label}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print sheet
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {CAMELOT_MONTHLY_SHEETS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={month === entry.id}
                onClick={() => setMonth(entry.id)}
                className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors cursor-pointer ${
                  month === entry.id
                    ? 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
                    : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[var(--text-muted)]">
            <span>{computed.reduce((n, group) => n + group.rows.length, 0)} items</span>
            <span>Total quantity: <strong className="text-[var(--text-primary)]">{totals.quantity}</strong></span>
            <span>Total cost: <strong className="text-[var(--text-primary)]">{formatCurrency(totals.cost)}</strong></span>
          </div>
        </CardContent>
      </Card>

      {computed.map(({ section, rows }) => {
        const sectionTotals = rows.reduce((sum, { row }) => ({
          quantity: sum.quantity + row.total,
          cost: sum.cost + row.cost,
        }), { quantity: 0, cost: 0 })

        return (
          <Card key={`${month}-${section.id}`}>
            <CardHeader className="border-b border-[var(--border)] pb-3">
              <CardTitle>
                {section.title}
                <span className="ml-2 text-[12px] font-normal text-[var(--text-faint)]">
                  {rows.length} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1680px] border-collapse text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
                      <th className="sticky left-0 z-10 w-10 bg-white px-1 pb-2 font-semibold">No.</th>
                      <th className="sticky left-10 z-10 w-52 bg-white px-1 pb-2 font-semibold">
                        Item
                      </th>
                      {DAYS.map((day) => (
                        <th key={day} className="w-11 px-0.5 pb-2 text-center font-semibold">
                          {day}
                        </th>
                      ))}
                      <th className="w-20 px-1 pb-2 text-right font-semibold">Total</th>
                      <th className="w-20 px-1 pb-2 text-right font-semibold">Rate</th>
                      <th className="w-28 px-1 pb-2 text-right font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ item, row }, rowIndex) => (
                      <tr key={item.name} className="border-t border-[var(--border)] align-top">
                        <td className="sticky left-0 z-10 bg-white px-1 py-1 text-[11px] text-[var(--text-faint)]">
                          {rowIndex + 1}
                        </td>
                        <td className="sticky left-10 z-10 bg-white px-1 py-1">
                          <span className="block text-[11px] font-medium text-[var(--text-primary)]">
                            {item.name}
                          </span>
                          {item.note ? (
                            <span className="block text-[9px] leading-tight text-[var(--warning-text)]">
                              {item.note}
                            </span>
                          ) : null}
                        </td>
                        {DAYS.map((day, dayIndex) => {
                          const key = camelotCellKey(month, section.id, rowIndex, dayIndex)
                          return (
                            <td key={day} className="px-0.5 py-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={edits[key] ?? ''}
                                onChange={(event) => setCell(key, event.target.value)}
                                aria-label={`${item.name}, ${sheet.label} day ${day} quantity`}
                                className="h-7 w-10 rounded border border-[var(--border)] bg-white px-1 text-center text-[11px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
                              />
                            </td>
                          )
                        })}
                        <td className="px-1 py-1 text-right text-[11px] font-semibold text-[var(--text-primary)]">
                          {row.total}
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={edits[camelotRateKey(month, section.id, rowIndex)] ?? ''}
                            onChange={(event) =>
                              setCell(camelotRateKey(month, section.id, rowIndex), event.target.value)
                            }
                            aria-label={`${item.name} rate in LKR`}
                            className="h-7 w-full rounded border border-[var(--border)] bg-white px-1 text-right text-[11px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
                          />
                        </td>
                        <td className="px-1 py-1 text-right text-[11px] font-semibold text-[var(--text-primary)]">
                          {formatCurrency(row.cost)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-2)] font-semibold">
                      <td className="sticky left-0 z-10 bg-[var(--surface-2)] px-1 py-2" colSpan={2}>
                        {section.title} total
                      </td>
                      {DAYS.map((day) => <td key={day} className="px-0.5 py-2" />)}
                      <td className="px-1 py-2 text-right text-[11px]">{sectionTotals.quantity}</td>
                      <td className="px-1 py-2" />
                      <td className="px-1 py-2 text-right text-[11px]">
                        {formatCurrency(sectionTotals.cost)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <p className="no-print text-[11px] text-[var(--text-faint)]">
        November's source heading says OCTOBER; the tab name is used for the month selector.
        Spreadsheet error cells are shown as blank with a note rather than as a price.
      </p>
    </div>
  )
}
