import { describe, expect, it } from 'vitest'
import {
  applyBulkResult,
  applyLinenLiveEvent,
  applyLinenVerification,
  classifyLinen,
  createSession,
  daysSince,
  endSession,
  failQueued,
  failedTotal,
  filterRecords,
  isMissingInCycle,
  queuedCodes,
  recordScan,
  requeueUnresolved,
  scannedCodes,
  summarise,
  summariseCategories,
  transitionViolation,
  allowedNextStatuses,
  type ScanSession,
} from './scan-session'
import { checkLetters } from './linen-code'
import type { LinenBulkScanResult } from '../../../types/linen'

const T0 = 1_700_000_000_000

/** A valid current-format tag: item BS, hotel G, series A, four-digit number
 * and the matching two-letter check. Only these are accepted by the scanners. */
function code(sequence: number): string {
  const base = `BSG-A${String(sequence).padStart(4, '0')}`
  return base + checkLetters(base)
}

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

function result(overrides: Partial<LinenBulkScanResult> = {}): LinenBulkScanResult {
  return { processed: [], errors: [], total_processed: 0, total_errors: 0, ...overrides }
}

describe('admin-defined transition legality', () => {
  const catalogue = {
    groups: [],
    statuses: [],
    violation_mode: 'block' as const,
    transition_rules: [
      { from_status: 'COLLECTED', to_statuses: ['AT_LAUNDRY'] },
      { from_status: 'WASHING', to_statuses: ['DRYING'] },
    ],
  }

  it('blocks re-collecting an already collected linen', () => {
    expect(transitionViolation(catalogue, 'COLLECTED', 'COLLECTED')).toContain('Cannot move')
  })

  it('allows the configured next step', () => {
    expect(transitionViolation(catalogue, 'COLLECTED', 'AT_LAUNDRY')).toBeNull()
  })

  it('treats unmapped statuses as unrestricted', () => {
    expect(transitionViolation(catalogue, 'IN_STOCK', 'WASHING')).toBeNull()
  })

  it('lists allowed next states', () => {
    expect(allowedNextStatuses(catalogue, 'COLLECTED')).toEqual(['AT_LAUNDRY'])
    expect(allowedNextStatuses(catalogue, 'IN_STOCK')).toBeNull()
  })
})

