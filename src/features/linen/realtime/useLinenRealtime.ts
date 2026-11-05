import { useEffect, useRef, useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/AuthContext'
import { invalidateResource } from '../../../cache/invalidation'
import { linenService } from '../services/linen.service'
import { CHANNEL_LAUNDRY, linenChannel, linenSocket } from './linen-socket'
import { applyLinenEvent } from './apply-event'
import type { LinenLiveStatus, LinenRealtimeEvent } from '../../../types/linen'

/**
 * Live linen transport for the whole app.
 *
 * Two layers, in this order of preference:
 *
 *  1. the WebSocket — events arrive pushed, cache is patched in place;
 *  2. the per-laundry live clock poll — used while the socket is not open, so
 *     a deployment that cannot hold a socket (serverless) behaves exactly as it
 *     did before this feature existed.
 *
 * The poll is stopped the moment the socket is live and resumed if it drops,
 * so the two never both run and no screen depends on either one.
 */

/** Coalesce a burst (a bulk scan publishes one event per tag) into a single
 *  cache pass. Below a frame at 60fps, so a scan still feels instantaneous. */
const FLUSH_MS = 120
const POLL_MS = 1000

export function useLinenRealtimeSync(queryClient: QueryClient): LinenLiveStatus {
  const { token, isAuthenticated } = useAuth()
  const [status, setStatus] = useState<LinenLiveStatus>(() => linenSocket.getStatus())
  const pending = useRef<LinenRealtimeEvent[]>([])
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── connection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      linenSocket.disconnect()
      return
    }
    linenSocket.connect(token)
    const onOnline = () => linenSocket.connect(token)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('online', onOnline)
    }
  }, [isAuthenticated, token])

  // ── what to listen to ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    return linenSocket.subscribe(CHANNEL_LAUNDRY)
  }, [isAuthenticated])

  // ── status, for the fallback decision and the indicator ────────────────
  useEffect(() => linenSocket.onStatus(setStatus), [])

  // ── events → cache ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return

    const flush = () => {
      flushTimer.current = null
      const batch = pending.current
      pending.current = []
      for (const event of batch) {
        try {
          applyLinenEvent(queryClient, event)
        } catch {
          // A malformed frame must never take the app's data layer down; the
          // next poll or navigation still reconciles.
        }
      }
    }

    const offEvent = linenSocket.onEvent((event) => {
      pending.current.push(event)
      if (flushTimer.current) return
      flushTimer.current = setTimeout(flush, FLUSH_MS)
    })

    // The socket came back after a gap: events were published while it was
    // down, so the clock moved without us seeing it. Reconcile once.
    const offResync = linenSocket.onResync(() => {
      invalidateResource(queryClient, 'linen')
    })

    return () => {
      offEvent()
      offResync()
      if (flushTimer.current) {
        clearTimeout(flushTimer.current)
        flushTimer.current = null
      }
      pending.current = []
    }
  }, [isAuthenticated, queryClient])

  // ── polling fallback (only while the socket is not carrying events) ────
  useEffect(() => {
    if (!isAuthenticated || status === 'live') return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let inFlight = false
    // Seed from the socket's clock so a live → fallback transition does not
    // refetch everything it has just been patching.
    let clock = linenSocket.getClock()

    const refresh = () => invalidateResource(queryClient, 'linen')

    const tick = async () => {
      if (cancelled || inFlight) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        timer = setTimeout(() => void tick(), POLL_MS)
        return
      }
      inFlight = true
      try {
        const next = await linenService.getLiveClock()
        if (!cancelled && next > clock) {
          const firstSample = clock === 0
          clock = next
          if (!firstSample) refresh()
        }
      } catch {
        // Network blip — the next tick retries.
      } finally {
        inFlight = false
        if (!cancelled) timer = setTimeout(() => void tick(), POLL_MS)
      }
    }

    void tick()
    const onVis = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [isAuthenticated, status, queryClient])

  return status
}

/** Transport status only — for a "live" badge that does not need events. */
export function useLinenLiveStatus(): LinenLiveStatus {
  const [status, setStatus] = useState<LinenLiveStatus>(() => linenSocket.getStatus())
  useEffect(() => linenSocket.onStatus(setStatus), [])
  return status
}

export interface LinenChannelState {
  status: LinenLiveStatus
  /** The most recent push that touched this tag, whoever caused it. */
  lastEvent: LinenRealtimeEvent | null
}

/**
 * Follow one tag.
 *
 * This is what a status screen uses: while it is open the server streams only
 * changes to *this* linen, so the status being looked at cannot be a stale
 * copy — a scan at the laundry desk updates the hotel's open tab in the same
 * second, and a second operator scanning the same tag is visible here.
 */
export function useLinenChannel(code?: string | null): LinenChannelState {
  const [status, setStatus] = useState<LinenLiveStatus>(() => linenSocket.getStatus())
  const [lastEvent, setLastEvent] = useState<LinenRealtimeEvent | null>(null)
  const normalized = code ? String(code).trim().toUpperCase() : ''

  useEffect(() => linenSocket.onStatus(setStatus), [])

  useEffect(() => {
    if (!normalized) {
      setLastEvent(null)
      return
    }
    return linenSocket.subscribe(linenChannel(normalized))
  }, [normalized])

  useEffect(() => {
    if (!normalized) return
    return linenSocket.onEvent((event) => {
      const touched =
        (event.linen?.linen_id ?? '').toUpperCase() === normalized ||
        (event.linen_ids ?? []).some((item) => String(item).toUpperCase() === normalized)
      if (touched) setLastEvent(event)
    })
  }, [normalized])

  return { status, lastEvent }
}
