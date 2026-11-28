import { describe, expect, it } from 'vitest'
import {
  CAMELOT_MONTHLY_SHEETS,
  camelotCellKey,
  camelotComputeRow,
  camelotInitialEdits,
  camelotRateKey,
  camelotSheetItemCount,
  type CamelotMonthId,
} from './camelot-monthly'

function item(month: CamelotMonthId, sectionId: string, name: string) {
  const sheet = CAMELOT_MONTHLY_SHEETS.find((entry) => entry.id === month)
  const section = sheet?.sections.find((entry) => entry.id === sectionId)
  const index = section?.items.findIndex((entry) => entry.name === name) ?? -1
  return { item: section?.items[index], index }
}

describe('Camelot monthly inventory source', () => {
  it('carries both workbook tabs with all five sections and 71 rows each', () => {
    expect(CAMELOT_MONTHLY_SHEETS.map((sheet) => sheet.id)).toEqual(['october', 'november'])
    for (const sheet of CAMELOT_MONTHLY_SHEETS) {
      expect(sheet.sections.map((section) => section.id)).toEqual([
        'uniform', 'housekeeping', 'room-linen', 'fb', 'pressing',
      ])
      expect(camelotSheetItemCount(sheet.id)).toBe(71)
      for (const section of sheet.sections) {
        for (const row of section.items) {
          expect(row.daily).toHaveLength(31)
        }
      }
    }
  })

  it('preserves the October daily totals and costs', () => {
    const october = item('october', 'uniform', 'Kitchen Coat')
    expect(october.item?.daily.reduce<number>((sum, value) => sum + (value ?? 0), 0)).toBe(468)
    expect(october.item?.total).toBe(468)
    expect(october.item?.rate).toBe(80)
    expect(october.item?.cost).toBe(37440)

    const serviette = item('october', 'fb', 'Serviette')
    expect(serviette.item?.total).toBe(3247)
    expect(serviette.item?.rate).toBe(21)
    expect(serviette.item?.cost).toBe(68187)
  })

  it('preserves the November values despite its stale heading', () => {
    const november = item('november', 'uniform', 'Kitchen Coat')
    expect(november.item?.total).toBe(43)
    expect(november.item?.rate).toBe(80)
    expect(november.item?.cost).toBe(3440)
    expect(item('november', 'fb', 'Serviette').item?.total).toBe(384)
  })

  it('turns spreadsheet error cells into null with an explanatory note', () => {
    const broken = item('october', 'fb', 'Table Cloth Rexing Black')
    expect(broken.item?.total).toBeNull()
    expect(broken.item?.cost).toBeNull()
    expect(broken.item?.rate).toBe(150)
    expect(broken.item?.note).toContain('Err:522')
    expect(CAMELOT_MONTHLY_SHEETS.every((sheet) =>
      sheet.sections.every((section) =>
        section.items.every((row) => !JSON.stringify(row).includes('#VALUE!'))))).toBe(true)
  })
})

describe('editable monthly grid helpers', () => {
  it('initialises edits from the source sheet without inventing blank cells', () => {
    const edits = camelotInitialEdits('november')
    const { index } = item('november', 'uniform', 'Kitchen Coat')
    expect(edits[camelotCellKey('november', 'uniform', index, 0)]).toBe('22')
    expect(edits[camelotCellKey('november', 'uniform', index, 2)]).toBeUndefined()
    expect(edits[camelotRateKey('november', 'uniform', index)]).toBe('80')
  })

  it('recomputes total, rate and cost from current cell values', () => {
    const { item: row, index } = item('october', 'uniform', 'Kitchen Coat')
    const edits = camelotInitialEdits('october')
    expect(camelotComputeRow(row!, 'october', 'uniform', index, edits)).toEqual({
      total: 468, rate: 80, cost: 37440,
    })

    edits[camelotCellKey('october', 'uniform', index, 0)] = '25'
    expect(camelotComputeRow(row!, 'october', 'uniform', index, edits).total).toBe(478)
    edits[camelotRateKey('october', 'uniform', index)] = '90'
    expect(camelotComputeRow(row!, 'october', 'uniform', index, edits)).toEqual({
      total: 478, rate: 90, cost: 43020,
    })
  })

  it('ignores invalid edited cells instead of producing NaN costs', () => {
    const { item: row, index } = item('october', 'fb', 'Table Cloth Rexing Black')
    const edits = camelotInitialEdits('october')
    edits[camelotCellKey('october', 'fb', index, 0)] = 'oops'
    const result = camelotComputeRow(row!, 'october', 'fb', index, edits)
    expect(Number.isFinite(result.cost)).toBe(true)
    expect(result.rate).toBe(150)
  })
})
