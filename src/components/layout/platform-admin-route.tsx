import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * PlatformAdminRoute — only renders for PLATFORM_ADMIN sessions.
 *
 * Stricter than AdminRoute (which also admits laundry admins): the laundry
 * registry must never be visible to tenant administrators.
 */
export function PlatformAdminRoute() {
    const { user, isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (user?.role_id?.toUpperCase() !== 'PLATFORM_ADMIN') {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
