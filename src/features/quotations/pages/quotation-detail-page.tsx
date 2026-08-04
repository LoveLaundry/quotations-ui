import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { formatCurrency, formatDate } from '../../../lib/utils'
import { useQuotation } from '../hooks/useQuotations'

export default function QuotationDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: quotation, isLoading, isError, error } = useQuotation(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/quotations')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Link to={`/quotations/${String(id)}/edit`}>
          <Button>Edit quotation</Button>
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-48" />
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotation'} />
      ) : quotation ? (
        <>
          <Card>
            <CardHeader>
              <div>
                <Badge>Quotation details</Badge>
                <h3 className="mt-3 text-2xl font-semibold">{quotation.item_name}</h3>
                <p className="mt-1 text-sm text-slate-500">Prepared for {quotation.size} size requests.</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="mt-2 font-semibold">{formatDate(quotation.created_at)}</p>
                </div>
                <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
                  <p className="text-sm text-slate-500">Updated</p>
                  <p className="mt-2 font-semibold">{formatDate(quotation.updated_at)}</p>
                </div>
                <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
                  <p className="text-sm text-slate-500">Options</p>
                  <p className="mt-2 font-semibold">{Object.keys(quotation.unit_price_with_options).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <h3 className="text-lg font-semibold">Pricing table</h3>
                <p className="text-sm text-slate-500">Service options and their prices</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-stone-200/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50/80">
                    <tr>
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Unit price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(quotation.unit_price_with_options).map(([name, price]) => (
                      <tr key={name} className="border-t border-stone-200/70 bg-white/70">
                        <td className="px-4 py-3">{name}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState title="Quotation not found" description="The selected quotation may have been removed or does not exist." />
      )}
    </div>
  )
}
