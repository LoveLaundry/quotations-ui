import billsApi from '../../../api/bills-api'
import type { DashboardSummaryResponse } from '../hooks/useBusinessDashboard'

export interface ActivityEntry {
  id: string
  user_id: string
  action: string
  entity: string
  entity_id: string
  details: Record<string, unknown>
  timestamp: string | null
}

export const dashboardApi = {
  getSummary: (period: string) =>
    billsApi
      .get<DashboardSummaryResponse>('/dashboard/summary', { params: { period } })
      .then((r) => r.data),

  getRecentActivity: (limit = 10) =>
    billsApi
      .get<ActivityEntry[]>('/dashboard/recent-activity', { params: { limit } })
      .then((r) => r.data),

  getClientWise: () =>
    billsApi
      .get<{ client_name: string; total_received: number; total_delivered: number; total_pending: number; total_mismatches: number; total_billed: number; paid_amount: number; outstanding: number; gate_pass_count: number }[]>('/reports/client-wise')
      .then((r) => r.data),

  getItemWise: () =>
    billsApi
      .get<{ item_name: string; total_received: number; total_delivered: number; pending: number; mismatch_count: number; client_count: number }[]>('/reports/item-wise')
      .then((r) => r.data),
}
