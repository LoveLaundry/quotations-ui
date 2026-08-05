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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatCurrency } from '../../../lib/utils'
import { useDeleteQuotation, useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import type { Quotation } from '../../../types/quotation'

export default function QuotationsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuotations()
  const deleteMutation = useDeleteQuotation()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null)

  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((q) => q.category?.trim() || 'Uncategorized'))
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() =>
    (data ?? [])
      .filter((q) => {
        const matchesSearch = [q.category, q.item_name, q.size]
          .join(' ').toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !categoryFilter ||
          (q.category?.trim() || 'Uncategorized') === categoryFilter
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => a.item_name.localeCompare(b.item_name)),
  [data, search, categoryFilter])

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Quotations' }]} />
          <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
            Quotations & Price List
          </h1>
          <p className="text-[13px] text-slate-500">Browse and manage all laundry service pricing</p>
        </div>
        <Link to="/quotations/new" className="shrink-0">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Price List</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, categories..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" active={!categoryFilter} count={data?.length} onClick={() => setCategoryFilter(null)} />
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                active={categoryFilter === cat}
                count={data?.filter((q) => (q.category?.trim() || 'Uncategorized') === cat).length}
                onClick={() => setCategoryFilter(cat)}
              />
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : isError ? (
            <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotations'} />
          ) : filtered.length ? (
            <>
              {/* ── Desktop table (md+) ── */}
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
                    {filtered.map((quotation, index) => {
                      const types = Object.entries(quotation.unit_price_with_options)
                      return (
                        <motion.tr
                          key={quotation.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                          className="border-t border-slate-100 bg-white transition hover:bg-slate-50/80"
                        >
                          <TableCell className="font-semibold text-slate-900">{quotation.item_name}</TableCell>
                          <TableCell className="text-slate-600">{quotation.category}</TableCell>
                          <TableCell className="text-slate-500">{quotation.size}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {types.slice(0, 3).map(([type, price]) => (
                                <span key={type} className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[12px] font-medium text-slate-600">
                                  {type}: {formatCurrency(price)}
                                </span>
                              ))}
                              {types.length > 3 && (
                                <span className="rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[12px] font-semibold text-red-600">
                                  +{types.length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setPreviewQuotation(quotation)} aria-label="Preview">
                                <Eye className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${quotation.id}/edit`)} aria-label="Edit">
                                <Edit className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(String(quotation.id))} aria-label="Delete" className="text-red-500 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile cards (< md) ── */}
              <div className="md:hidden space-y-2">
                {filtered.map((quotation, index) => {
                  const types = Object.entries(quotation.unit_price_with_options)
                  return (
                    <motion.div
                      key={quotation.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900">{quotation.item_name}</p>
                          <p className="text-[12px] text-slate-500 mt-0.5">{quotation.category} · {quotation.size}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => setPreviewQuotation(quotation)} aria-label="Preview">
                            <Eye className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${quotation.id}/edit`)} aria-label="Edit">
                            <Edit className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(String(quotation.id))} aria-label="Delete" className="text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {types.map(([type, price]) => (
                          <span key={type} className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {type}: {formatCurrency(price)}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyState
              title="No quotations found"
              description={search || categoryFilter ? 'Try adjusting your search or filters.' : 'Create your first quotation to get started.'}
              action={!search && !categoryFilter ? (
                <Link to="/quotations/new">
                  <Button>Create quotation</Button>
                </Link>
              ) : undefined}
            />
          )}
        </CardContent>
      </Card>

      <QuotationPreviewDialog
        quotation={previewQuotation}
        open={Boolean(previewQuotation)}
        onOpenChange={(open) => !open && setPreviewQuotation(null)}
      />
    </div>
  )
}
