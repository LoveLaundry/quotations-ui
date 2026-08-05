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
  const [preview, setPreview]               = useState<Quotation | null>(null)
  const [expanded, setExpanded]             = useState<string | null>(null)

  const categories = useMemo(() => {
    const g = (data ?? []).reduce<Record<string, Quotation[]>>((acc, q) => {
      const cat = q.category?.trim() || 'Uncategorized'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(q)
      return acc
    }, {})
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  return (
    <div className="space-y-5 pb-10 select-none">
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Categories' }]} />
        <h1 className="text-dashboard-title mt-1">Categories</h1>
        <p className="text-[13px] text-[#98A2B3] mt-0.5">Browse quotations organised by service category</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load categories'} />
      ) : categories.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map(([cat, items], idx) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.25) }}
            >
              <Card className="h-full">
                <CardHeader className="border-b border-[#F2F4F7] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA]">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{cat}</CardTitle>
                      <p className="text-[11px] text-[#98A2B3] mt-0.5">{items.length} items</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm"
                    onClick={() => setExpanded(expanded === cat ? null : cat)}
                  >
                    {expanded === cat ? 'Less' : 'More'}
                  </Button>
                </CardHeader>

                <CardContent className="pt-3">
                  <div className="space-y-1.5">
                    {(expanded === cat ? items : items.slice(0, 3)).map(q => (
                      <button
                        key={q.id} type="button"
                        onClick={() => setPreview(q)}
                        className="group flex w-full items-start justify-between rounded-lg border border-[#E4E7EC] bg-white p-3 text-left transition-all duration-100 hover:border-[#FECACA] hover:bg-[#FFF8F8] cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#101828] group-hover:text-[#DC2626] truncate transition-colors">
                            {q.item_name}
                          </p>
                          <p className="text-[11px] text-[#98A2B3]">{q.size}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {Object.entries(q.unit_price_with_options).map(([t, p]) => (
                              <span key={t} className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium text-[#374151]">
                                {t}: {formatCurrency(p)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Eye className="h-3.5 w-3.5 shrink-0 ml-2 mt-0.5 text-[#D1D5DB] group-hover:text-[#DC2626] transition-colors" />
                      </button>
                    ))}

                    {expanded !== cat && items.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(cat)}
                        className="w-full rounded-lg border border-dashed border-[#E4E7EC] py-2 text-[12px] font-medium text-[#6B7280] hover:border-[#FECACA] hover:text-[#DC2626] hover:bg-[#FFF8F8] transition-all cursor-pointer"
                      >
                        + {items.length - 3} more items
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState title="No categories yet" description="Categories appear once you create quotations." />
      )}

      <QuotationPreviewDialog quotation={preview} open={Boolean(preview)} onOpenChange={o => !o && setPreview(null)} />
    </div>
  )
}
