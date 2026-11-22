import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type RefObject,
} from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  cacheKeyFor, clampPageRange, documentTitle, inDateRange, nextSortDirection,
  normalizeError, paginate, retryDelay, selectionState, sortRows,
  type DateRange, type SortDirection,
} from './utils'

/* ── Shared provider state ──────────────────────────────────────────────── */

export type TableDensity = 'comfortable' | 'compact'

export interface FeatureContextValue {
  highContrast: boolean
  largeText: boolean
  reduceMotion: boolean
  density: TableDensity
  panelOpen: boolean
  shortcutsOpen: boolean
  commandOpen: boolean
  announcement: string
  routeTitle: string
  progress: number
  toggleHighContrast: () => void
  toggleLargeText: () => void
  toggleReduceMotion: () => void
  setDensity: (density: TableDensity) => void
  setPanelOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
  announce: (message: string) => void
  setRouteTitle: (title: string) => void
  startRoute: () => void
  finishRoute: () => void
}

export const FeatureContext = createContext<FeatureContextValue | null>(null)

export function useFeatures(): FeatureContextValue {
  const value = useContext(FeatureContext)
  if (!value) throw new Error('useFeatures must be used within FeatureProvider')
  return value
}

/* ── Storage and browser state ──────────────────────────────────────────── */

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Private browsing or a full quota must never break the UI.
    }
  }, [key, value])

  return [value, setValue] as const
}

export function useDebouncedValue<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function useReducedMotion(): boolean {
  const system = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { reduceMotion } = useFeatures()
  return system || reduceMotion
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}

export function useScrolled(threshold = 6): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])
  return scrolled
}

/* ── Keyboard and focus ─────────────────────────────────────────────────── */

export function useEscape(handler: () => void, active = true): void {
  const ref = useRef(handler)
  useEffect(() => { ref.current = handler }, [handler])
  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') ref.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active])
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Trap Tab inside a drawer or dialog and restore focus when it closes. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return
    const container = ref.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    container?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !container) return
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (!container.contains(document.activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previous?.isConnected) previous.focus()
    }
  }, [active, ref])
}

export function useFocusRestore(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [active])
}

/* ── Document and announcements ─────────────────────────────────────────── */

export function useDocumentTitle(title: string): void {
  const { setRouteTitle } = useFeatures()
  useEffect(() => {
    setRouteTitle(title)
    document.title = documentTitle(title)
  }, [title, setRouteTitle])
}

/* ── Drafts and submit safety ───────────────────────────────────────────── */

export type AutosaveStatus = 'idle' | 'saving' | 'saved'

export function useDraft<T>(
  scope: string | number | null | undefined,
  name: string,
  current: T,
  enabled = true,
) {
  const key = useMemo(() => cacheKeyFor(scope, `draft:${name}`), [scope, name])
  const [draft, setDraft] = useState<T | null>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  })
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const first = useRef(true)

  useEffect(() => {
    if (!enabled) return
    if (first.current) {
      first.current = false
      return
    }
    setStatus('saving')
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(current))
        setStatus('saved')
      } catch {
        setStatus('idle')
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [current, key, enabled])

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key) } catch { /* storage unavailable */ }
    setDraft(null)
    setStatus('idle')
  }, [key])

  const restoreDraft = useCallback((): T | null => draft, [draft])

  return { draft, hasDraft: draft !== null, restoreDraft, clearDraft, status }
}

/** Ref-level guard: two clicks in the same tick cannot start two writes. */
export function useSubmitGuard<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      if (inFlight.current) return undefined
      inFlight.current = true
      setPending(true)
      try {
        return await action(...args)
      } finally {
        inFlight.current = false
        setPending(false)
      }
    },
    [action],
  )
  return { run, pending }
}

/** Apply a visible change immediately, then roll it back if the write fails. */
export function useOptimisticWrite() {
  const { announce } = useFeatures()
  return useCallback(
    async (options: {
      optimistic: () => void
      rollback: () => void
      commit: () => Promise<void>
      successMessage?: string
      /** Let the caller render a field-level error summary instead of a toast. */
      silentErrors?: boolean
    }): Promise<boolean> => {
      options.optimistic()
      try {
        await options.commit()
        if (options.successMessage) {
          toast.success(options.successMessage)
          announce(options.successMessage)
        }
        return true
      } catch (error) {
        options.rollback()
        if (!options.silentErrors) {
          toast.error(normalizeError(error))
          announce('Save failed. Previous values were restored.')
        }
        return false
      }
    },
    [announce],
  )
}

export function useNotify() {
  const { announce } = useFeatures()
  return useMemo(
    () => ({
      success: (message: string) => { toast.success(message); announce(message) },
      error: (message: unknown) => {
        const text = normalizeError(message)
        toast.error(text)
        announce(text)
      },
      info: (message: string) => { toast.info(message); announce(message) },
    }),
    [announce],
  )
}

/* ── Retry / cache ──────────────────────────────────────────────────────── */

