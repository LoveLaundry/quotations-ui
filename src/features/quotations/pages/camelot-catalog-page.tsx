import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, FileSpreadsheet, Plus } from 'lucide-react'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { formatCurrency } from '../../feature-pack/utils'
import {
  CAMELOT_TEMPLATE,
  CAMELOT_TEMPLATE_FILE_NAME,
  camelotTemplateItemCount,
  camelotTemplateMissingRates,
  serializeCamelotTemplate,
} from '../lib/camelot-template'

function downloadTemplate() {
  const blob = new Blob([serializeCamelotTemplate(CAMELOT_TEMPLATE)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = CAMELOT_TEMPLATE_FILE_NAME
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Readable view of the JSON quotation template. The JSON file itself is the
 * source of truth — download it, edit the rates if needed, then upload it from
 * the quotation-create form.
 */
export default function CamelotCatalogPage() {
  const [query, setQuery] = useState('')

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return CAMELOT_TEMPLATE.sections
    return CAMELOT_TEMPLATE.sections
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
  const missingRates = camelotTemplateMissingRates(CAMELOT_TEMPLATE)

  return (
    <div className="space-y-5 pb-10 select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/' },
              { label: 'Quotations', href: '/quotations' },
              { label: 'Camelot Quotation Template' },
            ]}
          />
          <div className="mt-2 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[var(--danger-text)]" aria-hidden />
            <h1 className="text-dashboard-title">Camelot Quotation Template</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-[var(--text-faint)]">
            {CAMELOT_TEMPLATE.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" /> Download JSON
          </Button>
          <Link to="/price-lists/camelot-2026/monthly">
            <Button variant="secondary">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Monthly summary
            </Button>
          </Link>
          <Link to="/quotations/new">
            <Button>
              <Plus className="h-3.5 w-3.5" /> Create quotation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Items', value: camelotTemplateItemCount(CAMELOT_TEMPLATE) },
          { label: 'Sections', value: CAMELOT_TEMPLATE.sections.length },
          { label: 'Months', value: CAMELOT_TEMPLATE.months.map((month) => month.label).join(' · ') },
          { label: 'Currency', value: CAMELOT_TEMPLATE.currency },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-4">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                {metric.label}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[var(--info-border)] bg-[var(--info-soft)]">
        <CardContent className="pt-4">
          <p className="text-[12px] leading-relaxed text-[var(--info-text)]">
            Download <strong>{CAMELOT_TEMPLATE_FILE_NAME}</strong>, edit it if rates change, then
            upload it from <strong>New Quotation → Import JSON</strong>. The hotel is always chosen
            from the registered hotels list — the template never stores a hotel name or code.
          </p>
          <p className="mt-1 text-[11px] text-[var(--info-text)]">
            Monthly quantities are not prefilled. Open the monthly summary to enter them by hand.
            {missingRates.length > 0
              ? ` Confirm ${missingRates.length} rate${missingRates.length === 1 ? '' : 's'} before saving: ${missingRates.join(', ')}.`
              : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <label className="mb-1 block text-[12px] font-medium text-[var(--text-primary)]" htmlFor="camelot-search">
            Find an item
          </label>
          <Input
            id="camelot-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Bed Sheet, Serviette, Pressing"
          />
          <p className="mt-1 text-[11px] text-[var(--text-faint)]" role="status">
            Showing {shown} of {camelotTemplateItemCount(CAMELOT_TEMPLATE)} items
          </p>
        </CardContent>
      </Card>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-8 text-center text-[13px] text-[var(--text-faint)]">
          No template items match “{query}”.
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
                    <th className="pb-2 text-right font-semibold">Rate ({CAMELOT_TEMPLATE.currency})</th>
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
        Source: {CAMELOT_TEMPLATE.source ?? 'not recorded in template'}. The JSON file is the only
        place item names and rates live; this page, the monthly summary and quotation upload all
        read the same data.
      </p>
    </div>
  )
}
