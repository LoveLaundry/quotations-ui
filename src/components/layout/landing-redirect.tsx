import { Navigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'

/**
 * LandingRedirect — sends `/` (and any access-denied bounce) to the best page
 * for the current session.
 *
 * The index route used to hard-redirect to `/today`, which stranded hotel/shop
 * account roles on a tenant operations screen. `landingPathFor` now picks a
 * page the session may actually open: the daily hub for laundry operators, the
 * profile for client accounts.
 */
export function LandingRedirect() {
  const { landingPath } = usePermissions()
  return <Navigate to={landingPath} replace />
}
