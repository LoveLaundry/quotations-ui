import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, Printer, RotateCcw } from 'lucide-react'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { formatCurrency } from '../../feature-pack/utils'
import {
  CAMELOT_TEMPLATE,
  CAMELOT_TEMPLATE_FILE_NAME,
  camelotTemplateItemCount,
  type CamelotTemplateItem,
  type CamelotTemplateMonth,
  type CamelotTemplateSection,
} from '../lib/camelot-template'

const round2 = (value: number) => Math.round(value * 100) / 100
const asNumber = (value: string | undefined): number => {
  if (!value || value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function cellKey(monthId: string, sectionId: string, itemName: string): string {
  return `${monthId}::${sectionId}::${itemName}`
}

function defaultRate(item: CamelotTemplateItem): string {
  return item.rate === null ? '' : String(item.rate)
}

interface MonthSummary {
  itemsWithQuantity: number
  quantity: number
  value: number
}

/**
 * Monthly summary for the Camelot quotation. Quantities start empty — the
 * admin fills them in by hand. Rates and month labels come from the JSON
 * template, never from TypeScript constants.
 */
export default function CamelotMonthlyPage() {
  const [monthId, setMonthId] = useState<string>(CAMELOT_TEMPLATE.months[0].id)
  const [sectionFilter, setSectionFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [rates, setRates] = useState<Record<string, string>>({})

  const summaries = useMemo(() => {
    const result = new Map<string, MonthSummary>()
    for (const month of CAMELOT_TEMPLATE.months) {
      const summary: MonthSummary = { itemsWithQuantity: 0, quantity: 0, value: 0 }
      for (const section of CAMELOT_TEMPLATE.sections) {
        for (const item of section.items) {
          const key = cellKey(month.id, section.id, item.name)
          const quantity = asNumber(quantities[key])
          const rate = asNumber(rates[key] ?? defaultRate(item))
          if (quantity > 0) summary.itemsWithQuantity += 1
          summary.quantity += quantity
          summary.value += quantity * rate
        }
      }
      result.set(month.id, {
        itemsWithQuantity: summary.itemsWithQuantity,
        quantity: summary.quantity,
        value: round2(summary.value),
      })
    }
    return result
  }, [quantities, rates])

  const selectedMonth: CamelotTemplateMonth =
    CAMELOT_TEMPLATE.months.find((month) => month.id === monthId) ?? CAMELOT_TEMPLATE.months[0]

  const visibleSections = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return CAMELOT_TEMPLATE.sections
      .filter((section) => sectionFilter === 'all' || section.id === sectionFilter)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          !needle ||
          item.name.toLowerCase().includes(needle) ||
          item.note?.toLowerCase().includes(needle),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [sectionFilter, query])

  const selectedSummary = summaries.get(selectedMonth.id) ?? {
    itemsWithQuantity: 0, quantity: 0, value: 0,
  }

  const setQuantity = (key: string, value: string) => {
    setQuantities((previous) => ({ ...previous, [key]: value }))
  }

  const setRate = (key: string, value: string) => {
    setRates((previous) => ({ ...previous, [key]: value }))
  }

  const clearMonth = () => {
    const prefix = `${selectedMonth.id}::`
    setQuantities((previous) => Object.fromEntries(
      Object.entries(previous).filter(([key]) => !key.startsWith(prefix)),
    ))
  }

  return (
    <div className="space-y-5 pb-10 select-none camelot-monthly-page">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          .no-print { display: none !important; }
          .camelot-monthly-page input { border-color: transparent !important; }
          .camelot-monthly-page tr { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/' },
              { label: 'Camelot Template', href: '/price-lists/camelot-2026' },
              { label: 'Monthly Summary' },
            ]}
          />
          <div className="mt-2 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[var(--danger-text)]" aria-hidden />
            <h1 className="text-dashboard-title">Camelot Monthly Summary</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-[var(--text-faint)]">
            Enter monthly quantities by hand. Totals and value update as you type — no workbook
            grid, no prefilled days.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to="/price-lists/camelot-2026">
            <Button variant="secondary">
              <ArrowLeft className="h-3.5 w-3.5" /> Template
            </Button>
          </Link>
          <Button variant="secondary" onClick={clearMonth}>
            <RotateCcw className="h-3.5 w-3.5" /> Clear {selectedMonth.label}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print summary
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CAMELOT_TEMPLATE.months.map((month) => {
          const summary = summaries.get(month.id) ?? {
            itemsWithQuantity: 0, quantity: 0, value: 0,
          }
          const active = month.id === selectedMonth.id
          return (
            <button
              key={month.id}
              type="button"
              onClick={() => setMonthId(month.id)}
              aria-pressed={active}
              className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                active
                  ? 'border-[var(--danger-border)] bg-[var(--danger-soft)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">{month.label}</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                {month.days} days · {summary.itemsWithQuantity} of{' '}
                {camelotTemplateItemCount(CAMELOT_TEMPLATE)} items entered
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--text-muted)]">
                <span>Qty <strong className="text-[var(--text-primary)]">{summary.quantity}</strong></span>
                <span>
                  Value{' '}
                  <strong className="text-[var(--text-primary)]">{formatCurrency(summary.value)}</strong>
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <Card className="no-print">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSectionFilter('all')}
                aria-pressed={sectionFilter === 'all'}
                className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors cursor-pointer ${
                  sectionFilter === 'all'
                    ? 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
                    : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                }`}
              >
                All sections
              </button>
              {CAMELOT_TEMPLATE.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSectionFilter(section.id)}
                  aria-pressed={sectionFilter === section.id}
                  className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors cursor-pointer ${
                    sectionFilter === section.id
                      ? 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
                      : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-64">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter items"
                aria-label="Filter monthly items"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[var(--text-muted)]">
            <span>
              {selectedMonth.label}: <strong className="text-[var(--text-primary)]">{selectedSummary.quantity}</strong> pieces
            </span>
            <span>
              Value: <strong className="text-[var(--text-primary)]">{formatCurrency(selectedSummary.value)}</strong>
            </span>
            <span>{CAMELOT_TEMPLATE.currency}</span>
          </div>
        </CardContent>
      </Card>

      {visibleSections.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-8 text-center text-[13px] text-[var(--text-faint)]">
          No items match this filter.
        </p>
      ) : visibleSections.map((section: CamelotTemplateSection) => (
        <Card key={`${selectedMonth.id}-${section.id}`}>
          <CardHeader className="border-b border-[var(--border)] pb-3">
            <CardTitle>
              {section.title}
              <span className="ml-2 text-[12px] font-normal text-[var(--text-faint)]">
                {section.items.length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="w-32 pb-2 text-right font-semibold">Qty</th>
                    <th className="w-36 pb-2 text-right font-semibold">Rate ({CAMELOT_TEMPLATE.currency})</th>
                    <th className="w-32 pb-2 text-right font-semibold">Amount</th>
                    <th className="w-52 pb-2 pl-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item) => {
                    const key = cellKey(selectedMonth.id, section.id, item.name)
                    const rate = rates[key] ?? defaultRate(item)
                    const quantity = asNumber(quantities[key])
                    const amount = round2(quantity * asNumber(rate))
                    return (
                      <tr key={item.name} className="border-t border-[var(--border)]">
                        <td className="py-2 pr-3 text-[13px] font-medium text-[var(--text-primary)]">
                          {item.name}
                        </td>
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={quantities[key] ?? ''}
                            onChange={(event) => setQuantity(key, event.target.value)}
                            aria-label={`${item.name} quantity for ${selectedMonth.label}`}
                            placeholder="0"
                            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-2 text-right text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--success)]"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            inputMode="decimal"
                            value={rate}
                            onChange={(event) => setRate(key, event.target.value)}
                            aria-label={`${item.name} rate in ${CAMELOT_TEMPLATE.currency}`}
                            placeholder="—"
                            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-2 text-right text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--success)]"
                          />
                        </td>
                        <td className="px-1 py-2 text-right text-[13px] font-semibold text-[var(--text-primary)]">
                          {formatCurrency(amount)}
                        </td>
                        <td className="py-2 pl-3 text-[11px] text-[var(--text-faint)]">
                          {item.note ?? ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      <p className="no-print text-[11px] text-[var(--text-faint)]">
        Source: {CAMELOT_TEMPLATE.source ?? 'not recorded in template'}. Rates and month labels are
        read from {CAMELOT_TEMPLATE_FILE_NAME}; quantities are entered here by hand.
      </p>
    </div>
  )
}
