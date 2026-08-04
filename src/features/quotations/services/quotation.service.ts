import api from '../../../api/api'
import type { Quotation, QuotationPayload } from '../../../types/quotation'

async function getAllQuotations(): Promise<Quotation[]> {
  const response = await api.get<Quotation[]>('/quotations')
  return response.data
}

async function getQuotation(id: string): Promise<Quotation> {
  const response = await api.get<Quotation>(`/quotations/${id}`)
  return response.data
}

async function createQuotation(payload: QuotationPayload): Promise<Quotation> {
  const response = await api.post<Quotation>('/quotations', payload)
  return response.data
}

async function updateQuotation(id: string, payload: QuotationPayload): Promise<Quotation> {
  const response = await api.put<Quotation>(`/quotations/${id}`, payload)
  return response.data
}

async function deleteQuotation(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/quotations/${id}`)
  return response.data
}

export const quotationService = { getAllQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation }
