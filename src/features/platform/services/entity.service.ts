import authApi from '../../../api/auth-api'

export type EntityKind = 'shop' | 'hotel'
export type EntityStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'

export interface PlatformEntity {
  id: string
  shop_id?: string
  hotel_id?: string
  name: string
  shop_code?: string | null
  hotel_code?: string | null
  location?: string | null
  address?: string | null
  contact_number?: string | null
  email?: string | null
  logo_url?: string | null
  icon?: string | null
  description?: string | null
  subscription_plan?: string | null
  plan_limits?: string | null
  associated_laundry_id: string
  status: EntityStatus | string
  created_at?: string | null
  updated_at?: string | null
}

export interface EntityListResponse {
  items: PlatformEntity[]
  total: number
}

export interface EntityPayload {
  shop_id?: string
  hotel_id?: string
  name: string
  shop_code?: string
  hotel_code?: string
  location?: string
  address?: string
  contact_number?: string
  email?: string
  logo_url?: string
  icon?: string
  description?: string
  subscription_plan?: string
  plan_limits?: string
  associated_laundry_id: string
  admin_auth_id?: string
  admin_user_name?: string
  admin_password?: string
  admin_email?: string
}

export interface EntityMember {
  id: string
  auth_id: string
  user_name?: string | null
  shop_id?: string
  hotel_id?: string
  role?: string | null
  status?: string | null
  created_at?: string | null
}

function base(kind: EntityKind) {
  return kind === 'shop' ? '/shops' : '/hotels'
}

export const entityService = {
  list: (kind: EntityKind, params: { search?: string; status?: string; laundry_id?: string; limit?: number; offset?: number } = {}) =>
    authApi.get<EntityListResponse>(base(kind), { params }).then((r) => r.data),
  create: (kind: EntityKind, payload: EntityPayload) =>
    authApi.post<PlatformEntity>(base(kind), payload).then((r) => r.data),
  update: (kind: EntityKind, id: string, payload: Partial<EntityPayload>) =>
    authApi.put<PlatformEntity>(`${base(kind)}/${encodeURIComponent(id)}`, payload).then((r) => r.data),
  setStatus: (kind: EntityKind, id: string, status: EntityStatus) =>
    authApi.post<PlatformEntity>(`${base(kind)}/${encodeURIComponent(id)}/status`, { status }).then((r) => r.data),
  members: (kind: EntityKind, id: string) =>
    authApi.get<EntityMember[]>(`${base(kind)}/${encodeURIComponent(id)}/members`).then((r) => r.data),
  addMember: (kind: EntityKind, id: string, payload: { auth_id: string; role?: string }) =>
    authApi.post<EntityMember>(`${base(kind)}/${encodeURIComponent(id)}/members`, payload).then((r) => r.data),
  createAdmin: (kind: EntityKind, id: string, payload: { auth_id: string; user_name: string; password: string; email?: string; role?: string }) =>
    authApi.post<EntityMember>(`${base(kind)}/${encodeURIComponent(id)}/admins`, payload).then((r) => r.data),
  removeMember: (kind: EntityKind, id: string, authId: string) =>
    authApi.delete(`${base(kind)}/${encodeURIComponent(id)}/members/${encodeURIComponent(authId)}`).then((r) => r.data),
}
