import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { invalidateResource } from '../../../cache/invalidation'
import { subscribeLinenChange } from '../live-channel'
import { useLinenRealtimeSync } from '../realtime/useLinenRealtime'

/**
 * Keep every open session on the same laundry in lockstep with QR scans.
 *
 * Live changes now arrive over the linen WebSocket (see
 * `realtime/useLinenRealtime`), which patches the affected rows instead of
 * refetching. Two things stay here because the socket cannot do them:
 *
 *  - the live-clock poll, used only while the socket is not connected — a
 *    deployment that refuses the upgrade (serverless) keeps working exactly as
 *    it did before;
 *  - the same-browser BroadcastChannel, so two tabs stay in sync even when the
 *    socket is unavailable and the poll is between ticks.
 */
export function useLiveLinenSync(queryClient: QueryClient): void {
  useLinenRealtimeSync(queryClient)

  useEffect(
    () => subscribeLinenChange(() => invalidateResource(queryClient, 'linen')),
    [queryClient],
  )
}
