// ── Gate Pass ────────────────────────────────────────────────────────────────
export interface GatePassItem {
    item_name: string
    category?: string
    client_qty: number
    received_qty: number
    difference: number
    mismatch_reason?: string
    mismatch_notes?: string
}

export interface GatePass {
    _id: string
    gate_pass_number: string
    client_name: string
    receiving_date: string
    received_by: string
    items: GatePassItem[]
    status: 'RECEIVED' | 'PROCESSING' | 'READY_FOR_DELIVERY' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED'
    notes?: string
    adjustments?: object[]
    created_at: string
    updated_at: string
}

export interface GatePassCreate {
    gate_pass_number: string
    client_name: string
    receiving_date: string
    received_by: string
    items: GatePassItem[]
    notes?: string
    quotation_id?: string
}

// ── Delivery ─────────────────────────────────────────────────────────────────
export interface DeliveryItem {
    item_name: string
    quantity: number
}

export interface Delivery {
    _id: string
    gate_pass_id: string
    client_name: string
    delivery_date: string
    delivered_by: string
    received_by: string
    items: DeliveryItem[]
    status: string
    notes?: string
    created_at: string
}

export interface DeliveryCreate {
    gate_pass_id: string
    client_name: string
    delivery_date: string
    delivered_by: string
    received_by: string
    items: DeliveryItem[]
    notes?: string
}

// ── Payment ───────────────────────────────────────────────────────────────────
export interface Payment {
    _id: string
    bill_id: string
    client_name: string
    amount: number
    payment_method: string
    payment_date: string
    reference?: string
    notes?: string
    created_at: string
}

export interface PaymentCreate {
    amount: number
    payment_method: string
    payment_date: string
    reference?: string
    notes?: string
}

// ── Dashboard / Reports ───────────────────────────────────────────────────────
export interface ClientSummaryStats {
    total_gate_passes: number
    total_items_received: number
    total_items_delivered: number
    pending_items: number
    open_mismatches: number
    pending_bills: number
    total_billed: number
    total_paid: number
    outstanding_amount: number
}

export interface ClientSummary {
    stats: ClientSummaryStats
    gatepasses: GatePass[]
    deliveries: Delivery[]
    mismatches: object[]
    pending_balances: { item_name: string; received: number; delivered: number; pending: number }[]
    bills: object[]
    payments: Payment[]
}
