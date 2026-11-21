import { describe, expect, it } from 'vitest'
import {
  applyBulkResult,
  createSession,
  endSession,
  failQueued,
  failedTotal,
  filterRecords,
  queuedCodes,
  recordScan,
  requeueUnresolved,
  summarise,
  type ScanSession,
} from './scan-session'
import type { LinenBulkScanResult } from '../../../types/linen'

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

function result(overrides: Partial<LinenBulkScanResult> = {}): LinenBulkScanResult {
  return { processed: [], errors: [], total_processed: 0, total_errors: 0, ...overrides }
}

describe('linen scan session queue', () => {
  it('queues scans locally and does not count them as updated before OK', () => {
    let session = openSession()
    session = recordScan(session, 'LL-AAAAAA', T0 + 1)
    session = recordScan(session, '  ll-bbbbbb  ', T0 + 2)

    expect(queuedCodes(session)).toEqual(['LL-AAAAAA', 'LL-BBBBBB'])
    expect(session.records[0].code).toBe('LL-BBBBBB')

    const summary = summarise(session)
    expect(summary.attempts).toBe(2)
    expect(summary.queued).toBe(2)
    expect(summary.successful).toBe(0)
  })

  it('normalises deep links and rejects non-linen reads without queueing them', () => {
    let session = openSession()
    session = recordScan(session, 'https://ll.example/scan?code=LL-7K4P92', T0 + 1)
    session = recordScan(session, 'Cafe WiFi', T0 + 2)

    expect(queuedCodes(session)).toEqual(['LL-7K4P92'])
    expect(session.records[0]).toMatchObject({ code: 'Cafe WiFi', outcome: 'unreadable' })
    expect(summarise(session).unreadable).toBe(1)
  })

  it('rejects a repeated tag in the same session but keeps a failed tag retryable', () => {
    let session = openSession()
    session = recordScan(session, 'LL-AAAAAA', T0 + 1)
    session = recordScan(session, 'LL-AAAAAA', T0 + 2)

    expect(session.records[0]).toMatchObject({ code: 'LL-AAAAAA', outcome: 'duplicate' })
    expect(queuedCodes(session)).toEqual(['LL-AAAAAA'])

    session = failQueued(session, 'network down', T0 + 3)
    session = recordScan(session, 'LL-AAAAAA', T0 + 4)
    expect(queuedCodes(session)).toEqual(['LL-AAAAAA'])
  })

  it('settles every queued row from the single OK response', () => {
    let session = openSession()
    for (const code of ['LL-AAAAAA', 'LL-BBBBBB', 'LL-CCCCCC', 'LL-DDDDDD']) {
      session = recordScan(session, code, T0 + 1)
    }

    session = applyBulkResult(session, result({
      processed: [
        { linen_id: 'LL-AAAAAA', from_status: 'IN_STOCK', to_status: 'COLLECTED' },
        { linen_id: 'LL-BBBBBB', from_status: 'READY', to_status: 'COLLECTED' },
      ],
      errors: [
        { linen_id: 'LL-CCCCCC', error: 'Not found' },
        { linen_id: 'LL-DDDDDD', error: 'Unknown action' },
      ],
      total_processed: 2,
      total_errors: 2,
    }), T0 + 2)

    const byCode = new Map(session.records.map(record => [record.code, record]))
    expect(byCode.get('LL-AAAAAA')).toMatchObject({
      outcome: 'success', fromStatus: 'IN_STOCK', toStatus: 'COLLECTED',
    })
    expect(byCode.get('LL-BBBBBB')).toMatchObject({ outcome: 'success' })
    expect(byCode.get('LL-CCCCCC')?.outcome).toBe('not_found')
    expect(byCode.get('LL-DDDDDD')?.outcome).toBe('rejected')

    const summary = summarise(session)
    expect(summary.queued).toBe(0)
    expect(summary.successful).toBe(2)
    expect(summary.uniqueLinens).toBe(2)
    expect(failedTotal(summary)).toBe(2)
  })

  it('marks a code with no result as failed rather than silently losing it', () => {
    let session = recordScan(openSession(), 'LL-AAAAAA', T0 + 1)
    session = applyBulkResult(session, result(), T0 + 2)

    expect(session.records[0]).toMatchObject({ outcome: 'failed' })
    expect(summarise(session).failed).toBe(1)
  })

  it('requeues only unresolved rows when correcting after the summary', () => {
    let session = recordScan(openSession(), 'LL-AAAAAA', T0 + 1)
    session = recordScan(session, 'LL-BBBBBB', T0 + 2)
    session = recordScan(session, 'Cafe WiFi', T0 + 3)
    session = applyBulkResult(session, result({
      processed: [{ linen_id: 'LL-AAAAAA', from_status: 'READY', to_status: 'COLLECTED' }],
      errors: [{ linen_id: 'LL-BBBBBB', error: 'Not found' }],
    }), T0 + 4)
    session = endSession(session, T0 + 5)

    session = requeueUnresolved(session)

    expect(session.endedAt).toBeUndefined()
    expect(queuedCodes(session)).toEqual(['LL-BBBBBB'])
    expect(session.records.some(record => record.code === 'Cafe WiFi')).toBe(false)
    expect(session.records.find(record => record.code === 'LL-AAAAAA')?.outcome).toBe('success')
    expect(summarise(session).successful).toBe(1)
  })

  it('keeps a failing batch retryable with every code still queued', () => {
    let session = recordScan(openSession(), 'LL-AAAAAA', T0 + 1)
    session = recordScan(session, 'LL-BBBBBB', T0 + 2)
    session = failQueued(session, 'Could not reach the linen service', T0 + 3)

    expect(queuedCodes(session)).toEqual([])
    expect(summarise(session).failed).toBe(2)

    session = requeueUnresolved(session)
    expect(queuedCodes(session)).toEqual(['LL-AAAAAA', 'LL-BBBBBB'])
  })

  it('filters the history by code, state or outcome', () => {
    let session = recordScan(openSession(), 'LL-AAAAAA', T0 + 1)
    session = applyBulkResult(session, result({
      processed: [{ linen_id: 'LL-AAAAAA', from_status: 'READY', to_status: 'COLLECTED' }],
    }), T0 + 2)
    session = recordScan(session, 'LL-BBBBBB', T0 + 3)

    expect(filterRecords(session.records, 'll-aaaa')).toHaveLength(1)
    expect(filterRecords(session.records, 'COLLECTED')).toHaveLength(1)
    expect(filterRecords(session.records, 'updated')).toHaveLength(1)
    expect(filterRecords(session.records, 'queued')).toHaveLength(1)
    expect(filterRecords(session.records, '   ')).toHaveLength(2)
  })

  it('counts a thousand queued scans without drift', () => {
    let session = openSession()
    for (let index = 0; index < 1000; index += 1) {
      session = recordScan(session, `LL-${String(index).padStart(6, '0')}`, T0 + index)
    }

    expect(queuedCodes(session)).toHaveLength(1000)
    expect(summarise(session).queued).toBe(1000)
  })
})
