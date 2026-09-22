import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Activity, AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2,
  ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, Flag,
  Package, Plus, Receipt, RotateCcw, ShieldAlert, Truck, Undo2, Wallet, XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { StatCard } from '../../../components/ui/stat-card'
import { EmptyState } from '../../../components/ui/empty-state'
import { SmartConfirm } from '../../../components/ops/smart-confirm'
import { useGatePasses, useReopenLegacyBatch, invalidateDeliveryData } from '../../quotations/hooks/useGatePasses'
import { useDeliveries } from '../../quotations/hooks/useDeliveries'
import { returns as returnsApi } from '../../quotations/services/returns.service'
import type { ReturnCreate, ReturnItem } from '../../../types/operations'
import {
  useAdjustments, useApproveAdjustment, useRejectAdjustment,
  useCloseDay, useDayClose, useDayExpenses, useDayMoney, useEvents,
  usePendingGatePasses, useReconciliationIssues,
} from '../hooks/useDailyOps'
import { opsKeys } from '../hooks/useDailyOps'
import type { Adjustment, DayCloseTotals } from '../services/ops.service'

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

function fmtMoney(n: number): string {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
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
  DAY_CLOSED: 'Day closed',
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
    { to: '/returns/new', label: 'Return', hint: 'Record return', icon: RotateCcw, cls: 'bg-white hover:bg-[var(--surface-hover)] text-[var(--text-primary)]' },
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
  const batchReopen = useReopenLegacyBatch()
  const [confirm, setConfirm] = useState<{ adjustment: Adjustment; action: 'approve' | 'reject' } | null>(null)
  const [batchConfirm, setBatchConfirm] = useState(false)

  const pendingAdj = adjustments ?? []
  const issues = recon?.items ?? []
  const legacyCount = issues.filter(i => i.legacy_marked).length
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
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    Reconciliation issues
                  </p>
                  {legacyCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[12px]"
                      onClick={() => setBatchConfirm(true)}
                      disabled={batchReopen.isPending}
                      title="Reopen every pass closed by the old note flow with no delivery records"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      {batchReopen.isPending ? 'Reopening…' : `Reopen ${legacyCount} legacy`}
                    </Button>
                  )}
                </div>
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

      <SmartConfirm
        open={batchConfirm}
        title={legacyCount > 0 ? `Reopen ${legacyCount} legacy gate pass${legacyCount !== 1 ? 'es' : ''}?` : 'Reopen legacy gate passes?'}
        message="These passes were closed by the old note flow with no delivery records — their balances are hidden and they do not appear in Pending to Deliver. Reopening flags each legacy closure in the journal (LEGACY_CLOSED_WITHOUT_DELIVERY) and moves them back to Received. No quantities are fabricated."
        confirmLabel="Reopen all eligible"
        loading={batchReopen.isPending}
        onCancel={() => setBatchConfirm(false)}
        onConfirm={() => {
          setBatchConfirm(false)
          batchReopen.mutate()
        }}
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

// ── Day money ─────────────────────────────────────────────────────────────────

function MoneyTile({ label, value, accent }: { label: string; value: number; accent?: 'green' | 'amber' | 'red' }) {
  const color =
    accent === 'green' ? '#16A34A' : accent === 'amber' ? '#D97706' : accent === 'red' ? '#DC2626' : undefined
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p
        className="mt-0.5 text-[18px] font-bold tabular-nums"
        style={color ? { color } : { color: 'var(--text-primary)' }}
      >
        {fmtMoney(value)}
      </p>
    </div>
  )
}

