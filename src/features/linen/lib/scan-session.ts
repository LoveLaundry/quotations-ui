import type { LinenCustody } from '../../../types/linen'

/**
 * The state of one continuous scanning session, as pure data.
 *
 * Kept free of React and of the network so the counters an operator trusts can
 * be tested without a browser. The API calls live in the page; this module only
 * answers "what has this session done so far".
 *
 * Each scan commits on the server as it happens — there is no batch to submit —
 * so a session is a record of work already durable, not a staging area. Ending
 * a session therefore closes the local record; it does not finalise a shipment,
 * and must never be presented as if it did.
 */

export type ScanOutcome =
  | 'pending'
  | 'success'
  | 'duplicate'
  /** Decoded or typed text that is not a linen tag at all (a Wi-Fi poster). */
  | 'unreadable'
  /** A well-formed code with no linen registered under it here. */
  | 'not_found'
  /** The server refused the transition (rejected / conflict / unknown action). */
  | 'rejected'
  /** Nothing answerable: network down, timeout, 5xx. */
  | 'failed'

export interface ScanRecord {
  /** Normalised linen code, or the raw text when the tag was unreadable. */
  code: string
  outcome: ScanOutcome
  linenType?: string
  fromStatus?: string
  toStatus?: string
  /** Why it failed, in operator terms, when the outcome is not a success. */
  message?: string
  /** Epoch milliseconds of the attempt, and of its resolution. */
  attemptedAt: number
  resolvedAt?: number
}

export interface ScanSession {
  id: string
  action: string
  actionLabel: string
  toStatus: string
  custody: LinenCustody
  operator: string
  startedAt: number
  endedAt?: number
  /** Newest first, so the strip at the top of the screen is the live edge. */
  records: ScanRecord[]
}

export interface ScanSummary {
  attempts: number
  successful: number
  uniqueLinens: number
  duplicates: number
  failed: number
  pending: number
  unreadable: number
  notFound: number
  rejected: number
}

/** Only these may be incremented from an outcome — `attempts` and
 * `uniqueLinens` are derived, so an outcome must never write to them. */
type SummaryBucket = 'pending' | 'successful' | 'duplicates' | 'unreadable' | 'notFound' | 'rejected' | 'failed'

const OUTCOME_BUCKET: Record<ScanOutcome, SummaryBucket | null> = {
  pending: 'pending',
  success: 'successful',
  duplicate: 'duplicates',
  unreadable: 'unreadable',
  not_found: 'notFound',
  rejected: 'rejected',
  failed: 'failed',
}

export function createSession(input: {
  action: string
  actionLabel: string
  toStatus: string
  custody: LinenCustody
  operator: string
  /** Injectable for tests; a real session derives one per browser tab. */
  id?: string
  startedAt?: number
}): ScanSession {
  return {
    id: input.id ?? newSessionId(),
    action: input.action,
    actionLabel: input.actionLabel,
    toStatus: input.toStatus,
    custody: input.custody,
    operator: input.operator,
    startedAt: input.startedAt ?? Date.now(),
    records: [],
  }
}

export function isSessionOpen(session: ScanSession): boolean {
  return session.endedAt === undefined
}

export function endSession(session: ScanSession, endedAt = Date.now()): ScanSession {
  return { ...session, endedAt }
}

/**
 * A code that already succeeded in THIS session is a duplicate.
 *
 * Deliberately not "already seen": a failed or rejected attempt must stay
 * retryable, or one transient network blip would lock the operator out of the
 * linen they were trying to record. Equally this is session-scoped — the same
 * linen scanned next week in another shipment is a second legitimate physical
 * movement, not a duplicate (see the master brief, part 4.3).
 */
export function alreadyRecorded(session: ScanSession, code: string): boolean {
  return session.records.some(r => r.code === code && r.outcome === 'success')
}

/**
 * A scan of this code is still being processed.
 *
 * A fast scanner (or an operator double-tapping) can deliver the same tag twice
 * before the first answer comes back. Without this the second would pass the
 * duplicate test above — no success is recorded yet — and start a second
 * transition for one physical linen.
 */
