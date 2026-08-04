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
    <div className="space-y-10 pb-16 select-none">
      <div className="space-y-3">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Categories' }]} />
        <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
          Categories
        </h1>
        <p className="text-[22px] font-medium text-slate-500">
          Browse quotations organized by category
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load categories'} />
      ) : categories.length ? (
        <div className="grid gap-8 md:grid-cols-2">
          {categories.map(([category, items], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-slate-200/90 shadow-sm luxury-card">
                <CardHeader className="border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100 shadow-xs">
                      <FolderOpen className="h-9 w-9 icon-36" strokeWidth={1.75} />
                    </div>
                    <div>
                      <CardTitle className="text-card-title font-extrabold text-slate-900">{category}</CardTitle>
                      <p className="text-[18px] text-slate-500 font-semibold pt-0.5">{items.length} items</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="font-bold text-[18px]"
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  >
                    {expandedCategory === category ? 'Collapse' : 'Expand'}
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {(expandedCategory === category ? items : items.slice(0, 3)).map((quotation) => {
                      const types = Object.entries(quotation.unit_price_with_options)
                      return (
                        <button
                          key={quotation.id}
                          type="button"
                          onClick={() => setPreviewQuotation(quotation)}
                          className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left transition duration-200 hover:border-red-200 hover:bg-red-50/20 cursor-pointer shadow-xs group"
                        >
                          <div>
                            <p className="text-[22px] font-bold text-slate-900 group-hover:text-red-600 transition">
                              {quotation.item_name}
                            </p>
                            <p className="text-[17px] font-medium text-slate-500 pt-0.5">{quotation.size}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {types.map(([type, price]) => (
                                <span
                                  key={type}
                                  className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1 text-[16px] font-semibold text-slate-700"
                                >
                                  {type}: {formatCurrency(price)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Eye className="h-7 w-7 shrink-0 text-slate-400 group-hover:text-slate-900" />
                        </button>
                      )
                    })}
                    {!expandedCategory && items.length > 3 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(category)}
                        className="w-full rounded-2xl py-3 text-[20px] font-bold text-red-600 hover:bg-red-50 transition border border-dashed border-red-200 cursor-pointer"
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
