import { describe, expect, it } from 'vitest'
import {
  alreadyRecorded,
  createSession,
  endSession,
  failedTotal,
  filterRecords,
  inFlight,
  recordAttempt,
  resolveAttempt,
  summarise,
  type ScanSession,
} from './scan-session'

const T0 = 1_700_000_000_000

function openSession(): ScanSession {
  return createSession({
    action: 'collect',
    actionLabel: 'Collect',
    toStatus: 'COLLECTED',
    custody: 'hotel',
    operator: 'dulshan',
    id: 'S-TEST-0001',
    startedAt: T0,
  })
}

/** Scan one tag all the way through: attempt, then success. */
function succeed(session: ScanSession, code: string, fromStatus = 'IN_STOCK'): ScanSession {
  const attempted = recordAttempt(session, code, T0 + 1)
  return resolveAttempt(attempted, code, {
    outcome: 'success',
    linenType: 'Bedsheet',
    fromStatus,
    toStatus: 'COLLECTED',
  }, T0 + 2)
}

describe('scanning session', () => {
  it('counts every attempt once, newest first', () => {
    let s = openSession()
    s = succeed(s, 'LL-AAAAAA')
    s = succeed(s, 'LL-BBBBBB')

    const summary = summarise(s)
    expect(summary.attempts).toBe(2)
    expect(summary.successful).toBe(2)
    expect(summary.uniqueLinens).toBe(2)
    expect(summary.pending).toBe(0)
    expect(failedTotal(summary)).toBe(0)
    expect(s.records[0].code).toBe('LL-BBBBBB')
  })

  it('treats a repeated tag in the same session as a duplicate, not a second linen', () => {
    let s = openSession()
    s = succeed(s, 'LL-AAAAAA')

    expect(alreadyRecorded(s, 'LL-AAAAAA')).toBe(true)

    const attempted = recordAttempt(s, 'LL-AAAAAA', T0 + 3)
    s = resolveAttempt(attempted, 'LL-AAAAAA', { outcome: 'duplicate', message: 'already scanned this session' }, T0 + 4)

    const summary = summarise(s)
    expect(summary.duplicates).toBe(1)
    // The duplicate attempt must not inflate what was actually recorded.
    expect(summary.successful).toBe(1)
    expect(summary.uniqueLinens).toBe(1)
    expect(summary.attempts).toBe(2)
  })

  it('keeps a failed attempt retryable so one blip cannot lock out a linen', () => {
    let s = openSession()
    const first = recordAttempt(s, 'LL-AAAAAA', T0 + 1)
    s = resolveAttempt(first, 'LL-AAAAAA', { outcome: 'failed', message: 'no connection' }, T0 + 2)

    expect(alreadyRecorded(s, 'LL-AAAAAA')).toBe(false)

    s = succeed(s, 'LL-AAAAAA')
    const summary = summarise(s)
    expect(summary.successful).toBe(1)
    expect(summary.failed).toBe(1)
    expect(summary.duplicates).toBe(0)
  })

  it('separates a non-linen tag from an unregistered linen', () => {
    let s = openSession()
    const junk = recordAttempt(s, 'SSGTWiFi', T0 + 1)
    s = resolveAttempt(junk, 'SSGTWiFi', { outcome: 'unreadable', message: 'not a linen ID' }, T0 + 2)

    const missing = recordAttempt(s, 'LL-ZZZZZZ', T0 + 3)
    s = resolveAttempt(missing, 'LL-ZZZZZZ', { outcome: 'not_found' }, T0 + 4)

    const summary = summarise(s)
    expect(summary.unreadable).toBe(1)
    expect(summary.notFound).toBe(1)
    expect(failedTotal(summary)).toBe(2)
    expect(summary.successful).toBe(0)
  })

  it('holds an attempt as pending until the server answers', () => {
    const s = recordAttempt(openSession(), 'LL-AAAAAA', T0 + 1)
    const summary = summarise(s)
    expect(summary.pending).toBe(1)
    expect(summary.successful).toBe(0)
    // Pending is counted as an attempt but is not yet a failure.
    expect(summary.attempts).toBe(1)
    expect(failedTotal(summary)).toBe(0)
  })

  it('recognises a scan that is still being processed', () => {
    const s = recordAttempt(openSession(), 'LL-AAAAAA', T0 + 1)
    // A fast scanner can deliver the same tag twice before the first answer
    // returns; nothing is recorded as successful yet, so this is the guard.
    expect(inFlight(s, 'LL-AAAAAA')).toBe(true)
    expect(alreadyRecorded(s, 'LL-AAAAAA')).toBe(false)
    expect(inFlight(s, 'LL-BBBBBB')).toBe(false)

    const settled = resolveAttempt(s, 'LL-AAAAAA', { outcome: 'failed' }, T0 + 2)
    expect(inFlight(settled, 'LL-AAAAAA')).toBe(false)
  })

  it('settles a pending attempt exactly once', () => {
    const attempted = recordAttempt(openSession(), 'LL-AAAAAA', T0 + 1)
    const settled = resolveAttempt(attempted, 'LL-AAAAAA', { outcome: 'success', toStatus: 'COLLECTED' }, T0 + 2)
    // A late second resolution (a retry that came back after the first) must
    // not rewrite the record the operator already acted on.
    const twice = resolveAttempt(settled, 'LL-AAAAAA', { outcome: 'failed', message: 'timeout' }, T0 + 3)

    expect(twice).toBe(settled)
    expect(twice.records[0].outcome).toBe('success')
  })

  it('records the state the linen moved from and to', () => {
    const s = succeed(openSession(), 'LL-AAAAAA', 'READY')
    expect(s.records[0].fromStatus).toBe('READY')
    expect(s.records[0].toStatus).toBe('COLLECTED')
    expect(s.records[0].linenType).toBe('Bedsheet')
  })

  it('survives a thousand scans and still counts them correctly', () => {
    let s = openSession()
    for (let i = 0; i < 1000; i += 1) {
      s = succeed(s, `LL-${String(i).padStart(6, '0')}`)
    }
    const summary = summarise(s)
    expect(summary.attempts).toBe(1000)
    expect(summary.uniqueLinens).toBe(1000)
    expect(s.records.length).toBe(1000)
  })

  it('ends the session without touching what was already recorded', () => {
    let s = succeed(openSession(), 'LL-AAAAAA')
    s = endSession(s, T0 + 10)

    expect(s.endedAt).toBe(T0 + 10)
    // Ending is a local close: every scan was committed as it happened.
    expect(summarise(s).successful).toBe(1)
  })

  it('filters the history strip on code, type, state or outcome', () => {
    let s = openSession()
    s = succeed(s, 'LL-AAAAAA')
    const junk = recordAttempt(s, 'LL-BBBBBB', T0 + 5)
    s = resolveAttempt(junk, 'LL-BBBBBB', { outcome: 'not_found' }, T0 + 6)

    expect(filterRecords(s.records, 'll-aaaa')).toHaveLength(1)
    expect(filterRecords(s.records, 'bedsheet')).toHaveLength(1)
    expect(filterRecords(s.records, 'not registered')).toHaveLength(1)
    expect(filterRecords(s.records, 'COLLECTED')).toHaveLength(1)
    expect(filterRecords(s.records, '   ')).toHaveLength(2)
    expect(filterRecords(s.records, 'nothing-matches')).toHaveLength(0)
  })
})
