import { useAuth } from '../context/AuthContext'

export function usePermissions() {
    const { user } = useAuth()
    
    const hasPermission = (permission: string) => {
        if (!user) return false
        const role = user.role_id?.toUpperCase()
        if (role === 'ADMIN' || role === 'PLATFORM_ADMIN') return true
        
        if (!user.permissions) return false
        
        try {
            const permsArray = JSON.parse(user.permissions)
            if (Array.isArray(permsArray)) {
                return permsArray.includes(permission)
            }
        } catch {
            // If it's just a comma separated string
            const permsArray = user.permissions.split(',').map(p => p.trim())
            return permsArray.includes(permission)
        }
        return false
    }

    return { hasPermission }
}
