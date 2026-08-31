import billsApi from '../../../api/bills-api'
import type { Bill, BillPayload, BillListParams, BillListResponse } from '../../../types/bill'

async function createBill(payload: BillPayload): Promise<Bill> {
  const response = await billsApi.post<Bill>('/bills', payload)
  return response.data
}

async function getBills(params: BillListParams = {}): Promise<BillListResponse> {
  const response = await billsApi.get<BillListResponse>('/bills', { params })
  return response.data
}

async function getBill(id: string): Promise<Bill> {
  const response = await billsApi.get<Bill>(`/bills/${id}`)
  return response.data
}

async function deleteBill(id: string): Promise<{ message: string }> {
  const response = await billsApi.delete<{ message: string }>(`/bills/${id}`)
  return response.data
}

async function editBill(id: string, payload: Partial<BillPayload>): Promise<Bill> {
  const response = await billsApi.patch<Bill>(`/bills/${id}`, payload)
  return response.data
}

export const billService = { createBill, getBills, getBill, deleteBill, editBill }