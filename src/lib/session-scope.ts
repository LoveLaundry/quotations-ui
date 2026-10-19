import type { User } from '../types/auth'

/**
 * True when this session may only use the platform surface (Laundries, Users).
 *
 * A support session is the exception: a platform administrator who has entered a
 * laundry is operating *as* that laundry and must load its data. Support tokens
 * are memory-only, so `supportActive` is the reliable signal.
 */
export function isPlatformOnly(user: User | null, supportActive: boolean): boolean {
  if (supportActive || !user) return false
  return (
    user.platform_admin === true ||
    String(user.role_id ?? '').toUpperCase() === 'PLATFORM_ADMIN'
  )
}

/** Routes a platform-only session is allowed to mount. */
export const PLATFORM_PATHS = ['/laundries', '/users', '/profile']
