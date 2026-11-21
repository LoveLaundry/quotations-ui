import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { fetchRouteAccessOverrides, updateRouteAccessOverride, type RouteAccessOverrides } from '../api/route-access-api'
import { useAuth } from './AuthContext'

interface RouteAccessCtx {
  overrides: RouteAccessOverrides
  loading: boolean
  refresh: () => Promise<void>
  setOverride: (role: string, disabled_routes: string[]) => Promise<void>
}

const RouteAccessContext = createContext<RouteAccessCtx | null>(null)

export function RouteAccessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [overrides, setOverrides] = useState<RouteAccessOverrides>({})
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOverrides({})
      return
    }
    setLoading(true)
    try {
      const data = await fetchRouteAccessOverrides()
      setOverrides(data || {})
    } catch (e) {
      // If not admin or endpoint fails, just use empty overrides
      setOverrides({})
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setOverride = useCallback(async (role: string, disabled_routes: string[]) => {
    await updateRouteAccessOverride(role, disabled_routes)
    await refresh()
  }, [refresh])

  return (
    <RouteAccessContext.Provider value={{ overrides, loading, refresh, setOverride }}>
      {children}
    </RouteAccessContext.Provider>
  )
}

export function useRouteAccess() {
  const ctx = useContext(RouteAccessContext)
  if (!ctx) throw new Error('useRouteAccess must be used within RouteAccessProvider')
  return ctx
}
