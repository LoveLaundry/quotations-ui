import billsApi from '../../../api/bills-api'
import type { DashboardSummaryResponse } from '../hooks/useBusinessDashboard'

export const dashboardApi = {
  getSummary: (period: string) =>
    billsApi
      .get<DashboardSummaryResponse>('/dashboard/summary', { params: { period } })
      .then((r) => r.data),
}
