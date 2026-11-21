import authApi from '../../../api/auth-api'
import type { User } from '../../../types/auth'

/**
 * One client for the two platform entity registries. Hotels and shops expose
 * the same contract (`/hotels`, `/shops` with members + status + enter), so a
 * single typed service keeps the pages identical and prevents the endpoints
 * from drifting apart.
 */
export type EntityKind = 'hotels' | 'shops'

export interface RegistryEntity {
  id: string | number
  hotel_id?: string
  shop_id?: string
  hotel_code?: string | null
  shop_code?: string | null
  name: string
  associated_laundry_id: string
  location?: string | null
  address?: string | null
  contact_number?: string | null
  email?: string | null
  logo_url?: string | null
  icon?: string | null
  description?: string | null
  subscription_plan?: string | null
  plan_limits?: string | null
  status: string
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface RegistryMember {
  id?: string | number
  auth_id: string
  user_name?: string
  role?: string
  status?: string
  /** Which identity store supplied this roster row. */
  source?: 'client' | 'staff' | string
  created_at?: string | null
}

export interface RegistryMemberPayload {
  auth_id: string
  role: string
  /** Required only when the portal login does not exist yet. */
  user_name?: string
  password?: string
  email?: string
}

export interface RegistryListParams {
  search?: string
  status?: string
  laundryId?: string
  limit?: number
  offset?: number
}

export interface RegistryPayload {
  code: string
  name: string
  associated_laundry_id: string
  code_field?: string
  location?: string
  address?: string
  contact_number?: string
  email?: string
  icon?: string
  description?: string
  subscription_plan?: string
}

export interface RegistryEnterResponse {
  access_token: string
  token_type: string
  user: User
}

export function entityId(entity: RegistryEntity): string {
  return entity.hotel_id ?? entity.shop_id ?? String(entity.id)
}

export function entityCodeField(kind: EntityKind): 'hotel_code' | 'shop_code' {
  return kind === 'hotels' ? 'hotel_code' : 'shop_code'
}

export function entityService(kind: EntityKind) {
  const root = `/${kind}`

  const toWire = (payload: RegistryPayload) => {
    const codeField = payload.code_field ?? entityCodeField(kind)
    return {
      [kind === 'hotels' ? 'hotel_id' : 'shop_id']: payload.code.trim(),
      [codeField]: payload.code.trim(),
      name: payload.name.trim(),
      associated_laundry_id: payload.associated_laundry_id,
      ...(payload.location ? { location: payload.location.trim() } : {}),
      ...(payload.address ? { address: payload.address.trim() } : {}),
      ...(payload.contact_number ? { contact_number: payload.contact_number.trim() } : {}),
      ...(payload.email ? { email: payload.email.trim() } : {}),
      ...(payload.icon ? { icon: payload.icon } : {}),
      ...(payload.description ? { description: payload.description.trim() } : {}),
      ...(payload.subscription_plan ? { subscription_plan: payload.subscription_plan } : {}),
    }
  }

  return {
    kind,
    label: kind === 'hotels' ? 'Hotel' : 'Shop',

    get: (id: string) =>
      authApi.get<RegistryEntity>(`${root}/${encodeURIComponent(id)}`).then((r) => r.data),

    list: (params: RegistryListParams = {}) =>
      authApi
        .get<{ items: RegistryEntity[]; total: number }>(root, {
          params: {
            search: params.search || undefined,
            status: params.status || undefined,
            laundry_id: params.laundryId || undefined,
            limit: params.limit ?? 20,
            offset: params.offset ?? 0,
          },
        })
        .then((r) => r.data),

    create: (payload: RegistryPayload) =>
      authApi.post<RegistryEntity>(root, toWire(payload)).then((r) => r.data),

    update: (id: string, payload: Partial<RegistryPayload>) => {
      // The update model deliberately does not accept the immutable id or the
      // owning laundry, so only send fields actually present in the form.
      const body: Record<string, string> = {}
      if (payload.code) body[entityCodeField(kind)] = payload.code.trim()
      if (payload.name) body.name = payload.name.trim()
      if (payload.location !== undefined) body.location = payload.location ?? ''
      if (payload.address !== undefined) body.address = payload.address ?? ''
      if (payload.contact_number !== undefined) body.contact_number = payload.contact_number ?? ''
      if (payload.email !== undefined) body.email = payload.email ?? ''
      if (payload.icon !== undefined) body.icon = payload.icon ?? ''
      if (payload.description !== undefined) body.description = payload.description ?? ''
      if (payload.subscription_plan !== undefined) body.subscription_plan = payload.subscription_plan ?? ''
      return authApi.put<RegistryEntity>(`${root}/${encodeURIComponent(id)}`, body).then((r) => r.data)
    },

    setStatus: (id: string, status: string) =>
      authApi
        .post<RegistryEntity>(`${root}/${encodeURIComponent(id)}/status`, { status })
        .then((r) => r.data),

    members: (id: string) =>
      authApi.get<RegistryMember[]>(`${root}/${encodeURIComponent(id)}/members`).then((r) => r.data),

    addMember: (id: string, payload: RegistryMemberPayload) =>
      authApi
        .post<RegistryMember>(`${root}/${encodeURIComponent(id)}/members`, payload)
        .then((r) => r.data),

    removeMember: (id: string, authId: string) =>
      authApi.delete(`${root}/${encodeURIComponent(id)}/members/${encodeURIComponent(authId)}`).then((r) => r.data),

    enter: (id: string) =>
      authApi
        .post<RegistryEnterResponse>(`${root}/${encodeURIComponent(id)}/enter`)
        .then((r) => r.data),
  }
}

export const hotelRegistry = entityService('hotels')
export const shopRegistry = entityService('shops')
