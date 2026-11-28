import {
  hotelRegistry,
  type RegistryEntity,
  type RegistryListParams,
} from '../../platform/services/entity-registry.service'

/** The hotels registry rejects `limit > 200`; ask for smaller pages instead. */
export const HOTEL_PAGE_SIZE = 200
/** Hard ceiling so a broken `total` cannot make the browser loop forever. */
export const MAX_HOTELS = 1000

type HotelLister = (params: RegistryListParams) => Promise<{
  items: RegistryEntity[]
  total: number
}>

/**
 * Load the full hotels list for the tag generator.
 *
 * The generator used to request `limit: 500` once. The hotels endpoint caps
 * `limit` at 200, so the request was rejected and the dropdown stayed empty
 * even though the Hotels page showed records. Page through the same endpoint
 * the Hotels page uses, with a valid page size, until every hotel is loaded.
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
