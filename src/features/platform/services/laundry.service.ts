import authApi from '../../../api/auth-api'
import type { Laundry, LaundryMembership, User } from '../../../types/auth'

export interface LaundryListParams {
  search?: string
  status?: string
  limit?: number
  offset?: number
}

export interface LaundryListResponse {
  items: Laundry[]
  total: number
}

export interface LaundryPayload {
  laundry_id: string
  name: string
  br_number?: string
  location?: string
  address?: string
  contact_number?: string
  email?: string
  logo_url?: string
  icon?: string
  description?: string
  subscription_plan?: string
  plan_limits?: string
}

export interface ClientAccount {
  id: string
  laundry_id: string
  client_type: 'HOTEL' | 'SHOP'
  client_name: string
  auth_id: string
  user_name?: string
  email?: string
  role_id: string
  status: string
  created_at?: string
}

export interface ClientCreatePayload {
  laundry_id: string
  client_type: 'HOTEL' | 'SHOP'
  client_name: string
  auth_id: string
  user_name: string
  password: string
  email?: string
  role: 'HOTEL_ADMIN' | 'SHOP_ADMIN' | 'HOTEL_MANAGER' | 'SHOP_STAFF'
}

export const laundryService = {
  list: (params: LaundryListParams = {}) =>
    authApi.get<LaundryListResponse>('/laundries', { params }).then((r) => r.data),

  get: (id: string) => authApi.get<Laundry>(`/laundries/${id}`).then((r) => r.data),

  create: (payload: LaundryPayload) =>
    authApi.post<Laundry>('/laundries', payload).then((r) => r.data),

  update: (id: string, payload: Partial<LaundryPayload>) =>
    authApi.put<Laundry>(`/laundries/${id}`, payload).then((r) => r.data),

  setStatus: (id: string, status: string) =>
    authApi.post<Laundry>(`/laundries/${id}/status`, { status }).then((r) => r.data),

  members: (id: string) =>
    authApi.get<LaundryMembership[]>(`/laundries/${id}/members`).then((r) => r.data),

  addMember: (id: string, payload: { auth_id: string; role: string }) =>
    authApi.post<LaundryMembership>(`/laundries/${id}/members`, payload).then((r) => r.data),

  removeMember: (id: string, authId: string) =>
    authApi.delete(`/laundries/${id}/members/${encodeURIComponent(authId)}`).then((r) => r.data),

  clients: (laundryId: string) =>
    authApi.get<{ items: ClientAccount[] }>('/clients', { params: { laundry_id: laundryId } }).then((r) => r.data.items),

  createClient: (payload: ClientCreatePayload) =>
    authApi.post<ClientAccount>('/clients', payload).then((r) => r.data),

  setClientStatus: (clientId: string, status: string) =>
    authApi.patch<ClientAccount>(`/clients/${clientId}/status`, { status }).then((r) => r.data),

  enter: (id: string) =>
    authApi
      .post<{ access_token: string; token_type: string; user: User }>(`/laundries/${id}/enter`)
      .then((r) => r.data),

  switch: (laundryId: string) =>
    authApi
      .post<{ access_token: string; token_type: string; user: User }>('/auth/laundry', {
        laundry_id: laundryId,
      })
      .then((r) => r.data),
}
