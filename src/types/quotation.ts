export interface QuotationLineItem {
  id: string | number
  item_name: string
  category?: string
  unit_price: number
  notes?: string
}

export interface Quotation {
  id: string | number
  client_name: string
  quotation_title?: string
  line_items: QuotationLineItem[]
  created_at?: string
  updated_at?: string
  status?: 'draft' | 'sent' | 'accepted' | 'archived'
}

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
