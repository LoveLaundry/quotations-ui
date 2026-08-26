import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQuotations } from './useQuotations'
import { dashboardApi } from '../services/dashboard.service'
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

export interface DashboardSummaryResponse {
  current: PeriodMetrics
  previous: PeriodMetrics
}

export interface BusinessDashboardData {
  current: PeriodMetrics
  previous: PeriodMetrics
  alerts: DashboardAlert[]
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
  const quotesQ = useQuotations()
  const summaryQ = useQuery({
    queryKey: ['dashboard', 'summary', period],
    queryFn: () => dashboardApi.getSummary(period),
  })

  const isLoading = quotesQ.isLoading || summaryQ.isLoading
  const error = (summaryQ.error || quotesQ.error) as Error | null

  const data = useMemo<BusinessDashboardData | null>(() => {
    if (!summaryQ.data || !quotesQ.data) return null
    const quotes = quotesQ.data as Quotation[]

    const applyQuotations = (m: PeriodMetrics): PeriodMetrics => ({
      ...m,
      quotationsDraft: quotes.filter((q) => q.status === 'draft').length,
      quotationsSent: quotes.filter((q) => q.status === 'sent').length,
      quotationsAccepted: quotes.filter((q) => q.status === 'accepted').length,
      quotationAcceptedValue: quotes
        .filter((q) => q.status === 'accepted')
        .reduce((s, q) => s + (Number((q as { total_amount?: number }).total_amount) || 0), 0),
    })

    const current = applyQuotations(summaryQ.data.current)
    const previous = applyQuotations(summaryQ.data.previous)
    const alerts = buildAlerts(current)
    return { current, previous, alerts }
  }, [summaryQ.data, quotesQ.data])

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      summaryQ.refetch()
      quotesQ.refetch()
    },
  }
}
