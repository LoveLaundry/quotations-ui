// ── Verification ─────────────────────────────────────────────────────────────
export interface Verification {
    status: 'VERIFIED' | 'SYNCING' | 'PENDING' | 'FAILED'
    verified: boolean
    last_verified_at?: string | null
    main_version?: number
    secondary_version?: number
    error?: string | null
}

// ── Gate Pass ────────────────────────────────────────────────────────────────
export interface GatePassItem {
    item_name: string
    category?: string
    specification?: string
    client_qty: number
    received_qty: number
    difference: number
    mismatch_reason?: string
    mismatch_notes?: string
}

export interface GatePass {
    id: string
    gate_pass_number: string
    client_name: string
    receiving_date: string
    received_by: string
    items: GatePassItem[]
    status: 'RECEIVED' | 'PROCESSING' | 'READY_FOR_DELIVERY' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED'
    notes?: string
    adjustments?: object[]
    quotation_id?: string
    created_at: string
    updated_at: string
    verification?: Verification
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
    specification?: string
    quantity: number
}

export interface Delivery {
    id: string
    gate_pass_id: string
    client_name: string
    delivery_date: string
    delivered_by: string
    received_by: string
    items: DeliveryItem[]
    status: string
    notes?: string
    created_at: string
    verification?: Verification
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

// ── Dispatch (pickup / delivery scheduling) ────────────────────────────────────
export type DispatchStatus =
    | 'SCHEDULED'
    | 'ASSIGNED'
    | 'EN_ROUTE'
    | 'COMPLETED'
    | 'CANCELLED'

export interface DispatchJob {
    id: string
    job_type: 'pickup' | 'delivery'
    order_id?: string | null
    client_name: string
    address?: string | null
    contact_name?: string | null
    contact_phone?: string | null
    scheduled_at?: string | null
    status: DispatchStatus
    assigned_to?: string | null
    latitude?: number | null
    longitude?: number | null
    notes?: string | null
    created_at: string
    updated_at: string
}

export interface DispatchCreate {
    job_type?: 'pickup' | 'delivery'
    order_id?: string
    client_name: string
    address?: string
    contact_name?: string
    contact_phone?: string
    scheduled_at?: string
    assigned_to?: string
    latitude?: number
    longitude?: number
    notes?: string
}

export interface RoutePlan {
    order: string[]
    stops: DispatchJob[]
}

// ── Loyalty ──────────────────────────────────────────────────────────────────
export interface LoyaltyAccount {
    id: string
    client_name: string
    points: number
    tier: string
    visits: number
    created_at: string
    updated_at: string
}

export interface LoyaltyAdjust {
    client_name: string
    delta_points: number
    reason?: string
}

export interface DispatchUpdate {
    status?: DispatchStatus
    assigned_to?: string
    scheduled_at?: string
    notes?: string
}

// ── Payment ───────────────────────────────────────────────────────────────────
export interface Payment {
    id: string
    bill_id: string
    client_name: string
    amount: number
    payment_method: string
    payment_date: string
    reference?: string
    notes?: string
    created_at: string
    verification?: Verification
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
