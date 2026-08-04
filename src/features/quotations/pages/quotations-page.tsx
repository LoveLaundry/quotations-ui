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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

  const filtered = useMemo(() => {
    return (data ?? [])
      .filter((q) => {
        const matchesSearch = [q.category, q.item_name, q.size]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesCategory = !categoryFilter || (q.category?.trim() || 'Uncategorized') === categoryFilter
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => a.item_name.localeCompare(b.item_name))
  }, [data, search, categoryFilter])

  return (
    <div className="space-y-10 pb-16 select-none">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Quotations' }]} />
          <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
            Quotations & Price List
          </h1>
          <p className="text-[22px] font-medium text-slate-500">
            Browse and manage all laundry service pricing
          </p>
        </div>
        <Link to="/quotations/new">
          <Button size="lg" className="font-bold text-[22px]">
            <Plus className="mr-3 h-8 w-8" /> New Quotation
          </Button>
        </Link>
      </div>

      <Card className="border border-slate-200/90 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-6">
          <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-card-title font-extrabold text-slate-900">
              Price List
            </CardTitle>
            <div className="relative w-full lg:w-[440px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-7 w-7 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, categories..."
                className="pl-14 h-16 text-[22px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="flex flex-wrap gap-3">
            <FilterChip
              label="All"
              active={!categoryFilter}
              count={data?.length}
              onClick={() => setCategoryFilter(null)}
            />
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
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : isError ? (
            <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotations'} />
          ) : filtered.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-6 text-[22px]">Item</TableHead>
                  <TableHead className="py-6 text-[22px]">Category</TableHead>
                  <TableHead className="py-6 text-[22px]">Size</TableHead>
                  <TableHead className="py-6 text-[22px]">Service Types</TableHead>
                  <TableHead className="py-6 text-right text-[22px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((quotation, index) => {
                  const types = Object.entries(quotation.unit_price_with_options)
                  return (
                    <motion.tr
                      key={quotation.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-t border-slate-100 bg-white transition hover:bg-slate-50/80"
                    >
                      <TableCell className="py-6 text-[20px] font-bold text-slate-900">
                        {quotation.item_name}
                      </TableCell>
                      <TableCell className="py-6 text-[20px] font-semibold text-slate-700">
                        {quotation.category}
                      </TableCell>
                      <TableCell className="py-6 text-[20px] text-slate-600 font-medium">
                        {quotation.size}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex flex-wrap gap-2.5">
                          {types.slice(0, 3).map(([type, price]) => (
                            <span
                              key={type}
                              className="rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-[17px] font-semibold text-slate-700"
                            >
                              {type}: {formatCurrency(price)}
                            </span>
                          ))}
                          {types.length > 3 ? (
                            <span className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-1.5 text-[17px] font-bold text-red-600">
                              +{types.length - 3} more
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewQuotation(quotation)}
                            aria-label="Preview pricing"
                            className="h-12 w-12 rounded-xl"
                          >
                            <Eye className="h-7 w-7 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
                            aria-label="Edit"
                            className="h-12 w-12 rounded-xl"
                          >
                            <Edit className="h-7 w-7 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(String(quotation.id))}
                            aria-label="Delete"
                            className="h-12 w-12 rounded-xl text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-7 w-7" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No quotations found"
              description={search || categoryFilter ? 'Try adjusting your search or filters.' : 'Create your first quotation to get started.'}
              action={
                !search && !categoryFilter ? (
                  <Link to="/quotations/new">
                    <Button size="lg" className="font-bold text-[22px]">Create quotation</Button>
                  </Link>
                ) : undefined
              }
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
