import billsApi from '../../../api/bills-api'
import { newIdempotencyKey } from '../../../lib/idempotency'
import type { Bill, BillPayload, BillListParams, BillListResponse, UnbilledGatePass } from '../../../types/bill'

async function createBill(payload: BillPayload): Promise<Bill> {
  // Submission-scoped, not a hash of the body: two invoices built from the
  // same gate passes are two invoices, and a body hash made the second one
  // return the first while reporting success.
  const response = await billsApi.post<Bill>('/bills', payload, {
    headers: { 'X-Idempotency-Key': newIdempotencyKey() },
  })
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

async function getUnbilledGatePasses(client_name?: string): Promise<UnbilledGatePass[]> {
  const response = await billsApi.get<UnbilledGatePass[]>('/bills/unbilled-gatepasses', {
    params: client_name ? { client_name } : {},
  })
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

export const billService = { createBill, getBills, getBill, getUnbilledGatePasses, deleteBill, editBill }