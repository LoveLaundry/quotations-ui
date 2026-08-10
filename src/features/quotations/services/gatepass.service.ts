import billsApi from '../../../api/bills-api'
import type { GatePass, GatePassCreate } from '../../../types/operations'

export const gatepasses = {
    list: (params?: { client_name?: string; status?: string }) =>
        billsApi.get<GatePass[]>('/gatepasses', { params }).then((r: any) => r.data),

    get: (id: string) =>
        billsApi.get<GatePass>(`/gatepasses/${id}`).then((r: any) => r.data),

    create: (data: GatePassCreate) =>
        billsApi.post<GatePass>('/gatepasses', data).then((r: any) => r.data),

    updateStatus: (id: string, status: string) =>
        billsApi.patch<GatePass>(`/gatepasses/${id}/status`, null, { params: { status_update: status } }).then((r: any) => r.data),

    adjust: (id: string, item_name: string, corrected_qty: number, reason: string) =>
        billsApi.post<GatePass>(`/gatepasses/${id}/adjust`, { item_name, corrected_qty, reason }).then((r: any) => r.data),
}
