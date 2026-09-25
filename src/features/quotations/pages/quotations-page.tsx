import { Edit, Eye, Plus, Search, Trash2, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { ConfirmDialog } from '../../../components/ui/confirm-dialog'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Input } from '../../../components/ui/input'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useDeleteQuotation, useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import { ORDER_STATUSES } from '../../../types/quotation'
import type { OrderStatus, Quotation } from '../../../types/quotation'

const STATUS_CONFIG = {
  draft:           { label: 'Draft',    cls: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]' },
  sent:            { label: 'Sent',     cls: 'bg-[blue-50] text-[blue-600] border-[blue-200]' },
  accepted:        { label: 'Accepted', cls: 'bg-[emerald-50] text-[emerald-600] border-[emerald-200]' },
  archived:        { label: 'Archived', cls: 'bg-[var(--surface-2)] text-[var(--text-faint)] border-[var(--border)]' },
  received:        { label: 'Received', cls: 'b-indigo-50 tex-indigo-700 borde-indigo-200' },
  washing:         { label: 'Washing',  cls: 'b-indigo-50 tex-indigo-700 borde-indigo-200' },
  pressing:        { label: 'Pressing', cls: 'b-orange-50 tex-orange-700 borde-orange-200' },
  folding:         { label: 'Folding',  cls: 'b-orange-50 tex-orange-700 borde-orange-200' },
  packing:         { label: 'Packing',  cls: 'b-orange-50 tex-orange-700 borde-orange-200' },
  ready:           { label: 'Ready',    cls: 'b-emerald-50 tex-emerald-700 borde-emerald-200' },
  out_for_delivery:{ label: 'Out for Delivery', cls: 'b-emerald-50 tex-emerald-700 borde-emerald-200' },
  delivered:       { label: 'Delivered', cls: 'b-emerald-50 tex-emerald-700 borde-emerald-200' },
  cancelled:       { label: 'Cancelled', cls: 'bg-[var(--red-50)] text-[var(--red-700)] border-red-200' },
}

export default function QuotationsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuotations()
  const deleteMutation = useDeleteQuotation()

  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Quotation | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null)

  const filtered = useMemo(
    () =>
      (data ?? [])
        .filter(q => {
          const term = search.trim().toLowerCase()
          const matchesSearch =
            !term ||
            (q.client_name ?? '').toLowerCase().includes(term) ||
            (q.quotation_title ?? '').toLowerCase().includes(term) ||
            (q.line_items ?? []).some(li => (li.item_name ?? '').toLowerCase().includes(term))
          const matchesStatus = statusFilter === 'all' || q.status === statusFilter
          return matchesSearch && matchesStatus
        })
        .sort((a, b) => (a.client_name ?? '').localeCompare(b.client_name ?? '')),
    [data, search, statusFilter],
  )

  return (
    <div className="space-y-5 pb-8 select-none">
      <div className="flex flex-col gap-3">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Quotations' }]} />
          <h1 className="text-dashboard-title mt-1">Quotations</h1>
          <p className="text-[13px] text-[var(--text-faint)] mt-0.5">All hotel & client price lists</p>
        </div>
        <Link to="/quotations/new" className="w-full sm:w-auto">
          <Button size="lg" className="w-full max-w-md">
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-[var(--border)] pb-4">
          <div className="flex w-full flex-col gap-3">
            <CardTitle>
              All Quotations
              <span className="ml-2 font-normal text-[12px] text-[var(--text-faint)]">
                ({data?.length ?? 0})
              </span>
            </CardTitle>
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-faint)]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, title or item…" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', ...ORDER_STATUSES] as const).map(s => {
                const active = statusFilter === s
                const cfg = s === 'all' ? null : STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                      active
                        ? cfg
                          ? cfg.cls
                          : 'bg-[var(--surface)] text-white border-[var(--border-2)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {s === 'all' ? 'All' : cfg?.label ?? s}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-[72px] sm:h-[60px]" />)}</div>
          ) : isError ? (
            <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotations'} />
          ) : filtered.length ? (
            <div className="space-y-2">
              {filtered.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.25) }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 hover:border-[var(--red-100)] hover:bg-[var(--red-50)] transition-colors duration-100"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[14px] font-bold text-[var(--text-muted)] group-hover:bg-[var(--red-50)] group-hover:text-[var(--red-600)] group-hover:border-[var(--red-100)] transition-colors">
                      {(q.client_name ?? '?').charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{q.client_name ?? '(no name)'}</p>
                        {q.quotation_title && (
                          <span className="hidden sm:inline text-[12px] text-[var(--text-faint)] truncate">· {q.quotation_title}</span>
                        )}
                        {q.status && (
                          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap ${STATUS_CONFIG[q.status]?.cls ?? STATUS_CONFIG.draft.cls}`}>
                            {STATUS_CONFIG[q.status]?.label ?? q.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--text-faint)] mt-0.5 truncate">
                        {q.line_items?.length ?? 0} line items · Updated {formatDate(q.updated_at ?? q.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 justify-end sm:justify-start">
                    <Button variant="ghost" size="icon" onClick={() => setPreview(q)} aria-label="Preview">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${q.id}`)} aria-label="View">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${q.id}/edit`)} aria-label="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => setDeleteTarget(q)}
                      aria-label="Delete"
                      className="text-[var(--red-600)] hover:bg-[var(--red-50)]"
                    >
                      <Trash2 className="h-4 w-4" />
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Quotation?"
        message={
          deleteTarget
            ? `${deleteTarget.client_name}${deleteTarget.quotation_title ? ` — ${deleteTarget.quotation_title}` : ''} will be permanently deleted. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(String(deleteTarget.id), { onSettled: () => setDeleteTarget(null) })
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
