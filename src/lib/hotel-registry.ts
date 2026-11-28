import {
  hotelRegistry,
  type RegistryEntity,
  type RegistryListParams,
} from '../features/platform/services/entity-registry.service'

/** Match the hotels list request: `GET /hotels?limit=20&offset=0`. */
export const HOTEL_PAGE_SIZE = 20
/** Hard ceiling so a broken `total` cannot make the browser loop forever. */
export const MAX_HOTELS = 1000

type HotelLister = (params: RegistryListParams) => Promise<{
  items: RegistryEntity[]
  total: number
}>

/**
 * Load the full hotels list from the authoritative registry.
 *
 * The registry used to be requested with `limit: 500`, but `/hotels` caps the
 * page size at 200 and answers 422. Page through the same endpoint the Hotels
 * page uses so every hotel is available to the quotation form and tag picker.
 */
export async function listAllHotels(
  list: HotelLister = hotelRegistry.list,
): Promise<RegistryEntity[]> {
  const items: RegistryEntity[] = []
  let offset = 0
  let total = Number.POSITIVE_INFINITY

  while (offset < total && offset < MAX_HOTELS && items.length < MAX_HOTELS) {
    const page = await list({ limit: HOTEL_PAGE_SIZE, offset })
    const batch = page?.items ?? []
    total = Math.max(offset + batch.length, Number(page?.total) || 0)
    if (batch.length === 0) break
    items.push(...batch)
    offset += batch.length
  }

  return items.sort((a, b) => a.name.localeCompare(b.name))
}
