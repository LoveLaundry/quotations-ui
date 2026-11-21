import type { ReactElement } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRouteAccess } from '../../context/RouteAccessContext'
import { canAccess, landingPathFor, roleOf, type AccessSpec } from '../../lib/access'

/**
 * AccessRoute — the single route guard.
 */
export function AccessRoute({
  spec,
  children,
}: {
  spec: AccessSpec
  children?: ReactElement
}) {
  const { user, isAuthenticated, support } = useAuth()
  const { overrides } = useRouteAccess()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const role = roleOf(user)
  const disabledPaths = overrides?.[role]?.disabled_routes || []
  if (!canAccess(user, spec, support, { routePath: location.pathname, disabledPaths })) {
    return <Navigate to={landingPathFor(user, support)} replace />
  }

  return children ?? <Outlet />
}
