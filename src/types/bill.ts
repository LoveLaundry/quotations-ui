export interface BillItem {
  item_name: string
  category?: string
  unit_price: number
  quantity: number
  line_total: number
}

export interface Bill {
  id: string
  quotation_id: string
  client_name: string
  quotation_title?: string
  items: BillItem[]
  total_quantity: number
  total_amount: number
  paid_amount?: number
  outstanding_amount?: number
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  notes?: string
  created_at: string
  updated_at?: string
}

export interface BillPayload {
  quotation_id: string
  client_name: string
  quotation_title?: string
  items: Array<{
    item_name: string
    category?: string
    unit_price: number
    quantity: number
  }>
  notes?: string
}

export interface BillListParams {
  search?: string
  client_name?: string
  quotation_id?: string
  date_from?: string
  date_to?: string
  skip?: number
  limit?: number
}

export interface BillListResponse {
  items: Bill[]
  total: number
}