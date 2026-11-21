import type { LinenBulkScanResult, LinenCustody } from '../../../types/linen'
import { parseLinenCode } from './linen-code'

/**
 * Pure state for one continuous scanning session.
 *
 * Scans are queued locally and are NOT written to linen when they are read.
 * Pressing OK submits the whole queue in one `POST /linens/bulk-scan` call and
 * the server response settles every queued row. Keeping this module free of
 * React and of the network makes the counters and the retry rules testable.
 *
 * A session exists only in the browser: the server has no session entity. The
 * id is an operator-facing reference for one batch, not a database key.
 */

export type ScanOutcome =
  /** A valid code waiting for the OK batch submission. */
  | 'queued'
  /** Confirmed by the server as part of the OK batch. */
  | 'success'
  /** The same tag was already queued or updated in this session. */
  | 'duplicate'
  /** The read was not a linen tag at all (a Wi-Fi poster, for example). */
  | 'unreadable'
  /** A well-formed code the server could not find. */
  | 'not_found'
  /** The server refused this row. */
  | 'rejected'
  /** The batch call failed or returned no answer for this row. */
  | 'failed'

export interface ScanRecord {
  /** Normalised linen code, or capped raw text when the read was unreadable. */
  code: string
  outcome: ScanOutcome
  fromStatus?: string
  toStatus?: string
  message?: string
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
  /** Newest first, so the visible history strip shows the live edge. */
  records: ScanRecord[]
}

export interface ScanSummary {
  attempts: number
  queued: number
  successful: number
  uniqueLinens: number
  duplicates: number
  unreadable: number
  notFound: number
  rejected: number
  failed: number
}

type SummaryBucket = 'queued' | 'successful' | 'duplicates' | 'unreadable' | 'notFound' | 'rejected' | 'failed'

const OUTCOME_BUCKET: Record<ScanOutcome, SummaryBucket> = {
  queued: 'queued',
  success: 'successful',
  duplicate: 'duplicates',
  unreadable: 'unreadable',
  not_found: 'notFound',
  rejected: 'rejected',
  failed: 'failed',
}

const MAX_DISPLAY_CODE = 32
const RETRYABLE: ScanOutcome[] = ['not_found', 'rejected', 'failed']

