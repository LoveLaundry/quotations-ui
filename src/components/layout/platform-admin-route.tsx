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
    // ADMIN is the operator of this deployment, so it qualifies by default —
    // otherwise an account created before the registry existed could never
    // reach the page. Deployments that host several laundries (where their own
    // owners also hold ADMIN) turn this off with PLATFORM_ADMIN_STRICT.
    const role = user?.role_id?.toUpperCase()
    const isPlatformAdmin =
        user?.platform_admin === true || role === 'PLATFORM_ADMIN' || role === 'ADMIN'

    if (!isPlatformAdmin) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