function TodayMoney({ date }: { date: string }) {
  const { data: money, isLoading } = useDayMoney(date)
  const { data: expenseRows } = useDayExpenses(date)
  const expenses = ((expenseRows ?? []) as any[]).reduce((sum, item) => sum + (item.total || 0), 0)
  const outstanding = money?.outstanding_amount ?? 0
  const net = (money?.collected_amount ?? 0) - expenses

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Wallet className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
          Today's Money
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <MoneyTile label="Billed today" value={money?.billed_amount ?? 0} />
              <MoneyTile label="Collected today" value={money?.collected_amount ?? 0} accent="green" />
              <MoneyTile label="Expenses today" value={expenses} accent="red" />
              <MoneyTile label="Net for day" value={net} accent={net < 0 ? 'amber' : undefined} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              <span>
                Outstanding receivable: <span className="font-semibold tabular-nums" style={{ color: outstanding > 0 ? '#D97706' : 'var(--text-primary)' }}>{fmtMoney(outstanding)}</span>
                {' '}across {money?.open_bills_count ?? 0} open bills
              </span>
              {money && (
                <span className="hidden sm:inline">
                  {money.bills_created} bill{money.bills_created !== 1 ? 's' : ''} created · {money.payments_count} payment{money.payments_count !== 1 ? 's' : ''} recorded
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Fast return entry ─────────────────────────────────────────────────────────

const RETURN_ACTIONS_FAST = [
  { value: 'RECEIVE_BACK', label: 'Receive Back' },
  { value: 'RE_WASH', label: 'Re-wash' },
  { value: 'DISCARD', label: 'Discard' },
  { value: 'COMPENSATE', label: 'Compensate' },
]

const RETURN_REASONS_FAST = [
  { value: 'WRONG_ITEM', label: 'Wrong item' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'OTHER', label: 'Other' },
]

interface ReturnLine {
  qty: number
  action: string
  reason: string
}

const gpItemKey = (name: string, spec?: string) => `${name}||${spec ?? ''}`

function FastReturnCard() {
  const qc = useQueryClient()
  const { data: gatepasses } = useGatePasses()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [gpId, setGpId] = useState<string>('')
  const [lines, setLines] = useState<Record<string, ReturnLine>>({})

  const create = useMutation({
    mutationFn: (body: ReturnCreate) => returnsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: opsKeys.all })
      invalidateDeliveryData(qc)
      toast.success('Return recorded')
      setGpId('')
      setLines({})
      setSearch('')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to record return'),
  })

  const gp = (gatepasses ?? []).find(g => g.id === gpId) || null

  const matches = (gatepasses ?? [])
    .filter(g => g.status && g.status !== 'CANCELLED')
    .filter(g => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        String(g.gate_pass_number ?? '').toLowerCase().includes(q) ||
        String(g.client_name ?? '').toLowerCase().includes(q)
      )
    })
    .slice(0, 8)

  const totalQty = Object.values(lines).reduce((s, l) => s + l.qty, 0)

  const updateLine = (key: string, patch: Partial<ReturnLine>) =>
    setLines(prev => {
      const base = prev[key] ?? { qty: 0, action: 'RECEIVE_BACK', reason: 'OTHER' }
      return { ...prev, [key]: { ...base, ...patch } }
    })

  const submit = () => {
    if (!gp) return
    const items: ReturnItem[] = Object.entries(lines)
      .filter(([, l]) => l.qty > 0)
      .map(([key, l]) => {
        const [name, spec] = key.split('||')
        const pendingResend = l.action === 'RECEIVE_BACK' || l.action === 'RE_WASH'
        return {
          item_name: name,
          specification: spec || undefined,
          returned_qty: l.qty,
          action: l.action as any,
          reason: l.reason as any,
          condition: 'GOOD' as any,
          resend_status: pendingResend ? ('PENDING' as const) : undefined,
        }
      })
    if (items.length === 0) {
      toast.error('Enter a quantity for at least one item')
      return
    }
    create.mutate({
      gate_pass_id: gp.id!,
      client_name: gp.client_name,
      items: items as any,
    })
  }

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <RotateCcw className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
            Returns
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8" onClick={() => setOpen(o => !o)}>
            {open ? 'Close' : 'Quick return'}
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-4 space-y-4">
          {!gp ? (
            <div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search gate pass number or client…"
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px]"
                style={{ color: 'var(--text-primary)' }}
              />
              <div className="mt-2 max-h-52 overflow-y-auto divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                {matches.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGpId(g.id!)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[var(--surface-hover)] transition"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>
                      <span className="font-mono text-[12px]" style={{ color: 'var(--text-tertiary)' }}>#{g.gate_pass_number}</span>
                      <span className="ml-2 text-[13px] font-medium">{g.client_name}</span>
                    </span>
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                      {(g.items ?? []).reduce((s, i) => s + (i.received_qty || 0), 0)} pcs
                    </span>
                  </button>
                ))}
                {matches.length === 0 && (
                  <p className="px-3 py-4 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    No gate passes match
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    #{gp.gate_pass_number} · {gp.client_name}
                  </p>
                  <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                    {(gp.items ?? []).reduce((s, i) => s + (i.received_qty || 0), 0)} pcs received
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setGpId('')}>
                  Clear
                </Button>
              </div>

              <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                {(gp.items ?? []).filter(i => (i.received_qty || 0) > 0).map(it => {
                  const key = gpItemKey(it.item_name, it.specification)
                  const line = lines[key] ?? { qty: 0, action: 'RECEIVE_BACK', reason: 'OTHER' }
                  const max = it.received_qty || 0
                  return (
                    <div key={key} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                          {it.item_name}
                          {it.specification && <span className="ml-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{it.specification}</span>}
                        </p>
                        <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                          {max} received
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={max}
                          value={line.qty}
                          onChange={e => updateLine(key, { qty: Math.min(max, parseInt(e.target.value) || 0) })}
                          className="h-8 w-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-right text-[13px] tabular-nums"
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <select
                          value={line.action}
                          onChange={e => updateLine(key, { action: e.target.value })}
                          className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1.5 text-[12px]"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {RETURN_ACTIONS_FAST.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                        <select
                          value={line.reason}
                          onChange={e => updateLine(key, { reason: e.target.value })}
                          className="hidden h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1.5 text-[12px] sm:block"
                          style={{ color: 'var(--text-primary)' }}
                          title="Reason"
                        >
                          {RETURN_REASONS_FAST.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[12px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                  {totalQty} piece{totalQty !== 1 ? 's' : ''} to return
                </p>
                <Button
                  className="h-9 text-white"
                  style={{ backgroundColor: '#D97706' }}
                  disabled={create.isPending || totalQty === 0}
                  onClick={submit}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {create.isPending ? 'Recording…' : 'Record return'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
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

// ── Close day ─────────────────────────────────────────────────────────────────

function useDayTotals(date: string) {
  const { data: gatepasses } = useGatePasses()
  const { data: deliveries } = useDeliveries()
  const { data: adjustments } = useAdjustments('REQUESTED')
  const { data: recon } = useReconciliationIssues()
  const { data: money } = useDayMoney(date)
  const { data: expenseRows } = useDayExpenses(date)

  return useMemo<DayCloseTotals>(() => {
    const gps = (gatepasses ?? []).filter(
      gp => dayOf(gp.receiving_date) === date && gp.status !== 'CANCELLED',
    )
    const piecesReceived = gps.reduce(
      (sum, gp) => sum + (gp.items ?? []).reduce((s, it) => s + (it.received_qty || 0), 0),
      0,
    )
    const dels = (deliveries ?? []).filter(
      d => dayOf(d.delivery_date) === date && d.status !== 'CANCELLED',
    )
    const piecesDelivered = dels.reduce(
      (sum, d) => sum + (d.items ?? []).reduce((s, it) => s + (it.quantity || 0), 0),
      0,
    )
    const deliveredByGP = new Map<string, Map<string, number>>()
    for (const d of deliveries ?? []) {
      if (d.status === 'CANCELLED') continue
      let byItem = deliveredByGP.get(d.gate_pass_id)
      if (!byItem) {
        byItem = new Map<string, number>()
        deliveredByGP.set(d.gate_pass_id, byItem)
      }
      for (const it of d.items ?? []) {
        const key = `${it.item_name}||${it.specification ?? ''}`
        byItem.set(key, (byItem.get(key) ?? 0) + (it.quantity || 0))
      }
    }
    const piecesOutstanding = gps.reduce(
      (sum, gp) =>
        sum + (gp.items ?? []).reduce((s, it) => {
          const key = `${it.item_name}||${it.specification ?? ''}`
          const delivered = deliveredByGP.get(gp.id)?.get(key) ?? 0
          return s + Math.max(0, (it.received_qty || 0) - delivered)
        }, 0),
      0,
    )
    const expenses = ((expenseRows ?? []) as any[]).reduce((sum, item) => sum + (item.total || 0), 0)
    return {
      gate_pass_count: gps.length,
      pieces_received: piecesReceived,
      delivery_count: dels.length,
      pieces_delivered: piecesDelivered,
      pieces_outstanding: piecesOutstanding,
      pending_adjustments: (adjustments ?? []).length,
      reconciliation_issues: (recon?.items ?? []).length,
      billed_amount: money?.billed_amount ?? 0,
      collected_amount: money?.collected_amount ?? 0,
      expenses_amount: expenses,
      outstanding_amount: money?.outstanding_amount ?? 0,
    }
  }, [gatepasses, deliveries, adjustments, recon, date, money, expenseRows])
}

const DAY_TOTAL_ROWS: { key: keyof DayCloseTotals; label: string; flag?: 'ok' | 'warn' }[] = [
  { key: 'gate_pass_count', label: 'Gate passes received' },
  { key: 'pieces_received', label: 'Pieces received' },
  { key: 'delivery_count', label: 'Deliveries recorded' },
  { key: 'pieces_delivered', label: 'Pieces delivered' },
  { key: 'pieces_outstanding', label: 'Pieces outstanding', flag: 'warn' },
]

const DAY_MONEY_ROWS: { key: keyof DayCloseTotals; label: string; accent?: 'green' | 'amber' | 'red' }[] = [
  { key: 'billed_amount', label: 'Billed' },
  { key: 'collected_amount', label: 'Collected', accent: 'green' },
  { key: 'expenses_amount', label: 'Expenses', accent: 'red' },
]

function CloseDayCard({ date }: { date: string }) {
  const totals = useDayTotals(date)
  const { data: closed, isLoading: loadingClosed } = useDayClose(date)
  const close = useCloseDay()
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(false)

  const openFlags = totals.pending_adjustments + totals.reconciliation_issues
  const closedAt = closed && typeof closed.meta === 'object' && closed.meta
    ? String((closed.meta as { closed_at?: string }).closed_at ?? '')
    : ''

  const summaryRows = DAY_TOTAL_ROWS.map(row => ({ ...row, value: totals[row.key] }))
  const netForDay = totals.collected_amount - totals.expenses_amount
  const moneyTiles = [
    ...DAY_MONEY_ROWS.map(row => ({ ...row, value: totals[row.key] as number })),
    { key: 'net', label: 'Net for day', accent: (netForDay < 0 ? 'amber' : 'green') as 'amber' | 'green', value: netForDay },
  ]

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Flag className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
            Close Day
          </CardTitle>
          {closed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[12px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Closed{closedAt ? ` · ${fmtTime(closedAt)}` : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {loadingClosed ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
              {summaryRows.map(row => (
                <div key={row.key} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{row.label}</p>
                  <p
                    className="mt-0.5 text-[18px] font-bold tabular-nums"
                    style={row.flag === 'warn' && row.value > 0 ? { color: '#D97706' } : { color: 'var(--text-primary)' }}
                  >
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                Money for the day
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                {moneyTiles.map(tile => (
                  <MoneyTile key={tile.key} label={tile.label} value={tile.value} accent={tile.accent} />
                ))}
              </div>
            </div>

            {openFlags > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {totals.pending_adjustments} pending adjustment{totals.pending_adjustments !== 1 ? 's' : ''}
                  {totals.pending_adjustments > 0 && totals.reconciliation_issues > 0 ? ' and ' : ''}
                  {totals.reconciliation_issues > 0 ? `${totals.reconciliation_issues} reconciliation issue${totals.reconciliation_issues !== 1 ? 's' : ''}` : ''}
                  {' '}still open. Resolve them in Needs Attention before closing.
                </span>
              </div>
            )}

            {closed && (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12px] text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Day already closed. Re-close to record a fresh snapshot of the current numbers.
                  {closed.reason ? ` Note: “${closed.reason}”` : ''}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional note for this day's close (e.g. late deliveries due, staff note)"
                className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px]"
                style={{ color: 'var(--text-primary)' }}
              />
              <Button
                className="h-9 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                disabled={close.isPending}
                onClick={() => setConfirm(true)}
              >
                <Flag className="h-3.5 w-3.5" />
                {closed ? 'Re-close day' : 'Close day'}
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <SmartConfirm
        open={confirm}
        title={closed ? 'Re-close the day?' : 'Close the day?'}
        message="This writes an end-of-day snapshot into the journal; the numbers below are frozen at this moment."
        changes={[
          ...summaryRows.map(row => ({ label: row.label, from: row.value, to: row.value })),
          ...moneyTiles.map(tile => ({ label: tile.label, from: fmtMoney(tile.value), to: fmtMoney(tile.value) })),
          ...(openFlags > 0
            ? [{ label: 'Open items needing attention', from: openFlags, to: openFlags }]
            : []),
        ]}
        confirmLabel={closed ? 'Re-close day' : 'Close day'}
        loading={close.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false)
          close.mutate({ date, totals, note: note.trim() || undefined })
        }}
      />
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

      {/* Money */}
      <TodayMoney date={date} />

      {/* Attention + Pending */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttentionQueue />
        <PendingDeliveries />
      </div>

      {/* Fast return entry */}
      <FastReturnCard />

      <DailyTimeline date={date} />

      <CloseDayCard date={date} />

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