export function createSession(input: {
  action: string
  actionLabel: string
  toStatus: string
  custody: LinenCustody
  operator: string
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

/** Add one raw scan. Invalid reads are recorded so the operator can see them;
 * valid codes enter the batch queue unless they are already in this session. */
export function recordScan(session: ScanSession, raw: string, attemptedAt = Date.now()): ScanSession {
  const code = parseLinenCode(raw)

  if (!code) {
    const shown = (raw ?? '').trim().slice(0, MAX_DISPLAY_CODE) || 'empty read'
    return prepend(session, {
      code: shown,
      outcome: 'unreadable',
      message: 'Not a linen tag',
      attemptedAt,
    })
  }

  if (session.records.some(record => record.code === code && (record.outcome === 'queued' || record.outcome === 'success'))) {
    return prepend(session, {
      code,
      outcome: 'duplicate',
      message: 'Already in this session',
      attemptedAt,
    })
  }

  return prepend(session, { code, outcome: 'queued', attemptedAt })
}

/** Codes to send to bulk-scan, oldest first and unique. */
export function queuedCodes(session: ScanSession): string[] {
  return session.records
    .filter(record => record.outcome === 'queued')
    .reverse()
    .map(record => record.code)
}

/** Re-open a finished session and put server-rejected rows back in the queue.
 * Unreadable reads have no usable code, so they are dropped and re-scanned. */
export function requeueUnresolved(session: ScanSession): ScanSession {
  const seen = new Set(queuedCodes(session))
  const records = session.records.flatMap(record => {
    if (record.outcome === 'unreadable') return []

    if (RETRYABLE.includes(record.outcome)) {
      if (seen.has(record.code)) return []
      seen.add(record.code)
      return [{ ...record, outcome: 'queued' as const, message: undefined, resolvedAt: undefined }]
    }

    return [record]
  })

  return { ...session, endedAt: undefined, records }
}

/** Settle every queued row from one bulk-scan response. */
export function applyBulkResult(
  session: ScanSession,
  result: LinenBulkScanResult,
  resolvedAt = Date.now()
): ScanSession {
  const processed = new Map<string, LinenBulkScanResult['processed'][number]>()
  for (const row of result.processed ?? []) {
    processed.set(normalise(row.linen_id), row)
  }

  const errors = new Map<string, string>()
  for (const row of result.errors ?? []) {
    errors.set(normalise(row.linen_id), row.error)
  }

  return {
    ...session,
    records: session.records.map(record => {
      if (record.outcome !== 'queued') return record

      const row = processed.get(record.code)
      if (row) {
        return {
          ...record,
          outcome: 'success' as const,
          fromStatus: row.from_status,
          toStatus: row.to_status,
          message: undefined,
          resolvedAt,
        }
      }

      const error = errors.get(record.code)
      if (error) {
        const notFound = /not\s*found|not\s*registered/i.test(error)
        return {
          ...record,
          outcome: notFound ? ('not_found' as const) : ('rejected' as const),
          message: error,
          resolvedAt,
        }
      }

      return {
        ...record,
        outcome: 'failed' as const,
        message: 'No result was returned for this code',
        resolvedAt,
      }
    }),
  }
}

/** A transport-level failure settles every queued row so none is left looking
 * as though it might have been submitted. They stay retryable. */
export function failQueued(session: ScanSession, message: string, resolvedAt = Date.now()): ScanSession {
  return {
    ...session,
    records: session.records.map(record =>
      record.outcome === 'queued'
        ? { ...record, outcome: 'failed' as const, message, resolvedAt }
        : record
    ),
  }
}

export function summarise(session: ScanSession): ScanSummary {
  const summary: ScanSummary = {
    attempts: session.records.length,
    queued: 0,
    successful: 0,
    uniqueLinens: 0,
    duplicates: 0,
    unreadable: 0,
    notFound: 0,
    rejected: 0,
    failed: 0,
  }

  const successfulCodes = new Set<string>()
  for (const record of session.records) {
    summary[OUTCOME_BUCKET[record.outcome]] += 1
    if (record.outcome === 'success') successfulCodes.add(record.code)
  }
  summary.uniqueLinens = successfulCodes.size
  return summary
}

/** Every attempt that did not result in a linen update. */
export function failedTotal(summary: ScanSummary): number {
  return summary.unreadable + summary.notFound + summary.rejected + summary.failed
}

export const OUTCOME_TONE: Record<ScanOutcome, 'green' | 'amber' | 'red' | 'blue' | 'neutral'> = {
  success: 'green',
  queued: 'blue',
  duplicate: 'amber',
  unreadable: 'amber',
  not_found: 'red',
  rejected: 'red',
  failed: 'red',
}

export const OUTCOME_LABEL: Record<ScanOutcome, string> = {
  success: 'Updated',
  queued: 'Queued',
  duplicate: 'Duplicate',
  unreadable: 'Not a linen tag',
  not_found: 'Not registered',
  rejected: 'Rejected',
  failed: 'Failed',
}

export function filterRecords(records: ScanRecord[], term: string): ScanRecord[] {
  const needle = term.trim().toLowerCase()
  if (!needle) return records
  return records.filter(record =>
    [record.code, record.fromStatus, record.toStatus, record.message, OUTCOME_LABEL[record.outcome]]
      .filter(Boolean)
      .some(field => String(field).toLowerCase().includes(needle))
  )
}

function prepend(session: ScanSession, record: ScanRecord): ScanSession {
  return { ...session, records: [record, ...session.records] }
}

function normalise(code: string): string {
  return String(code ?? '').trim().toUpperCase()
}

function newSessionId(): string {
  const stamp = new Date().toISOString().slice(11, 16).replace(':', '')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `S-${stamp}-${random}`
}
