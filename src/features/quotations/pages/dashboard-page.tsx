import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, DollarSign, Wallet, AlertTriangle, TrendingUp,
  ClipboardList, Users, Package, Clock,
  Download, Activity, ArrowUpRight, ArrowDownRight,
  BarChart3, Target, Layers, Timer, Eye,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, AreaChart, Area, Bar,
  PieChart, Pie, Cell, Legend, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from 'recharts'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { useDashboardOverview, type DashboardOverviewData, type DashboardPeriod } from '../hooks/useBusinessDashboard'
import { reports } from '../services/reports.service'
import { BalancesPopup } from '../components/balances-popup'
import { toast } from 'sonner'

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
]

function pctChange(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? '+100%' : '0%'
  const pct = ((cur - prev) / Math.max(1, prev)) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`
}

function fmt(lkr: number) {
  if (lkr >= 1_000_000) return `${(lkr / 1_000_000).toFixed(1)}M`
  if (lkr >= 1_000) return `${(lkr / 1_000).toFixed(1)}K`
  return lkr.toFixed(0)
}

function ActionIcon({ action }: { action: string }) {
  const a = (action || '').toUpperCase()
  const cfg = a.includes('CREATE') || a.includes('ADD')
    ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
    : a.includes('UPDATE') || a.includes('EDIT') || a.includes('BILL_EDIT')
      ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
      : a.includes('DELETE') || a.includes('REMOVE') || a.includes('CANCEL')
        ? 'bg-[#FFF1F1] text-[#DC2626] border-[#FECACA]'
        : a.includes('PAYMENT')
          ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
          : 'bg-[#F9FAFB] text-[#6B7280] border-[#E4E7EC]'
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg}`}>{a}</span>
}

