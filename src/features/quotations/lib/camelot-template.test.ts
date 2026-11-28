import { describe, expect, it } from 'vitest'
import {
  CAMELOT_TEMPLATE,
  camelotTemplateCategories,
  camelotTemplateItemCount,
  camelotTemplateItems,
  camelotTemplateLineItems,
  camelotTemplateMissingRates,
  camelotTemplateSectionCount,
  parseCamelotTemplate,
  serializeCamelotTemplate,
} from './camelot-template'

describe('Camelot quotation JSON template', () => {
  it('is the single source for sections, items and months', () => {
    expect(CAMELOT_TEMPLATE.schemaVersion).toBe(1)
    expect(CAMELOT_TEMPLATE.months.map((month) => month.id)).toEqual(['october', 'november'])
    expect(CAMELOT_TEMPLATE.sections.map((section) => section.id)).toEqual([
      'uniform', 'housekeeping', 'room-linen', 'fb', 'pressing',
    ])
    expect(CAMELOT_TEMPLATE.sections.map((section) => section.items.length)).toEqual([
      38, 8, 8, 15, 2,
    ])
    expect(camelotTemplateItemCount(CAMELOT_TEMPLATE)).toBe(71)
  })

  it('carries rates from the JSON file without hard-coded values in code', () => {
    const byName = new Map(
      camelotTemplateItems(CAMELOT_TEMPLATE).map(({ item }) => [item.name, item.rate]),
    )
    expect(byName.get('Kitchen Coat')).toBe(80)
    expect(byName.get('Bed Sheet (S)')).toBe(90)
    expect(byName.get('Serviette')).toBe(21)
    expect(byName.get('Table Cloth ( Pressing Only )')).toBe(40)
  })

  it('keeps empty source rates as null, never as spreadsheet errors', () => {
    expect(camelotTemplateMissingRates(CAMELOT_TEMPLATE)).toEqual([
      'Sarong', 'Jersey', 'Water Bottle Bags',
    ])
    for (const { item } of camelotTemplateItems(CAMELOT_TEMPLATE)) {
      expect(item.rate === null || Number.isFinite(item.rate)).toBe(true)
      expect(item.name).not.toMatch(/#VALUE!|Err:\d+/i)
    }
  })

  it('maps JSON sections to form-ready quotation rows', () => {
    const lines = camelotTemplateLineItems(CAMELOT_TEMPLATE)
    expect(lines).toHaveLength(71)
    expect(lines.every((line) => line.category.length > 0 && line.specifications.length === 0)).toBe(true)
    expect(lines.find((line) => line.item_name === 'Sarong')).toMatchObject({
      unit_price: '0',
      notes: expect.stringContaining('confirm price'),
    })
  })

  it('can load only the requested sections', () => {
    expect(camelotTemplateSectionCount(CAMELOT_TEMPLATE, 'fb')).toBe(15)
    const lines = camelotTemplateLineItems(CAMELOT_TEMPLATE, ['fb'])
    expect(lines).toHaveLength(15)
    expect(lines.every((line) => line.category === 'F & B Linen Inventory')).toBe(true)
    expect(camelotTemplateCategories(CAMELOT_TEMPLATE)).toContain('Room Linen')
  })

  it('never stores prefilled daily quantities in the template', () => {
    expect(JSON.stringify(CAMELOT_TEMPLATE)).not.toMatch(/"daily"|"quantity"|"total"/)
  })
})

describe('JSON upload parsing', () => {
  it('round-trips the bundled template', () => {
    const parsed = parseCamelotTemplate(serializeCamelotTemplate(CAMELOT_TEMPLATE))
    expect(parsed).toEqual(CAMELOT_TEMPLATE)
  })

  it('accepts numeric rate strings but rejects invalid files', () => {
    const custom = {
      ...CAMELOT_TEMPLATE,
      sections: [{
        id: 'custom',
        title: 'Custom',
        items: [{ name: 'Custom Item', rate: '125.50' }],
      }],
    }
    expect(parseCamelotTemplate(JSON.stringify(custom)).sections[0].items[0].rate).toBe(125.5)
    expect(() => parseCamelotTemplate('{')).toThrow('not valid JSON')
    expect(() => parseCamelotTemplate(JSON.stringify({ ...custom, schemaVersion: 99 }))).toThrow()
  })

  it('rejects duplicate items and spreadsheet error cells', () => {
    const bad = {
      ...CAMELOT_TEMPLATE,
      sections: [{
        id: 'custom',
        title: 'Custom',
        items: [
          { name: 'Same', rate: 10 },
          { name: 'same', rate: 20 },
        ],
      }],
    }
    expect(() => parseCamelotTemplate(JSON.stringify(bad))).toThrow(/Duplicate item/)

    const broken = {
      ...CAMELOT_TEMPLATE,
      sections: [{
        id: 'custom',
        title: 'Custom',
        items: [{ name: '#VALUE!', rate: 10 }],
      }],
    }
    expect(() => parseCamelotTemplate(JSON.stringify(broken))).toThrow(/error cells/)
  })
})
