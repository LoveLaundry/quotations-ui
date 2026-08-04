import { ArrowRight, PlusCircle, ReceiptText, TrendingUp, Wallet2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Skeleton } from '../../../components/ui/skeleton'
import { EmptyState } from '../../../components/ui/empty-state'
import { useQuotations } from '../hooks/useQuotations'
import { formatCurrency, formatDate } from '../../../lib/utils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useQuotations()

  const total = quotations?.length ?? 0
  const recent = quotations?.slice(0, 3) ?? []
  const estimatedValue = quotations?.reduce((sum, quote) => sum + Object.values(quote.unit_price_with_options).reduce((a, b) => a + b, 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-stone-200/80 bg-white/85 p-6 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge>Operations overview</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Create quotations that feel calm, clear, and professional.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Use this workspace to review quote activity, prepare new offers, and keep your pricing records in order.</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70">
            Connected to your live quotation service
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Compose new quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader className="space-y-2">
                <DialogTitle>Start a new quotation</DialogTitle>
                <p className="text-sm leading-6 text-slate-500">
                  Create a fresh quote for a client with the details and pricing structure you need.
                </p>
              </DialogHeader>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-sm text-slate-600">
                You will be taken to the quotation form to add the item, size, and pricing options.
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button onClick={() => navigate('/quotations/new')}>Continue</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Link to="/quotations">
            <Button variant="secondary">Open library</Button>
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
                <div key={quotation.id} className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
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
