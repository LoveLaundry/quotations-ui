import billsApi from '../../../api/bills-api'
import type { Delivery, DeliveryCreate } from '../../../types/operations'

function toISODatetime(dateStr: string): string {
    // If already a full datetime string, return as-is
    if (dateStr.includes('T')) return dateStr
    // Convert plain date "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00"
    return `${dateStr}T00:00:00`
}

export const deliveries = {
    list: (params?: { client_name?: string; gate_pass_id?: string }) =>
        billsApi.get<Delivery[]>('/deliveries', { params }).then((r: any) => r.data),

    get: (id: string) =>
        billsApi.get<Delivery>(`/deliveries/${id}`).then((r: any) => r.data),

    create: (data: DeliveryCreate) => {
        const payload = {
            ...data,
            delivery_date: toISODatetime(data.delivery_date),
        }
        return billsApi.post<Delivery>('/deliveries', payload).then((r: any) => r.data)
    },
}
