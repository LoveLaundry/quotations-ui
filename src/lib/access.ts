import type { User } from '../types/auth'

/**
 * access.ts — the single source of truth for "what may this session see".
 *
 * Before this module the access policy was duplicated across five surfaces
 * (route guards, the sidebar, command search, the today page quick actions and
 * a handful of inline checks). Each copy drifted: a link could appear in the
 * palette that the route guard would bounce, or a platform administrator could
 * reach a tenant screen that would 403 on its first data request. Every surface
 * now asks the same functions here, so a hidden link and a blocked route can
 * never disagree.
 *
 * Two axes decide access, and nothing else:
 *   · role      — tenant operators, client-account admins, platform admins
 *   · grants    — the role's capability set, or an explicit permission string
 *
 * The capability names are frontend names. They intentionally mirror the
 * backend `ROLE_CAPABILITIES` maps instead of trusting `user.permissions`,
 * which is often empty for role-derived grants such as `bill:read`.
 */

export type Role = string

/** Upper-cased role id, or '' when there is no session. */
export function roleOf(user: User | null | undefined): Role {
  return String(user?.role_id ?? '').toUpperCase()
}

/** True for platform administrators. The DB flag is authoritative; the role is
 *  kept as a fallback for sessions issued before the flag existed. */
export function isPlatformAdmin(user: User | null | undefined): boolean {
  if (!user) return false
  return user.platform_admin === true || roleOf(user) === 'PLATFORM_ADMIN'
}

/** Roles that operate a laundry in this app. */
export const TENANT_OPERATOR_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'PLATFORM_ADMIN'] as const

/** Roles that belong to a hotel/shop portal, not the laundry operations app. */
export const CLIENT_ROLES = ['HOTEL_ADMIN', 'HOTEL_MANAGER', 'SHOP_ADMIN', 'SHOP_STAFF'] as const

/** Roles accepted where the backend's `require_role('ADMIN')` is used. */
export const ADMIN_ROLES = ['ADMIN', 'PLATFORM_ADMIN'] as const

/** Frontend capability names used by route metadata and action buttons. */
export const CAPABILITIES = {
  viewGatePasses: 'view_gate_passes',
  manageGatePasses: 'manage_gate_passes',
  viewDeliveries: 'view_deliveries',
  manageDeliveries: 'manage_deliveries',
  viewBills: 'view_bills',
  manageBills: 'manage_bills',
  managePayments: 'manage_payments',
  viewStatements: 'view_statements',
  viewReturns: 'view_returns',
  manageReturns: 'manage_returns',
  viewLinen: 'view_linen',
  manageLinen: 'manage_linen',
  scanLinen: 'scan_linen',
  closeDay: 'close_day',
  todaySheet: 'today_sheet',
} as const

const ALL_CAPABILITIES: string[] = Object.values(CAPABILITIES)

/**
 * Role-derived grants. ADMIN/MANAGER/PLATFORM_ADMIN are full tenant operators.
 * STAFF mirrors bill-service's STAFF set: it may run the daily flow (receive,
 * deliver, return, read bills) but may not create/edit bills, record payments
 * or write linen inventory. Client-account roles get no tenant capabilities;
 * they are served by the dedicated hotel/shop portals.
 */
const ROLE_CAPABILITIES: Record<string, ReadonlySet<string>> = {
  ADMIN: new Set(ALL_CAPABILITIES),
  MANAGER: new Set(ALL_CAPABILITIES),
  PLATFORM_ADMIN: new Set(ALL_CAPABILITIES),
  STAFF: new Set([
    CAPABILITIES.viewGatePasses,
    CAPABILITIES.manageGatePasses,
    CAPABILITIES.viewDeliveries,
    CAPABILITIES.manageDeliveries,
    CAPABILITIES.viewBills,
    CAPABILITIES.viewStatements,
    CAPABILITIES.viewReturns,
    CAPABILITIES.manageReturns,
    CAPABILITIES.viewLinen,
    CAPABILITIES.scanLinen,
    CAPABILITIES.closeDay,
    CAPABILITIES.todaySheet,
  ]),
  HOTEL_ADMIN: new Set<string>(),
  HOTEL_MANAGER: new Set<string>(),
  SHOP_ADMIN: new Set<string>(),
  SHOP_STAFF: new Set<string>(),
}

/** Accept either frontend names or the backend capability strings some tokens
 *  carry in `user.permissions`. */
