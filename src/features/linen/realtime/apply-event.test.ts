import { describe, expect, it, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { applyLinenEvent, patchCachedLinen } from './apply-event'
import { linenKeys } from '../hooks/useLinen'
import type { Linen, LinenListResponse, LinenRealtimeEvent } from '../../../types/linen'

const BASE: Linen = {
  id: 'doc-1',
  linen_id: 'LL-7K4P92',
  category: 'BED',
  item_type: 'Sheet',
  client_name: 'Hotel X',
  status: 'WASHING',
  condition: 'GOOD',
  location: 'Washer 3',
  wash_count: 4,
  created_at: '2026-11-01T08:00:00Z',
  updated_at: '2026-11-05T08:00:00Z',
}

const SCAN_EVENT: LinenRealtimeEvent = {
  type: 'linen.event',
  event: 'scan',
  laundry_id: 'acme',
  clock: 12,
  at: '2026-11-05T09:00:00Z',
  action: 'ready',
  linen: {
    id: 'doc-1',
    linen_id: 'LL-7K4P92',
    status: 'READY',
    previous_status: 'WASHING',
    wash_count: 5,
    location: 'Press table',
    updated_at: '2026-11-05T09:00:00Z',
  },
}

let qc: QueryClient

beforeEach(() => {
  qc = new QueryClient()
})

function listOf(): LinenListResponse {
  return { items: [{ ...BASE }], total: 1 }
}

describe('patchCachedLinen', () => {
  it('updates the detail and the by-code lookup of the same tag', () => {
    qc.setQueryData(linenKeys.detail('doc-1'), { ...BASE })
    qc.setQueryData(linenKeys.byCode('LL-7K4P92'), { ...BASE })

    patchCachedLinen(qc, SCAN_EVENT.linen!)

    expect(qc.getQueryData<Linen>(linenKeys.detail('doc-1'))?.status).toBe('READY')
    expect(qc.getQueryData<Linen>(linenKeys.byCode('LL-7K4P92'))?.wash_count).toBe(5)
  })

  it('does not create a cache entry for a screen that is not open', () => {
    patchCachedLinen(qc, SCAN_EVENT.linen!)
    expect(qc.getQueryData(linenKeys.detail('doc-1'))).toBeUndefined()
  })
})

describe('lists', () => {
  it('patches the row in place when it still matches the list filters', () => {
    qc.setQueryData(linenKeys.list({ limit: 50 }), listOf())

    applyLinenEvent(qc, SCAN_EVENT)

    const data = qc.getQueryData<LinenListResponse>(linenKeys.list({ limit: 50 }))!
    expect(data.items[0].status).toBe('READY')
    expect(data.items[0].location).toBe('Press table')
    expect(data.total).toBe(1)
  })

  it('drops a row from a status-filtered list it no longer belongs to', () => {
    qc.setQueryData(linenKeys.list({ status: 'WASHING' }), listOf())

    applyLinenEvent(qc, SCAN_EVENT)

    const data = qc.getQueryData<LinenListResponse>(linenKeys.list({ status: 'WASHING' }))!
    // A "Washing" screen must not keep showing a linen that has moved to Ready.
    expect(data.items).toHaveLength(0)
    expect(data.total).toBe(0)
  })

  it('drops a row from a client-filtered list it no longer matches', () => {
    qc.setQueryData(linenKeys.list({ client_name: 'Hotel X' }), listOf())
    applyLinenEvent(qc, {
      ...SCAN_EVENT,
      linen: { ...SCAN_EVENT.linen!, client_name: 'Another Hotel' },
    })
    const data = qc.getQueryData<LinenListResponse>(linenKeys.list({ client_name: 'Hotel X' }))!
    expect(data.items).toHaveLength(0)
  })

  it('leaves a list that does not contain the linen alone', () => {
    qc.setQueryData(linenKeys.list({ status: 'READY' }), {
      items: [{ ...BASE, id: 'other', status: 'READY' }],
      total: 1,
    })

    applyLinenEvent(qc, SCAN_EVENT)

    const data = qc.getQueryData<LinenListResponse>(linenKeys.list({ status: 'READY' }))!
    expect(data.items[0].id).toBe('other')
    expect(data.total).toBe(1)
  })
})

describe('delete', () => {
  it('removes the linen from every cache it appears in', () => {
    qc.setQueryData(linenKeys.detail('doc-1'), { ...BASE })
    qc.setQueryData(linenKeys.byCode('LL-7K4P92'), { ...BASE })
    qc.setQueryData(linenKeys.list({}), listOf())

    applyLinenEvent(qc, {
      type: 'linen.event',
      event: 'delete',
      laundry_id: 'acme',
      clock: 13,
      at: '2026-11-05T09:10:00Z',
      linen: { id: 'doc-1', linen_id: 'LL-7K4P92', status: 'RETIRED', previous_status: 'READY' },
    })

    expect(qc.getQueryData(linenKeys.detail('doc-1'))).toBeUndefined()
    expect(qc.getQueryData(linenKeys.byCode('LL-7K4P92'))).toBeUndefined()
    expect(qc.getQueryData<LinenListResponse>(linenKeys.list({}))!.items).toHaveLength(0)
  })
})

describe('batch events', () => {
  it('does not need a row snapshot to invalidate a list after a bulk create', () => {
    qc.setQueryData(linenKeys.list({}), listOf())
    applyLinenEvent(qc, {
      type: 'linen.event',
      event: 'create_bulk',
      laundry_id: 'acme',
      clock: 14,
      at: '2026-11-05T09:20:00Z',
      count: 100,
      linen_ids: ['LL-A', 'LL-B'],
    })
    // The cached page is now shorter than the collection; it must be marked
    // stale so the next render refetches rather than trusting it.
    expect(qc.getQueryState(linenKeys.list({}))?.isInvalidated).toBe(true)
  })
})

