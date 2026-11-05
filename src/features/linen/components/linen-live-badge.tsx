import { Badge } from '../../../components/ui/badge'
import type { LinenLiveStatus } from '../../../types/linen'

/**
 * Whether the status on screen is being pushed or polled.
 *
 * Worth the pixels: an operator standing at a hotel desk needs to know that the
 * "Washing" they are looking at will move by itself when the laundry scans the
 * tag, or whether they are looking at a snapshot that refreshes on a timer.
 */
export function LinenLiveBadge({
  status,
  className,
}: {
  status: LinenLiveStatus
  className?: string
}) {
  if (status === 'idle') return null

  if (status === 'live') {
    return (
      <Badge
        tone="success"
        size="xs"
        dot
        className={className}
        title="Live — status changes are pushed the moment another device scans"
      >
        Live
      </Badge>
    )
  }

  if (status === 'connecting') {
    return (
      <Badge
        tone="warning"
        size="xs"
        dot
        className={className}
        title="Opening the live connection"
      >
        Connecting
      </Badge>
    )
  }

  return (
    <Badge
      tone="neutral"
      size="xs"
      dot
      className={className}
      title="Live connection unavailable — this screen refreshes on a timer instead"
    >
      Polling
    </Badge>
  )
}
