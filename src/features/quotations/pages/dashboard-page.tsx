import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, DollarSign, Wallet, AlertTriangle, TrendingUp,
  ClipboardList, Users, Package, Clock,
  Download, Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { useDashboardOverview, type DashboardPeriod, type DashboardOverviewData } from '../hooks/useBusinessDashboard'
import { reports } from '../services/reports.service'
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
            <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 mt-2">
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
            <table className="w-full text-[13px]">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  {['Gate Pass', 'Client', 'Pending'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pendingGPs.map((gp, i) => (
                  <motion.tr key={gp.gate_pass_number} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-[var(--surface-hover)]">
                    <td className="px-3 py-2.5 font-mono text-[12px] font-semibold">{gp.gate_pass_number}</td>
                    <td className="px-3 py-2.5 truncate max-w-[140px]">{gp.client_name}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">
                        {gp.pending} items
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const { data, isLoading } = useDashboardOverview(period)
  const [showExport, setShowExport] = useState(false)

  const handleExport = async (type: 'gatepasses' | 'bills' | 'deliveries') => {
    try {
      await reports.exportCSV(type)
      toast.success(`Exported ${type} as CSV`)
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
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1 min-w-[150px]">
                {([['gatepasses', 'Gate Passes'], ['bills', 'Bills'], ['deliveries', 'Deliveries']] as const).map(([type, label]) => (
                  <button key={type} onClick={() => handleExport(type)} className="w-full text-left px-4 py-2 text-[13px] hover:bg-[var(--surface-hover)] transition">
                    {label}
                  </button>
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
          <ChartsRow data={data} />
          <TablesRow data={data} />
          <ActivityTimeline data={data} />
        </motion.div>
      ) : (
        <div className="text-center py-20 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          No data available. Start by creating a gate pass or bill.
        </div>
      )}
    </div>
  )
}
