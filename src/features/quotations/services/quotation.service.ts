import axios from 'axios'
import api from '../../../api/api'
import type { Quotation, QuotationPayload, OrderStatus, GarmentTag } from '../../../types/quotation'
import {
  responseSizeGuard, stableKey, timeoutMessage,
} from '../../feature-pack/utils'

const API_TIMEOUT_MS = 10_000

/**
 * Every list/detail response passes through here before it can reach a table.
 * An implausibly large payload is a data-layer fault, not something a renderer
 * should try to survive; timeouts get a message that reassures the operator
 * their unsaved form is still intact.
 */
async function guarded<T>(request: Promise<{ data: unknown }>): Promise<T> {
  try {
    const response = await request
    if (!responseSizeGuard(response.data)) {
      throw new Error('The server returned an unexpectedly large response. Narrow the list and retry.')
    }
    return response.data as T
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    const timedOut =
      (axios.isAxiosError(error) && error.code === 'ECONNABORTED') ||
      status === 408 ||
      status === 504
    if (timedOut) throw new Error(timeoutMessage(API_TIMEOUT_MS))
    throw error
  }
}

async function getAllQuotations(): Promise<Quotation[]> {
  return guarded<Quotation[]>(api.get('/quotations', { timeout: API_TIMEOUT_MS }))
}

async function getQuotation(id: string): Promise<Quotation> {
  return guarded<Quotation>(api.get(`/quotations/${id}`, { timeout: API_TIMEOUT_MS }))
}

async function createQuotation(payload: QuotationPayload): Promise<Quotation> {
  // The key is derived from the payload, so a retry after a lost response is
  // recognised as the same logical write instead of creating a duplicate.
  return guarded<Quotation>(
    api.post('/quotations', payload, {
      timeout: API_TIMEOUT_MS,
      headers: { 'Idempotency-Key': stableKey({ kind: 'quotation:create', payload }) },
    }),
  )
}

async function updateQuotation(id: string, payload: QuotationPayload): Promise<Quotation> {
  return guarded<Quotation>(api.put(`/quotations/${id}`, payload, { timeout: API_TIMEOUT_MS }))
}

async function deleteQuotation(id: string): Promise<{ message: string }> {
  return guarded<{ message: string }>(api.delete(`/quotations/${id}`, { timeout: API_TIMEOUT_MS }))
}

async function advanceStatus(
  id: string,
  status: OrderStatus,
  note?: string,
): Promise<Quotation> {
  return guarded<Quotation>(
    api.post(`/quotations/${id}/status`, { status, note }, { timeout: API_TIMEOUT_MS }),
  )
}

interface TagsResponse {
  quotation_id: string | number
  tags: GarmentTag[]
}

async function createTags(
  id: string,
  body: { count?: number; per_item?: boolean; label?: string },
): Promise<TagsResponse> {
  return guarded<TagsResponse>(
    api.post(`/quotations/${id}/tags`, body, { timeout: API_TIMEOUT_MS }),
  )
}

async function listTags(id: string): Promise<TagsResponse> {
  return guarded<TagsResponse>(api.get(`/quotations/${id}/tags`, { timeout: API_TIMEOUT_MS }))
}

export const quotationService = {
  getAllQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  advanceStatus,
  createTags,
  listTags,
}
