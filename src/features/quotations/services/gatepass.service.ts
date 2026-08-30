import billsApi from '../../../api/bills-api'
import type { GatePass, GatePassCreate } from '../../../types/operations'

function toISODatetime(dateStr: string): string {
    if (dateStr.includes('T')) return dateStr
    return `${dateStr}T00:00:00`
}

export const gatepasses = {
    list: (params?: { client_name?: string; status?: string }) =>
        billsApi.get<GatePass[]>('/gatepasses', { params }).then((r: any) => r.data),

    get: (id: string) =>
        billsApi.get<GatePass>(`/gatepasses/${id}`).then((r: any) => r.data),

    create: (data: GatePassCreate) => {
        const payload = {
            ...data,
            receiving_date: toISODatetime(data.receiving_date),
        }
        return billsApi.post<GatePass>('/gatepasses', payload).then((r: any) => r.data)
    },

    updateStatus: (id: string, status: string) =>
        billsApi.patch<GatePass>(`/gatepasses/${id}/status`, null, { params: { status_update: status } }).then((r: any) => r.data),

    adjust: (id: string, item_name: string, corrected_qty: number, reason: string) =>
        billsApi.post<GatePass>(`/gatepasses/${id}/adjust`, { item_name, corrected_qty, reason }).then((r: any) => r.data),

    updateDate: (id: string, receiving_date: string, reason?: string) =>
        billsApi.patch<GatePass>(`/gatepasses/${id}/date`, { receiving_date: toISODatetime(receiving_date), reason }).then((r: any) => r.data),

    update: (
        id: string,
        payload: {
            client_name?: string
            received_by?: string
            notes?: string
            items?: Array<{
                item_name: string
                category?: string | null
                client_qty: number
                received_qty: number
                mismatch_reason?: string | null
                mismatch_notes?: string | null
            }>
        },
    ) =>
        billsApi.patch<GatePass>(`/gatepasses/${id}`, payload).then((r: any) => r.data),

    createBillFromGatePass: (
        gate_pass_id: string,
        data: { instant?: boolean; notes?: string; quotation_id?: string; client_name?: string },
    ) =>
        billsApi.post('/bills', {
            gate_pass_id,
            instant: data.instant ?? false,
            notes: data.notes,
            quotation_id: data.quotation_id,
            client_name: data.client_name,
        }).then((r: any) => r.data),
}

