import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gatepasses } from '../services/gatepass.service'
import { deliveries } from '../services/delivery.service'
import { useBills } from './useBills'
import { useQuotations } from './useQuotations'
import type { Bill } from '../../../types/bill'
import type { GatePass, Delivery } from '../../../types/operations'
import type { Quotation } from '../../../types/quotation'

export type DashboardPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface TopClient {
  client_name: string
  revenue: number
  outstanding: number
  bills: number
}

export interface SeriesPoint {
  key: string
  label: string
  revenue: number
  collected: number
}

export interface StatusSlice {
  name: string
  value: number
  color: string
}

export interface PendingGatePass {
  gate_pass_number: string
  client_name: string
  pending: number
}

export interface PeriodMetrics {
  revenue: number
  collected: number
  outstanding: number
  collectionRate: number
  avgBill: number
  billCount: number
  paidBills: number
  partialBills: number
  pendingBills: number
  gatePasses: number
  itemsReceived: number
  itemsDelivered: number
  itemsPending: number
  activeClients: number
  newClients: number
  quotationsDraft: number
  quotationsSent: number
  quotationsAccepted: number
  quotationAcceptedValue: number
  topClients: TopClient[]
  revenueSeries: SeriesPoint[]
  paymentStatus: StatusSlice[]
  pendingGatePasses: PendingGatePass[]
}

export interface DashboardAlert {
  id: string
  severity: 'high' | 'medium' | 'low'
  message: string
}

export interface BusinessDashboardData {
  current: PeriodMetrics
  previous: PeriodMetrics
  alerts: DashboardAlert[]
}

const DAY_MS = 86_400_000

function getWindows(period: DashboardPeriod) {
  const now = new Date()
  const span =
    period === 'day'
      ? DAY_MS
      : period === 'week'
        ? 7 * DAY_MS
        : period === 'month'
          ? 30 * DAY_MS
          : period === 'quarter'
            ? 90 * DAY_MS
            : 365 * DAY_MS

  const curStart = new Date(now.getTime() - span)
  const prevEnd = new Date(curStart.getTime() - 1)
  const prevStart = new Date(curStart.getTime() - span)
  return { curStart, curEnd: now, prevStart, prevEnd }
}

