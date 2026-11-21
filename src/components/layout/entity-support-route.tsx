import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { landingPathFor } from '../../lib/access'

/**
 * EntitySupportRoute — confines a hotel/shop support token to its own page.
 *
 * A support token issued by `/hotels/{id}/enter` or `/shops/{id}/enter` has no
 * `laundry_id` claim. It must never mount a laundry operations route. If the
 * session is missing, expired, or does not match the entity in the URL, send the
 * operator back to the only page that session can safely render.
 */
export function EntitySupportRoute({ kind }: { kind: 'hotels' | 'shops' }) {
  const { user, support, isAuthenticated } = useAuth()
  const { entityId } = useParams()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const expectedKind = kind === 'hotels' ? 'hotel' : 'shop'
  if (!support || support.kind !== expectedKind || support.entityId !== entityId) {
    return <Navigate to={landingPathFor(user, support)} replace />
  }

  return <Outlet />
}
