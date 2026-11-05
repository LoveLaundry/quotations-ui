import type { QueryClient } from '@tanstack/react-query'
import { linenKeys } from '../hooks/useLinen'
import type {
  Linen,
  LinenListParams,
  LinenListResponse,
  LinenRealtimeEvent,
  LinenSnapshot,
} from '../../../types/linen'

/**
 * Apply a pushed linen change straight to the cache it belongs to.
 *
 * The alternative — invalidating the whole `linens` namespace on every event —
 * is what the clock poll did, and it is the wrong shape for a socket: a
 * pressing station scanning sixty tags a minute would turn every one of them
 * into a refetch of every list, dashboard and detail panel on every other
 * device. The event already carries the row that changed, so the cache is
 * patched in place and only genuinely derived numbers (stats, per-item history)
 * are refetched.
 *
 * Lists are filtered honestly: a row that no longer matches the filters the
 * list was fetched with is removed (and `total` decremented) instead of being
 * left on a "Washing" screen showing a linen that has moved to Ready.
 */

const LIST_ROOT = ['linens', 'list'] as const

function patchLinen(current: Linen, snapshot: LinenSnapshot): Linen {
  return {
    ...current,
    status: (snapshot.status as Linen['status']) ?? current.status,
    category: snapshot.category ?? current.category,
    item_type: snapshot.item_type ?? current.item_type,
    client_name: snapshot.client_name ?? current.client_name,
    condition: (snapshot.condition as Linen['condition']) ?? current.condition,
    location: snapshot.location === undefined ? current.location : snapshot.location ?? undefined,
    wash_count: snapshot.wash_count ?? current.wash_count,
    last_washed_date: snapshot.last_washed_date ?? current.last_washed_date,
    last_scanned_date: snapshot.last_scanned_date ?? current.last_scanned_date,
    retirement_date: snapshot.retirement_date ?? current.retirement_date,
    updated_at: snapshot.updated_at ?? current.updated_at,
  }
}

/** Does `item` still belong in a list fetched with `params`? */
function matchesListFilters(item: Linen, params: LinenListParams): boolean {
  if (params.status && item.status !== params.status) return false
  if (params.category && item.category !== params.category) return false
  if (params.condition && item.condition !== params.condition) return false
  if (params.client_name) {
    const needle = String(params.client_name).toLowerCase()
    if (!String(item.client_name ?? '').toLowerCase().includes(needle)) return false
  }
  if (params.search) {
    const needle = String(params.search).toLowerCase()
    const haystack = [item.linen_id, item.item_type, item.client_name, item.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  return true
}

function patchLists(qc: QueryClient, snapshot: LinenSnapshot): void {
  for (const query of qc.getQueryCache().findAll({ queryKey: LIST_ROOT })) {
    const data = query.state.data as LinenListResponse | undefined
    if (!data?.items?.length) continue
    const index = data.items.findIndex((item) => item.id === snapshot.id)
    if (index === -1) continue

    const params = (query.queryKey[2] ?? {}) as LinenListParams
    const patched = patchLinen(data.items[index], snapshot)

    if (!matchesListFilters(patched, params)) {
      qc.setQueryData<LinenListResponse>(query.queryKey, {
        items: data.items.filter((_, position) => position !== index),
        total: Math.max(0, data.total - 1),
      })
      continue
    }

    const items = data.items.slice()
    items[index] = patched
    qc.setQueryData<LinenListResponse>(query.queryKey, { ...data, items })
  }
}

function removeFromLists(qc: QueryClient, snapshot: LinenSnapshot): void {
  for (const query of qc.getQueryCache().findAll({ queryKey: LIST_ROOT })) {
    const data = query.state.data as LinenListResponse | undefined
    if (!data?.items?.length) continue
    if (!data.items.some((item) => item.id === snapshot.id)) continue
    qc.setQueryData<LinenListResponse>(query.queryKey, {
      items: data.items.filter((item) => item.id !== snapshot.id),
      total: Math.max(0, data.total - 1),
    })
  }
}

/** Patch the detail panel and the by-code lookup of one linen, if either is
 *  cached. `getQueryData` first on purpose: `setQueryData` would otherwise
 *  create an entry for a screen that is not open. */
export function patchCachedLinen(qc: QueryClient, snapshot: LinenSnapshot): void {
  if (snapshot.id) {
    const detailKey = linenKeys.detail(snapshot.id)
    const detail = qc.getQueryData<Linen>(detailKey)
    if (detail) qc.setQueryData<Linen>(detailKey, patchLinen(detail, snapshot))
  }
  if (snapshot.linen_id) {
    const codeKey = linenKeys.byCode(snapshot.linen_id)
    const byCode = qc.getQueryData<Linen>(codeKey)
    if (byCode) qc.setQueryData<Linen>(codeKey, patchLinen(byCode, snapshot))
  }
  patchLists(qc, snapshot)
}

export function applyLinenEvent(qc: QueryClient, event: LinenRealtimeEvent): void {
  const snapshot = event.linen ?? null

  if (event.event === 'delete') {
    if (snapshot && snapshot.id) qc.removeQueries({ queryKey: linenKeys.detail(snapshot.id) })
    if (snapshot && snapshot.linen_id) qc.removeQueries({ queryKey: linenKeys.byCode(snapshot.linen_id) })
    if (snapshot) removeFromLists(qc, snapshot)
    void qc.invalidateQueries({ queryKey: linenKeys.stats() })
    return
  }

  if (event.event === 'create' || event.event === 'create_bulk' || event.event === 'generate_tags') {
    // A tag that did not exist a moment ago has no cached row to patch; the
    // list it belongs in has to be fetched. One invalidation for the whole
    // batch is why bulk generation publishes a single summary event.
    void qc.invalidateQueries({ queryKey: LIST_ROOT })
    void qc.invalidateQueries({ queryKey: linenKeys.stats() })
    return
  }

  if (snapshot) {
    patchCachedLinen(qc, snapshot)
    // The movement history gained a row that the payload does not describe.
    if (snapshot.id) {
      void qc.invalidateQueries({ queryKey: linenKeys.events(snapshot.id) })
    }
  }
  void qc.invalidateQueries({ queryKey: linenKeys.stats() })
}
