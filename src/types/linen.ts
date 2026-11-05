export type LinenStatus =
  | 'IN_STOCK' | 'AT_CLIENT' | 'COLLECTED' | 'AT_LAUNDRY'
  | 'WASHING' | 'DRYING' | 'PRESSING' | 'READY'
  | 'DELIVERED' | 'MISSING' | 'DAMAGED' | 'RETIRED'

export type LinenCategory =
  | 'BEDSHEET' | 'PILLOWCASE' | 'TOWEL' | 'DUVET_COVER'
  | 'BATH_MAT' | 'UNIFORM' | 'TABLECLOTH' | 'NAPKIN'
  | 'ROBE' | 'SLIPPER' | 'OTHER'

export type LinenCondition = 'NEW' | 'GOOD' | 'FAIR' | 'WORN' | 'DAMAGED'

export interface Linen {
  id: string
  linen_id: string
  category: string
  item_type: string
  description?: string
  size?: string
  color?: string
  client_name: string
  department?: string
  status: LinenStatus
  condition: LinenCondition
  location?: string
  wash_count: number
  last_washed_date?: string
  last_scanned_date?: string
  retirement_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface LinenEvent {
  id: string
  linen_id: string
  action: string
  from_status?: string
  to_status: string
  location?: string
  user?: string
  related_order?: string
  notes?: string
  timestamp: string
}

export interface LinenListResponse {
  items: Linen[]
  total: number
}

/**
 * The post-change row carried by a socket event.
 *
 * Deliberately narrower than `Linen`: it holds only the fields a screen can
 * render differently after a scan, so one event stays small enough to ship on
 * every tag at a busy station instead of triggering a refetch.
 */
export interface LinenSnapshot {
  id: string
  linen_id: string
  status: LinenStatus | string
  previous_status: string | null
  category?: string
  item_type?: string
  client_name?: string
  condition?: string
  location?: string | null
  wash_count?: number
  last_washed_date?: string | null
  last_scanned_date?: string | null
  retirement_date?: string | null
  updated_at?: string | null
}

export type LinenRealtimeEventName =
  | 'scan'
  | 'create'
  | 'create_bulk'
  | 'generate_tags'
  | 'update'
  | 'delete'
  | 'bulk_scan'

/** One frame from `/ws/linen` (`type: "linen.event"`). */
export interface LinenRealtimeEvent {
  type: 'linen.event'
  event: LinenRealtimeEventName
  laundry_id: string
  clock: number
  at: string
  action?: string | null
  actor?: { user_id: string; name: string; role: string } | null
  count?: number | null
  linen?: LinenSnapshot | null
  linen_ids?: string[]
}

/** `live` means the socket is carrying events; `fallback` means the app is
 *  back on the live-clock poll because a socket cannot be held open (a
 *  serverless deployment rejects the upgrade outright). */
export type LinenLiveStatus = 'idle' | 'connecting' | 'live' | 'fallback'

export interface LinenEventListResponse {
  items: LinenEvent[]
  total: number
}

export interface LinenStats {
  total: number
  in_stock: number
  at_client: number
  collected: number
  at_laundry: number
  washing: number
  drying: number
  pressing: number
  ready: number
  delivered: number
  missing: number
  damaged: number
  retired: number
  total_wash_cycles: number
  recently_scanned: number
}

export interface LinenListParams {
  search?: string
  category?: string
  status?: string
  client_name?: string
  condition?: string
  sort_by?: string
  sort_order?: string
  skip?: number
  limit?: number
}

export interface LinenBulkCreate {
  category: string
  item_type: string
  description?: string
  size?: string
  color?: string
  client_name: string
  department?: string
  quantity: number
  notes?: string
}

export interface LinenScanAction {
  action: string
  location?: string
  user?: string
  related_order?: string
  notes?: string
}

export interface LinenTagGenerate {
  category: string
  item_type: string
  client_name: string
  quantity: number
  size?: string
  color?: string
  department?: string
}

/**
 * One scan action exactly as `GET /linens/transitions` describes it. The
 * server owns the status vocabulary, so the state picker is built from these
 * rows rather than from a list kept in this app (which would drift the moment
 * the backend gained or renamed a state).
 */
export interface LinenTransition {
  action: string
  label: string
  to_status: string
  to_status_label: string
  custody: LinenCustody
  terminal: boolean
}

export type LinenCustody = 'hotel' | 'laundry' | 'exception'

export interface LinenTransitionGroup {
  custody: LinenCustody
  label: string
  description: string
  transitions: LinenTransition[]
}

export interface LinenTransitionList {
  groups: LinenTransitionGroup[]
  statuses: LinenStatus[]
}

export const LINEN_STATUS_CONFIG: Record<LinenStatus, { label: string; color: string; bg: string }> = {
  IN_STOCK:    { label: 'In Stock',    color: '#16A34A', bg: '#DCFCE7' },
  AT_CLIENT:   { label: 'At Client',   color: '#2563EB', bg: '#DBEAFE' },
  COLLECTED:   { label: 'Collected',   color: '#9333EA', bg: '#F3E8FF' },
  AT_LAUNDRY:  { label: 'At Laundry',  color: '#EA580C', bg: '#FFF7ED' },
  WASHING:     { label: 'Washing',     color: '#0891B2', bg: '#ECFEFF' },
  DRYING:      { label: 'Drying',      color: '#D97706', bg: '#FFFBEB' },
  PRESSING:    { label: 'Pressing',    color: '#7C3AED', bg: '#EDE9FE' },
  READY:       { label: 'Ready',       color: '#16A34A', bg: '#DCFCE7' },
  DELIVERED:   { label: 'Delivered',   color: '#059669', bg: '#D1FAE5' },
  MISSING:     { label: 'Missing',     color: '#DC2626', bg: '#FEE2E2' },
  DAMAGED:     { label: 'Damaged',     color: '#DC2626', bg: '#FEE2E2' },
  RETIRED:     { label: 'Retired',     color: '#6B7280', bg: 'var(--surface-3)' },
}

export const LINEN_CATEGORIES: { value: string; label: string }[] = [
  { value: 'BEDSHEET', label: 'Bedsheet' },
  { value: 'PILLOWCASE', label: 'Pillowcase' },
  { value: 'TOWEL', label: 'Towel' },
  { value: 'DUVET_COVER', label: 'Duvet Cover' },
  { value: 'BATH_MAT', label: 'Bath Mat' },
  { value: 'UNIFORM', label: 'Uniform' },
  { value: 'TABLECLOTH', label: 'Tablecloth' },
  { value: 'NAPKIN', label: 'Napkin' },
  { value: 'ROBE', label: 'Robe' },
  { value: 'SLIPPER', label: 'Slipper' },
  { value: 'OTHER', label: 'Other' },
]

export const LINEN_CONDITIONS: { value: string; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'WORN', label: 'Worn' },
  { value: 'DAMAGED', label: 'Damaged' },
]

// There is deliberately no list of scan actions here. `GET /linens/transitions`
// is the only source: a copy in this file would let the picker offer states the
// linen service has already changed the meaning of.