describe('linen scan session queue', () => {
  it('queues scans locally and does not count them as updated before OK', () => {
    const first = code(1)
    const second = code(2)
    let session = openSession()
    session = recordScan(session, first, T0 + 1)
    session = recordScan(session, `  ${second.toLowerCase()}  `, T0 + 2)

    expect(queuedCodes(session)).toEqual([first, second])
    expect(session.records[0].code).toBe(second)

    const summary = summarise(session)
    expect(summary.attempts).toBe(2)
    expect(summary.queued).toBe(2)
    expect(summary.successful).toBe(0)
  })

  it('normalises deep links and rejects non-linen reads without queueing them', () => {
    const tag = code(5)
    let session = openSession()
    session = recordScan(session, `https://ll.example/scan?code=${tag.toLowerCase()}`, T0 + 1)
    session = recordScan(session, 'Cafe WiFi', T0 + 2)

    expect(queuedCodes(session)).toEqual([tag])
    expect(session.records[0]).toMatchObject({ code: 'Cafe WiFi', outcome: 'unreadable' })
    expect(summarise(session).unreadable).toBe(1)
  })

  it('rejects legacy tags, old numeric IDs and wrong check letters', () => {
    let session = openSession()
    session = recordScan(session, 'LL-7K4P92', T0 + 1)
    session = recordScan(session, 'BSG-00001', T0 + 2)
    session = recordScan(session, 'https://lovelaundry.lk/i/BSG-A0001XY', T0 + 3)

    expect(queuedCodes(session)).toEqual([])
    expect(summarise(session).unreadable).toBe(3)
  })

  it('rejects a repeated tag in the same session but keeps a failed tag retryable', () => {
    const tag = code(1)
    let session = openSession()
    session = recordScan(session, tag, T0 + 1)
    session = recordScan(session, tag, T0 + 2)

    expect(session.records[0]).toMatchObject({ code: tag, outcome: 'duplicate' })
    expect(queuedCodes(session)).toEqual([tag])

    session = failQueued(session, 'network down', T0 + 3)
    session = recordScan(session, tag, T0 + 4)
    expect(queuedCodes(session)).toEqual([tag])
  })

  it('settles every queued row from the single OK response', () => {
    const codes = [code(1), code(2), code(3), code(4)]
    let session = openSession()
    for (const tag of codes) {
      session = recordScan(session, tag, T0 + 1)
    }

    session = applyBulkResult(session, result({
      processed: [
        { linen_id: codes[0], from_status: 'IN_STOCK', to_status: 'COLLECTED' },
        { linen_id: codes[1], from_status: 'READY', to_status: 'COLLECTED' },
      ],
      errors: [
        { linen_id: codes[2], error: 'Not found' },
        { linen_id: codes[3], error: 'Unknown action' },
      ],
      total_processed: 2,
      total_errors: 2,
    }), T0 + 2)

    const byCode = new Map(session.records.map(record => [record.code, record]))
    expect(byCode.get(codes[0])).toMatchObject({
      outcome: 'success', fromStatus: 'IN_STOCK', toStatus: 'COLLECTED',
    })
    expect(byCode.get(codes[1])).toMatchObject({ outcome: 'success' })
    expect(byCode.get(codes[2])?.outcome).toBe('not_found')
    expect(byCode.get(codes[3])?.outcome).toBe('rejected')

    const summary = summarise(session)
    expect(summary.queued).toBe(0)
    expect(summary.successful).toBe(2)
    expect(summary.uniqueLinens).toBe(2)
    expect(failedTotal(summary)).toBe(2)
  })

  it('marks a code with no result as failed rather than silently losing it', () => {
    const tag = code(1)
    let session = recordScan(openSession(), tag, T0 + 1)
    session = applyBulkResult(session, result(), T0 + 2)

    expect(session.records[0]).toMatchObject({ outcome: 'failed' })
    expect(summarise(session).failed).toBe(1)
  })

  it('requeues only unresolved rows when correcting after the summary', () => {
    const first = code(1)
    const second = code(2)
    let session = recordScan(openSession(), first, T0 + 1)
    session = recordScan(session, second, T0 + 2)
    session = recordScan(session, 'Cafe WiFi', T0 + 3)
    session = applyBulkResult(session, result({
      processed: [{ linen_id: first, from_status: 'READY', to_status: 'COLLECTED' }],
      errors: [{ linen_id: second, error: 'Not found' }],
    }), T0 + 4)
    session = endSession(session, T0 + 5)

    session = requeueUnresolved(session)

    expect(session.endedAt).toBeUndefined()
    expect(queuedCodes(session)).toEqual([second])
    expect(session.records.some(record => record.code === 'Cafe WiFi')).toBe(false)
    expect(session.records.find(record => record.code === first)?.outcome).toBe('success')
    expect(summarise(session).successful).toBe(1)
  })

  it('keeps a failing batch retryable with every code still queued', () => {
    const first = code(1)
    const second = code(2)
    let session = recordScan(openSession(), first, T0 + 1)
    session = recordScan(session, second, T0 + 2)
    session = failQueued(session, 'Could not reach the linen service', T0 + 3)

    expect(queuedCodes(session)).toEqual([])
    expect(summarise(session).failed).toBe(2)

    session = requeueUnresolved(session)
    expect(queuedCodes(session)).toEqual([first, second])
  })

  it('filters the history by code, state or outcome', () => {
    const first = code(1)
    const second = code(2)
    let session = recordScan(openSession(), first, T0 + 1)
    session = applyBulkResult(session, result({
      processed: [{ linen_id: first, from_status: 'READY', to_status: 'COLLECTED' }],
    }), T0 + 2)
    session = recordScan(session, second, T0 + 3)

    expect(filterRecords(session.records, first)).toHaveLength(1)
    expect(filterRecords(session.records, 'COLLECTED')).toHaveLength(1)
    expect(filterRecords(session.records, 'updated')).toHaveLength(1)
    expect(filterRecords(session.records, 'queued')).toHaveLength(1)
    expect(filterRecords(session.records, '   ')).toHaveLength(2)
  })

  it('counts a thousand queued scans without drift', () => {
    let session = openSession()
    for (let index = 1; index <= 1000; index += 1) {
      session = recordScan(session, code(index), T0 + index)
    }

    expect(queuedCodes(session)).toHaveLength(1000)
    expect(summarise(session).queued).toBe(1000)
  })

  it('counts distinct linens once and buckets the four requested categories', () => {
    const bath = code(7)
    const pool = code(8)
    const single = code(9)
    const double = code(10)
    const other = code(11)
    let session = openSession()
    for (const tag of [bath, pool, single, double, other]) {
      session = recordScan(session, tag, T0 + 1)
    }
    session = recordScan(session, bath, T0 + 2) // duplicate read

    session = applyLinenVerification(session, bath, {
      linen_id: bath, category: 'TOWEL', item_type: 'BATH TOWEL',
    }, T0 + 3)
    session = applyLinenVerification(session, pool, {
      linen_id: pool, category: 'TOWEL', item_type: 'POOL TOWEL',
    }, T0 + 3)
    session = applyLinenVerification(session, single, {
      linen_id: single, category: 'BEDSHEET', size: 'SINGLE',
    }, T0 + 3)
    session = applyLinenVerification(session, double, {
      linen_id: double, category: 'BEDSHEET', item_type: 'DOUBLE',
    }, T0 + 3)
    session = applyLinenVerification(session, other, null, T0 + 3)

    const summary = summarise(session)
    expect(scannedCodes(session.records)).toHaveLength(5)
    expect(summary.distinctLinens).toBe(5)
    expect(summary.verifiedLinens).toBe(4)
    expect(summary.unverifiedLinens).toBe(1)
    expect(summary.categories).toMatchObject({
      bathTowels: 1,
      poolTowels: 1,
      singleBedsheets: 1,
      doubleBedsheets: 1,
      other: 1,
    })

    // The duplicate read inherits its proof from the first bath-towel read.
    const duplicate = session.records.find(record => record.outcome === 'duplicate')
    expect(duplicate).toMatchObject({ verification: 'verified', identity: { linen_id: bath } })
  })

  it('keeps category metadata when a live websocket event patches a tag', () => {
    const tag = code(12)
    let session = recordScan(openSession(), tag, T0 + 1)
    session = applyLinenVerification(session, tag, {
      linen_id: tag, category: 'TOWEL', item_type: 'POOL TOWEL', size: 'LARGE',
    }, T0 + 2)

    session = applyLinenLiveEvent(session, {
      type: 'linen.event',
      event: 'scan',
      action: 'collect',
      at: new Date(T0 + 3).toISOString(),
      linen: { linen_id: tag, status: 'COLLECTED', previous_status: 'READY' },
    }, T0 + 4)

    const record = session.records[0]
    expect(record.live).toMatchObject({ status: 'COLLECTED', previousStatus: 'READY', action: 'collect' })
    expect(record.verification).toBe('verified')
    expect(record.identity).toMatchObject({ item_type: 'POOL TOWEL', size: 'LARGE' })
    expect(classifyLinen(record.identity)).toBe('pool_towel')
  })

  it('marks a tag from a bulk linen_ids event live even without a snapshot', () => {
    const tag = code(13)
    let session = recordScan(openSession(), tag, T0 + 1)
    session = applyLinenLiveEvent(session, {
      event: 'bulk_scan', linen_ids: [tag.toLowerCase(), code(11)],
    }, T0 + 2)

    expect(session.records[0].live).toMatchObject({ event: 'bulk_scan', at: T0 + 2 })
    expect(session.records[0].verification).toBe('checking')
  })

  it('uses one admin-defined window for overdue linen', () => {
    expect(daysSince(new Date(T0 - 3 * 86_400_000).toISOString(), T0)).toBe(3)
    expect(daysSince(undefined, T0)).toBeNull()

    const base = { status: 'AT_CLIENT' as const, last_scanned_date: new Date(T0 - 6 * 86_400_000).toISOString() }
    expect(isMissingInCycle(base, 7, T0)).toBe(false)
    expect(isMissingInCycle(base, 5, T0)).toBe(true)
    expect(isMissingInCycle({ status: 'MISSING', last_scanned_date: new Date(T0).toISOString() }, 7, T0)).toBe(true)
    expect(isMissingInCycle({ status: 'RETIRED', last_scanned_date: undefined }, 7, T0)).toBe(false)
    expect(isMissingInCycle({ status: 'READY', last_scanned_date: undefined }, 7, T0)).toBe(true)
  })

  it('classifies bedsheets by size and never mistakes a bath mat for a towel', () => {
    expect(classifyLinen({ linen_id: 'A', category: 'BEDSHEET', size: 'DOUBLE' })).toBe('double_bedsheet')
    expect(classifyLinen({ linen_id: 'B', item_type: 'Single bed sheet' })).toBe('single_bedsheet')
    expect(classifyLinen({ linen_id: 'C', category: 'BATH_MAT', item_type: 'Bath mat' })).toBe('other')
    expect(summariseCategories([]).distinct).toBe(0)
  })
})
