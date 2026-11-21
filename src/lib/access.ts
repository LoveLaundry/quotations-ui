import type { SupportSession } from '../context/AuthContext'
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
 *   · scope  — a platform session (registry + identities) vs a tenant session
 *              (one laundry's operations)
 *   · grants — the role's capability set, or an explicit permission string
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

/**
 * Historical callers pass a boolean; new callers pass the support session so
 * laundry support and hotel/shop support can be told apart.
 */
export type SupportState = boolean | SupportSession | null | undefined

function supportKind(support: SupportState): 'none' | 'laundry' | 'entity' {
  if (!support) return 'none'
  if (typeof support === 'boolean') return support ? 'laundry' : 'none'
  return support.kind === 'laundry' ? 'laundry' : 'entity'
}

export function entitySupportPath(support: SupportState): string | null {
  if (!support || typeof support === 'boolean' || support.kind === 'laundry') return null
  const segment = support.kind === 'hotel' ? 'hotels' : 'shops'
  return `/support/${segment}/${encodeURIComponent(support.entityId)}`
}

/**
 * True when this session may only use the platform surface (Laundries, Users).
 *
 * Laundry support is the exception: a platform administrator who has entered a
 * laundry operates *as* that laundry and must load its tenant data. A hotel or
 * shop support token has no laundry claim, so it stays on the platform side and
 * is confined to its entity support page.
 */
export function isPlatformOnly(
  user: User | null | undefined,
  support: SupportState = false,
): boolean {
  if (!user || supportKind(support) === 'laundry') return false
  return isPlatformAdmin(user)
}

/** Roles a laundry administrator, manager and floor staff run as. Used where a
 *  route is limited to the tenant's own people. */
export const TENANT_ADMIN_ROLES = ['ADMIN', 'MANAGER'] as const

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

/** Does the session hold this capability? ADMIN and PLATFORM_ADMIN are
 *  unconditional: the backends resolve every capability for those roles. */
export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  if (isPlatformAdmin(user)) return true
  const role = roleOf(user)
  if (role === 'ADMIN') return true
  return permissionsOf(user).has(permission)
}

/**
 * The access shape shared by every nav entry, quick action and route guard.
 * A target may be scoped by role list, by capability, by platform/tenant scope,
 * and by "admins only" — combine freely; all present constraints must pass.
 */
export interface AccessSpec {
  /** Capability strings; the session must hold every one. */
  permissions?: string[]
  /** Role ids; the session's role must be one of them. */
  roles?: string[]
  /** Tenant-admin only (ADMIN / MANAGER). PLATFORM_ADMIN does not satisfy it
   *  unless it is also in `roles`, because a platform operator runs no laundry. */
  adminOnly?: boolean
  /** Only platform administrators may reach this. */
  platformOnly?: boolean
  /** Platform administrators may NOT reach this (tenant operations). */
  tenantOnly?: boolean
  /** Only an active hotel/shop support session may mount this route. */
  entitySupport?: boolean
}

/** True when the session satisfies every constraint present in the spec. */
export function canAccess(
  user: User | null | undefined,
  spec: AccessSpec = {},
  support: SupportState = false,
  opts?: { routePath?: string; disabledPaths?: string[] },
): boolean {
  if (!user) return false

  // Admin-managed route disable override (by role + path)
  if (opts?.routePath && opts?.disabledPaths && opts.disabledPaths.includes(opts.routePath)) {
    return false
  }

  const role = roleOf(user)
  const kind = supportKind(support)
  const platform = isPlatformOnly(user, support)

  // An entity support token is not a general platform or tenant session. It
  // can only reach the route that owns the active entity session; every other
  // route bounces back to that page instead of trying laundry APIs with a
  // token that has no laundry scope.
  if (kind === 'entity' && !spec.entitySupport) return false
  if (spec.entitySupport && kind !== 'entity') return false

  // Scope first: a platform-only session is confined to the platform surface,
  // and a tenant-only screen is closed to a full platform administrator.
  if (spec.platformOnly && !isPlatformAdmin(user)) return false
  if (platform && !spec.platformOnly && !spec.entitySupport) return false
  if (spec.tenantOnly && isPlatformAdmin(user)) return false

  if (spec.adminOnly) {
    const tenantAdmin = (TENANT_ADMIN_ROLES as readonly string[]).includes(role)
    const explicit = spec.roles?.includes(role) ?? false
    if (!tenantAdmin && !explicit) return false
  }

  if (spec.roles && !spec.roles.includes(role)) return false

  if (spec.permissions && !spec.permissions.every((p) => hasPermission(user, p))) {
    return false
  }

  return true
}

/**
 * The best landing route for a session. Used by the index redirect and by any
 * "you cannot see that" bounce, so a user is never dropped on a page their own
 * session cannot render.
 */
export function landingPathFor(user: User | null | undefined, support: SupportState = false): string {
  if (!user) return '/login'

  const entityPath = entitySupportPath(support)
  if (entityPath) return entityPath
  if (isPlatformOnly(user, support)) return '/laundries'

  const candidates: { path: string; spec: AccessSpec }[] = [
    { path: '/today', spec: {} },
    { path: '/dashboard', spec: {} },
    { path: '/management', spec: {} },
    { path: '/profile', spec: {} },
  ]
  // Note: landingPathFor doesn't have overrides context; callers should be careful.
  // For now, keep simple.
  return candidates.find((c) => canAccess(user, c.spec, support))?.path ?? '/profile'
}
