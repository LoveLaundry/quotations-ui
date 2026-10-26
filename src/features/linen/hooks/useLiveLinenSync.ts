import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/AuthContext'
import { invalidateResource } from '../../../cache/invalidation'
import { linenService } from '../services/linen.service'
import { subscribeLinenChange } from '../live-channel'

const POLL_MS = 1000

/**
 * Keep every open session on the same laundry in lockstep with QR scans.
 * A cheap clock endpoint is polled while the tab is visible; when it moves,
 * linen lists/details/stats are invalidated so other users see the new
 * status without a full reload.
 */
export function useLiveLinenSync(queryClient: QueryClient): void {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    let clock = 0
    let timer: ReturnType<typeof setTimeout> | null = null
    let inFlight = false

    const refresh = () => {
      invalidateResource(queryClient, 'linen')
    }

    const unsub = subscribeLinenChange(refresh)

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
      unsub()
    }
  }, [isAuthenticated, queryClient])
}
