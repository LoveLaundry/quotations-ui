import { Eye, FolderOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatCurrency } from '../../../lib/utils'
import { useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import type { Quotation } from '../../../types/quotation'

export default function CategoriesPage() {
  const { data, isLoading, isError, error } = useQuotations()
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const grouped = (data ?? []).reduce<Record<string, Quotation[]>>((acc, q) => {
      const cat = q.category?.trim() || 'Uncategorized'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(q)
      return acc
    }, {})
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))
  }, [data])

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Categories' }]} />
        <p className="text-body-lg text-slate-500">
          Browse quotations organized by category
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load categories'} />
      ) : categories.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {categories.map(([category, items], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <FolderOpen className="h-9 w-9" strokeWidth={1.5} />
                    </div>
                    <div>
                      <CardTitle>{category}</CardTitle>
                      <p className="text-body text-slate-500">{items.length} items</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  >
                    {expandedCategory === category ? 'Collapse' : 'Expand'}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(expandedCategory === category ? items : items.slice(0, 3)).map((quotation) => {
                      const types = Object.entries(quotation.unit_price_with_options)
                      return (
                        <button
                          key={quotation.id}
                          type="button"
                          onClick={() => setPreviewQuotation(quotation)}
                          className="flex w-full items-center justify-between rounded-lg border border-surface-border bg-white px-4 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/30"
                        >
                          <div>
                            <p className="text-body-lg font-semibold text-slate-900">{quotation.item_name}</p>
                            <p className="text-body text-slate-500">{quotation.size}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {types.map(([type, price]) => (
                                <span
                                  key={type}
                                  className="rounded-md bg-slate-100 px-2 py-0.5 text-sm text-slate-600"
                                >
                                  {type}: {formatCurrency(price)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Eye className="h-7 w-7 shrink-0 text-slate-400" />
                        </button>
                      )
                    })}
                    {!expandedCategory && items.length > 3 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(category)}
                        className="w-full rounded-lg py-2 text-body font-medium text-brand-600 hover:bg-brand-50"
                      >
                        Show {items.length - 3} more
                      </button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No categories yet"
          description="Categories will appear once you create quotations."
        />
      )}

      <QuotationPreviewDialog
        quotation={previewQuotation}
        open={Boolean(previewQuotation)}
        onOpenChange={(open) => !open && setPreviewQuotation(null)}
      />
    </div>
  )
}
