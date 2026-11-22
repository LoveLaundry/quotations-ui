/**
 * Pure helpers for the feature pack.
 *
 * Everything in this module is safe to import from a page, a hook or a unit
 * test: there is no React, no DOM access at import time, and no dependency on
 * the API layer. Presentation and browser effects live in `components.tsx`
 * and `hooks.ts` respectively.
 */

export type SortDirection = 'asc' | 'desc'

/** The fixed client type of this application. Quotations UI is the laundry
 *  back office; unlike the standalone shop/hotel portals it never offers a
 *  client-type choice at sign-in. */
export const APP_CLIENT_TYPE = 'LAUNDRY' as const

/** A platform page title is always suffixed with the product name. */
export function documentTitle(title?: string): string {
  const clean = (title ?? '').trim()
  return clean ? `${clean} · LoveLaundry` : 'LoveLaundry'
}

/* ── Formatting ─────────────────────────────────────────────────────────── */

export function formatCurrency(value: number | string | null | undefined): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value)
  return Number.isFinite(n) ? new Intl.NumberFormat('en-LK').format(n) : '—'
}

export function formatDate(value?: string | number | Date | null): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-LK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Colombo',
  }).format(date)
}

export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-LK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Colombo',
  }).format(date)
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ── Pagination and sorting ─────────────────────────────────────────────── */

export interface PageRange {
  offset: number
  start: number
  end: number
  page: number
  pageCount: number
}

/** Clamp an offset into a valid page boundary for the given result size. */
export function clampPageRange(total: number, limit: number, offset: number): PageRange {
  const safeTotal = Math.max(0, Math.floor(Number(total) || 0))
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 1))
  const pageCount = Math.max(1, Math.ceil(safeTotal / safeLimit))
  const maxOffset = (pageCount - 1) * safeLimit
  const safeOffset = Math.min(Math.max(0, Math.floor(Number(offset) || 0)), maxOffset)
  const page = Math.floor(safeOffset / safeLimit) + 1
  const end = Math.min(safeOffset + safeLimit, safeTotal)
  return {
    offset: safeOffset,
    start: safeTotal === 0 ? 0 : safeOffset + 1,
    end,
    page,
    pageCount,
  }
}

export function paginate<T>(rows: readonly T[], offset: number, limit: number): T[] {
  const range = clampPageRange(rows.length, limit, offset)
  return rows.slice(range.offset, range.end)
}

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

export function sortRows<T>(
  rows: readonly T[],
  accessor: (row: T) => unknown,
  direction: SortDirection,
): T[] {
  const factor = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => compareValues(accessor(a), accessor(b)) * factor)
}

export function nextSortDirection(current: SortDirection | null): SortDirection {
  return current === 'asc' ? 'desc' : 'asc'
}

/* ── Dates used by the date-range filter ────────────────────────────────── */

export interface DateRange {
  from: string
  to: string
}

export function inDateRange(value: unknown, range: DateRange): boolean {
  if (!range.from && !range.to) return true
  if (!value) return false
  const time = new Date(String(value)).getTime()
  if (!Number.isFinite(time)) return false
  // `to` is inclusive for the whole calendar day.
  if (range.from && time < new Date(`${range.from}T00:00:00`).getTime()) return false
  if (range.to && time > new Date(`${range.to}T23:59:59`).getTime()) return false
  return true
}

/* ── Response normalisation ─────────────────────────────────────────────── */

/** Coerce any null / malformed list payload into a real, non-null array. */
export function normalizeItems<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter((row) => row != null) as T[]) : []
}

const NESTED_COLLECTIONS = ['items', 'line_items', 'specifications', 'gate_passes', 'rows'] as const

/**
 * Repair every nested collection in an API object. Returns a new object; the
 * caller's data is never mutated. Depth is bounded so a cyclic payload cannot
 * spin forever.
 */
export function aggregateNestedItems<T>(value: T, depth = 0): T {
  if (depth > 8 || value == null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value
      .filter((row) => row != null)
      .map((row) => aggregateNestedItems(row, depth + 1)) as unknown as T
  }
  const out: Record<string, unknown> = { ...(value as Record<string, unknown>) }
  for (const key of NESTED_COLLECTIONS) {
    // Only repair collections the payload actually declares. Inventing keys on
    // every nested record would bloat quotations with empty arrays.
    if (!Object.prototype.hasOwnProperty.call(out, key)) continue
    const child = out[key]
    if (!Array.isArray(child)) out[key] = []
    else out[key] = aggregateNestedItems(child, depth + 1)
  }
  return out as T
}

/* ── Duplicate detection ────────────────────────────────────────────────── */

export function duplicateKeys<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = keyOf(row).trim().toLowerCase()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return new Map([...counts].filter(([, count]) => count > 1))
}

export function findDuplicateRows<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): number[] {
  const duplicates = duplicateKeys(rows, keyOf)
  const indexes: number[] = []
  rows.forEach((row, index) => {
    if (duplicates.has(keyOf(row).trim().toLowerCase())) indexes.push(index)
  })
  return indexes
}

/** Item identity matches the backend balance engine: name + specification. */
export function itemIdentity(row: { item_name?: string; name?: string; specification?: string; category?: string }): string {
  return `${(row.item_name ?? row.name ?? '').trim().toLowerCase()}||${(row.specification ?? row.category ?? '').trim().toLowerCase()}`
}

/* ── Validation ─────────────────────────────────────────────────────────── */

export interface FieldErrors {
  [field: string]: string | undefined
}

