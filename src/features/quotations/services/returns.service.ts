import billsApi from '../../../api/bills-api'
import type { Return, ReturnCreate } from '../../../types/operations'

export const returns = {
  list: (params?: { client_name?: string; status?: string; gate_pass_id?: string; skip?: number; limit?: number }) =>
    billsApi.get<{ items: Return[]; total: number }>('/returns', { params }).then((r: any) => r.data),

  get: (returnId: string) =>
    billsApi.get<Return>(`/returns/${returnId}`).then((r: any) => r.data),

  create: (data: ReturnCreate) =>
    billsApi.post<Return>('/returns', data).then((r: any) => r.data),

  update: (returnId: string, data: Partial<Return>) =>
    billsApi.patch<Return>(`/returns/${returnId}`, data).then((r: any) => r.data),

  summary: () =>
    billsApi.get<{ total: number; pending: number; received: number; processed: number }>('/returns/stats/summary').then((r: any) => r.data),
}
