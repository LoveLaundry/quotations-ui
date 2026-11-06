import billsApi from '../../../api/bills-api'

// ── Adjustments (controlled quantity corrections) ─────────────────────────────
export interface Adjustment {
  id: string
  gate_pass_id: string
  item_name: string
  specification?: string
  original_qty: number
  corrected_qty: number
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED'
  requested_by?: string
  requested_by_id?: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  created_at: string
  updated_at?: string
}

// ── Reconciliation (read-only inconsistency report) ───────────────────────────
export interface ReconciliationIssue {
  code: string
  severity?: string
  message: string
  item_name?: string
  specification?: string
  [key: string]: unknown
}

export interface ReconciliationRow {
  id: string
  gate_pass_number: string
  client_name: string
  status: string
  receiving_date?: string
  legacy_marked: boolean
  totals?: Record<string, number>
  issues: ReconciliationIssue[]
}

export interface ReconciliationResponse {
  items: ReconciliationRow[]
  summary: Record<string, number>
}

// ── Event journal (append-only daily timeline) ────────────────────────────────
export interface ItemDelta {
  item_name: string
  specification?: string
  before?: number
  after?: number
  delta?: number
  /** Backend naming used by journal entries written by the services. */
  qty_before?: number
  qty_after?: number
  qty_delta?: number
}

export interface TransactionEvent {
  id: string
  entity_type: string
  entity_id: string
  event_type: string
  gate_pass_id?: string
  user_id?: string
  user_name?: string
  reason?: string
  item_deltas?: ItemDelta[]
  meta?: Record<string, unknown>
  prev_status?: string
  new_status?: string
  occurred_at: string
}

export const ops = {
  adjustments: {
    list: (params?: { status?: string; gate_pass_id?: string }): Promise<Adjustment[]> =>
      billsApi.get<Adjustment[]>('/adjustments', { params }).then(r => r.data),
    approve: (id: string) =>
      billsApi.post(`/adjustments/${id}/approve`).then(r => r.data),
    reject: (id: string) =>
      billsApi.post(`/adjustments/${id}/reject`).then(r => r.data),
  },
  reconciliation: {
    issues: (params?: { status?: string }): Promise<ReconciliationResponse> =>
      billsApi.get<ReconciliationResponse>('/reconciliation/issues', { params }).then(r => r.data),
  },
  events: {
    list: (params?: {
      date?: string
      date_from?: string
      date_to?: string
      gate_pass_id?: string
      entity_type?: string
      event_type?: string
      limit?: number
    }): Promise<TransactionEvent[]> =>
      billsApi.get<TransactionEvent[]>('/events', { params }).then(r => r.data),
  },
}

// ── Day close (append-only end-of-day snapshot) ───────────────────────────────
export interface DayCloseTotals {
  gate_pass_count: number
  pieces_received: number
  delivery_count: number
  pieces_delivered: number
  pieces_outstanding: number
  pending_adjustments: number
  reconciliation_issues: number
  billed_amount: number
  collected_amount: number
  expenses_amount: number
  outstanding_amount: number
}

export interface DayCloseSnapshot extends TransactionEvent {
  reason?: string
  meta?: { totals?: DayCloseTotals; closed_at?: string }
}

export const dayCloseApi = {
  get: (date: string): Promise<DayCloseSnapshot | null> =>
    billsApi.get<DayCloseSnapshot>('/day-close', { params: { date } }).then(r => r.data ?? null),
  create: (body: { date: string; totals: DayCloseTotals; note?: string }): Promise<DayCloseSnapshot> =>
    billsApi.post<DayCloseSnapshot>('/day-close', body).then(r => r.data),
}

// ── Day money (income/collected/outstanding for one day) ──────────────────────
export interface DayMoney {
  date: string
  bills_created: number
  billed_amount: number
  billed_paid_amount: number
  payments_count: number
  collected_amount: number
  open_bills_count: number
  outstanding_amount: number
}

export const moneyApi = {
  get: (date: string): Promise<DayMoney> =>
    billsApi.get<DayMoney>('/day-money', { params: { date } }).then(r => r.data),
}

// ── Today sheet (single-screen daily entry) ──────────────────────────────────
export interface SheetPassItem {
  item_name: string
  specification?: string
  category?: string
  expected_qty?: number
  received_qty?: number
  delivered_qty?: number
  returned_qty?: number
  available_qty: number
  unit?: string
}

export interface SheetPendingPass {
  gate_pass_id: string
  gate_pass_number: string
  client_name: string
  receiving_date?: string
  status: string
  total_available_qty: number
  deliverable_items: SheetPassItem[]
  items: SheetPassItem[]
}

export interface SheetClient {
  client_name: string
  receives: Array<{ id: string; gate_pass_number?: string; receiving_date?: string; items: Array<{ item_name: string; specification?: string; received_qty: number; unit?: string }> }>
  deliveries: Array<{ id: string; delivery_date?: string; status?: string; items: Array<{ item_name: string; specification?: string; quantity: number; gate_pass_id?: string }> }>
  pending_passes: SheetPendingPass[]
  received_qty: number
  delivered_qty: number
  available_qty: number
}

export interface TodaySheetResponse {
  date: string
  clients: SheetClient[]
}

export interface SheetCommitResult {
  section: 'receive' | 'delivery'
  client_name: string
  ok: boolean
  id?: string
  gate_pass_number?: string
  error?: unknown
}

export const todaySheetApi = {
  get: (date: string): Promise<TodaySheetResponse> =>
    billsApi.get<TodaySheetResponse>('/today-sheet', { params: { date } }).then(r => r.data),
  commit: (body: {
    date: string
    receives: Array<{ client_name: string; items: Array<{ item_name: string; specification?: string; unit?: string; quantity: number; piece_count?: number }>; notes?: string }>
    deliveries: Array<{ client_name: string; items: Array<{ item_name: string; specification?: string; quantity: number; gate_pass_id?: string }>; notes?: string; received_by?: string }>
  }): Promise<{ date: string; results: SheetCommitResult[] }> =>
    billsApi.post('/today-sheet/commit', body).then(r => r.data),
}