export function validateRegistration(values: {
  username?: string
  displayName?: string
  password?: string
  confirm?: string
}): FieldErrors {
  const errors: FieldErrors = {}
  const username = (values.username ?? '').trim()
  const password = values.password ?? ''
  if (username.length < 3) errors.username = 'Use at least 3 characters.'
  if (values.displayName !== undefined && !values.displayName.trim()) {
    errors.displayName = 'Display name is required.'
  }
  if (password.length < 8) errors.password = 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = errors.password ?? 'Include a letter and a number.'
  }
  if (values.confirm !== undefined && password !== values.confirm) {
    errors.confirm = 'Passwords do not match.'
  }
  return errors
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: 'Enter a password' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score++
  const safe = Math.min(4, score) as PasswordStrength['score']
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  return { score: safe, label: labels[safe] }
}

/* ── Error / network helpers ────────────────────────────────────────────── */

/** Turn any thrown value into one calm, user-readable sentence. */
export function normalizeError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback
  if (typeof error === 'string') return error
  const obj = error as {
    response?: { data?: { message?: unknown; error?: unknown }; status?: number }
    message?: unknown
  }
  const dataMessage = obj.response?.data?.message ?? obj.response?.data?.error
  if (typeof dataMessage === 'string' && dataMessage.trim()) return dataMessage.trim()
  if (Array.isArray(dataMessage)) return dataMessage.map(String).join(', ')
  if (typeof obj.message === 'string' && obj.message.trim() && obj.message !== 'Network Error') {
    return obj.message.trim()
  }
  if (obj.response?.status === 0 || obj.message === 'Network Error') {
    return 'Cannot reach the server. Check your connection and retry.'
  }
  return fallback
}

export function timeoutMessage(ms: number): string {
  return `The server did not respond within ${Math.round(ms / 1000)}s. Your changes were not lost — retry when ready.`
}

export function retryDelay(attempt: number, base = 500, max = 8000): number {
  const exponential = base * 2 ** Math.max(0, attempt)
  const jitter = Math.floor(exponential * 0.2 * Math.random())
  return Math.min(max, exponential + jitter)
}

/** Reject obviously oversized API payloads before they reach a renderer. */
export function responseSizeGuard(payload: unknown, maxBytes = 8 * 1024 * 1024): boolean {
  try {
    return new Blob([JSON.stringify(payload ?? null)]).size <= maxBytes
  } catch {
    return false
  }
}

/* ── Export helpers ─────────────────────────────────────────────────────── */

export function csvCell(value: unknown): string {
  if (value == null) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function toCSV<T extends Record<string, unknown>>(
  rows: readonly T[],
  columns: readonly { key: string; label: string }[],
): string {
  const head = columns.map((c) => csvCell(c.label)).join(',')
  const body = rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(','))
  return [head, ...body].join('\r\n')
}

export function toJSON<T>(
  rows: readonly T[],
  columns: readonly { key: string; label: string }[],
): string {
  return JSON.stringify(
    rows.map((row) => {
      const out: Record<string, unknown> = {}
      for (const column of columns) out[column.label] = (row as Record<string, unknown>)[column.key]
      return out
    }),
    null,
    2,
  )
}

/* ── Session / cache identity ───────────────────────────────────────────── */

/** Cache keys always include the authenticated scope, so one account can
 *  never read another account's draft or list snapshot. */
export function cacheKeyFor(scope: string | number | null | undefined, name: string): string {
  return `ll:${scope ?? 'anon'}:${name}`
}

/** Stable, dependency-free idempotency token for a logical write. */
export function stableKey(payload: unknown): string {
  const text = JSON.stringify(payload ?? null)
  let hash = 5381
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0
  return `fp-${hash.toString(16)}`
}

/* ── Roles, scope and labels ────────────────────────────────────────────── */

export const ENTITY_ROLES = {
  hotels: ['HOTEL_ADMIN', 'HOTEL_MANAGER'],
  shops: ['SHOP_ADMIN', 'SHOP_STAFF'],
} as const

export function isEntityRole(role: unknown): boolean {
  const upper = String(role ?? '').toUpperCase()
  return Object.values(ENTITY_ROLES).some((roles) => (roles as readonly string[]).includes(upper))
}

/** Membership status that may still be entered. Unknown statuses are treated
 *  as available so a newer backend value cannot silently lock out an account;
 *  the two terminal states are always disabled in scope switchers. */
export function isActiveAssociation(status?: string | null): boolean {
  const upper = String(status ?? '').trim().toUpperCase()
  return upper !== 'SUSPENDED' && upper !== 'ARCHIVED' && upper !== 'INACTIVE'
}

export function roleLabel(role?: string | null): string {
  const value = String(role ?? '').trim()
  if (!value) return 'User'
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function scopeLabel(support?: { kind: string; entityName?: string; laundryName?: string } | null): string {
  if (!support) return 'Laundry workspace'
  if (support.kind === 'laundry') return `${support.laundryName ?? 'Laundry'} support`
  return `${support.entityName ?? 'Entity'} · ${support.kind} support`
}

export function initialsOf(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

/* ── Selection helpers ──────────────────────────────────────────────────── */

export function selectionState<T>(
  rows: readonly T[],
  selected: ReadonlySet<string>,
  keyOf: (row: T) => string,
): { all: boolean; some: boolean; count: number } {
  let count = 0
  for (const row of rows) if (selected.has(keyOf(row))) count++
  return { all: rows.length > 0 && count === rows.length, some: count > 0 && count < rows.length, count }
}
