import { ArrowRight, Building2, FileText, Plus, Receipt } from 'lucide-react'
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

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-[#F9FAFB] text-[#6B7280] border-[#E4E7EC]',
  sent: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  accepted: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  archived: 'bg-[#FAFAFA] text-[#9CA3AF] border-[#E4E7EC]',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useQuotations()
  const [preview, setPreview] = useState<Quotation | null>(null)

  const total = quotations?.length ?? 0
  const clients = new Set(quotations?.map(q => (q.client_name ?? '').trim()).filter(Boolean)).size
  const lineItems = quotations?.reduce((s, q) => s + (q.line_items?.length ?? 0), 0) ?? 0
  const recent = quotations?.slice(0, 6) ?? []

  return (
    <div className="space-y-5 pb-8 select-none">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Love Laundry · Medagama, Panirendawa
            </p>
          </div>
          <h1 className="text-dashboard-title">Dashboard</h1>
          <p className="text-page-subtitle">
            Hotel quotation management system — Registration No: 40-3064
          </p>
        </div>
        <Link to="/quotations/new" className="max-w-md w-full sm:w-auto">
          <Button size="lg" className="w-full shadow-lg shadow-red-600/20">
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-[110px] sm:h-[100px]" />)
        ) : (
          <>
            <StatCard
              label="Quotations"
              value={total}
              description="Total created"
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              label="Clients"
              value={clients}
              description="Hotels / venues"
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              label="Line Items"
              value={lineItems}
              description="Across all quotes"
              icon={<Receipt className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="border-b border-[#F2F4F7] pb-3">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-1.5">
            {[
              { label: 'New Quotation', icon: Plus, href: '/quotations/new', primary: true },
              { label: 'All Quotations', icon: FileText, href: '/quotations', primary: false },
              { label: 'By Client', icon: Building2, href: '/categories', primary: false },
            ].map(({ label, icon: Icon, href, primary }) => (
              <Link key={href} to={href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-100',
                    primary
                      ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                      : 'border border-[#E4E7EC] bg-white text-[#374151] hover:bg-[#F9FAFB]',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[13px] font-medium">{label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-40" />
                </motion.div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[#F2F4F7] pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
              <div>
                <CardTitle>Recent Quotations</CardTitle>
                <p className="text-[12px] text-[#98A2B3] mt-0.5">Latest hotel price lists</p>
              </div>
              <Link to="/quotations" className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-[60px] sm:h-[52px]" />
                ))}
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
                    className="group flex w-full items-center gap-3 sm:gap-4 rounded-lg border border-[#F2F4F7] bg-white px-3 sm:px-4 py-3 text-left hover:border-[#FECACA] hover:bg-[#FFF8F8] transition-all duration-100 cursor-pointer"
                  >
                    <div className="flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] border border-[#E4E7EC] text-[13px] sm:text-[12px] font-bold text-[#6B7280] group-hover:bg-[#FFF1F1] group-hover:text-[#DC2626] group-hover:border-[#FECACA] transition-all">
                      {(q.client_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] sm:text-[13px] font-semibold text-[#101828] truncate">
                        {q.client_name ?? '(no name)'}
                      </p>
                      <p className="text-[11px] text-[#98A2B3] mt-0.5">
                        {q.line_items?.length ?? 0} items · {formatDate(q.updated_at ?? q.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2 shrink-0">
                      {q.status && (
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap ${
                            STATUS_STYLE[q.status] ?? STATUS_STYLE.draft
                          }`}
                        >
                          {q.status}
                        </span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-[#D1D5DB] group-hover:text-[#DC2626] transition-colors hidden sm:block" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No quotations yet"
                description="Create your first hotel quotation to get started."
                action={
                  <Button onClick={() => navigate('/quotations/new')}>Create quotation</Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <QuotationPreviewDialog
        quotation={preview}
        open={Boolean(preview)}
        onOpenChange={o => !o && setPreview(null)}
      />
    </div>
  )
}
