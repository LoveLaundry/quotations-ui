import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { FilterChip } from '../../../components/ui/filter-chip'
import { Input } from '../../../components/ui/input'
import { Skeleton } from '../../../components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatCurrency } from '../../../lib/utils'
import { useDeleteQuotation, useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import type { Quotation } from '../../../types/quotation'

export default function QuotationsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuotations()
  const deleteMutation = useDeleteQuotation()

  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState<string | null>(null)
  const [preview, setPreview]       = useState<Quotation | null>(null)

  const categories = useMemo(() => {
    const s = new Set((data ?? []).map(q => q.category?.trim() || 'Uncategorized'))
    return Array.from(s).sort()
  }, [data])

  const filtered = useMemo(() =>
    (data ?? [])
      .filter(q => {
        const ok = [q.category, q.item_name, q.size].join(' ').toLowerCase().includes(search.toLowerCase())
        const cat = !catFilter || (q.category?.trim() || 'Uncategorized') === catFilter
        return ok && cat
      })
      .sort((a, b) => a.item_name.localeCompare(b.item_name)),
  [data, search, catFilter])

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Quotations' }]} />
          <h1 className="text-dashboard-title mt-1">Quotations</h1>
          <p className="text-[13px] text-[#98A2B3] mt-0.5">Manage all laundry service pricing</p>
        </div>
        <Link to="/quotations/new" className="shrink-0">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        {/* Search + title */}
        <CardHeader className="border-b border-[#F2F4F7] pb-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Price List <span className="ml-2 text-[#98A2B3] font-normal text-[12px]">({data?.length ?? 0} items)</span></CardTitle>
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            <FilterChip label="All" active={!catFilter} count={data?.length} onClick={() => setCatFilter(null)} />
            {categories.map(cat => (
              <FilterChip
                key={cat} label={cat} active={catFilter === cat}
                count={data?.filter(q => (q.category?.trim() || 'Uncategorized') === cat).length}
                onClick={() => setCatFilter(cat)}
              />
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-[52px]" />)}</div>
          ) : isError ? (
            <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotations'} />
          ) : filtered.length ? (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Service Types</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((q, i) => {
                      const types = Object.entries(q.unit_price_with_options)
                      return (
                        <motion.tr
                          key={q.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.025, 0.25) }}
                          className="border-t border-[#F2F4F7] bg-white transition-colors duration-100 hover:bg-[#FAFAFA]"
                        >
                          <TableCell><span className="font-semibold text-[#101828]">{q.item_name}</span></TableCell>
                          <TableCell>{q.category}</TableCell>
                          <TableCell>{q.size}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {types.slice(0, 3).map(([t, p]) => (
                                <span key={t} className="rounded-md border border-[#E4E7EC] bg-[#F9FAFB] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                                  {t}: {formatCurrency(p)}
                                </span>
                              ))}
                              {types.length > 3 && (
                                <span className="rounded-md border border-[#FECACA] bg-[#FFF1F1] px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
                                  +{types.length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <Button variant="ghost" size="icon" onClick={() => setPreview(q)} aria-label="Preview">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${q.id}/edit`)} aria-label="Edit">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(String(q.id))} aria-label="Delete" className="text-[#DC2626] hover:bg-[#FFF1F1]">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {filtered.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.25) }}
                    className="rounded-xl border border-[#E4E7EC] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#101828] truncate">{q.item_name}</p>
                        <p className="text-[11px] text-[#98A2B3] mt-0.5">{q.category} · {q.size}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => setPreview(q)} aria-label="Preview"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${q.id}/edit`)} aria-label="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(String(q.id))} aria-label="Delete" className="text-[#DC2626] hover:bg-[#FFF1F1]"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {Object.entries(q.unit_price_with_options).map(([t, p]) => (
                        <span key={t} className="rounded-md border border-[#E4E7EC] bg-[#F9FAFB] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                          {t}: {formatCurrency(p)}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No quotations found"
              description={search || catFilter ? 'Try adjusting your filters.' : 'Create your first quotation to get started.'}
              action={!search && !catFilter ? <Link to="/quotations/new"><Button>Create quotation</Button></Link> : undefined}
            />
          )}
        </CardContent>
      </Card>

      <QuotationPreviewDialog quotation={preview} open={Boolean(preview)} onOpenChange={o => !o && setPreview(null)} />
    </div>
  )
}
