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
