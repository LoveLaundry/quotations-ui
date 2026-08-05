import { ArrowRight, FolderOpen, Layers, Plus, Receipt, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
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
import type { Quotation } from '../../../types/quotation'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useQuotations()
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null)

  const total = quotations?.length ?? 0
  const categories = new Set(quotations?.map((q) => q.category?.trim() || 'Uncategorized')).size
  const recent = quotations?.slice(0, 5) ?? []
  const totalOptions =
    quotations?.reduce((sum, q) => sum + Object.keys(q.unit_price_with_options).length, 0) ?? 0

  const quickActions = [
    { label: 'New Quotation', icon: Plus, href: '/quotations/new', primary: true },
    { label: 'View All', icon: Receipt, href: '/quotations', primary: false },
    { label: 'Categories', icon: FolderOpen, href: '/categories', primary: false },
  ]

  return (
    <div className="space-y-6 pb-10 select-none">
      {/* Welcome */}
      <section className="space-y-2">
        <Badge variant="secondary" className="text-[11px] font-bold text-red-600 bg-red-50 border-red-200">
          Guest Laundry Accounts
        </Badge>
        <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-[14px] text-slate-500 leading-relaxed max-w-xl">
          Manage pricing, review quotations, and keep your guest laundry operations running smoothly.
        </p>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Total Items"    value={total}        description="In price list"    icon={<Receipt   className="h-5 w-5" strokeWidth={1.75} />} />
            <StatCard label="Categories"     value={categories}   description="Active groups"    icon={<FolderOpen className="h-5 w-5" strokeWidth={1.75} />} />
            <StatCard label="Service Types"  value={totalOptions} description="Pricing options"  icon={<Layers    className="h-5 w-5" strokeWidth={1.75} />} />
            <StatCard label="Recent Updates" value={recent.length} description="Latest entries"  icon={<TrendingUp className="h-5 w-5" strokeWidth={1.75} />} />
          </>
        )}
      </div>

      {/* Quick actions + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Quick Actions */}
        <Card className="lg:col-span-4">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {quickActions.map(({ label, icon: Icon, href, primary }) => (
              <Link key={href} to={href} className="block">
                <motion.div
                  whileHover={{ x: 3 }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition duration-150 cursor-pointer ${
                    primary
                      ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/20 hover:bg-red-700'
                      : 'border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span className="text-[13px]">{label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-60" />
                </motion.div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-8">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="mt-0.5 text-[12px] text-slate-500">Latest quotation updates</p>
              </div>
              <Link to="/quotations">
                <Button variant="secondary" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : recent.length ? (
              <div className="space-y-2">
                {recent.map((quotation, index) => (
                  <motion.button
                    key={quotation.id}
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    whileHover={{ x: 3 }}
                    onClick={() => setPreviewQuotation(quotation)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition duration-150 hover:border-red-200 hover:bg-red-50/30 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 truncate">{quotation.item_name}</p>
                      <p className="text-[12px] text-slate-500 truncate">
                        {quotation.category} · {quotation.size} · {formatDate(quotation.updated_at ?? quotation.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[12px] font-bold text-red-600">
                        {Object.keys(quotation.unit_price_with_options).length} types
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
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