export function inFlight(session: ScanSession, code: string): boolean {
  return session.records.some(r => r.code === code && r.outcome === 'pending')
}

/** Add an attempt as pending. The caller then performs the server work. */
export function recordAttempt(session: ScanSession, code: string, attemptedAt = Date.now()): ScanSession {
  return {
    ...session,
    records: [{ code, outcome: 'pending', attemptedAt }, ...session.records],
  }
}

/** Settle a pending attempt. Ignored if the record has already been settled. */
export function resolveAttempt(
  session: ScanSession,
  code: string,
  patch: { outcome: ScanOutcome; linenType?: string; fromStatus?: string; toStatus?: string; message?: string },
  resolvedAt = Date.now()
): ScanSession {
  const index = session.records.findIndex(r => r.code === code && r.outcome === 'pending')
  if (index === -1) return session

  const records = session.records.slice()
  records[index] = {
    ...records[index],
    outcome: patch.outcome,
    linenType: patch.linenType ?? records[index].linenType,
    fromStatus: patch.fromStatus ?? records[index].fromStatus,
    toStatus: patch.toStatus ?? records[index].toStatus,
    message: patch.message ?? records[index].message,
    resolvedAt,
  }
  return { ...session, records }
}

/**
 * Count the session, derived from its records every time.
 *
 * Nothing is incremented into a stored counter, so the header can never drift
 * away from the list below it — the numbers are always recomputed from the same
 * rows the operator can see and search.
 */
export function summarise(session: ScanSession): ScanSummary {
  const summary: ScanSummary = {
    attempts: session.records.length,
    successful: 0,
    uniqueLinens: 0,
    duplicates: 0,
    failed: 0,
    pending: 0,
    unreadable: 0,
    notFound: 0,
    rejected: 0,
  }

  const successfulCodes = new Set<string>()
  for (const record of session.records) {
    const bucket = OUTCOME_BUCKET[record.outcome]
    if (bucket) summary[bucket] += 1
    if (record.outcome === 'success') successfulCodes.add(record.code)
  }

  summary.uniqueLinens = successfulCodes.size
  return summary
}

/** Everything that did not end well, which the header shows as one number and
 * the summary breaks down by cause. */
export function failedTotal(summary: ScanSummary): number {
  return summary.unreadable + summary.notFound + summary.rejected + summary.failed
}

/** Colour per outcome, so green/yellow/red means the same thing on every card. */
export const OUTCOME_TONE: Record<ScanOutcome, 'green' | 'amber' | 'red' | 'blue' | 'neutral'> = {
  success: 'green',
  duplicate: 'amber',
  unreadable: 'amber',
  not_found: 'red',
  rejected: 'red',
  failed: 'red',
  pending: 'blue',
}

export const OUTCOME_LABEL: Record<ScanOutcome, string> = {
  success: 'Updated',
  duplicate: 'Duplicate',
  unreadable: 'Not a linen tag',
  not_found: 'Not registered',
  rejected: 'Rejected',
  failed: 'Failed',
  pending: 'Working…',
}

/** Case- and whitespace-insensitive filter over the live history strip. */
export function filterRecords(records: ScanRecord[], term: string): ScanRecord[] {
  const needle = term.trim().toLowerCase()
  if (!needle) return records
  return records.filter(r =>
    [r.code, r.linenType, r.fromStatus, r.toStatus, OUTCOME_LABEL[r.outcome]]
      .filter(Boolean)
      .some(field => String(field).toLowerCase().includes(needle))
  )
}

/**
 * A readable id for the header. Not a database key — the server does not know
 * about sessions yet — so it is generated per tab and shown so an operator can
 * quote it when a batch goes wrong.
 */
function newSessionId(): string {
  const stamp = new Date().toISOString().slice(11, 16).replace(':', '')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `S-${stamp}-${random}`
}
