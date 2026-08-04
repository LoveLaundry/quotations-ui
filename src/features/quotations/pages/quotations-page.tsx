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
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Quotations' }]} />
          <p className="text-body-lg text-slate-500">
            Browse and manage all laundry service pricing
          </p>
        </div>
        <Link to="/quotations/new">
          <Button size="lg">
            <Plus className="mr-2 h-8 w-8" /> New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Price List</CardTitle>
            <div className="relative w-full lg:w-96">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-7 w-7 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, categories..."
                className="pl-12"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
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
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : isError ? (
            <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotations'} />
          ) : filtered.length ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-t border-surface-border bg-white transition hover:bg-slate-50/60"
                    >
                      <TableCell>
                        <span className="font-semibold text-slate-900">{quotation.item_name}</span>
                      </TableCell>
                      <TableCell>{quotation.category}</TableCell>
                      <TableCell>{quotation.size}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {types.slice(0, 3).map(([type, price]) => (
                            <span
                              key={type}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-600"
                            >
                              {type}: {formatCurrency(price)}
                            </span>
                          ))}
                          {types.length > 3 ? (
                            <span className="rounded-md bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-600">
                              +{types.length - 3} more
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewQuotation(quotation)}
                            aria-label="Preview pricing"
                          >
                            <Eye className="h-7 w-7" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
                            aria-label="Edit"
                          >
                            <Edit className="h-7 w-7" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(String(quotation.id))}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-7 w-7 text-red-500" />
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
                    <Button>Create quotation</Button>
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
