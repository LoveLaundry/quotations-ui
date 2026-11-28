/**
 * Camelot 2026 price list, transcribed from `camelot 2026 complete.ods`.
 *
 * Both sheets (October and November) carry the same rates; November contains a
 * stray duplicate `Slip Cloth` cell and a stale "OCTOBER" heading, so the
 * October sheet is the authoritative source for the item/rate pairs here.
 *
 * Three source rows have no rate at all (Sarong, Jersey, Water Bottle Bags).
 * They stay in the catalog with `rate: null` so the list matches the document;
 * the quotation loader turns them into zero-priced rows with a visible note.
 * Formula errors in the source totals (`#VALUE!` / `Err:522`) are not rates and
 * are never copied into a quotation.
 */

export interface CamelotCatalogItem {
  /** Exact item label from the source spreadsheet. */
  name: string
  /** LKR rate. `null` means the source cell was empty. */
  rate: number | null
  note?: string
}

export interface CamelotCatalogSection {
  id: string
  title: string
  items: CamelotCatalogItem[]
}

export const CAMELOT_2026_SOURCE = 'camelot 2026 complete.ods'

export const CAMELOT_2026_CATALOG: CamelotCatalogSection[] = [
  {
    id: 'uniform',
    title: 'Uniform Inventory',
    items: [
      { name: 'Kitchen Coat', rate: 80 },
      { name: 'Kitchen Apron', rate: 35 },
      { name: 'Kitchen Duster', rate: 25 },
      { name: 'Kitchen Trouser', rate: 75 },
      { name: 'Black Trouser', rate: 75 },
      { name: 'Kit Blue Trouser', rate: 75 },
      { name: 'Kit .Blue T - Shirt', rate: 65 },
      { name: 'Kit Blue Shirts', rate: 80 },
      { name: 'Garden Trouser', rate: 75 },
      { name: 'Garden Shirts', rate: 80 },
      { name: 'Eng Trouser Brown', rate: 75 },
      { name: 'Eng Shirts Brown', rate: 80 },
      { name: 'H.K.L Blue Shirts', rate: 80 },
      { name: 'H.K.L.Blue T-Shirt', rate: 65 },
      { name: 'Red T-Shirts', rate: 65 },
      { name: 'Red Shirts', rate: 80 },
      { name: 'Grey Shirts', rate: 80 },
      { name: 'Orange Shirts', rate: 80 },
      { name: 'F/O Shirts Brown', rate: 80 },
      { name: 'Pool T-Shirts', rate: 65 },
      { name: 'Pool Shorts', rate: 60 },
      { name: 'White Shirts', rate: 80 },
      { name: 'Acc Shirts', rate: 80 },
      { name: 'Duck Blue T-Shirt', rate: 65 },
      { name: 'Orange T-Shirt', rate: 65 },
      { name: 'Exec Trouser Cream', rate: 75 },
      { name: 'Exec Shirts L Blue', rate: 80 },
      { name: 'Exec Shirts D Blue', rate: 80 },
      { name: 'Exec Shirts Maroon', rate: 80 },
      { name: 'Wraparound', rate: 75 },
      { name: 'Blouse', rate: 65 },
      { name: 'Cap', rate: 60 },
      { name: 'Sarong', rate: null, note: 'Rate not supplied in source sheet' },
      { name: 'Vest', rate: 40 },
      { name: 'Saree', rate: 320 },
      { name: 'Resturant Shirt', rate: 80 },
      { name: 'Bottom', rate: 75 },
      { name: 'Jersey', rate: null, note: 'Rate not supplied in source sheet' },
    ],
  },
  {
    id: 'housekeeping',
    title: 'Housekeeping Linen',
    items: [
      { name: 'Bed Cushion Cover', rate: 90 },
      { name: 'Chair Cushion Cover', rate: 90 },
      { name: 'Balcony Cushion Cover', rate: 90 },
      { name: 'H/K Duster', rate: 19 },
      { name: 'Mop Cloth', rate: 25 },
      { name: 'Flags', rate: 60 },
      { name: 'Pillows', rate: 70 },
      { name: 'Curtain', rate: 350 },
    ],
  },
  {
    id: 'room-linen',
    title: 'Room Linen',
    items: [
      { name: 'Bed Sheet (S)', rate: 90 },
      { name: 'Bed Sheet (D)', rate: 90 },
      { name: 'Duvet Cover (S)', rate: 110 },
      { name: 'Duvet Cover (D)', rate: 110 },
      { name: 'Pillow Case', rate: 35 },
      { name: 'Face Towel', rate: 45 },
      { name: 'Bath Towel', rate: 70 },
      { name: 'Bath Mat', rate: 45 },
    ],
  },
  {
    id: 'fb',
    title: 'F & B Linen Inventory',
    items: [
      { name: 'Table Cloth', rate: 62 },
      { name: 'Serviette', rate: 21 },
      { name: 'Chair Cover (White)', rate: 35 },
      { name: 'Chair Band', rate: 17 },
      { name: 'Cushion Chair Cover', rate: 150 },
      { name: 'Duster F&B', rate: 19 },
      { name: 'Glass Cloth', rate: 25 },
      { name: 'Frill Cloth', rate: 150 },
      { name: 'Satin Cloth', rate: 100 },
      { name: 'Table Runner', rate: 60 },
      { name: 'Curtain (Romantic)', rate: 350 },
      {
        name: 'Table Cloth Rexing Black',
        rate: 150,
        note: 'Source total cell had a formula error; rate is present',
      },
      { name: 'Tray Mat', rate: 27 },
      { name: 'Slip Cloth', rate: 40 },
      { name: 'Water Bottle Bags', rate: null, note: 'Rate not supplied in source sheet' },
    ],
  },
  {
    id: 'pressing',
    title: 'Pressing Only',
    items: [
      { name: 'Table Cloth ( Pressing Only )', rate: 40 },
      { name: 'Table Runner ( Pressing Only )', rate: 20 },
    ],
  },
]

export interface CamelotLineItem {
  item_name: string
  category: string
  unit_price: string
  notes: string
  specifications: Array<{ specification: string; unit_price: string }>
}

/** All catalog items, optionally restricted to a set of section ids. */
export function camelotCatalogItems(sectionIds?: readonly string[]): Array<{
  item: CamelotCatalogItem
  section: CamelotCatalogSection
}> {
  const wanted = sectionIds ? new Set(sectionIds) : null
  return CAMELOT_2026_CATALOG
    .filter((section) => !wanted || wanted.has(section.id))
    .flatMap((section) => section.items.map((item) => ({ item, section })))
}

/** Form-ready rows. Missing source rates become `0` with a checker's note. */
export function camelotLineItems(sectionIds?: readonly string[]): CamelotLineItem[] {
  return camelotCatalogItems(sectionIds).map(({ item, section }) => ({
    item_name: item.name,
    category: section.title,
    unit_price: String(item.rate ?? 0),
    notes: item.rate === null
      ? `${item.note ?? 'Rate missing in source'} — confirm price`
      : (item.note ?? ''),
    specifications: [],
  }))
}

export function camelotItemCount(): number {
  return CAMELOT_2026_CATALOG.reduce((sum, section) => sum + section.items.length, 0)
}

export function camelotSectionCount(id: string): number {
  return CAMELOT_2026_CATALOG.find((section) => section.id === id)?.items.length ?? 0
}
