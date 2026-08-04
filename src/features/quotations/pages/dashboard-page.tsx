import {
  ArrowRight,
  FolderOpen,
  Layers,
  Plus,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { StatCard } from '../../../components/ui/stat-card'
import { Badge } from '../../../components/ui/badge'
import { formatCurrency, formatDate } from '../../../lib/utils'
import { useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import { useState } from 'react'
import type { Quotation } from '../../../types/quotation'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useQuotations()
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null)

  const total = quotations?.length ?? 0
  const categories = new Set(quotations?.map((q) => q.category?.trim() || 'Uncategorized')).size
  const recent = quotations?.slice(0, 5) ?? []
  const totalOptions = quotations?.reduce(
    (sum, q) => sum + Object.keys(q.unit_price_with_options).length,
    0,
  ) ?? 0

  const quickActions = [
    { label: 'New Quotation', icon: Plus, href: '/quotations/new', primary: true },
    { label: 'View All', icon: Receipt, href: '/quotations', primary: false },
    { label: 'Categories', icon: FolderOpen, href: '/categories', primary: false },
  ]

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <Badge>Guest Laundry Accounts</Badge>
        <h2 className="text-dashboard text-slate-900">
          Welcome back
        </h2>
        <p className="max-w-2xl text-body-lg text-slate-500">
          Manage pricing, review quotations, and keep your guest laundry operations running smoothly.
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)
        ) : (
          <>
            <StatCard
              label="Total Items"
              value={total}
              description="In price list"
              icon={<Receipt className="h-9 w-9" strokeWidth={1.5} />}
            />
            <StatCard
              label="Categories"
              value={categories}
              description="Active groups"
              icon={<FolderOpen className="h-9 w-9" strokeWidth={1.5} />}
            />
            <StatCard
              label="Service Types"
              value={totalOptions}
              description="Pricing options"
              icon={<Layers className="h-9 w-9" strokeWidth={1.5} />}
            />
            <StatCard
              label="Recent Updates"
              value={recent.length}
              description="Latest entries"
              icon={<TrendingUp className="h-9 w-9" strokeWidth={1.5} />}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map(({ label, icon: Icon, href, primary }) => (
              <Link key={href} to={href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-4 rounded-lg px-4 py-4 transition ${
                    primary
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-surface-border bg-white hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-9 w-9" strokeWidth={1.5} />
                  <span className="text-body-lg font-semibold">{label}</span>
                  <ArrowRight className="ml-auto h-6 w-6 opacity-60" />
                </motion.div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <p className="mt-1 text-body text-slate-500">Latest quotation updates</p>
            </div>
            <Link to="/quotations">
              <Button variant="secondary" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : recent.length ? (
              <div className="space-y-2">
                {recent.map((quotation, index) => (
                  <motion.button
                    key={quotation.id}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => setPreviewQuotation(quotation)}
                    className="flex w-full items-center justify-between rounded-lg border border-surface-border bg-white px-5 py-4 text-left transition hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <div>
                      <p className="text-body-lg font-semibold text-slate-900">{quotation.item_name}</p>
                      <p className="text-body text-slate-500">
                        {quotation.category} · {quotation.size} · {formatDate(quotation.updated_at ?? quotation.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-body font-semibold text-brand-600">
                        {Object.keys(quotation.unit_price_with_options).length} types
                      </span>
                      <ArrowRight className="h-6 w-6 text-slate-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No quotations yet"
                description="Create your first quotation to get started."
                action={<Button onClick={() => navigate('/quotations/new')}>Create quotation</Button>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <QuotationPreviewDialog
        quotation={previewQuotation}
        open={Boolean(previewQuotation)}
        onOpenChange={(open) => !open && setPreviewQuotation(null)}
      />
    </div>
  )
}
