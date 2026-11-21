import { useMemo, useState } from 'react'
import { PageHeader } from '../../../components/ui/page-header'
import { useRouteAccess } from '../../../context/RouteAccessContext'
import { ROUTES, NAV_GROUPS } from '../../../config/route-meta'

const ROLE_GROUPS: { label: string; roles: string[] }[] = [
  { label: 'Laundry roles', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { label: 'Shop roles', roles: ['SHOP_ADMIN', 'SHOP_STAFF'] },
  { label: 'Hotel roles', roles: ['HOTEL_ADMIN', 'HOTEL_MANAGER'] },
]

export default function RouteAccessPage() {
  const { overrides, setOverride, loading } = useRouteAccess()
  const [activeGroup, setActiveGroup] = useState(0)
  const [activeRole, setActiveRole] = useState(ROLE_GROUPS[0].roles[0])
  const [saving, setSaving] = useState<string | null | 'bulk'>(null)
  const [query, setQuery] = useState('')

  const toggleableRoutes = useMemo(() => {
    return ROUTES.filter(
      (r) => r.path && r.path !== '/login' && r.path !== '/guest/shop' && !r.path.startsWith('/track/')
    ).map((r) => ({ path: r.path, title: r.title, group: (r.group || 'Other') as string }))
  }, [])

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return toggleableRoutes
    return toggleableRoutes.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q)
    )
  }, [toggleableRoutes, query])

  const disabledForRole = useMemo(() => {
    return new Set(overrides?.[activeRole]?.disabled_routes || [])
  }, [overrides, activeRole])

  const grouped = useMemo(() => {
    const byGroup = new Map<string, { path: string; title: string; group: string }[]>()
    for (const r of filteredRoutes) {
      const g = r.group || 'Other'
      if (!byGroup.has(g)) byGroup.set(g, [])
      byGroup.get(g)!.push(r)
    }
    const ordered: { group: string; items: typeof filteredRoutes }[] = []
    for (const ng of NAV_GROUPS) {
      if (byGroup.has(ng.id)) ordered.push({ group: ng.label, items: byGroup.get(ng.id)! })
      else if (byGroup.has(ng.label)) ordered.push({ group: ng.label, items: byGroup.get(ng.label)! })
    }
    for (const [g, items] of byGroup) {
      if (!ordered.find((o) => o.group === g)) ordered.push({ group: g, items })
    }
    return ordered
  }, [filteredRoutes])

  const setDisabledList = async (nextDisabled: string[]) => {
    setSaving('bulk')
    try {
      await setOverride(activeRole, nextDisabled)
    } catch {
      alert('Failed to save. Check permissions / network.')
    } finally {
      setSaving(null)
    }
  }

  const toggleRoute = async (routePath: string) => {
    const current = new Set(overrides?.[activeRole]?.disabled_routes || [])
    if (current.has(routePath)) current.delete(routePath)
    else current.add(routePath)
    setSaving(routePath)
    try {
      await setOverride(activeRole, Array.from(current))
    } catch {
      alert('Failed to save. Check permissions / network.')
    } finally {
      setSaving(null)
    }
  }

  const disableAllInGroup = async (paths: string[]) => {
    const current = new Set(overrides?.[activeRole]?.disabled_routes || [])
    for (const p of paths) current.add(p)
    await setDisabledList(Array.from(current))
  }

  const enableAllInGroup = async (paths: string[]) => {
    const current = new Set(overrides?.[activeRole]?.disabled_routes || [])
    for (const p of paths) current.delete(p)
    await setDisabledList(Array.from(current))
  }

  const copyFromRole = async (fromRole: string) => {
    if (!fromRole || fromRole === activeRole) return
    const fromDisabled = overrides?.[fromRole]?.disabled_routes || []
    await setDisabledList([...fromDisabled])
  }

  const currentRoles = ROLE_GROUPS[activeGroup].roles

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Route Access"
        subtitle="Turn routes/pages on or off per role. Changes apply after refresh or next navigation."
      />

      <div className="flex flex-wrap gap-2">
        {ROLE_GROUPS.map((g, i) => (
          <button
            key={g.label}
            type="button"
            onClick={() => {
              setActiveGroup(i)
              setActiveRole(g.roles[0])
            }}
            className={`px-3 py-1.5 rounded text-sm border ${i === activeGroup ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--border)]'}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm text-[var(--text-muted)]">Role:</span>
        {currentRoles.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setActiveRole(r)}
            className={`px-3 py-1.5 rounded text-sm border ${r === activeRole ? 'bg-[var(--surface-2)] font-semibold border-[var(--border-2)]' : 'border-[var(--border)]'}`}
          >
            {r}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm text-[var(--text-muted)]">Copy from:</span>
          <select
            className="text-sm border border-[var(--border)] rounded px-2 py-1 bg-[var(--surface)]"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              if (v) void copyFromRole(v)
              e.target.value = ''
            }}
            disabled={saving !== null}
          >
            <option value="">— select role —</option>
            {currentRoles.filter((r) => r !== activeRole).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search routes (path, title, group)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-sm border border-[var(--border)] rounded px-3 py-1.5 bg-[var(--surface)] w-full max-w-md"
        />
      </div>

      {loading && <div className="text-sm text-[var(--text-muted)]">Loading overrides…</div>}

      <div className="space-y-6">
        {grouped.map((g) => {
          const enabledCount = g.items.filter((i) => !disabledForRole.has(i.path)).length
          return (
            <div key={g.group} className="rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--surface-2)] px-3 py-2">
                <h3 className="text-sm font-semibold">
                  {g.group} <span className="font-normal text-[var(--text-muted)]">({enabledCount}/{g.items.length} enabled)</span>
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => enableAllInGroup(g.items.map((i) => i.path))}
                    className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-50"
                  >
                    Enable all
                  </button>
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => disableAllInGroup(g.items.map((i) => i.path))}
                    className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-50"
                  >
                    Disable all
                  </button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-[var(--border)]">
                    <th className="text-left p-3 w-1/3">Route</th>
                    <th className="text-left p-3 w-1/2">Title</th>
                    <th className="text-left p-3 w-1/6">Enabled for {activeRole}</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((r) => {
                    const disabled = disabledForRole.has(r.path)
                    return (
                      <tr key={r.path} className="border-t border-[var(--border)]">
                        <td className="p-3 font-mono text-xs">{r.path}</td>
                        <td className="p-3">{r.title}</td>
                        <td className="p-3">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!disabled}
                              disabled={saving !== null}
                              onChange={() => toggleRoute(r.path)}
                            />
                            <span>{disabled ? 'Disabled' : 'Enabled'}</span>
                          </label>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
        {grouped.length === 0 && (
          <div className="text-sm text-[var(--text-muted)]">No routes match your search.</div>
        )}
      </div>
    </div>
  )
}
