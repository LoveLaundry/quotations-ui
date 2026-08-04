import { ArrowRight, ReceiptText, TrendingUp, Wallet2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { EmptyState } from '../../../components/ui/empty-state'
import { useQuotations } from '../hooks/useQuotations'
import { formatCurrency, formatDate } from '../../../lib/utils'

export default function DashboardPage() {
  const { data: quotations, isLoading } = useQuotations()

  const total = quotations?.length ?? 0
  const recent = quotations?.slice(0, 3) ?? []
  const estimatedValue = quotations?.reduce((sum, quote) => sum + Object.values(quote.unit_price_with_options).reduce((a, b) => a + b, 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-rose-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,245,247,0.85))] p-6 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.24)] backdrop-blur-xl dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.85))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Premium Admin Dashboard</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Track quotations with clarity and speed.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Create, review, and refine pricing offers from one polished workspace built for your team.</p>
          </div>
          <Link to="/quotations/new">
            <Button>Compose new quotation</Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />)
        ) : (
          <>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Total quotations</p>
                  <ReceiptText className="h-5 w-5 text-rose-600" />
                </div>
                <div className="mt-4 text-3xl font-semibold">{total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Estimated value</p>
                  <Wallet2 className="h-5 w-5 text-rose-600" />
                </div>
                <div className="mt-4 text-3xl font-semibold">{formatCurrency(estimatedValue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Recent activity</p>
                  <TrendingUp className="h-5 w-5 text-rose-600" />
                </div>
                <div className="mt-4 text-3xl font-semibold">{recent.length}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <h3 className="text-lg font-semibold">Recent quotations</h3>
            <p className="text-sm text-slate-500">Freshly prepared pricing snapshots</p>
          </div>
          <Link to="/quotations">
            <Button variant="secondary">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16" />)}
            </div>
          ) : quotations?.length ? (
            <div className="space-y-3">
              {recent.map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between rounded-2xl border border-rose-100/80 bg-white/80 p-4 shadow-sm">
                  <div>
                    <p className="font-medium">{quotation.item_name}</p>
                    <p className="text-sm text-slate-500">{quotation.size} • {formatDate(quotation.created_at)}</p>
                  </div>
                  <Link to={`/quotations/${quotation.id}`} className="text-sm font-semibold text-rose-600">
                    Open <ArrowRight className="ml-1 inline h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No quotations yet" description="Your first quotation will appear here once you create it." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
