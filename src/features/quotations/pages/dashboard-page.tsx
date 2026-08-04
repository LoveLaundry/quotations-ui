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
import { formatDate } from '../../../lib/utils'
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
    <div className="space-y-12 pb-16 select-none">
      {/* Top Banner / Welcome Section */}
      <section className="space-y-4">
        <Badge variant="secondary" className="px-4 py-1.5 text-[17px] font-bold text-red-600 bg-red-50 border-red-200">
          Guest Laundry Accounts
        </Badge>
        <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="max-w-3xl text-[22px] font-medium text-slate-500 leading-relaxed">
          Manage pricing, review quotations, and keep your guest laundry operations running smoothly.
        </p>
      </section>

      {/* 4 Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)
        ) : (
          <>
            <StatCard
              label="Total Items"
              value={total}
              description="In price list"
              icon={<Receipt className="h-9 w-9 icon-36" strokeWidth={1.75} />}
            />
            <StatCard
              label="Categories"
              value={categories}
              description="Active groups"
              icon={<FolderOpen className="h-9 w-9 icon-36" strokeWidth={1.75} />}
            />
            <StatCard
              label="Service Types"
              value={totalOptions}
              description="Pricing options"
              icon={<Layers className="h-9 w-9 icon-36" strokeWidth={1.75} />}
            />
            <StatCard
              label="Recent Updates"
              value={recent.length}
              description="Latest entries"
              icon={<TrendingUp className="h-9 w-9 icon-36" strokeWidth={1.75} />}
            />
          </>
        )}
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Quick Actions Card */}
        <Card className="lg:col-span-4 border border-slate-200/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-5">
            <CardTitle className="text-card-title font-extrabold text-slate-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {quickActions.map(({ label, icon: Icon, href, primary }) => (
              <Link key={href} to={href} className="block">
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-4 rounded-2xl px-6 py-5 transition duration-200 cursor-pointer ${
                    primary
                      ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/20 hover:bg-red-700'
                      : 'border border-slate-200/90 bg-white text-slate-800 font-semibold hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-9 w-9 shrink-0 icon-36" strokeWidth={1.75} />
                  <span className="text-[22px]">{label}</span>
                  <ArrowRight className="ml-auto h-7 w-7 opacity-70" />
                </motion.div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="lg:col-span-8 border border-slate-200/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="text-card-title font-extrabold text-slate-900">
                  Recent Activity
                </CardTitle>
                <p className="mt-1 text-[18px] font-medium text-slate-500">Latest quotation updates</p>
              </div>
              <Link to="/quotations">
                <Button variant="secondary" size="sm" className="font-semibold text-[18px]">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : recent.length ? (
              <div className="space-y-3">
                {recent.map((quotation, index) => (
                  <motion.button
                    key={quotation.id}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => setPreviewQuotation(quotation)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left transition duration-200 hover:border-red-200 hover:bg-red-50/20 cursor-pointer shadow-xs"
                  >
                    <div>
                      <p className="text-[22px] font-bold text-slate-900">{quotation.item_name}</p>
                      <p className="text-[18px] font-medium text-slate-500 pt-0.5">
                        {quotation.category} · {quotation.size} · {formatDate(quotation.updated_at ?? quotation.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[18px] font-bold text-red-600">
                        {Object.keys(quotation.unit_price_with_options).length} types
                      </span>
                      <ArrowRight className="h-7 w-7 text-slate-400" />
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