export function useRetryable<T>(action: () => Promise<T>, maxAttempts = 3) {
  const [error, setError] = useState<unknown>(null)
  const [pending, setPending] = useState(false)
  const attempt = useRef(0)
  const run = useCallback(async (): Promise<T | undefined> => {
    if (pending) return undefined
    setPending(true)
    try {
      let last: unknown
      for (let i = attempt.current; i < maxAttempts; i++) {
        try {
          const result = await action()
          attempt.current = 0
          setError(null)
          return result
        } catch (err) {
          last = err
          attempt.current = i + 1
          if (i < maxAttempts - 1) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, retryDelay(i)))
          }
        }
      }
      setError(last)
      return undefined
    } finally {
      setPending(false)
    }
  }, [action, maxAttempts, pending])
  const reset = useCallback(() => { attempt.current = 0; setError(null) }, [])
  return { run, reset, pending, error, attempts: attempt.current }
}

/** Expose React Query's paint-old-data-then-refresh behaviour to the UI. */
export function useStaleWhileRevalidate<TData, TError>(query: UseQueryResult<TData, TError>) {
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefreshing: Boolean(query.data !== undefined && query.isFetching),
    fromCache: query.data !== undefined && query.isStale && !query.isFetching,
    refetch: query.refetch,
  }
}

/* ── Table controller ───────────────────────────────────────────────────── */

export interface TableControllerOptions<T> {
  rows: readonly T[]
  keyOf: (row: T) => string
  searchable?: (row: T) => string
  filterDate?: (row: T) => unknown
  initialSort?: { key: string; direction: SortDirection }
  initialPageSize?: number
}

export function useTableController<T>(options: TableControllerOptions<T>) {
  const { rows, keyOf, searchable, filterDate, initialSort, initialPageSize = 25 } = options
  const { density, setDensity } = useFeatures()

  const [rawSearch, setRawSearch] = useState('')
  const search = useDebouncedValue(rawSearch, 200)
  const [status, setStatus] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(initialSort ?? null)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [detail, setDetail] = useState<T | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())

  const normalized = useMemo(
    () => rows.map((row) => aggregateRows(row)),
    [rows],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    let out = normalized.filter((row) => {
      const matchesSearch = !term || !searchable || searchable(row).toLowerCase().includes(term)
      const matchesStatus = status === 'all' || String((row as Record<string, unknown>).status ?? '') === status
      const matchesDate = !filterDate || inDateRange(filterDate(row), dateRange)
      return matchesSearch && matchesStatus && matchesDate
    })
    if (sort?.key) {
      out = sortRows(out, (row) => (row as Record<string, unknown>)[sort.key], sort.direction)
    }
    return out
  }, [normalized, search, searchable, status, filterDate, dateRange, sort])

  const range = useMemo(
    () => clampPageRange(filtered.length, pageSize, offset),
    [filtered.length, pageSize, offset],
  )
  useEffect(() => {
    if (offset !== range.offset) setOffset(range.offset)
  }, [offset, range.offset])

  const pageRows = useMemo(
    () => paginate(filtered, range.offset, pageSize),
    [filtered, range.offset, pageSize],
  )
  const selection = useMemo(
    () => selectionState(pageRows, selected, keyOf),
    [pageRows, selected, keyOf],
  )

  const toggleRow = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev)
      const keys = pageRows.map(keyOf)
      const allSelected = keys.length > 0 && keys.every((key) => next.has(key))
      for (const key of keys) {
        if (allSelected) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }, [pageRows, keyOf])

  const clearSelection = useCallback(() => setSelected(new Set()), [])
  const toggleColumn = useCallback((key: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
  const toggleSort = useCallback((key: string) => {
    setSort((prev) => ({
      key,
      direction: nextSortDirection(prev?.key === key ? prev.direction : null),
    }))
  }, [])
  const reset = useCallback(() => {
    setRawSearch('')
    setStatus('all')
    setDateRange({ from: '', to: '' })
    setOffset(0)
    clearSelection()
  }, [clearSelection])

  return {
    // filters
    rawSearch, setRawSearch, search, status, setStatus, dateRange, setDateRange,
    reset, isFiltered: Boolean(search || status !== 'all' || dateRange.from || dateRange.to),
    // output
    rows: normalized, filtered, pageRows, total: filtered.length,
    range, pageSize, setPageSize, setOffset,
    // sorting and columns
    sort, toggleSort, hidden, toggleColumn, density, setDensity,
    // selection and detail
    selected, selection, toggleRow, toggleAll, clearSelection, detail, setDetail,
  }
}

/** Local counterpart of the API normaliser, for table rows before rendering. */
function aggregateRows<T>(row: T): T {
  if (row == null || typeof row !== 'object') return row
  const source = row as Record<string, unknown>
  const out: Record<string, unknown> = { ...source }
  if (!Array.isArray(out.line_items)) out.line_items = []
  if (!Array.isArray(out.items)) out.items = []
  return out as T
}

/* ── Session expiry countdown ───────────────────────────────────────────── */

export function useSessionWarning(token?: string | null, warnBeforeSeconds = 180) {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    if (!token) { setRemaining(null); return }
    let exp: number | null = null
    try {
      const parts = token.split('.')
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
        exp = typeof payload.exp === 'number' ? payload.exp : null
      }
    } catch { exp = null }
    if (!exp) { setRemaining(null); return }
    const update = () => setRemaining(Math.max(0, exp! * 1000 - Date.now()))
    update()
    const timer = window.setInterval(update, 30_000)
    return () => window.clearInterval(timer)
  }, [token])
  return {
    remaining,
    warning: remaining !== null && remaining <= warnBeforeSeconds * 1000,
    expired: remaining !== null && remaining <= 0,
  }
}
