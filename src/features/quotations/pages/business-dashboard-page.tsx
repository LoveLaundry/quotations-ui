import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  Wallet,
  Percent,
  Receipt,
  Package,
  Truck,
  Boxes,
  Users,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  FileText,
  ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/ui/error-state'
import { SyncStatusBar } from '../../../components/ui/sync-status-bar'
import { useBusinessDashboard, type DashboardPeriod } from '../hooks/useBusinessDashboard'

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
]

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(v)

const fmtNum = (v: number) => new Intl.NumberFormat('en-LK').format(Math.round(v))

function deltaInfo(cur: number, prev: number, higherIsBetter: boolean) {
  const pct = prev === 0 ? (cur === 0 ? 0 : 100) : ((cur - prev) / Math.abs(prev)) * 100
  const changed = Math.abs(pct) >= 0.05
  const good = pct >= 0 ? higherIsBetter : !higherIsBetter
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '■'
  return { text: `${arrow} ${Math.abs(pct).toFixed(1)}%`, good: changed ? good : true }
}

interface KpiProps {
  label: string
  value: string
  icon: React.ReactNode
  accent: string
  delta?: { text: string; good: boolean }
  to?: string
}

function KpiCard({ label, value, icon, accent, delta, to }: KpiProps) {
  const navigate = useNavigate()
  const clickable = Boolean(to)

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => { if (to) navigate(to) }}
      onKeyDown={clickable ? e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(to!)
        }
      } : undefined}
      className={`rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        clickable ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40 hover:border-[#BCC4D1]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#767676]">{label}</p>
          <p className="mt-2 text-[27px] font-bold text-[var(--text-primary)] leading-none truncate">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 text-[12px] font-semibold ${
              delta.good ? 'text-[#15803D]' : 'text-[#C1121F]'
            }`}
          >
            {delta.text}
          </span>
          <span className="text-[12px] text-[#7B8BA4]">vs prev</span>
        </div>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, label, money = true }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 shadow-md">
      <p className="text-[12px] font-medium text-[#767676]">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[13px] font-semibold text-[var(--text-primary)]">
          {p.name}: {money ? fmtMoney(p.value) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function BusinessDashboardPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const { data, isLoading, error, refetch } = useBusinessDashboard(period)

  if (isLoading || !data) {
    return (
      <div className="space-y-5 pb-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5 pb-10">
        <h1 className="text-dashboard-title">Business Dashboard</h1>
        <ErrorState
          title="Unable to load dashboard"
          description={error instanceof Error ? error.message : 'Failed to fetch business data.'}
        />
        <div className="flex justify-center">
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    )
  }

  const { current, previous, alerts } = data
  const cmp = (cur: number, prev: number, better: boolean) => deltaInfo(cur, prev, better)

  const fin: Array<{
    label: string
    value: string
    icon: React.ReactNode
    accent: string
    cur: number
    prev: number
    better: boolean
    to?: string
  }> = [
    {
      label: 'Revenue',
      value: fmtMoney(current.revenue),
      icon: <Banknote size={20} />,
      accent: 'bg-[#F9E7E9] text-[#C1121F]',
      cur: current.revenue,
      prev: previous.revenue,
      better: true,
      to: '/bills',
    },
    {
      label: 'Collected',
      value: fmtMoney(current.collected),
      icon: <Wallet size={20} />,
      accent: 'bg-[#E8F2EC] text-[#15803D]',
      cur: current.collected,
      prev: previous.collected,
      better: true,
      to: '/bills',
    },
    {
      label: 'Outstanding',
      value: fmtMoney(current.outstanding),
      icon: <Receipt size={20} />,
      accent: 'bg-[#F9E7E9] text-[#CC3D47]',
      cur: current.outstanding,
      prev: previous.outstanding,
      better: false,
      to: '/bills',
    },
    {
      label: 'Collection Rate',
      value: `${current.collectionRate.toFixed(1)}%`,
      icon: <Percent size={20} />,
      accent: 'bg-[#E7EAEE] text-[#0F2C59]',
      cur: current.collectionRate,
      prev: previous.collectionRate,
      better: true,
      to: '/bills',
    },
  ]

  const ops: Array<{
    label: string
    value: string
    icon: React.ReactNode
    accent: string
    cur: number
    prev: number
    better: boolean
    to?: string
  }> = [
    {
      label: 'Gate Passes',
      value: fmtNum(current.gatePasses),
      icon: <Package size={20} />,
      accent: 'bg-[#E7EAEE] text-[#0F2C59]',
      cur: current.gatePasses,
      prev: previous.gatePasses,
      better: true,
      to: '/gate-passes',
    },
    {
      label: 'Items Received',
      value: fmtNum(current.itemsReceived),
      icon: <Boxes size={20} />,
      accent: 'bg-[#E8F2EC] text-[#15803D]',
      cur: current.itemsReceived,
      prev: previous.itemsReceived,
      better: true,
      to: '/gate-passes',
    },
    {
      label: 'Items Delivered',
      value: fmtNum(current.itemsDelivered),
      icon: <Truck size={20} />,
      accent: 'bg-[#E8F2EC] text-[#15803D]',
      cur: current.itemsDelivered,
      prev: previous.itemsDelivered,
      better: true,
      to: '/deliveries',
    },
    {
      label: 'Pending Items',
      value: fmtNum(current.itemsPending),
      icon: <AlertTriangle size={20} />,
      accent: 'bg-[#F9E7E9] text-[#C1121F]',
      cur: current.itemsPending,
      prev: previous.itemsPending,
      better: false,
      to: '/deliveries',
    },
  ]

  const pipeline = [
    { name: 'Draft', value: current.quotationsDraft, color: '#7B8BA4' },
    { name: 'Sent', value: current.quotationsSent, color: '#CC3D47' },
    { name: 'Accepted', value: current.quotationsAccepted, color: '#15803D' },
  ]

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-700" />
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wide text-[#767676]">
              Deep Analytics & Insights
            </p>
          </div>
          <h1 className="text-dashboard-title">Business Intelligence</h1>
          <p className="text-[13px] text-[#7B8BA4] mt-0.5">
            Financial, operational and client performance for the selected period
          </p>
          <SyncStatusBar queryKey={['dashboard']} label="Dashboard" className="mt-2" />
        </div>
        <div className="inline-flex rounded-xl bg-[var(--surface-3)] p-1 self-start">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
                period === p.key
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[#767676] hover:text-[#0A1D3A]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                a.severity === 'high'
                  ? 'bg-[#F9E7E9] border-[#EEBDC0] text-[#7D0C14]'
                  : a.severity === 'medium'
                    ? 'bg-[#F9E7E9] border-[#DD7D84] text-[#7D0C14]'
                    : 'bg-[#E7EAEE] border-[#BCC4D1] text-[#0A1D3A]'
              }`}
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p className="text-[13px] font-medium">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fin.map((k) => {
          const d = cmp(k.cur, k.prev, k.better)
          return (
            <KpiCard
              key={k.label}
              label={k.label}
              value={k.value}
              icon={k.icon}
              accent={k.accent}
              delta={{ text: d.text, good: d.good }}
              to={k.to}
            />
          )
        })}
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ops.map((k) => {
          const d = cmp(k.cur, k.prev, k.better)
          return (
            <KpiCard
              key={k.label}
              label={k.label}
              value={k.value}
              icon={k.icon}
              accent={k.accent}
              delta={{ text: d.text, good: d.good }}
              to={k.to}
            />
          )
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-[var(--border)] pb-3">
            <CardTitle>Revenue vs Collection</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {current.revenueSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={current.revenueSeries} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C1121F" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#C1121F" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="col" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15803D" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#15803D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EAEE" vertical={false} />
                  <XAxis dataKey="label" stroke="#7B8BA4" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#7B8BA4"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#C1121F"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Collected"
                    stroke="#15803D"
                    strokeWidth={2}
                    fill="url(#col)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-[13px] text-[#7B8BA4]">
                No revenue data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[var(--border)] pb-3">
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {current.paymentStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={current.paymentStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {current.paymentStatus.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-[13px] text-[#7B8BA4]">
                No billing data
              </div>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {current.paymentStatus.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[12px] text-[#767676]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name} · {fmtMoney(s.value)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-[var(--border)] pb-3">
            <CardTitle>Top Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {current.topClients.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={current.topClients}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EAEE" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#7B8BA4"
                    fontSize={12}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="client_name"
                    stroke="#7B8BA4"
                    fontSize={11}
                    width={110}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#C1121F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-[13px] text-[#7B8BA4]">
                No client data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[var(--border)] pb-3">
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pipeline.map((p) => (
                <div key={p.name} className="rounded-xl border border-[var(--border)] p-3 text-center">
                  <p className="text-[22px] font-bold text-[var(--text-primary)]">{p.value}</p>
                  <p className="text-[12px] text-[#767676]">{p.name}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={pipeline} margin={{ left: 8, right: 8, top: 8 }}>
                <XAxis dataKey="name" stroke="#7B8BA4" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={false} content={<ChartTooltip money={false} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pipeline.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] text-[#767676]">
                <FileText size={16} className="text-[#0F2C59]" />
                Accepted value
              </div>
              <span className="text-[15px] font-bold text-[var(--text-primary)]">
                {fmtMoney(current.quotationAcceptedValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
            <CardTitle>Top Clients</CardTitle>
            <button
              onClick={() => navigate('/bills')}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#C1121F] hover:text-[#C1121F]"
            >
              View all <ArrowUpRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            {current.topClients.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {current.topClients.map((c) => {
                  const pct = current.revenue > 0 ? (c.revenue / current.revenue) * 100 : 0
                  return (
                    <div key={c.client_name} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                          {c.client_name}
                        </p>
                        <p className="text-[11px] text-[#7B8BA4]">
                          {c.bills} bill{c.bills !== 1 ? 's' : ''} · {fmtMoney(c.outstanding)} outstanding
                        </p>
                        <div className="mt-1.5 h-1.5 w-full max-w-[200px] rounded-full bg-[#E7EAEE]">
                          <div
                            className="h-1.5 rounded-full bg-[#C1121F]"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-[14px] font-bold text-[var(--text-primary)]">
                        {fmtMoney(c.revenue)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-[#7B8BA4]">No client data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
            <CardTitle>Items Pending Delivery</CardTitle>
            <button
              onClick={() => navigate('/gate-passes')}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#C1121F] hover:text-[#C1121F]"
            >
              Gate passes <ArrowUpRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            {current.pendingGatePasses.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {current.pendingGatePasses.map((g) => (
                  <div key={g.gate_pass_number} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                        {g.client_name}
                      </p>
                      <p className="text-[11px] text-[#7B8BA4] font-mono">#{g.gate_pass_number}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#F9E7E9] px-2.5 py-1 text-[12px] font-semibold text-[#C1121F] border border-[#EEBDC0]">
                      <Boxes size={13} /> {fmtNum(g.pending)} pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-[#15803D]">
                All received items have been delivered
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clients summary footer */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#767676]">
            <Users size={16} />
            <p className="text-[12px] font-semibold uppercase tracking-wide">Active Clients</p>
          </div>
          <p className="mt-2 text-[24px] font-bold text-[var(--text-primary)]">{fmtNum(current.activeClients)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#767676]">
            <UserPlus size={16} />
            <p className="text-[12px] font-semibold uppercase tracking-wide">New Clients</p>
          </div>
          <p className="mt-2 text-[24px] font-bold text-[var(--text-primary)]">{fmtNum(current.newClients)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#767676]">
            <TrendingUp size={16} />
            <p className="text-[12px] font-semibold uppercase tracking-wide">Avg Bill Value</p>
          </div>
          <p className="mt-2 text-[24px] font-bold text-[var(--text-primary)]">{fmtMoney(current.avgBill)}</p>
        </div>
      </div>
    </div>
  )
}
