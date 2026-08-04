export interface Quotation {
  id: string | number
  category: string
  item_name: string
  size: string
  unit_price_with_options: Record<string, number>
  created_at?: string
  updated_at?: string
}

export interface QuotationPayload {
  category: string
  item_name: string
  size: string
  unit_price_with_options: Record<string, number>
}

export interface QuotationFormValues {
  category: string
  item_name: string
  size: string
  options: Array<{ id: string; name: string; price: string }>
}
