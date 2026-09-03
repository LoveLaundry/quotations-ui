import billsApi from '../../../api/bills-api'
import type { ShopBill, ShopBillCreate, ShopBillListParams, ShopBillPayment, BillTemplate, BillTemplateCreate } from '../../../types/shop-bill'

export const shopBillService = {
  list: (params?: ShopBillListParams) =>
    billsApi.get<{ items: ShopBill[]; total: number }>('/shop-bills', { params }).then((r: any) => r.data),

  get: (id: string) =>
    billsApi.get<ShopBill>(`/shop-bills/${id}`).then((r: any) => r.data),

  create: (data: ShopBillCreate) =>
    billsApi.post<ShopBill>('/shop-bills', data).then((r: any) => r.data),

  update: (id: string, data: Record<string, any>) =>
    billsApi.patch<ShopBill>(`/shop-bills/${id}`, data).then((r: any) => r.data),

  recordPayment: (id: string, data: ShopBillPayment) =>
    billsApi.post<ShopBill>(`/shop-bills/${id}/payment`, data).then((r: any) => r.data),

  delete: (id: string) =>
    billsApi.delete(`/shop-bills/${id}`).then((r: any) => r.data),

  // Feature 1: Duplicate
  duplicate: (id: string) =>
    billsApi.post<ShopBill>(`/shop-bills/${id}/duplicate`).then((r: any) => r.data),

  // Feature 2: Notes History
  getNotesHistory: (id: string) =>
    billsApi.get<{ notes_history: any[] }>(`/shop-bills/${id}/notes-history`).then((r: any) => r.data),

  // Feature 3: Bulk Status
  bulkStatus: (billIds: string[], status: string) =>
    billsApi.post<{ updated: number }>('/shop-bills/bulk-status', { bill_ids: billIds, status }).then((r: any) => r.data),

  // Feature 4: Templates
  listTemplates: (search?: string) =>
    billsApi.get<{ items: BillTemplate[]; total: number }>('/shop-bills/templates', { params: { search } }).then((r: any) => r.data),

  getTemplate: (id: string) =>
    billsApi.get<BillTemplate>(`/shop-bills/templates/${id}`).then((r: any) => r.data),

  createTemplate: (data: BillTemplateCreate) =>
    billsApi.post<BillTemplate>('/shop-bills/templates', data).then((r: any) => r.data),

  deleteTemplate: (id: string) =>
    billsApi.delete(`/shop-bills/templates/${id}`).then((r: any) => r.data),

  // Feature 5: Quick Bill
  quickBill: (clientName: string, templateId?: string) =>
    billsApi.post<ShopBill>('/shop-bills/quick', null, { params: { client_name: clientName, template_id: templateId } }).then((r: any) => r.data),

  // Feature 5b: Manual Bill (old/legacy services — just amount + date)
  manualBill: (clientName: string, amount: number, date?: string, notes?: string) =>
    billsApi.post<ShopBill>('/shop-bills/manual', null, {
      params: { client_name: clientName, amount, date: date || undefined, notes: notes || undefined },
    }).then((r: any) => r.data),

  // Feature 6: Split
  split: (billId: string, itemIndices: number[]) =>
    billsApi.post<ShopBill>(`/shop-bills/${billId}/split`, { item_indices: itemIndices }).then((r: any) => r.data),

  // Feature 7: Merge
  merge: (billIds: string[]) =>
    billsApi.post<ShopBill>('/shop-bills/merge', { bill_ids: billIds }).then((r: any) => r.data),

  // Feature 8: Recurring
  makeRecurring: (billId: string, interval: string, endDate?: string) =>
    billsApi.post<ShopBill>(`/shop-bills/${billId}/make-recurring`, null, { params: { interval, end_date: endDate } }).then((r: any) => r.data),

  getRecurringDue: () =>
    billsApi.get<{ items: any[]; total: number }>('/shop-bills/recurring/due').then((r: any) => r.data),

  // Feature 9: Expiry
  getExpiring: (days: number = 7) =>
    billsApi.get<{ items: ShopBill[]; total: number }>('/shop-bills/expiring', { params: { days } }).then((r: any) => r.data),

  expireOld: (maxDays: number = 30) =>
    billsApi.post<{ expired: number }>('/shop-bills/expire-old', null, { params: { max_days: maxDays } }).then((r: any) => r.data),
}
