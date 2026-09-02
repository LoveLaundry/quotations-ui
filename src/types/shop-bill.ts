export interface ShopBillItem {
  item_name: string
  specification?: string
  category?: string
  unit_price: number
  quantity: number
  line_total: number
}

export interface ShopBill {
  id: string
  bill_number: string
  client_name: string
  quotation_id?: string
  items: ShopBillItem[]
  total_quantity: number
  total_amount: number
  discounts: number
  transport_fee: number
  taxes: number
  grand_total: number
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
  payment_status: 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'
  paid_amount: number
  outstanding_amount: number
  notes?: string
  delivery_date?: string
  tags?: { tag_id: string; qr_data: string; status: string }[]
  created_at: string
  updated_at: string
}

export interface ShopBillCreate {
  bill_number?: string
  client_name: string
  quotation_id?: string
  items: Omit<ShopBillItem, 'line_total'>[]
  notes?: string
  delivery_date?: string
  discounts?: number
  transport_fee?: number
  taxes?: number
}

export interface ShopBillListParams {
  client_name?: string
  status?: string
  payment_status?: string
  search?: string
  skip?: number
  limit?: number
}

export interface ShopBillPayment {
  amount: number
  payment_method: string
  payment_date: string
  reference?: string
  notes?: string
}