function inWindow(dateStr: string, start: Date, end: Date) {
  const t = new Date(dateStr).getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function bucketKey(dateStr: string, period: DashboardPeriod) {
  const d = new Date(dateStr)
  if (period === 'day') {
    const h = String(d.getHours()).padStart(2, '0')
    return { key: `${h}:00`, label: `${h}:00` }
  }
  if (period === 'quarter' || period === 'year') {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return { key: `${y}-${m}`, label: `${y}-${m}` }
  }
  // week / month → by day
  const key = d.toISOString().slice(0, 10)
  return { key, label: `${d.getMonth() + 1}/${d.getDate()}` }
}

function deliveryMap(dels: Delivery[]) {
  const map = new Map<string, Map<string, number>>()
  for (const d of dels) {
    const m = map.get(d.gate_pass_id) ?? new Map<string, number>()
    for (const it of d.items ?? []) {
      m.set(it.item_name, (m.get(it.item_name) ?? 0) + (Number(it.quantity) || 0))
    }
    map.set(d.gate_pass_id, m)
  }
  return map
}

function computeMetrics(input: {
  bills: Bill[]
  gps: GatePass[]
  dels: Delivery[]
  quotes: Quotation[]
  start: Date
  end: Date
  clientFirstBill: Map<string, number>
  period: DashboardPeriod
}): PeriodMetrics {
  const { bills, gps, dels, quotes, start, end, clientFirstBill, period } = input

  const curBills = bills.filter((b) => inWindow(b.created_at, start, end) && (b.payment_status ?? '') !== 'CANCELLED')

  const revenue = curBills.reduce((s, b) => s + (Number(b.grand_total ?? b.total_amount) || 0), 0)
  const collected = curBills.reduce((s, b) => s + (Number(b.paid_amount) || 0), 0)
  const outstanding = curBills.reduce(
    (s, b) => s + (Number(b.outstanding_amount ?? (b.grand_total ?? b.total_amount) - (b.paid_amount ?? 0)) || 0),
    0,
  )
  const billCount = curBills.length
  const paidBills = curBills.filter((b) => b.payment_status === 'PAID').length
  const partialBills = curBills.filter((b) => b.payment_status === 'PARTIALLY_PAID').length
  const pendingBills = curBills.filter((b) => {
    const s = b.payment_status
    return s !== 'PAID' && s !== 'PARTIALLY_PAID' && s !== 'CANCELLED'
  }).length
  const collectionRate = revenue > 0 ? (collected / revenue) * 100 : 0
  const avgBill = billCount > 0 ? revenue / billCount : 0

  const curGps = gps.filter((g) => inWindow(g.created_at ?? g.created_at, start, end))
  const gatePasses = curGps.length
  const itemsReceived = curGps.reduce(
    (s, g) => s + g.items.reduce((x, i) => x + (Number(i.received_qty) || 0), 0),
    0,
  )

  const curDels = dels.filter((d) => inWindow(d.created_at ?? d.created_at, start, end))
  const itemsDelivered = curDels.reduce(
    (s, d) => s + d.items.reduce((x, i) => x + (Number(i.quantity) || 0), 0),
    0,
  )
  const itemsPending = Math.max(0, itemsReceived - itemsDelivered)

  const activeClients = new Set(curBills.map((b) => b.client_name)).size
  const newClients = curBills.filter((b) => {
    const first = clientFirstBill.get(b.client_name)
    return first !== undefined && first >= start.getTime() && first <= end.getTime()
  }).length

  const quotationsDraft = quotes.filter((q) => q.status === 'draft').length
  const quotationsSent = quotes.filter((q) => q.status === 'sent').length
  const quotationsAccepted = quotes.filter((q) => q.status === 'accepted').length
  const quotationAcceptedValue = quotes
    .filter((q) => q.status === 'accepted')
    .reduce((s, q) => s + (Number((q as { total_amount?: number }).total_amount) || 0), 0)

  // Top clients
  const clientAgg = new Map<string, { revenue: number; outstanding: number; bills: number }>()
  for (const b of curBills) {
    const agg = clientAgg.get(b.client_name) ?? { revenue: 0, outstanding: 0, bills: 0 }
    agg.revenue += Number(b.grand_total ?? b.total_amount) || 0
    agg.outstanding += Number(b.outstanding_amount ?? (b.grand_total ?? b.total_amount) - (b.paid_amount ?? 0)) || 0
    agg.bills += 1
    clientAgg.set(b.client_name, agg)
  }
  const topClients: TopClient[] = Array.from(clientAgg.entries())
    .map(([client_name, v]) => ({ client_name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  // Revenue series
  const seriesMap = new Map<string, { label: string; revenue: number; collected: number }>()
  for (const b of curBills) {
    const { key, label } = bucketKey(b.created_at, period)
    const entry = seriesMap.get(key) ?? { label, revenue: 0, collected: 0 }
    entry.revenue += Number(b.grand_total ?? b.total_amount) || 0
    entry.collected += Number(b.paid_amount) || 0
    seriesMap.set(key, entry)
  }
  const revenueSeries: SeriesPoint[] = Array.from(seriesMap.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => a.key.localeCompare(b.key))

  // Payment status breakdown (by amount)
  const statusTotals = { PAID: 0, PARTIAL: 0, PENDING: 0 }
  for (const b of curBills) {
    const amt = Number(b.grand_total ?? b.total_amount) || 0
    if (b.payment_status === 'PAID') statusTotals.PAID += amt
    else if (b.payment_status === 'PARTIALLY_PAID') statusTotals.PARTIAL += amt
    else if (b.payment_status !== 'CANCELLED') statusTotals.PENDING += amt
  }
  const paymentStatus: StatusSlice[] = [
    { name: 'Paid', value: statusTotals.PAID, color: '#16A34A' },
    { name: 'Partial', value: statusTotals.PARTIAL, color: '#F59E0B' },
    { name: 'Unpaid', value: statusTotals.PENDING, color: '#DC2626' },
  ].filter((s) => s.value > 0)

  // Pending gate passes (items not yet delivered)
  const dMap = deliveryMap(dels)
  const pendingGatePasses: PendingGatePass[] = curGps
    .map((gp) => {
      const keys = [gp.id, (gp as { _id?: string })._id, gp.gate_pass_number].filter(Boolean) as string[]
      let delMap: Map<string, number> | undefined
      for (const k of keys) {
        const f = dMap.get(k)
        if (f) {
          delMap = f
          break
        }
      }
      const pending = gp.items.reduce((s, i) => {
        const received = Number(i.received_qty) || 0
        const delivered = Number(delMap?.get(i.item_name) ?? 0)
        return s + Math.max(0, received - delivered)
      }, 0)
      return { gate_pass_number: gp.gate_pass_number, client_name: gp.client_name, pending }
    })
    .filter((g) => g.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 6)

  return {
    revenue,
    collected,
    outstanding,
    collectionRate,
    avgBill,
    billCount,
    paidBills,
    partialBills,
    pendingBills,
    gatePasses,
    itemsReceived,
    itemsDelivered,
    itemsPending,
    activeClients,
    newClients,
    quotationsDraft,
    quotationsSent,
    quotationsAccepted,
    quotationAcceptedValue,
    topClients,
    revenueSeries,
    paymentStatus,
    pendingGatePasses,
  }
}

function buildAlerts(m: PeriodMetrics): DashboardAlert[] {
  const alerts: DashboardAlert[] = []
  if (m.collectionRate < 70 && m.revenue > 0) {
    alerts.push({
      id: 'collection',
      severity: 'high',
      message: `Collection rate is ${m.collectionRate.toFixed(1)}%. Prioritize follow-ups on ${m.pendingBills} unpaid bills.`,
    })
  }
  if (m.outstanding > 0 && m.outstanding > m.revenue * 0.4) {
    alerts.push({
      id: 'outstanding',
      severity: 'medium',
      message: `Outstanding receivables are ${((m.outstanding / Math.max(1, m.revenue)) * 100).toFixed(0)}% of revenue (${m.outstanding.toFixed(0)} LKR).`,
    })
  }
  if (m.itemsPending > 50) {
    alerts.push({
      id: 'pending-items',
      severity: 'medium',
      message: `${m.itemsPending} items are still pending delivery across ${m.gatePasses} gate passes.`,
    })
  }
  if (m.quotationsAccepted > 0 && m.quotationsDraft + m.quotationsSent > 0) {
    const conv =
      m.quotationsAccepted / (m.quotationsAccepted + m.quotationsDraft + m.quotationsSent)
    if (conv < 0.4) {
      alerts.push({
        id: 'conversion',
        severity: 'low',
        message: `Quotation conversion is ${(conv * 100).toFixed(0)}%. ${m.quotationsDraft} drafts are still open.`,
      })
    }
  }
  return alerts
}

export function useBusinessDashboard(period: DashboardPeriod) {
  const billsQ = useBills({ limit: 1000 })
  const quotesQ = useQuotations()
  const gpQ = useQuery({ queryKey: ['dashboard', 'gatepasses'], queryFn: () => gatepasses.list() })
  const delQ = useQuery({ queryKey: ['dashboard', 'deliveries'], queryFn: () => deliveries.list() })

  const isLoading = billsQ.isLoading || quotesQ.isLoading || gpQ.isLoading || delQ.isLoading
  const error = billsQ.error || quotesQ.error || gpQ.error || delQ.error

  const data = useMemo<BusinessDashboardData | null>(() => {
    if (!billsQ.data || !quotesQ.data || !gpQ.data || !delQ.data) return null
    const bills = billsQ.data.items
    const quotes = quotesQ.data
    const gps = gpQ.data
    const dels = delQ.data

    const clientFirstBill = new Map<string, number>()
    for (const b of bills) {
      const t = new Date(b.created_at).getTime()
      const prev = clientFirstBill.get(b.client_name)
      if (prev === undefined || t < prev) clientFirstBill.set(b.client_name, t)
    }

    const w = getWindows(period)
    const current = computeMetrics({
      bills,
      gps,
      dels,
      quotes,
      start: w.curStart,
      end: w.curEnd,
      clientFirstBill,
      period,
    })
    const previous = computeMetrics({
      bills,
      gps,
      dels,
      quotes,
      start: w.prevStart,
      end: w.prevEnd,
      clientFirstBill,
      period,
    })
    const alerts = buildAlerts(current)
    return { current, previous, alerts }
  }, [billsQ.data, quotesQ.data, gpQ.data, delQ.data, period])

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      billsQ.refetch()
      quotesQ.refetch()
      gpQ.refetch()
      delQ.refetch()
    },
  }
}
