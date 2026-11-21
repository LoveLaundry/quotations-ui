import authApi from './auth-api'

export interface RouteAccessOverrides {
  [role: string]: { disabled_routes: string[] }
}

export async function fetchRouteAccessOverrides(): Promise<RouteAccessOverrides> {
  const res = await authApi.get('/admin/route-access')
  return res.data?.overrides || {}
}

export async function updateRouteAccessOverride(role: string, disabled_routes: string[]): Promise<void> {
  await authApi.put('/admin/route-access', { role, disabled_routes })
}
