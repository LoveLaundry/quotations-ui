/**
 * How a write actually landed.
 *
 * The offline adapter answers a queued write with `202 { queued: true }` so the
 * UI can keep working, which is easy to mistake for a real save. Toasting
 * "recorded" for a correction that is only sitting in the outbox is worse than
 * useless: the balance on screen does not move, the operator posts it again,
 * and now there are two corrections queued for the same mistake.
 *
 * Every mutation therefore reports which of the three things happened.
 */
import { toast } from 'sonner'

export interface QueuedWriteMarker {
  queued?: boolean
}

export function isQueuedWrite(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && (value as QueuedWriteMarker).queued)
}

const API_MESSAGES: Record<string, string> = {
  delivery: 'Delivery recorded',
  balance_adjustment: 'Balance correction recorded',
  void: 'Correction voided',
  payment: 'Payment recorded',
  bill: 'Bill saved',
}

export type WriteKind = keyof typeof API_MESSAGES

/**
 * Toast the real outcome of a write and report whether the data changed.
 *
 * Returns `true` when the server accepted the write and cached data can be
 * treated as fresh, `false` when it was only queued — in which case the caller
 * must not treat the current figures as the new truth.
 */
export function reportWriteOutcome(
  result: unknown,
  kind: WriteKind,
  queuedMessage: string,
): boolean {
  if (isQueuedWrite(result)) {
    toast.info(queuedMessage, { description: 'It will be sent as soon as you are back online.' })
    return false
  }
  toast.success(API_MESSAGES[kind])
  return true
}
