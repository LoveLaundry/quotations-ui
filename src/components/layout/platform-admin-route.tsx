import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * PlatformAdminRoute — only renders for platform administrators.
 *
 * Stricter than AdminRoute (which also admits laundry admins): the laundry
 * registry must never be visible to tenant administrators.
 */
export function PlatformAdminRoute() {
    const { user, isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // `platform_admin` is the authoritative flag (it comes from the database and
    // is re-checked on every request). `role_id` is kept as a fallback for older
    // sessions issued before the flag existed.
    // Platform scope is explicit: the flag or the dedicated role. An ADMIN runs
    // one laundry and must not reach the registry.
    const role = user?.role_id?.toUpperCase()
    const isPlatformAdmin =
        user?.platform_admin === true || role === 'PLATFORM_ADMIN'

    if (!isPlatformAdmin) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
