import billsApi from '../../../api/bills-api'
import type { ShopBill, ShopBillCreate, ShopBillListParams, ShopBillPayment } from '../../../types/shop-bill'

export const shopBillService = {
  list: (params?: ShopBillListParams) =>
    billsApi.get<{ items: ShopBill[]; total: number }>('/shop-bills', { params }).then((r: any) => r.data),

  get: (id: string) =>
    billsApi.get<ShopBill>(`/shop-bills/${id}`).then((r: any) => r.data),

  create: (data: ShopBillCreate) =>
    billsApi.post<ShopBill>('/shop-bills', data).then((r: any) => r.data),

  update: (id: string, data: Partial<ShopBill>) =>
    billsApi.patch<ShopBill>(`/shop-bills/${id}`, data).then((r: any) => r.data),

  recordPayment: (id: string, data: ShopBillPayment) =>
    billsApi.post<ShopBill>(`/shop-bills/${id}/payment`, data).then((r: any) => r.data),

  delete: (id: string) =>
    billsApi.delete(`/shop-bills/${id}`).then((r: any) => r.data),
}
