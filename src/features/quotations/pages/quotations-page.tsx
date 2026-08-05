import { Edit, Eye, Plus, Search, Trash2, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Input } from '../../../components/ui/input'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useDeleteQuotation, useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import type { Quotation } from '../../../types/quotation'

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    cls: 'bg-[#F9FAFB] text-[#6B7280] border-[#E4E7EC]' },
  sent:     { label: 'Sent',     cls: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' },
  accepted: { label: 'Accepted', cls: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' },
  archived: { label: 'Archived', cls: 'bg-[#FAFAFA] text-[#9CA3AF] border-[#E4E7EC]' },
}

export default function QuotationsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuotations()
  const deleteMutation = useDeleteQuotation()

  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Quotation | null>(null)

  const filtered = useMemo(
    () =>
      (data ?? [])
        .filter(q => (q.client_name ?? '').toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (a.client_name ?? '').localeCompare(b.client_name ?? '')),
    [data, search],
  )

  return (
    <div className="space-y-5 pb-10 select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Quotations' }]} />
          <h1 className="text-dashboard-title mt-1">Quotations</h1>
          <p className="text-[13px] text-[#98A2B3] mt-0.5">All hotel & client price lists</p>
        </div>
        <Link to="/quotations/new" className="shrink-0">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-[#F2F4F7] pb-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              All Quotations
              <span className="ml-2 font-normal text-[12px] text-[#98A2B3]">
                ({data?.length ?? 0})
              </span>
            </CardTitle>
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by hotel name…" className="pl-8" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-[60px]" />)}</div>
          ) : isError ? (
            <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotations'} />
          ) : filtered.length ? (
            <div className="space-y-1.5">
              {filtered.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.25) }}
                  className="group flex items-center gap-4 rounded-xl border border-[#E4E7EC] bg-white p-4 hover:border-[#FECACA] hover:bg-[#FFF8F8] transition-all duration-100"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] border border-[#E4E7EC] text-[14px] font-bold text-[#6B7280] group-hover:bg-[#FFF1F1] group-hover:text-[#DC2626] group-hover:border-[#FECACA] transition-all">
                    {(q.client_name ?? '?').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[#101828]">{q.client_name ?? '(no name)'}</p>
                      {q.quotation_title && (
                        <span className="text-[12px] text-[#98A2B3]">· {q.quotation_title}</span>
                      )}
                      {q.status && (
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_CONFIG[q.status]?.cls ?? STATUS_CONFIG.draft.cls}`}>
                          {STATUS_CONFIG[q.status]?.label ?? q.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#98A2B3] mt-0.5">
                      {q.line_items?.length ?? 0} line items · Updated {formatDate(q.updated_at ?? q.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setPreview(q)} aria-label="Preview">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${q.id}`)} aria-label="View">
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${q.id}/edit`)} aria-label="Edit">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => deleteMutation.mutate(String(q.id))}
                      aria-label="Delete"
                      className="text-[#DC2626] hover:bg-[#FFF1F1]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No quotations found"
              description={search ? `No results for "${search}"` : 'Create your first hotel quotation to get started.'}
              action={!search ? <Link to="/quotations/new"><Button>Create quotation</Button></Link> : undefined}
            />
          )}
        </CardContent>
      </Card>

      <QuotationPreviewDialog quotation={preview} open={Boolean(preview)} onOpenChange={o => !o && setPreview(null)} />
    </div>
  )
}
