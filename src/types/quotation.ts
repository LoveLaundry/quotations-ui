export interface QuotationSpecification {
  specification: string
  unit_price: number
}

export interface QuotationLineItem {
  id: string | number
  item_name: string
  category?: string
  unit_price: number
  notes?: string
  specifications?: QuotationSpecification[]
}

export type OrderStatus =
  | 'draft'
  | 'received'
  | 'washing'
  | 'pressing'
  | 'folding'
  | 'packing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'draft',
  'received',
  'washing',
  'pressing',
  'folding',
  'packing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  received: 'Received',
  washing: 'Washing',
  pressing: 'Pressing',
  folding: 'Folding',
  packing: 'Packing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['received', 'cancelled'],
  received: ['washing', 'cancelled'],
  washing: ['pressing', 'cancelled'],
  pressing: ['folding', 'cancelled'],
  folding: ['packing', 'cancelled'],
  packing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  draft: 'bg-[var(--border)] text-[#0A1D3A] border-[var(--border)]',
  received: 'bg-[#E7EAEE] text-[#3A5277] border-[#BCC4D1]',
  washing: 'bg-[#E7EAEE] text-[#3A5277] border-[#BCC4D1]',
  pressing: 'bg-[#F9E7E9] text-[#7D0C14] border-[#EEBDC0]',
  folding: 'bg-[#F9E7E9] text-[#7D0C14] border-[#EEBDC0]',
  packing: 'bg-[#F9E7E9] text-[#7D0C14] border-[#EEBDC0]',
  ready: 'bg-[#E8F2EC] text-[#0E5328] border-[#BDDBC9]',
  out_for_delivery: 'bg-[#E8F2EC] text-[#0E5328] border-[#BDDBC9]',
  delivered: 'bg-[#E8F2EC] text-[#0E5328] border-[#BDDBC9]',
  cancelled: 'bg-[#F9E7E9] text-[#7D0C14] border-[#EEBDC0]',
}

export interface StatusHistoryEntry {
  status: string
  changed_at: string
  changed_by?: string | null
  note?: string | null
}

export interface GarmentTag {
  id: string | number
  code: string
  quotation_id: string | number
  line_item_id?: string | null
  label?: string | null
  created_at?: string
  tracking_url: string
}

export interface Quotation {
  id: string | number
  client_name: string
  quotation_title?: string
  line_items: QuotationLineItem[]
  created_at?: string
  updated_at?: string
  status?: OrderStatus
  status_history?: StatusHistoryEntry[]
  tag?: 'shop' | 'hotel'
}

export interface QuotationPayload {
  client_name: string
  quotation_title?: string
  line_items: Array<{
    item_name: string
    category?: string
    unit_price: number
    notes?: string
    specifications?: Array<{ specification: string; unit_price: number }>
  }>
  status?: OrderStatus
  tag?: 'shop' | 'hotel'
}

export interface QuotationFormValues {
  client_name: string
  quotation_title: string
  tag: 'shop' | 'hotel'
  line_items: Array<{
    id: string
    item_name: string
    category: string
    unit_price: string
    notes: string
    specifications: Array<{ specification: string; unit_price: string }>
  }>
}
