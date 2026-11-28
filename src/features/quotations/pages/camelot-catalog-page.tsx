import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, Plus } from 'lucide-react'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { formatCurrency } from '../../feature-pack/utils'
import {
  CAMELOT_2026_CATALOG, CAMELOT_2026_SOURCE, camelotItemCount,
} from '../lib/camelot-catalog'

/**
 * Read-only view of the Camelot 2026 workbook. The same catalog can be added
 * to a quotation from the quotation form's "Load Camelot 2026" control; this
 * page is where staff check the item names and rates first.
 */
export default function CamelotCatalogPage() {
  const [query, setQuery] = useState('')

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return CAMELOT_2026_CATALOG
    return CAMELOT_2026_CATALOG
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.name.toLowerCase().includes(needle) ||
          item.note?.toLowerCase().includes(needle),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [query])

  const shown = sections.reduce((sum, section) => sum + section.items.length, 0)

  return (
    <div className="space-y-5 pb-10 select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/' },
              { label: 'Quotations', href: '/quotations' },
              { label: 'Camelot 2026 Price List' },
            ]}
          />
          <div className="mt-2 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[var(--danger-text)]" aria-hidden />
            <h1 className="text-dashboard-title">Camelot 2026 Price List</h1>
          </div>
          <p className="text-[13px] text-[var(--text-faint)] mt-0.5">
            {camelotItemCount()} items across {CAMELOT_2026_CATALOG.length} sections, transcribed
            from {CAMELOT_2026_SOURCE}. Rates are in LKR.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Link to="/price-lists/camelot-2026/monthly">
            <Button variant="secondary">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Monthly inventory
            </Button>
          </Link>
          <Link to="/quotations/new">
            <Button>
              <Plus className="h-3.5 w-3.5" /> New quotation
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-1" htmlFor="camelot-search">
            Find an item
          </label>
          <Input
            id="camelot-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Bed Sheet, Serviette, Pressing"
          />
          <p className="mt-1 text-[11px] text-[var(--text-faint)]" role="status">
            Showing {shown} of {camelotItemCount()} items
          </p>
        </CardContent>
      </Card>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-8 text-center text-[13px] text-[var(--text-faint)]">
          No Camelot items match “{query}”.
        </p>
      ) : sections.map((section) => (
        <Card key={section.id}>
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
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                    <th className="pb-2 w-12 font-semibold">No.</th>
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="pb-2 text-right font-semibold">Rate (LKR)</th>
                    <th className="pb-2 pl-4 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item, index) => (
                    <tr key={item.name} className="border-t border-[var(--border)]">
                      <td className="py-2 text-[12px] text-[var(--text-faint)]">{index + 1}</td>
                      <td className="py-2 text-[13px] font-medium text-[var(--text-primary)]">
                        {item.name}
                      </td>
                      <td className="py-2 text-right text-[13px] text-[var(--text-primary)]">
                        {item.rate === null
                          ? <span className="text-[var(--warning-text)]">Not supplied</span>
                          : formatCurrency(item.rate)}
                      </td>
                      <td className="py-2 pl-4 text-[11px] text-[var(--text-faint)]">
                        {item.note ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      <p className="text-[11px] text-[var(--text-faint)]">
        Three source rows have an empty rate cell; the quotation loader adds them at 0 with a note
        so they can be checked. Spreadsheet formula errors were not imported as prices.
      </p>
    </div>
  )
}
