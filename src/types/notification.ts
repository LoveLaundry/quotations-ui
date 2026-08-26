import type { Quotation } from './quotation'

export type NotificationType = 'gatepass_pending' | 'quotation_accepted'

export interface GatePassPendingEntry {
  gate_pass_id: string
  gate_pass_number: string
  client_name: string
  item_name: string
  received: number
  delivered: number
  pending: number
}

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  count: number
  route: string
  gatePassItems?: GatePassPendingEntry[]
  quotations?: Quotation[]
}
