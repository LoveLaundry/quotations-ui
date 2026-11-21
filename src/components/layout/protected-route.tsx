import { AccessRoute } from './access-route'

/**
 * ProtectedRoute — authentication only.
 *
 * Kept as a thin wrapper so older route definitions keep working. New routes
 * should use AccessRoute with their spec from `accessSpecForPath()`.
 */
export function ProtectedRoute() {
  return <AccessRoute spec={{}} />
}
