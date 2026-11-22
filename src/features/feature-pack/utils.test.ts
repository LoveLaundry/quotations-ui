import { describe, expect, it, vi } from 'vitest'
import {
  APP_CLIENT_TYPE, aggregateNestedItems, cacheKeyFor, clampPageRange,
  compareValues, csvCell, documentTitle, duplicateKeys, findDuplicateRows,
  formatBytes, formatCurrency, formatDate, formatNumber, inDateRange,
  isActiveAssociation, isEntityRole, itemIdentity, nextSortDirection,
  normalizeError, normalizeItems, paginate, passwordStrength, responseSizeGuard,
  retryDelay, roleLabel, scopeLabel, selectionState, sortRows, stableKey,
  timeoutMessage, toCSV, toJSON, validateRegistration,
} from './utils'

describe('feature-pack presentation helpers', () => {
  it('builds platform document titles', () => {
    expect(documentTitle('Quotations')).toBe('Quotations · LoveLaundry')
    expect(documentTitle('  ')).toBe('LoveLaundry')
    expect(documentTitle()).toBe('LoveLaundry')
  })

  it('formats money, counts, dates and sizes for this locale', () => {
    expect(formatCurrency(1234.5)).toContain('LKR')
    expect(formatCurrency(1234.5)).toMatch(/1,234\.50/)
    expect(formatCurrency('not-a-number')).toBe('—')
    expect(formatNumber(1234)).toBe('1,234')
    expect(formatDate('2024-01-02T12:00:00Z')).toBe('Jan 02, 2024')
    expect(formatDate('bad')).toBe('—')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(-1)).toBe('—')
  })
})

describe('feature-pack pagination and sorting', () => {
  it('clamps out-of-range offsets onto real pages', () => {
    expect(clampPageRange(42, 10, 999)).toEqual({
      offset: 40, start: 41, end: 42, page: 5, pageCount: 5,
    })
    expect(clampPageRange(0, 10, 30)).toEqual({
      offset: 0, start: 0, end: 0, page: 1, pageCount: 1,
    })
    expect(clampPageRange(-5, 0, -4)).toEqual({
      offset: 0, start: 0, end: 0, page: 1, pageCount: 1,
    })
  })

  it('paginates and sorts without mutating the source', () => {
    const rows = [10, 2, 1]
    expect(paginate(rows, 0, 2)).toEqual([10, 2])
    expect(paginate(rows, 2, 2)).toEqual([1])
    expect(rows).toEqual([10, 2, 1])
    expect(sortRows(rows, (row) => row, 'asc')).toEqual([1, 2, 10])
    expect(sortRows(rows, (row) => row, 'desc')).toEqual([10, 2, 1])
    expect(compareValues(null, 2)).toBeLessThan(0)
    expect(compareValues('item-10', 'item-2')).toBeGreaterThan(0)
    expect(nextSortDirection(null)).toBe('asc')
    expect(nextSortDirection('asc')).toBe('desc')
    expect(nextSortDirection('desc')).toBe('asc')
  })
})

describe('feature-pack normalisers', () => {
  it('treats null and malformed collections as empty arrays', () => {
    expect(normalizeItems(null)).toEqual([])
    expect(normalizeItems([{ id: 1 }, null, undefined])).toEqual([{ id: 1 }])
  })

  it('repairs nested collections without mutating the input', () => {
    const input = { id: 1, line_items: null, specs: [], items: [{ id: 2 }] }
    const output = aggregateNestedItems(input)
    expect(output.line_items).toEqual([])
    expect(output.items).toEqual([{ id: 2 }])
    expect(input.line_items).toBeNull()
  })

  it('detects repeated item identities', () => {
    const rows = [
      { item_name: 'Shirt', specification: 'Large' },
      { name: 'shirt', category: 'large' },
      { item_name: 'Trouser', specification: 'Small' },
    ]
    expect([...duplicateKeys(rows, itemIdentity)]).toEqual([['shirt||large', 2]])
    expect(findDuplicateRows(rows, itemIdentity)).toEqual([0, 1])
  })

  it('filters date ranges inclusively', () => {
    const range = { from: '2024-01-01', to: '2024-01-31' }
    expect(inDateRange('2024-01-01T00:30:00', range)).toBe(true)
    expect(inDateRange('2024-01-31T23:30:00', range)).toBe(true)
    expect(inDateRange('2023-12-31T23:30:00', range)).toBe(false)
    expect(inDateRange('2024-02-01T00:30:00', range)).toBe(false)
    expect(inDateRange(null, { from: '', to: '' })).toBe(true)
  })
})

