import billsApi from '../../../api/bills-api'
import { idempotencyKey } from '../../../lib/idempotency'
import type {
    BalanceAdjustment,
    BalanceAdjustmentCreate,
    Delivery,
    DeliveryBalanceReport,
    DeliveryCreate,
} from '../../../types/operations'

function toISODatetime(dateStr: string): string {
    // If already a full datetime string, return as-is
    if (dateStr.includes('T')) return dateStr
    // Convert plain date "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00"
    return `${dateStr}T00:00:00`
}

export interface PendingGatePassItem {
    item_name: string
    specification: string
    category: string
    received_qty: number
    delivered_qty: number
    returned_qty: number
    pending_qty: number
    /** Signed correction folded into `pending_qty`. */
    balance_adjustment_qty: number
}

export interface PendingGatePass {
    gate_pass_id: string
    gate_pass_number: string
    client_name: string
    receiving_date: string
    /** The status the balance engine derives. Never a stale stored label. */
    status: string
    /** What is currently persisted, kept only to surface a mismatch. */
    stored_status: string
    total_pending: number
    /** Signed corrections across the listed items. */
    total_balance_adjusted: number
    items: PendingGatePassItem[]
}

export const deliveries = {
    list: (params?: { client_name?: string; gate_pass_id?: string }): Promise<Delivery[]> =>
        billsApi.get<Delivery[]>('/deliveries', { params }).then(r => r.data),

    get: (id: string) =>
        billsApi.get<Delivery>(`/deliveries/${id}`).then((r: any) => r.data),

    updateDate: (id: string, delivery_date: string, reason?: string) =>
        billsApi.patch<Delivery>(`/deliveries/${id}/date`, { delivery_date: toISODatetime(delivery_date), reason }).then((r: any) => r.data),

    create: async (data: DeliveryCreate) => {
        const payload = {
            ...data,
            delivery_date: toISODatetime(data.delivery_date),
        }
        const key = await idempotencyKey(payload)
        return billsApi.post<Delivery>('/deliveries', payload, {
            headers: { 'X-Idempotency-Key': key },
        }).then((r: any) => r.data)
    },

    pendingGatePasses: (clientName?: string) =>
        billsApi.get<PendingGatePass[]>('/deliveries/pending-gatepasses', {
            params: clientName ? { client_name: clientName } : {},
        }).then((r: any) => r.data),

    balanceReport: (deliveryId: string) =>
        billsApi.get<DeliveryBalanceReport>(`/deliveries/${deliveryId}/balance-report`)
            .then(r => r.data),

    adjustments: (params: { gate_pass_id?: string; delivery_id?: string }) =>
        billsApi.get<BalanceAdjustment[]>('/balance-adjustments', { params }).then(r => r.data),

    createAdjustment: async (data: BalanceAdjustmentCreate) => {
        const key = await idempotencyKey(data)
        return billsApi.post<BalanceAdjustment>('/balance-adjustments', data, {
            headers: { 'X-Idempotency-Key': key },
        }).then(r => r.data)
    },

    voidAdjustment: (id: string, reason: string) =>
        billsApi.post<{ id: string; status: string }>(
            `/balance-adjustments/${id}/void`,
            null,
            { params: { reason } },
        ).then(r => r.data),
}
