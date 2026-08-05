import { ArrowRight, FolderOpen, Layers, Plus, Receipt, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { StatCard } from '../../../components/ui/stat-card'
import { formatDate } from '../../../lib/utils'
import { useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import type { Quotation } from '../../../types/quotation'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useQuotations()
  const [preview, setPreview] = useState<Quotation | null>(null)

  const total        = quotations?.length ?? 0
  const catCount     = new Set(quotations?.map(q => q.category?.trim() || 'Uncategorized')).size
  const recent       = quotations?.slice(0, 6) ?? []
  const totalOptions = quotations?.reduce((s, q) => s + Object.keys(q.unit_price_with_options).length, 0) ?? 0

  return (
    <div className="space-y-6 pb-10 select-none">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#98A2B3] uppercase tracking-widest mb-1">
            Guest Laundry · Love Laundry
          </p>
          <h1 className="text-dashboard-title">Dashboard</h1>
          <p className="mt-1 text-[13px] text-[#98A2B3]">
            Manage pricing, categories, and laundry service quotations.
          </p>
        </div>
        <Link to="/quotations/new" className="shrink-0">
          <Button size="lg">
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading
          ? [1,2,3,4].map(i => <Skeleton key={i} className="h-[88px]" />)
          : <>
              <StatCard label="Total Items"    value={total}        description="In price list"    icon={<Receipt    className="h-4 w-4" />} />
              <StatCard label="Categories"     value={catCount}     description="Active groups"    icon={<FolderOpen className="h-4 w-4" />} />
              <StatCard label="Service Types"  value={totalOptions} description="Pricing options"  icon={<Layers     className="h-4 w-4" />} />
              <StatCard label="Recent Updates" value={recent.length} description="Latest entries"  icon={<TrendingUp className="h-4 w-4" />} />
            </>
        }
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">

        {/* Quick actions */}
        <Card>
          <CardHeader className="border-b border-[#F2F4F7] pb-3">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-1.5">
            {[
              { label: 'New Quotation', icon: Plus,      href: '/quotations/new', primary: true  },
              { label: 'Price List',    icon: Receipt,   href: '/quotations',     primary: false },
              { label: 'Categories',   icon: FolderOpen, href: '/categories',     primary: false },
            ].map(({ label, icon: Icon, href, primary }) => (
              <Link key={href} to={href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-100',
                    primary
                      ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                      : 'border border-[#E4E7EC] bg-white text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[13px] font-medium">{label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                </motion.div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="border-b border-[#F2F4F7] pb-3">
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-[12px] text-[#98A2B3] mt-0.5">Latest quotation entries</p>
              </div>
              <Link to="/quotations"><Button variant="secondary" size="sm">View all</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-[52px]" />)}
              </div>
            ) : recent.length ? (
              <div className="space-y-1.5">
                {recent.map((q, i) => (
                  <motion.button
                    key={q.id}
                    type="button"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ x: 2 }}
                    onClick={() => setPreview(q)}
                    className="group flex w-full items-center gap-4 rounded-lg border border-[#F2F4F7] bg-white px-4 py-3 text-left hover:border-[#FECACA] hover:bg-[#FFF8F8] transition-all duration-100 cursor-pointer"
                  >
                    {/* Colour dot */}
                    <div className="h-2 w-2 rounded-full bg-[#DC2626] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#101828] truncate">{q.item_name}</p>
                      <p className="text-[11px] text-[#98A2B3] mt-0.5 truncate">
                        {q.category} · {q.size} · {formatDate(q.updated_at ?? q.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded-md bg-[#FFF1F1] border border-[#FECACA] px-1.5 py-0.5 text-[10px] font-semibold text-[#DC2626]">
                        {Object.keys(q.unit_price_with_options).length} types
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#D1D5DB] group-hover:text-[#DC2626] transition-colors" />
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
        quotation={preview}
        open={Boolean(preview)}
        onOpenChange={open => !open && setPreview(null)}
      />
    </div>
  )
}
