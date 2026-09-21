import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2,
  ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, Package,
  Plus, Receipt, ShieldAlert, Truck, XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { StatCard } from '../../../components/ui/stat-card'
import { EmptyState } from '../../../components/ui/empty-state'
import { SmartConfirm } from '../../../components/ops/smart-confirm'
import { useGatePasses } from '../../quotations/hooks/useGatePasses'
import { useDeliveries } from '../../quotations/hooks/useDeliveries'
import {
  useAdjustments, useApproveAdjustment, useRejectAdjustment,
  useEvents, usePendingGatePasses, useReconciliationIssues,
} from '../hooks/useDailyOps'
import type { Adjustment } from '../services/ops.service'

// ── Date helpers (local calendar day, no timezone drift) ──────────────────────

function localISO(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return localISO(dt)
}

function dayOf(iso?: string | null): string {
  return iso ? String(iso).slice(0, 10) : ''
}

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(ts?: string): string {
  if (!ts) return ''
  const dt = new Date(ts)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const EVENT_LABEL: Record<string, string> = {
  GATEPASS_CREATED: 'Gate pass received',
  GATEPASS_STATUS_CHANGED: 'Gate pass status changed',
  DELIVERY_CREATED: 'Delivery dispatched',
  BILL_CREATED: 'Bill created',
  PAYMENT_RECORDED: 'Payment recorded',
  ADJUSTMENT_REQUESTED: 'Adjustment requested',
  ADJUSTMENT_APPROVED: 'Adjustment approved',
  ADJUSTMENT_REJECTED: 'Adjustment rejected',
  RETURN_RECORDED: 'Return recorded',
}

function eventLabel(type: string): string {
  return EVENT_LABEL[type] || type.replace(/_/g, ' ').toLowerCase()
}

// ── Quick actions ─────────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { to: '/gate-passes/new', label: 'Receive', hint: 'New gate pass', icon: ClipboardList, cls: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white border-transparent' },
    { to: '/deliveries/new', label: 'Deliver', hint: 'Record delivery', icon: Truck, cls: 'bg-[#16A34A] hover:bg-[#15803D] text-white border-transparent' },
    { to: '/bills/new', label: 'Bill', hint: 'Create bill', icon: FileText, cls: 'bg-white hover:bg-[var(--surface-hover)] text-[var(--text-primary)]' },
    { to: '/management/expenses', label: 'Expense', hint: 'Record expense', icon: Receipt, cls: 'bg-white hover:bg-[var(--surface-hover)] text-[var(--text-primary)]' },
    { to: '/management/attendance-log', label: 'Attendance', hint: 'Log staff', icon: CalendarCheck, cls: 'bg-white hover:bg-[var(--surface-hover)] text-[var(--text-primary)]' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map(a => (
        <Button key={a.to} asChild className={`h-auto justify-start gap-3 border border-[var(--border)] px-3.5 py-3 ${a.cls}`}>
          <Link to={a.to}>
            <a.icon className="h-4 w-4 shrink-0" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[13px] font-semibold">{a.label}</span>
              <span className="text-[10px] font-normal opacity-80">{a.hint}</span>
            </span>
          </Link>
        </Button>
      ))}
    </div>
  )
}

// ── Attention queue ───────────────────────────────────────────────────────────

