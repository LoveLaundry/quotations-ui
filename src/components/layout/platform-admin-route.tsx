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
    const isPlatformAdmin =
        user?.platform_admin === true || user?.role_id?.toUpperCase() === 'PLATFORM_ADMIN'

    if (!isPlatformAdmin) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
