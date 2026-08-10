import billsApi from '../../../api/bills-api'
import type { Delivery, DeliveryCreate } from '../../../types/operations'

export const deliveries = {
    list: (params?: { client_name?: string; gate_pass_id?: string }) =>
        billsApi.get<Delivery[]>('/deliveries', { params }).then((r: any) => r.data),

    get: (id: string) =>
        billsApi.get<Delivery>(`/deliveries/${id}`).then((r: any) => r.data),

    create: (data: DeliveryCreate) =>
        billsApi.post<Delivery>('/deliveries', data).then((r: any) => r.data),
}
