import { describe, expect, it } from 'vitest'
import {
  CAMELOT_2026_CATALOG,
  camelotCatalogItems,
  camelotItemCount,
  camelotLineItems,
  camelotSectionCount,
} from './camelot-catalog'

describe('Camelot 2026 price list', () => {
  it('contains every section and all 71 source item/rate rows', () => {
    expect(CAMELOT_2026_CATALOG.map((section) => section.id)).toEqual([
      'uniform',
      'housekeeping',
      'room-linen',
      'fb',
      'pressing',
    ])
    expect(CAMELOT_2026_CATALOG.map((section) => section.items.length)).toEqual([
      38, 8, 8, 15, 2,
    ])
    expect(camelotItemCount()).toBe(71)
  })

  it('keeps the exact item names and rates from the spreadsheet', () => {
    const byName = new Map(
      camelotCatalogItems().map(({ item }) => [item.name, item.rate]),
    )
    expect(byName.get('Kitchen Coat')).toBe(80)
    expect(byName.get('Kitchen Apron')).toBe(35)
    expect(byName.get('Kitchen Trouser')).toBe(75)
    expect(byName.get('H.K.L.Blue T-Shirt')).toBe(65)
    expect(byName.get('Bed Sheet (S)')).toBe(90)
    expect(byName.get('Duvet Cover (S)')).toBe(110)
    expect(byName.get('Table Cloth')).toBe(62)
    expect(byName.get('Serviette')).toBe(21)
    expect(byName.get('Slip Cloth')).toBe(40)
    expect(byName.get('Table Cloth ( Pressing Only )')).toBe(40)
  })

  it('never imports spreadsheet error cells as prices', () => {
    for (const { item } of camelotCatalogItems()) {
      expect(item.rate === null || Number.isFinite(item.rate)).toBe(true)
      expect(item.name).not.toMatch(/#VALUE!|Err:522/)
    }
  })

  it('flags the three rows whose rate cell is empty', () => {
    const missing = camelotCatalogItems()
      .filter(({ item }) => item.rate === null)
      .map(({ item }) => item.name)
    expect(missing).toEqual(['Sarong', 'Jersey', 'Water Bottle Bags'])
    expect(missing.every((name) =>
      camelotLineItems().some((line) =>
        line.item_name === name && line.unit_price === '0' && line.notes.includes('Rate not supplied'),
      ),
    )).toBe(true)
  })

  it('maps each section to a quotation category and returns form-ready rows', () => {
    const lines = camelotLineItems()
    expect(lines).toHaveLength(71)
    expect(lines.every((line) => line.category.length > 0 && line.specifications.length === 0)).toBe(true)
    expect(lines.filter((line) => line.category === 'Room Linen')).toHaveLength(8)
    expect(lines.every((line) => /^\d+(\.\d+)?$/.test(line.unit_price))).toBe(true)
  })

  it('can load a single section without the rest of the catalog', () => {
    expect(camelotSectionCount('fb')).toBe(15)
    const lines = camelotLineItems(['fb'])
    expect(lines).toHaveLength(15)
    expect(lines.every((line) => line.category === 'F & B Linen Inventory')).toBe(true)
  })

  it('has no duplicate item names inside a section', () => {
    for (const section of CAMELOT_2026_CATALOG) {
      const names = section.items.map((item) => item.name.trim().toLowerCase())
      expect(new Set(names).size).toBe(names.length)
    }
  })
})