function AttentionQueue() {
  const { data: adjustments, isLoading: loadingAdj } = useAdjustments('REQUESTED')
  const { data: recon, isLoading: loadingRecon } = useReconciliationIssues()
  const approve = useApproveAdjustment()
  const reject = useRejectAdjustment()
  const [confirm, setConfirm] = useState<{ adjustment: Adjustment; action: 'approve' | 'reject' } | null>(null)

  const pendingAdj = adjustments ?? []
  const issues = recon?.items ?? []
  const clear = pendingAdj.length === 0 && issues.length === 0

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <ShieldAlert className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
            Needs Attention
          </CardTitle>
          {!clear && (
            <span className="inline-flex items-center rounded-full bg-[#FFF1F1] border border-[#FECACA] px-2.5 py-0.5 text-[12px] font-bold text-[#DC2626]">
              {pendingAdj.length + issues.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {loadingAdj || loadingRecon ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : clear ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[13px] font-semibold text-emerald-800">All clear</p>
              <p className="text-[12px] text-emerald-700">No pending adjustments or reconciliation issues.</p>
            </div>
          </div>
        ) : (
          <>
            {pendingAdj.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  Quantity adjustments awaiting approval
                </p>
                <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                  {pendingAdj.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                          {a.item_name}
                          {a.specification && <span className="ml-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{a.specification}</span>}
                        </p>
                        <p className="truncate text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                          {a.original_qty} <ArrowRight className="inline h-3 w-3" /> {a.corrected_qty}
                          {a.reason && ` · ${a.reason}`}
                          {a.requested_by && ` · by ${a.requested_by}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setConfirm({ adjustment: a, action: 'reject' })}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" className="h-7 px-2" onClick={() => setConfirm({ adjustment: a, action: 'approve' })}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {issues.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  Reconciliation issues
                </p>
                <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                  {issues.slice(0, 8).map(row => (
                    <Link key={row.id} to={`/gate-passes/${row.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                          #{row.gate_pass_number} · {row.client_name}
                        </p>
                        <p className="truncate text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                          {row.issues.map(i => i.code).join(', ')}
                          {row.legacy_marked && ' · legacy marked'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <SmartConfirm
        open={Boolean(confirm)}
        title={confirm?.action === 'approve' ? 'Approve adjustment?' : 'Reject adjustment?'}
        message={
          confirm
            ? `${confirm.adjustment.item_name}${confirm.adjustment.specification ? ` (${confirm.adjustment.specification})` : ''} — ${confirm.adjustment.reason}`
            : undefined
        }
        changes={
          confirm && confirm.action === 'approve'
            ? [{ label: 'Received quantity', from: confirm.adjustment.original_qty, to: confirm.adjustment.corrected_qty }]
            : undefined
        }
        confirmLabel={confirm?.action === 'approve' ? 'Approve' : 'Reject'}
        loading={approve.isPending || reject.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return
          const done = () => setConfirm(null)
          if (confirm.action === 'approve') approve.mutate(confirm.adjustment.id, { onSuccess: done, onError: done })
          else reject.mutate(confirm.adjustment.id, { onSuccess: done, onError: done })
        }        }
      />
    </Card>
  )
}

// ── Pending deliveries ────────────────────────────────────────────────────────

function PendingDeliveries() {
  const { data, isLoading } = usePendingGatePasses()
  const rows = (data ?? []).filter(r => r.total_pending > 0)

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Package className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
            Pending to Deliver
          </CardTitle>
          {rows.length > 0 && (
            <Button asChild size="sm" className="h-7 bg-[#16A34A] hover:bg-[#15803D] text-white">
              <Link to="/deliveries/new">
                <Truck className="h-3.5 w-3.5" /> Deliver
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2 py-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-6 w-6 text-[#9CA3AF]" />}
            title="Nothing pending"
            description="Every received item has been delivered."
          />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {rows.map(r => (
              <Link key={r.gate_pass_id} to={`/gate-passes/${r.gate_pass_id}`} className="flex items-center gap-3 py-2.5 hover:bg-[var(--surface-hover)] transition">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-[11px] font-bold text-[#C2410C]">
                  {r.total_pending}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {r.client_name}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    #{r.gate_pass_number} · {r.items.filter(i => i.pending_qty > 0).map(i => `${i.item_name} ×${i.pending_qty}`).join(', ')}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Daily timeline ────────────────────────────────────────────────────────────

function DailyTimeline({ date }: { date: string }) {
  const { data, isLoading } = useEvents(date)
  const events = data ?? []

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Activity className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6 text-[#9CA3AF]" />}
            title="No activity recorded"
            description="Movements for this day will appear here as they are entered."
          />
        ) : (
          <div className="relative space-y-0.5">
            {events.map((e, i) => (
              <motion.div
                key={e.id || i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center gap-3 py-2"
              >
                <span className="w-12 shrink-0 text-right text-[11px] font-medium tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                  {fmtTime(e.occurred_at)}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#DC2626]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-medium">{eventLabel(e.event_type)}</span>
                    {e.item_deltas && e.item_deltas.length > 0 && (
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {' · '}
                        {e.item_deltas.map(d => `${d.item_name} ${d.before ?? '—'}→${d.after ?? '—'}`).join(', ')}
                      </span>
                    )}
                  </p>
                  {(e.user_name || e.reason) && (
                    <p className="truncate text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {e.user_name || 'system'}{e.reason ? ` · ${e.reason}` : ''}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const [date, setDate] = useState(localISO())
  const isToday = date === localISO()

  const { data: gatepasses } = useGatePasses()
  const { data: deliveries } = useDeliveries()
  const { data: adjustments } = useAdjustments('REQUESTED')
  const { data: recon } = useReconciliationIssues()

  const kpis = useMemo(() => {
    const gps = (gatepasses ?? []).filter(
      gp => dayOf(gp.receiving_date) === date && gp.status !== 'CANCELLED',
    )
    const itemsReceived = gps.reduce(
      (sum, gp) => sum + (gp.items ?? []).reduce((s, it) => s + (it.received_qty || 0), 0),
      0,
    )
    const dels = (deliveries ?? []).filter(
      d => dayOf(d.delivery_date) === date && d.status !== 'CANCELLED',
    )
    const itemsDelivered = dels.reduce(
      (sum, d) => sum + (d.items ?? []).reduce((s, it) => s + (it.quantity || 0), 0),
      0,
    )
    return {
      gatePasses: gps.length,
      itemsReceived,
      deliveries: dels.length,
      itemsDelivered,
      pendingAdjustments: (adjustments ?? []).length,
      reconIssues: (recon?.items ?? []).length,
    }
  }, [gatepasses, deliveries, adjustments, recon, date])

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[11px] font-semibold uppercase tracking-wide sm:text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              Love Laundry · Daily Operations
            </p>
          </div>
          <h1 className="text-dashboard-title">Today</h1>
          <p className="text-page-subtitle">{fmtDay(date)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate(d => shiftISO(d, -1))} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={date}
            onChange={e => e.target.value && setDate(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px]"
            style={{ color: 'var(--text-primary)' }}
          />
          <Button variant="outline" size="icon" onClick={() => setDate(d => shiftISO(d, 1))} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="secondary" size="sm" onClick={() => setDate(localISO())}>
              Today
            </Button>
          )}
        </div>
      </div>

      <QuickActions />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Gate Passes In" value={kpis.gatePasses} icon={<ClipboardList size={20} />} color="red" to="/gate-passes" className="p-4" />
        <StatCard label="Items Received" value={kpis.itemsReceived} icon={<Package size={20} />} color="purple" to="/gate-passes" className="p-4" />
        <StatCard label="Deliveries Out" value={kpis.deliveries} icon={<Truck size={20} />} color="green" to="/deliveries" className="p-4" />
        <StatCard label="Items Delivered" value={kpis.itemsDelivered} icon={<Package size={20} />} color="blue" to="/deliveries" className="p-4" />
        <StatCard label="Pending Adjustments" value={kpis.pendingAdjustments} icon={<AlertTriangle size={20} />} color="amber" className="p-4" />
        <StatCard label="Reconciliation" value={kpis.reconIssues} icon={<ShieldAlert size={20} />} color={kpis.reconIssues > 0 ? 'red' : 'gray'} className="p-4" />
      </div>

      {/* Attention + Pending */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttentionQueue />
        <PendingDeliveries />
      </div>

      <DailyTimeline date={date} />

      <div className="flex items-center justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <Plus className="h-3.5 w-3.5" /> Open full dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
