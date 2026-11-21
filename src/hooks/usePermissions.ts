import { useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouteAccess } from '../context/RouteAccessContext'
import {
  canAccess as canAccessFor,
  hasPermission as hasPermissionFor,
  isPlatformAdmin as isPlatformAdminFor,
  landingPathFor,
  roleOf,
  permissionsOf,
  type AccessSpec,
} from '../lib/access'

export function usePermissions() {
  const { user, support } = useAuth()
  const { overrides } = useRouteAccess()
  const role = roleOf(user)
  const permissions = useMemo(() => permissionsOf(user), [user])
  const disabledPaths = useMemo(() => overrides?.[role]?.disabled_routes || [], [overrides, role])

  const hasPermission = useCallback(
    (permission: string) => hasPermissionFor(user, permission),
    [user],
  )

  const canAccess = useCallback(
    (spec: AccessSpec, routePath?: string) => canAccessFor(user, spec, support, { routePath, disabledPaths }),
    [user, support, disabledPaths],
  )

  const isPlatformAdmin = useMemo(() => isPlatformAdminFor(user), [user])

  const landingPath = useMemo(
    () => landingPathFor(user, support),
    [user, support],
  )

  const isAdmin = role === 'ADMIN' || role === 'PLATFORM_ADMIN'

  return { role, permissions, hasPermission, canAccess, isPlatformAdmin, isAdmin, landingPath }
}
