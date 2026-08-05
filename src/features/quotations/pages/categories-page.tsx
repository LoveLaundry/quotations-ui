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
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  return (
    <div className="space-y-5 pb-10 select-none">
      <div className="space-y-1">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Categories' }]} />
        <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">Categories</h1>
        <p className="text-[13px] text-slate-500">Browse quotations organised by category</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load categories'} />
      ) : categories.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map(([category, items], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
            >
              <Card className="luxury-card h-full">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                      <FolderOpen className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{category}</CardTitle>
                      <p className="text-[12px] text-slate-500 mt-0.5">{items.length} items</p>
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

                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {(expandedCategory === category ? items : items.slice(0, 3)).map((quotation) => {
                      const types = Object.entries(quotation.unit_price_with_options)
                      return (
                        <button
                          key={quotation.id}
                          type="button"
                          onClick={() => setPreviewQuotation(quotation)}
                          className="flex w-full items-start justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-red-200 hover:bg-red-50/20 cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-900 group-hover:text-red-600 transition truncate">
                              {quotation.item_name}
                            </p>
                            <p className="text-[11px] text-slate-500">{quotation.size}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {types.map(([type, price]) => (
                                <span key={type} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                                  {type}: {formatCurrency(price)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Eye className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-red-500 ml-2 mt-0.5" />
                        </button>
                      )
                    })}

                    {expandedCategory !== category && items.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(category)}
                        className="w-full rounded-xl py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition border border-dashed border-red-200 cursor-pointer"
                      >
                        Show {items.length - 3} more
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState title="No categories yet" description="Categories will appear once you create quotations." />
      )}

      <QuotationPreviewDialog
        quotation={previewQuotation}
        open={Boolean(previewQuotation)}
        onOpenChange={(open) => !open && setPreviewQuotation(null)}
      />
    </div>
  )
}
