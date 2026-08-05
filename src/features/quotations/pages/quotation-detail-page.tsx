import { ArrowLeft, Edit, Printer, Building2, Calendar, Hash } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useQuotation } from '../hooks/useQuotations'

// Group line items by category for display
function groupByCategory(items: Array<{ item_name: string; category?: string; unit_price: number; notes?: string; id?: string | number }>) {
  const groups: Record<string, typeof items> = {}
  for (const item of items) {
    const cat = item.category?.trim() || 'General'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return Object.entries(groups)
}

export default function QuotationDetailPage() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const { data: q, isLoading, isError, error } = useQuotation(id)

  const grouped = q ? groupByCategory(q.line_items ?? []) : []

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Quotations', href: '/quotations' },
            { label: q?.client_name ?? 'Details' },
          ]} />
          <h1 className="text-dashboard-title mt-1">{q?.client_name ?? '—'}</h1>
          {q?.quotation_title && (
            <p className="text-[13px] text-[#98A2B3] mt-0.5">{q.quotation_title}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Link to={`/quotations/${String(id)}/edit`}>
            <Button><Edit className="h-3.5 w-3.5" /> Edit</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotation'} />
      ) : q ? (
        <>
          {/* Meta card */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#98A2B3] uppercase font-semibold tracking-wide">Client</p>
                    <p className="text-[13px] font-semibold text-[#101828]">{q.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#6B7280] border border-[#E4E7EC]">
                    <Hash className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#98A2B3] uppercase font-semibold tracking-wide">Line Items</p>
                    <p className="text-[13px] font-semibold text-[#101828]">{q.line_items?.length ?? 0} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#6B7280] border border-[#E4E7EC]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#98A2B3] uppercase font-semibold tracking-wide">Updated</p>
                    <p className="text-[13px] font-semibold text-[#101828]">{formatDate(q.updated_at ?? q.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price list — matches the printed quotation format exactly */}
          <Card id="printable-receipt">
            <CardHeader className="border-b border-[#F2F4F7] pb-4">
              <div>
                <CardTitle>{q.client_name} — Price List</CardTitle>
                {q.quotation_title && (
                  <p className="text-[12px] text-[#98A2B3] mt-0.5">{q.quotation_title}</p>
                )}
              </div>
              {/* Love Laundry branding for print */}
              <div className="hidden print:block text-right">
                <p className="text-[12px] font-bold text-[#101828]">Love Laundry</p>
                <p className="text-[11px] text-[#98A2B3]">Medagama, Panirendawa · Reg. No: 40-3064</p>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {grouped.map(([cat, items]) => (
                <div key={cat}>
                  {/* Category header */}
                  {grouped.length > 1 && (
                    <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#F2F4F7]">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">{cat}</p>
                    </div>
                  )}

                  {/* Items table */}
                  <table className="w-full">
                    {grouped.indexOf(grouped.find(g => g[0] === cat)!) === 0 && (
                      <thead className="border-b border-[#F2F4F7]">
                        <tr className="bg-[#F9FAFB]">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#98A2B3] w-12">#</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#98A2B3]">Item</th>
                          <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[#98A2B3] w-36">Unit Price (LKR)</th>
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {items.map((li, idx) => {
                        // Global index for # column
                        const globalIdx = (q.line_items ?? []).indexOf(li as typeof q.line_items[0])
                        return (
                          <tr
                            key={li.id ?? idx}
                            className="border-b border-[#F7F8FA] hover:bg-[#FAFAFA] transition-colors"
                          >
                            <td className="px-4 py-2.5 text-[12px] text-[#98A2B3] w-12">{globalIdx + 1}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-[13px] font-medium text-[#101828]">{li.item_name}</span>
                              {li.notes && (
                                <span className="ml-1.5 text-[12px] text-[#98A2B3]">({li.notes})</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-[13px] font-semibold text-[#101828]">
                                {li.unit_price.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Footer */}
              <div className="border-t border-[#E4E7EC] px-4 py-3 flex items-center justify-between bg-[#F9FAFB]">
                <span className="text-[12px] font-medium text-[#6B7280]">
                  {q.line_items?.length ?? 0} items total
                </span>
                <div className="text-right">
                  <p className="text-[11px] text-[#98A2B3] uppercase font-semibold tracking-wide">Currency</p>
                  <p className="text-[13px] font-semibold text-[#101828]">LKR (Sri Lankan Rupees)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          title="Quotation not found"
          description="This quotation may have been deleted."
          action={<Button onClick={() => navigate('/quotations')}>Back to list</Button>}
        />
      )}
    </div>
  )
}
