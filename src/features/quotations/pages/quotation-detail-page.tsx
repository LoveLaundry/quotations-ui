import { ArrowLeft, CalendarDays, Edit, Layers3 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Badge } from '../../../components/ui/badge'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { formatCurrency, formatDate } from '../../../lib/utils'
import { useQuotation } from '../hooks/useQuotations'

export default function QuotationDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: quotation, isLoading, isError, error } = useQuotation(id)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/' },
              { label: 'Quotations', href: '/quotations' },
              { label: quotation?.item_name ?? 'Details' },
            ]}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="mr-2 h-7 w-7" /> Back
          </Button>
          <Link to={`/quotations/${String(id)}/edit`}>
            <Button>
              <Edit className="mr-2 h-7 w-7" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load quotation'} />
      ) : quotation ? (
        <>
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>{quotation.category}</Badge>
                  <Badge variant="secondary">{quotation.size}</Badge>
                </div>
                <CardTitle>{quotation.item_name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-surface-border bg-slate-50/50 p-5">
                  <div className="flex items-center gap-3 text-brand-600">
                    <Layers3 className="h-8 w-8" />
                    <span className="text-body font-semibold">Service Types</span>
                  </div>
                  <p className="mt-3 text-dashboard text-slate-900">
                    {Object.keys(quotation.unit_price_with_options).length}
                  </p>
                </div>
                <div className="rounded-lg border border-surface-border bg-slate-50/50 p-5">
                  <div className="flex items-center gap-3 text-brand-600">
                    <CalendarDays className="h-8 w-8" />
                    <span className="text-body font-semibold">Created</span>
                  </div>
                  <p className="mt-3 text-body-lg font-semibold text-slate-900">
                    {formatDate(quotation.created_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-surface-border bg-slate-50/50 p-5">
                  <div className="flex items-center gap-3 text-brand-600">
                    <CalendarDays className="h-8 w-8" />
                    <span className="text-body font-semibold">Updated</span>
                  </div>
                  <p className="mt-3 text-body-lg font-semibold text-slate-900">
                    {formatDate(quotation.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing by Service Type</CardTitle>
              <p className="text-body text-slate-500">All available service types and their unit prices</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Service Type</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(quotation.unit_price_with_options).map(([type, price]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <span className="font-semibold text-slate-900">{type}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-body-lg font-semibold text-brand-600">
                          {formatCurrency(price)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          title="Quotation not found"
          description="The selected quotation may have been removed."
          action={<Button onClick={() => navigate('/quotations')}>Back to list</Button>}
        />
      )}
    </div>
  )
}