describe('feature-pack validation and errors', () => {
  it('validates registration fields with plain-language messages', () => {
    expect(validateRegistration({
      username: 'ab', displayName: ' ', password: 'short', confirm: 'other',
    })).toMatchObject({
      username: 'Use at least 3 characters.',
      displayName: 'Display name is required.',
      password: 'Use at least 8 characters.',
      confirm: 'Passwords do not match.',
    })
    expect(validateRegistration({
      username: 'operator', displayName: 'Owner', password: 'password9', confirm: 'password9',
    })).toEqual({})
  })

  it('grades password strength in four steps', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: 'Enter a password' })
    expect(passwordStrength('Abcdefgh1!').score).toBe(3)
    expect(passwordStrength('Abcdefghijkl1!')).toEqual({ score: 4, label: 'Very strong' })
  })

  it('normalises every thrown shape into one sentence', () => {
    expect(normalizeError('Already exists')).toBe('Already exists')
    expect(normalizeError({ response: { data: { message: 'Invalid code' } } })).toBe('Invalid code')
    expect(normalizeError({ response: { data: { error: ['One', 'Two'] } } })).toBe('One, Two')
    expect(normalizeError({ message: 'Network Error' })).toBe(
      'Cannot reach the server. Check your connection and retry.',
    )
    expect(normalizeError({})).toBe('Something went wrong. Please try again.')
  })

  it('explains timeouts and bounds retry delays', () => {
    expect(timeoutMessage(10_000)).toContain('10s')
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(retryDelay(0, 500)).toBe(500)
    expect(retryDelay(2, 500)).toBe(2000)
    random.mockRestore()
  })

  it('rejects implausibly large payloads', () => {
    expect(responseSizeGuard({ rows: [1, 2, 3] })).toBe(true)
    expect(responseSizeGuard({ rows: [1, 2, 3] }, 1)).toBe(false)
  })
})

describe('feature-pack export helpers', () => {
  it('escapes CSV cells against spreadsheet formulas', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(toCSV(
      [{ id: 1, name: 'A,B' }],
      [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }],
    )).toBe('"ID","Name"\r\n"1","A,B"')
  })

  it('labels JSON rows with human column names', () => {
    expect(JSON.parse(toJSON(
      [{ id: 7 }],
      [{ key: 'id', label: 'Record ID' }],
    ))).toEqual([{ 'Record ID': 7 }])
  })
})

describe('feature-pack session, role and scope helpers', () => {
  it('keeps cache keys scoped and idempotency keys stable', () => {
    expect(APP_CLIENT_TYPE).toBe('LAUNDRY')
    expect(cacheKeyFor('user-1', 'draft:new')).toBe('ll:user-1:draft:new')
    expect(cacheKeyFor(null, 'snapshot')).toBe('ll:anon:snapshot')
    expect(stableKey({ a: 1 })).toBe(stableKey({ a: 1 }))
    expect(stableKey({ a: 1 })).not.toBe(stableKey({ a: 2 }))
  })

  it('allows only the four valid entity roles', () => {
    expect(isEntityRole('HOTEL_ADMIN')).toBe(true)
    expect(isEntityRole('hotel_manager')).toBe(true)
    expect(isEntityRole('SHOP_STAFF')).toBe(true)
    expect(isEntityRole('ADMIN')).toBe(false)
    expect(isEntityRole('MANAGER')).toBe(false)
    expect(isEntityRole('STAFF')).toBe(false)
    expect(roleLabel('SHOP_STAFF')).toBe('Shop Staff')
    expect(roleLabel(null)).toBe('User')
  })

  it('describes support and tenant scopes', () => {
    expect(scopeLabel(null)).toBe('Laundry workspace')
    expect(scopeLabel({ kind: 'laundry', laundryName: 'Colombo' })).toBe('Colombo support')
    expect(scopeLabel({ kind: 'hotel', entityName: 'Camelot' })).toBe('Camelot · hotel support')
  })

  it('disables suspended and archived associations only', () => {
    expect(isActiveAssociation('ACTIVE')).toBe(true)
    expect(isActiveAssociation(undefined)).toBe(true)
    expect(isActiveAssociation('SUSPENDED')).toBe(false)
    expect(isActiveAssociation('archived')).toBe(false)
    expect(isActiveAssociation('INACTIVE')).toBe(false)
  })

  it('reports select-all state for the visible page', () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const keyOf = (row: { id: string }) => row.id
    expect(selectionState(rows, new Set(), keyOf)).toEqual({ all: false, some: false, count: 0 })
    expect(selectionState(rows, new Set(['a']), keyOf)).toEqual({ all: false, some: true, count: 1 })
    expect(selectionState(rows, new Set(['a', 'b', 'c']), keyOf)).toEqual({ all: true, some: false, count: 3 })
  })
})
