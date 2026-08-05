// ── Core types matching the real business model ──────────────────────────────

/** Line item within a quotation (e.g. "Bed Sheet - 125.00 LKR") */
export interface QuotationLineItem {
  id: string | number
  item_name: string           // e.g. "Bed Sheet", "Bath Towel"
  category?: string            // Optional grouping (e.g. "Linens", "Clothing")
  unit_price: number          // Single price in LKR
  notes?: string              // Optional (e.g. "(S, D)", "(Gold/Brown)")
}

/** Full quotation document for a client/hotel */
export interface Quotation {
  id: string | number
  client_name: string         // e.g. "Nilawin Hotel", "Avenra Garden Hotel"
  quotation_title?: string    // Optional custom title
  line_items: QuotationLineItem[]
  created_at?: string
  updated_at?: string
  status?: 'draft' | 'sent' | 'accepted' | 'archived'
}

/** Payload for creating/updating a quotation */
export interface QuotationPayload {
  client_name: string
  quotation_title?: string
  line_items: Array<{
    item_name: string
    category?: string
    unit_price: number
    notes?: string
  }>
  status?: 'draft' | 'sent' | 'accepted' | 'archived'
}

/** Form values for quotation creation/editing */
export interface QuotationFormValues {
  client_name: string
  quotation_title: string
  line_items: Array<{
    id: string
    item_name: string
    category: string
    unit_price: string
    notes: string
  }>
}
