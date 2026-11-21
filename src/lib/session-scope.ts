import type { User } from '../types/auth'
import { PLATFORM_PATHS as REGISTRY_PLATFORM_PATHS } from '../config/route-meta'
import { isPlatformOnly as isPlatformOnlyFor, landingPathFor, type SupportState } from './access'

/**
 * Re-exported from lib/access.ts so the session-scope helpers and the access
 * helpers are one implementation. Existing imports keep working.
 */
export function isPlatformOnly(user: User | null, support: SupportState = false): boolean {
  return isPlatformOnlyFor(user, support)
}

/**
 * Routes a platform-only session is allowed to mount.
 *
 * Derived from the navigation registry (which is also what builds the
 * sidebar), so the guard and the menu can never drift apart again.
 */
export const PLATFORM_PATHS = REGISTRY_PLATFORM_PATHS

/** Where a platform-only session lands and returns to. */
export const PLATFORM_LANDING = '/platform'

export { landingPathFor }
