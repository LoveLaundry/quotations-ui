import { describe, expect, it, vi } from 'vitest'
import { HOTEL_PAGE_SIZE, listAllHotels } from './hotel-registry'
import type { RegistryEntity, RegistryListParams } from '../../platform/services/entity-registry.service'

function hotel(id: string, name: string, code = id.toUpperCase()): RegistryEntity {
  return {
    id,
    hotel_id: id,
    hotel_code: code,
    name,
    associated_laundry_id: 'laundry-1',
    status: 'ACTIVE',
  }
}

describe('hotel list for the tag generator', () => {
  it('pages the hotels endpoint with the API-supported limit', async () => {
    const seen: RegistryListParams[] = []
    const list = vi.fn(async ({ offset }: RegistryListParams) => {
      seen.push({ limit: HOTEL_PAGE_SIZE, offset })
      return {
        items: offset === 0 ? [hotel('g', 'Goldi'), hotel('s', 'Sunrise')] : [hotel('b', 'Bay View')],
        total: 3,
      }
    })

    const result = await listAllHotels(list)

    expect(seen).toEqual([
      { limit: HOTEL_PAGE_SIZE, offset: 0 },
      { limit: HOTEL_PAGE_SIZE, offset: 2 },
    ])
    expect(seen.every(params => (params.limit ?? 0) <= 200)).toBe(true)
    expect(result.map(item => item.name)).toEqual(['Bay View', 'Goldi', 'Sunrise'])
  })

  it('never requests more than the endpoint allows on a large registry', async () => {
    const seen: RegistryListParams[] = []
    const list = vi.fn(async (params: RegistryListParams) => {
      seen.push(params)
      return { items: [], total: 0 }
    })
    await listAllHotels(list)
    expect(seen).toHaveLength(1)
    expect(seen[0].limit).toBeLessThanOrEqual(200)
  })

  it('propagates a failed hotels request so the UI can show an error', async () => {
    const list = vi.fn(async () => { throw new Error('422 Unprocessable Entity') })
    await expect(listAllHotels(list)).rejects.toThrow('422')
  })
})
