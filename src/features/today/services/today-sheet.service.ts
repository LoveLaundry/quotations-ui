import billsApi from '../../../api/bills-api'
import type { AvailabilityGatePass } from '../../../types/operations'

/** One received line already recorded for this day. */
export interface TodaySheetItemLine {
    item_name: string
    specification?: string | null
    unit?: string | null
    quantity: number
}

export interface TodaySheetReceiveRecord {
    gate_pass_id: string
    gate_pass_number: string
    received_by: string
    items: TodaySheetItemLine[]
}

export interface TodaySheetDeliveryRecord {
    delivery_id: string
    received_by: string
    items: Array<TodaySheetItemLine & { gate_pass_id?: string }>
}

export interface TodaySheetClient {
    client_name: string
    available_qty: number
    pending_passes: AvailabilityGatePass[]
    receives: TodaySheetReceiveRecord[]
    deliveries: TodaySheetDeliveryRecord[]
}

export interface TodaySheetTotals {
    clients: number
    pending_passes: number
    available_qty: number
    received_lines: number
    received_qty: number
    delivery_lines: number
    delivered_qty: number
}

export interface TodaySheetResponse {
    date: string
    clients: TodaySheetClient[]
    totals: TodaySheetTotals
}

export interface TodaySheetReceiveInput {
    client_name: string
    items: Array<{
        item_name: string
        specification?: string | null
        unit?: string | null
        quantity: number
    }>
    received_by?: string | null
}

export interface TodaySheetDeliveryInput {
    client_name: string
    items: Array<{
        item_name: string
        specification?: string | null
        quantity: number
        /** Omit (or leave empty) for server-side AUTO/FIFO allocation. */
        gate_pass_id?: string | null
    }>
    received_by?: string | null
}

export interface TodaySheetCommitPayload {
    date: string
    receives: TodaySheetReceiveInput[]
    deliveries: TodaySheetDeliveryInput[]
}

export interface TodaySheetCommitResult {
    kind: 'receive' | 'delivery'
    client_name: string
    ok: boolean
    id?: string
    ids?: string[]
    gate_pass_number?: string
    quantity?: number
    error?: string
}

export interface TodaySheetCommitResponse {
    date: string
    results: TodaySheetCommitResult[]
    summary: {
        groups: number
        succeeded: number
        failed: number
        received_qty: number
        delivered_qty: number
    }
}

export interface TodayExpenseRecord {
    id?: string
    date?: string
    category_name?: string
    description?: string
    amount: number | string
    client_name?: string | null
    allocation?: 'SHOP' | 'SHARED'
}

export interface TodayExpenseInput {
    date: string
    category_name: string
    amount: number
    client_name: string | null
    allocation: 'SHOP' | 'SHARED'
}

export const todaySheetApi = {
    get: (date: string): Promise<TodaySheetResponse> =>
        billsApi.get<TodaySheetResponse>('/today-sheet', { params: { date } }).then(r => r.data),

    commit: (payload: TodaySheetCommitPayload): Promise<TodaySheetCommitResponse> =>
        billsApi.post<TodaySheetCommitResponse>('/today-sheet/commit', payload).then(r => r.data),
}