function fmtTimeAgo(ts: string | null) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCards({ data }: { data: DashboardOverviewData }) {
  const { current: c, previous: p } = data
  const kpis = [
    { label: 'Revenue', value: `LKR ${fmt(c.revenue)}`, trend: pctChange(c.revenue, p.revenue), icon: DollarSign, accent: '#DC2626' },
    { label: 'Collected', value: `LKR ${fmt(c.collected)}`, trend: pctChange(c.collected, p.collected), icon: Wallet, accent: '#16A34A' },
    { label: 'Outstanding', value: `LKR ${fmt(c.outstanding)}`, trend: pctChange(c.outstanding, p.outstanding), icon: AlertTriangle, accent: '#D97706' },
    { label: 'Collection Rate', value: `${c.collectionRate.toFixed(1)}%`, trend: pctChange(c.collectionRate, p.collectionRate), icon: TrendingUp, accent: '#2563EB' },
    { label: 'Gate Passes', value: c.gatePasses, trend: pctChange(c.gatePasses, p.gatePasses), icon: ClipboardList, accent: '#7C3AED' },
    { label: 'Active Clients', value: c.activeClients, trend: pctChange(c.activeClients, p.activeClients), icon: Users, accent: '#0891B2' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{k.label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${k.accent}10`, color: k.accent }}>
                <k.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{k.value}</p>
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold mt-2 ${k.trend.startsWith('+') || (!k.trend.startsWith('-') && k.trend !== '0%') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : k.trend.startsWith('-') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
              {k.trend}
            </span>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ── Charts Row ───────────────────────────────────────────────────────────────

function ChartsRow({ data }: { data: DashboardOverviewData }) {
  const series = data.current.revenueSeries || []
  const pieData = (data.current.paymentStatus || []).filter(s => s.value > 0)

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      {/* Revenue vs Collection */}
      <Card>
        <CardHeader className="border-b border-[var(--border)] pb-3">
          <CardTitle className="text-[14px]">Revenue vs Collection</CardTitle>
        </CardHeader>
        <CardContent className="pt-4" style={{ height: 260 }}>
          {series.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  formatter={(v: number) => [`LKR ${v.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#DC2626" fill="url(#gradRevenue)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="collected" stroke="#16A34A" fill="url(#gradCollected)" strokeWidth={2} name="Collected" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Status Donut */}
      <Card>
        <CardHeader className="border-b border-[var(--border)] pb-3">
          <CardTitle className="text-[14px]">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4" style={{ height: 260 }}>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No bills yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {pieData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  formatter={(v: number) => [`LKR ${v.toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Tables Row ───────────────────────────────────────────────────────────────

function TablesRow({ data }: { data: DashboardOverviewData }) {
  const topClients = (data.current.topClients || []).slice(0, 5)
  const pendingGPs = (data.current.pendingGatePasses || []).slice(0, 5)
  const maxRevenue = Math.max(...topClients.map(c => c.revenue), 1)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Top Clients */}
      <Card>
        <CardHeader className="border-b border-[var(--border)] pb-3">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Users className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> Top Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          {topClients.length === 0 ? (
            <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No client data yet</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  {['Client', 'Revenue', 'Outstanding', 'Bills'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {topClients.map((c, i) => (
                  <motion.tr key={c.client_name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-[var(--surface-hover)]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1F1] border border-[#FECACA] text-[11px] font-bold text-[#DC2626]">
                          {c.client_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate max-w-[140px]">{c.client_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">LKR {fmt(c.revenue)}</span>
                        <div className="h-1.5 flex-1 bg-[var(--border)] rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full bg-[#DC2626] rounded-full" style={{ width: `${(c.revenue / maxRevenue) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#D97706] font-semibold">LKR {fmt(c.outstanding)}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--text-tertiary)' }}>{c.bills}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pending Deliveries */}
      <Card>
        <CardHeader className="border-b border-[var(--border)] pb-3">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Package className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> Pending Delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          {pendingGPs.length === 0 ? (
            <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>All deliveries are up to date</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingGPs.map((gp, i) => (
                <motion.div
                  key={gp.gate_pass_number}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold">{gp.gate_pass_number}</span>
                      <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{gp.client_name}</span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">
                      {gp.pending} pending
                    </span>
                  </div>
                  {gp.items && gp.items.length > 0 && (
                    <div className="ml-2 space-y-1">
                      {gp.items.map((item) => (
                        <div key={`${item.item_name}-${item.specification}`} className="flex items-center gap-2 text-[12px]">
                          <span className="font-medium">{item.item_name}</span>
                          {item.specification && (
                            <span className="inline-flex items-center rounded bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB]">
                              {item.specification}
                            </span>
                          )}
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            {item.delivered}/{item.received} delivered
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Alerts ───────────────────────────────────────────────────────────────────

function AlertBanners({ data }: { data: DashboardOverviewData }) {
  if (data.alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {data.alerts.map(a => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] ${
            a.severity === 'high' ? 'bg-[#FFF1F1] border-[#FECACA] text-[#991B1B]' :
            a.severity === 'medium' ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]' :
            'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
          }`}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  )
}

// ── Recent Activity ──────────────────────────────────────────────────────────

function ActivityTimeline({ data }: { data: DashboardOverviewData }) {
  if (data.activity.length === 0) return null

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Activity className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> Recent Activity
          </CardTitle>
          <Link to="/reports" className="text-[12px] font-medium hover:underline" style={{ color: 'var(--text-tertiary)' }}>
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-[var(--border)]">
          {data.activity.map((a, i) => (
            <motion.div
              key={a.id || i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 py-2.5"
            >
              <ActionIcon action={a.action} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] truncate">
                  <span className="font-medium">{a.user_id}</span>
                  {' '}
                  <span style={{ color: 'var(--text-tertiary)' }}>{a.action.toLowerCase().replace(/_/g, ' ')}</span>
                  {' '}
                  {a.entity && <span className="font-medium">{a.entity}</span>}
                </p>
              </div>
              <span className="text-[11px] shrink-0 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Clock className="h-3 w-3" />
                {fmtTimeAgo(a.timestamp)}
              </span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Balances Overview ────────────────────────────────────────────────────────

function BalancesOverview({ data, onShowDetails }: { data: DashboardOverviewData; onShowDetails: () => void }) {
  const { current: c } = data
  const totalRevenue = c.revenue
  const totalCollected = c.collected
  const totalOutstanding = c.outstanding
  const collectedPct = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0
  const outstandingPct = totalRevenue > 0 ? (totalOutstanding / totalRevenue) * 100 : 0

  const clients = (data.clientWise || [])
    .filter(cl => cl.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 8)
  const maxClientOutstanding = Math.max(...clients.map(c => c.outstanding), 1)

  return (
    <Card className="overflow-hidden">
      {/* Hero banner */}
      <div className="px-6 py-5 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Total Outstanding</p>
            <p className="text-[36px] font-extrabold leading-tight tracking-tight text-gray-900">
              LKR {totalOutstanding.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="flex gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Collected</p>
              <p className="text-[20px] font-bold text-gray-900">LKR {fmt(totalCollected)}</p>
              <p className="text-[11px] text-gray-500 font-semibold">{collectedPct.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pending</p>
              <p className="text-[20px] font-bold text-gray-900">LKR {fmt(totalOutstanding)}</p>
              <p className="text-[11px] text-gray-500 font-semibold">{outstandingPct.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Bills</p>
              <p className="text-[20px] font-bold text-gray-900">{c.billCount}</p>
              <p className="text-[11px] text-gray-500">{c.paidBills} paid</p>
            </div>
          </div>
        </div>
        {/* Visual bar */}
        <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${collectedPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gray-600 rounded-l-full"
            title="Collected"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${outstandingPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full bg-gray-400"
            title="Outstanding"
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-gray-500">
          <span>Collected {collectedPct.toFixed(0)}%</span>
          <span>Outstanding {outstandingPct.toFixed(0)}%</span>
        </div>
        {totalOutstanding > 0 && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={onShowDetails}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              View Full Details
            </button>
          </div>
        )}
      </div>

      {/* Per-client breakdown */}
      {clients.length > 0 && (
        <CardContent className="pt-4">
          <p className="text-[13px] font-semibold mb-3 text-gray-500">Outstanding by Client</p>
          <div className="space-y-4">
            {clients.map((cl, i) => {
              const barPct = (cl.outstanding / maxClientOutstanding) * 100
              const specColors = ['#7C3AED', '#0891B2', '#059669', '#D946EF', '#EA580C', '#4F46E5']
              return (
                <motion.div
                  key={cl.client_name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-gray-600">
                        {cl.client_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-semibold truncate text-gray-900">{cl.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-bold text-gray-900">
                        LKR {cl.outstanding.toLocaleString()}
                      </span>
                      {cl.total_billed > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600">
                          {((cl.outstanding / Math.max(1, cl.total_billed)) * 100).toFixed(0)}% of bill
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="h-full rounded-full bg-gray-500"
                    />
                  </div>
                  {/* Pending items with specs */}
                  {cl.items && cl.items.length > 0 && (
                    <div className="ml-9 space-y-1">
                      {cl.items.map((item, j) => (
                        <div key={`${item.item_name}-${item.specification}`} className="flex items-center gap-2 text-[12px]">
                          <span className="font-medium">{item.item_name}</span>
                          {item.specification && (
                            <span
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                              style={{ backgroundColor: specColors[j % specColors.length] }}
                            >
                              {item.specification}
                            </span>
                          )}
                          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            {item.delivered}/{item.received}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-600">
                            {item.pending} pending
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ── Today's Deliveries ────────────────────────────────────────────────────────

const SPEC_COLORS = ['#7C3AED', '#0891B2', '#059669', '#D946EF', '#EA580C', '#4F46E5', '#DC2626', '#0D9488']

function TodayDeliveries({ data }: { data: DashboardOverviewData }) {
  const clients = data.todayDeliveries || []
  const totalDelivered = clients.reduce((s, c) => s + c.total_qty, 0)

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b border-gray-100 pb-3">
          <CardTitle className="text-[15px] font-semibold text-gray-900">Today's Deliveries</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-[13px] text-gray-400">No deliveries today yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-gray-900">Today's Deliveries</h3>
        <span className="text-[12px] font-semibold text-gray-900">{totalDelivered.toLocaleString()} pcs delivered</span>
      </div>
      {clients.map((client, i) => {
        const totalPending = client.pending_items?.reduce((s, p) => s + p.pending, 0) || 0
        const allItems = new Map<string, { item_name: string; specification: string; sentToday: number; pending: number; returned: number }>()
        for (const item of client.delivered_items) {
          const dk = `${item.item_name}||${item.specification}`
          const existing = allItems.get(dk)
          if (existing) existing.sentToday += item.quantity
          else allItems.set(dk, { item_name: item.item_name, specification: item.specification, sentToday: item.quantity, pending: 0, returned: 0 })
        }
        for (const p of client.pending_items || []) {
          const dk = `${p.item_name}||${p.specification}`
          const existing = allItems.get(dk)
          if (existing) {
            existing.pending = p.pending
            existing.returned = p.returned || 0
          } else {
            allItems.set(dk, { item_name: p.item_name, specification: p.specification, sentToday: 0, pending: p.pending, returned: p.returned || 0 })
          }
        }
        const rows = Array.from(allItems.values())

        return (
          <motion.div
            key={client.client_name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="overflow-hidden">
              {/* Client header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50/80 border-b border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-gray-700">
                    {client.client_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[14px] font-semibold text-gray-900">{client.client_name}</span>
                </div>
                <div className="flex items-center gap-4 text-[12px]">
                  <span className="text-gray-500">Sent today: <span className="font-semibold text-gray-900">{client.total_qty}</span></span>
                  {totalPending > 0 && (
                    <span className="text-gray-500">Pending: <span className="font-semibold text-gray-900">{totalPending}</span></span>
                  )}
                </div>
              </div>
              {/* Table */}
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-[40%]">Item</th>
                    <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-[18%]">Specification</th>
                    <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-[14%] text-center">Sent Today</th>
                    <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-[14%] text-center">Returned</th>
                    <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-[14%] text-center">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, j) => (
                    <tr key={`${row.item_name}-${row.specification}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                      <td className="px-5 py-2.5 text-[13px] font-medium text-gray-900">{row.item_name}</td>
                      <td className="px-5 py-2.5">
                        {row.specification ? (
                          <span
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: SPEC_COLORS[j % SPEC_COLORS.length] }}
                          >
                            {row.specification}
                          </span>
                        ) : (
                          <span className="text-[12px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-[13px] font-semibold text-gray-900 text-center">{row.sentToday > 0 ? row.sentToday : '—'}</td>
                      <td className={`px-5 py-2.5 text-[13px] font-semibold text-center ${row.returned > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {row.returned > 0 ? row.returned : '—'}
                      </td>
                      <td className={`px-5 py-2.5 text-[13px] font-semibold text-center ${row.pending > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {row.pending > 0 ? row.pending : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Period Comparison ────────────────────────────────────────────────────────

function PeriodComparison({ data }: { data: DashboardOverviewData }) {
  const { current: c, previous: p } = data
  const comparisons = [
    { label: 'Revenue', cur: c.revenue, prev: p.revenue, format: 'lkr' as const },
    { label: 'Collected', cur: c.collected, prev: p.collected, format: 'lkr' as const },
    { label: 'Outstanding', cur: c.outstanding, prev: p.outstanding, format: 'lkr' as const, invert: true },
    { label: 'Avg Bill', cur: c.avgBill, prev: p.avgBill, format: 'lkr' as const },
    { label: 'Bills', cur: c.billCount, prev: p.billCount, format: 'num' as const },
    { label: 'Clients', cur: c.activeClients, prev: p.activeClients, format: 'num' as const },
  ]

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Timer className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> Period Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {comparisons.map((cmp) => {
            const diff = cmp.prev === 0 ? (cmp.cur > 0 ? 100 : 0) : ((cmp.cur - cmp.prev) / Math.max(1, cmp.prev)) * 100
            const improved = cmp.invert ? diff < 0 : diff > 0
            const val = cmp.format === 'lkr' ? `LKR ${fmt(cmp.cur)}` : cmp.cur.toString()
            return (
              <div key={cmp.label} className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>{cmp.label}</p>
                <p className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>{val}</p>
                <div className={`inline-flex items-center gap-0.5 mt-1 text-[11px] font-semibold ${improved ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {improved ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(diff).toFixed(0)}% vs prev
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Item Analytics ───────────────────────────────────────────────────────────

function ItemAnalytics({ data }: { data: DashboardOverviewData }) {
  const items = (data.itemWise || []).slice(0, 8)
  const maxReceived = Math.max(...items.map(i => i.total_received), 1)

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Layers className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> Item Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">
        {items.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No item data yet</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="border-b border-[var(--border)]">
              <tr>
                {['Item', 'Received', 'Delivered', 'Pending', 'Clients'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item, i) => (
                <motion.tr key={item.item_name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-[var(--surface-hover)]">
                  <td className="px-3 py-2.5 font-medium">{item.item_name}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.total_received}</span>
                      <div className="h-1.5 flex-1 bg-[var(--border)] rounded-full overflow-hidden max-w-[60px]">
                        <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${(item.total_received / maxReceived) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[#16A34A] font-semibold">{item.total_delivered}</td>
                  <td className="px-3 py-2.5">
                    {item.pending > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">{item.pending}</span>
                    ) : (
                      <span className="text-[#16A34A]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--text-tertiary)' }}>{item.client_count}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

// ── Outstanding Aging ────────────────────────────────────────────────────────

function OutstandingAgingChart({ data }: { data: DashboardOverviewData }) {
  const aging = data.aging
  const total = aging.current + aging['30_day'] + aging['60_day'] + aging['90_day'] + aging.over_90

  const bars = [
    { label: 'Current', value: aging.current, color: '#16A34A' },
    { label: '1-30 days', value: aging['30_day'], color: '#F59E0B' },
    { label: '31-60 days', value: aging['60_day'], color: '#F97316' },
    { label: '61-90 days', value: aging['90_day'], color: '#EF4444' },
    { label: '90+ days', value: aging.over_90, color: '#991B1B' },
  ]

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <BarChart3 className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> Outstanding Aging
          </CardTitle>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>LKR {fmt(total)}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {total === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No outstanding bills</div>
        ) : (
          <div className="space-y-3">
            {bars.map((b) => {
              const pct = total > 0 ? (b.value / total) * 100 : 0
              return (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium">{b.label}</span>
                    <span className="text-[12px] font-semibold">LKR {fmt(b.value)} <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Quotation Funnel ─────────────────────────────────────────────────────────

function QuotationFunnel({ data }: { data: DashboardOverviewData }) {
  const { current: c } = data
  const total = c.quotationsDraft + c.quotationsSent + c.quotationsAccepted
  const stages = [
    { label: 'Draft', count: c.quotationsDraft, color: '#6B7280', bg: '#F9FAFB' },
    { label: 'Sent', count: c.quotationsSent, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Accepted', count: c.quotationsAccepted, color: '#16A34A', bg: '#F0FDF4' },
  ]

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Target className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> Quotation Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {total === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No quotations yet</div>
        ) : (
          <div className="space-y-3">
            {stages.map((s, i) => {
              const pct = total > 0 ? (s.count / total) * 100 : 0
              const width = Math.max(pct, 8)
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-16 text-right text-[12px] font-medium" style={{ color: s.color }}>{s.label}</span>
                  <div className="flex-1 flex items-center">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="h-8 rounded-lg flex items-center px-3"
                      style={{ backgroundColor: s.bg, border: `1px solid ${s.color}20` }}
                    >
                      <span className="text-[13px] font-bold" style={{ color: s.color }}>{s.count}</span>
                    </motion.div>
                  </div>
                  <span className="text-[12px] w-12 text-right" style={{ color: 'var(--text-tertiary)' }}>{pct.toFixed(0)}%</span>
                </div>
              )
            })}
            {c.quotationAcceptedValue > 0 && (
              <div className="pt-2 border-t border-[var(--border)] text-center">
                <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Accepted Value: </span>
                <span className="text-[14px] font-bold text-[#16A34A]">LKR {fmt(c.quotationAcceptedValue)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── 12-Month Trend ───────────────────────────────────────────────────────────

function YearlyTrendChart({ data }: { data: DashboardOverviewData }) {
  const trend = data.yearlyTrend || []

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <TrendingUp className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} /> 12-Month Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4" style={{ height: 280 }}>
        {trend.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend}>
              <defs>
                <linearGradient id="gradYearRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DC2626" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradYearCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
              <RechartsTooltip
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                formatter={(v: number, name: string) => [`LKR ${v.toLocaleString()}`, name]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#DC2626" fill="url(#gradYearRevenue)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="collected" stroke="#16A34A" fill="url(#gradYearCollected)" strokeWidth={2} name="Collected" />
              <Bar dataKey="bills" fill="#E5E7EB" radius={[3, 3, 0, 0]} name="Bills" barSize={16} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const { data, isLoading } = useDashboardOverview(period)
  const [showExport, setShowExport] = useState(false)
  const [showBalances, setShowBalances] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showExport) return
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showExport])

  const handleExport = async (type: 'gatepasses' | 'bills' | 'deliveries', format: 'csv' | 'xlsx' = 'csv') => {
    try {
      if (format === 'xlsx') {
        await reports.exportExcel(type)
      } else {
        await reports.exportCSV(type)
      }
      toast.success(`Exported ${type} as ${format.toUpperCase()}`)
    } catch {
      toast.error('Export failed')
    }
    setShowExport(false)
  }

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              Love Laundry · Medagama, Panirendawa
            </p>
          </div>
          <h1 className="text-dashboard-title">Dashboard</h1>
          <p className="text-page-subtitle">
            Business overview — Registration No: 40-3064
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={exportRef}>
            <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1 min-w-[200px]">
                {([['gatepasses', 'Gate Passes'], ['bills', 'Bills'], ['deliveries', 'Deliveries']] as const).map(([type, label]) => (
                  <div key={type} className="flex border-b border-[var(--border)] last:border-0">
                    <button onClick={() => handleExport(type, 'csv')} className="flex-1 text-left px-4 py-2 text-[13px] hover:bg-[var(--surface-hover)] transition font-medium">
                      {label} <span className="text-[10px] text-[var(--text-tertiary)]">CSV</span>
                    </button>
                    <button onClick={() => handleExport(type, 'xlsx')} className="flex-1 text-left px-4 py-2 text-[13px] hover:bg-[var(--surface-hover)] transition font-medium">
                      {label} <span className="text-[10px] text-[var(--text-tertiary)]">Excel</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/quotations/new">
            <Button size="sm" className="shadow-sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-xl px-4 py-2 text-[13px] font-medium whitespace-nowrap transition cursor-pointer ${
              period === p.value
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'hover:bg-[var(--surface-hover)]'
            }`}
            style={period !== p.value ? { color: 'var(--text-secondary)' } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[110px]" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[250px]" />
          </div>
        </div>
      ) : data ? (
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <AlertBanners data={data} />
          <KpiCards data={data} />
          <BalancesOverview data={data} onShowDetails={() => setShowBalances(true)} />
          <TodayDeliveries data={data} />
          <PeriodComparison data={data} />
          <ChartsRow data={data} />
          <TablesRow data={data} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ItemAnalytics data={data} />
            <OutstandingAgingChart data={data} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <QuotationFunnel data={data} />
            <YearlyTrendChart data={data} />
          </div>
          <ActivityTimeline data={data} />
        </motion.div>
      ) : (
        <div className="text-center py-20 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          No data available. Start by creating a gate pass or bill.
        </div>
      )}

      {/* Balances Detail Popup */}
      {data && (
        <BalancesPopup
          open={showBalances}
          onClose={() => setShowBalances(false)}
          clients={data.clientWise || []}
          aging={data.aging}
          totalOutstanding={data.current.outstanding}
          totalRevenue={data.current.revenue}
          totalCollected={data.current.collected}
        />
      )}
    </div>
  )
}
