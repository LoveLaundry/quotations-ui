import { Edit, Eye, Search, Trash2, PlusCircle, ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Input } from '../../../components/ui/input'
import { Skeleton } from '../../../components/ui/skeleton'
import { useDeleteQuotation, useQuotations } from '../hooks/useQuotations'
import { formatCurrency, formatDate } from '../../../lib/utils'

const perPage = 5

export default function QuotationsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuotations()
  const deleteMutation = useDeleteQuotation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    const list = (data ?? []).filter((quotation) =>
      [quotation.item_name, quotation.size, Object.keys(quotation.unit_price_with_options).join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    return [...list].sort((a, b) => {
      const comparison = a.item_name.localeCompare(b.item_name)
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, search, sortDirection])

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <h3 className="text-lg font-semibold">Quotations library</h3>
            <p className="text-sm text-slate-500">Search, review, and manage your pricing records.</p>
          </div>
          <Button onClick={() => navigate('/quotations/new')}>
            <PlusCircle className="mr-2 h-4 w-4" /> New quote
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search by item or service" className="pl-9" />
            </div>
            <Button variant="secondary" onClick={() => setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'))}>
              <ArrowUpDown className="mr-2 h-4 w-4" /> Sort A-Z
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16" />)}
            </div>
          ) : isError ? (
            <div className="mt-4">
              <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotations'} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No quotations match your search" description="Adjust your filters or create a new quotation." />
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200/70 md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100/70 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 font-medium">Size</th>
                      <th className="px-4 py-3 font-medium">Options</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((quotation) => (
                      <tr key={quotation.id} className="border-t border-slate-200/70 bg-white/60 dark:border-slate-800 dark:bg-slate-950/30">
                        <td className="px-4 py-3 font-semibold">{quotation.item_name}</td>
                        <td className="px-4 py-3">{quotation.size}</td>
                        <td className="px-4 py-3">{Object.keys(quotation.unit_price_with_options).length}</td>
                        <td className="px-4 py-3">{formatDate(quotation.updated_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/quotations/${String(quotation.id)}`)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/quotations/${String(quotation.id)}/edit`)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(String(quotation.id))}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {paginated.map((quotation) => (
                  <div key={quotation.id} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{quotation.item_name}</p>
                        <p className="text-sm text-slate-500">{quotation.size}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotations/${String(quotation.id)}`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotations/${String(quotation.id)}/edit`)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(String(quotation.id))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                      <span>{Object.keys(quotation.unit_price_with_options).length} options</span>
                      <span>{formatCurrency(Object.values(quotation.unit_price_with_options).reduce((sum, value) => sum + value, 0))}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">Page {page} of {pageCount}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</Button>
                  <Button variant="secondary" size="sm" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