const BACKEND_CAPABILITIES: Record<string, string> = {
  [CAPABILITIES.viewGatePasses]: 'gatepass:read',
  [CAPABILITIES.manageGatePasses]: 'gatepass:write',
  [CAPABILITIES.viewDeliveries]: 'delivery:read',
  [CAPABILITIES.manageDeliveries]: 'delivery:write',
  [CAPABILITIES.viewBills]: 'bill:read',
  [CAPABILITIES.manageBills]: 'bill:write',
  [CAPABILITIES.managePayments]: 'payment:write',
  [CAPABILITIES.viewStatements]: 'bill:read',
  [CAPABILITIES.viewReturns]: 'gatepass:read',
  [CAPABILITIES.manageReturns]: 'gatepass:write',
  [CAPABILITIES.viewLinen]: 'linen:read',
  [CAPABILITIES.manageLinen]: 'linen:write',
  [CAPABILITIES.scanLinen]: 'linen:scan',
  [CAPABILITIES.closeDay]: 'gatepass:read',
  [CAPABILITIES.todaySheet]: 'gatepass:write',
}

/**
 * Normalise `user.permissions` into a Set. The value arrives as either a JSON
 * array (current API), a comma-separated string (older API) or nothing at all.
 * Parsing is centralised here so every caller sees the same list.
 */
export function permissionsOf(user: User | null | undefined): Set<string> {
  const raw = user?.permissions
  if (!raw) return new Set()
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed.map((p) => String(p).trim()))
  } catch {
    // Not JSON — fall through to the comma-separated form.
  }
  return new Set(
    String(raw)
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  )
}

/** Does the session hold this capability? Roles supply the default grants;
 *  an explicitly issued permission can add a capability on top. */
export function hasPermission(
  user: User | null | undefined,
  permission: string,
  supportActive = false,
): boolean {
  if (!user) return false
  // An audited support session operates inside the entered laundry with the
  // platform administrator's full capability set.
  if (supportActive) return true

  const explicit = permissionsOf(user)
  if (explicit.has(permission) || explicit.has(BACKEND_CAPABILITIES[permission] ?? '')) {
    return true
  }
  return ROLE_CAPABILITIES[roleOf(user)]?.has(permission) ?? false
}

/**
 * The access shape shared by every nav entry, quick action and route guard.
 * A target may be scoped by role list, by capability, by role family, and by
 * "admins only" — combine freely; all present constraints must pass.
 */
export interface AccessSpec {
  /** Capability strings; the session must hold every one. */
  permissions?: string[]
  /** Role ids; the session's role must be one of them (platform admins pass). */
  roles?: string[]
  /** ADMIN or PLATFORM_ADMIN only. */
  adminOnly?: boolean
  /** Only platform administrators may reach this. */
  platformOnly?: boolean
  /** Tenant operations only — hotel/shop account roles are excluded, but an
   *  explicitly granted tenant capability also admits a custom role. */
  tenantOnly?: boolean
}

/** True when the session satisfies every constraint present in the spec. */
export function canAccess(
  user: User | null | undefined,
  spec: AccessSpec = {},
  supportActive = false,
): boolean {
  if (!user) return false
  if (supportActive) return true

  const role = roleOf(user)
  const platformAdmin = isPlatformAdmin(user)
  const clientAccount = (CLIENT_ROLES as readonly string[]).includes(role)
  const tenantOperator = (TENANT_OPERATOR_ROLES as readonly string[]).includes(role)
  const hasTenantGrant = hasPermission(user, CAPABILITIES.viewGatePasses)
    || hasPermission(user, CAPABILITIES.viewDeliveries)
    || hasPermission(user, CAPABILITIES.viewBills)

  if (spec.platformOnly && !platformAdmin) return false
  if (spec.tenantOnly && !platformAdmin && (clientAccount || (!tenantOperator && !hasTenantGrant))) {
    return false
  }
  if (spec.adminOnly && !platformAdmin && !(ADMIN_ROLES as readonly string[]).includes(role)) {
    return false
  }
  if (spec.roles && !platformAdmin && !spec.roles.includes(role)) return false

  if (spec.permissions && !spec.permissions.every((p) => hasPermission(user, p, supportActive))) {
    return false
  }

  return true
}

/**
 * The best landing route for a session. Used by the index redirect, the login
 * redirect and by any "you cannot see that" bounce, so a user is never dropped
 * on a page their own session cannot render.
 *
 * Tenant operators (including platform admins operating this app) land on the
 * daily hub. Hotel/shop account roles — and any unknown role without grants —
 * land on the profile, which every authenticated session may open.
 */
export function landingPathFor(user: User | null | undefined, supportActive = false): string {
  if (!user) return '/login'
  if (supportActive) return '/today'

  const role = roleOf(user)
  if (
    isPlatformAdmin(user) ||
    (TENANT_OPERATOR_ROLES as readonly string[]).includes(role) ||
    hasPermission(user, CAPABILITIES.viewGatePasses) ||
    hasPermission(user, CAPABILITIES.viewDeliveries) ||
    hasPermission(user, CAPABILITIES.viewBills)
  ) {
    return '/today'
  }
  return '/profile'
}
