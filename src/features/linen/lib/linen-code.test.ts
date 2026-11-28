import { describe, expect, it } from 'vitest'
import { checkLetters, isValidStructuredId, parseLinenCode } from './linen-code'

const TAG = 'BSG-A0001XL' // bedsheet / hotel G / A0001 / check letters XL

describe('checksummed tag IDs', () => {
  it('computes the same two check letters as both APIs', () => {
    expect(checkLetters('BSG-A0001')).toBe('XL')
    expect(isValidStructuredId(TAG)).toBe(true)
    expect(isValidStructuredId('bsg-a0001xl')).toBe(true)
  })

  it('rejects legacy tags, old numeric IDs and mistyped check letters', () => {
    for (const bad of ['LL-7K4P92', 'BSG-00001', 'BSG-A0001XY', 'BSG-A0000AA']) {
      expect(isValidStructuredId(bad)).toBe(false)
      expect(parseLinenCode(bad)).toBeNull()
    }
  })
})

describe('parseLinenCode', () => {
  it('accepts the bare code a LoveLaundry tag prints', () => {
    expect(parseLinenCode(TAG)).toBe(TAG)
    expect(parseLinenCode('bsg-a0001xl')).toBe(TAG)
    expect(parseLinenCode(`  ${TAG}\n`)).toBe(TAG)
  })

  it('accepts codes wrapped by a scanner or a wallet app', () => {
    expect(parseLinenCode(`"${TAG}"`)).toBe(TAG)
    expect(parseLinenCode(`[${TAG}]`)).toBe(TAG)
    expect(parseLinenCode(`\u0002${TAG}\r`)).toBe(TAG)
  })

  it('accepts other item and hotel codes with a valid checksum', () => {
    const base = 'TWH-A0020'
    const tag = base + checkLetters(base)
    expect(parseLinenCode(tag.toLowerCase())).toBe(tag)
    expect(parseLinenCode(`LOVE LAUNDRY ${tag} BATH TOWEL`)).toBe(tag)
  })

  it('extracts the code from a deep link or a re-printed URL tag', () => {
    expect(parseLinenCode(`https://manager.lovelaundry.lk/linen/scanner?code=${TAG.toLowerCase()}`)).toBe(TAG)
    expect(parseLinenCode(`https://lovelaundry.lk/track?tag=${TAG.toLowerCase()}`)).toBe(TAG)
    expect(parseLinenCode(`https://lovelaundry.lk/linen/${TAG}`)).toBe(TAG)
    expect(parseLinenCode(`https://lovelaundry.lk/linen/${TAG}?ref=qr`)).toBe(TAG)
    expect(parseLinenCode(`https://lovelaundry.lk/linen/${TAG}%20`)).toBe(TAG)
    expect(parseLinenCode(`https://lovelaundry.lk/i/${TAG}`)).toBe(TAG)
    expect(parseLinenCode(`https://lovelaundry.lk/linen/scanner?code=${TAG}`)).toBe(TAG)
  })

  it('finds the code when a label carries more than the code', () => {
    expect(parseLinenCode(`LOVE LAUNDRY ${TAG} KING BEDSHEET`)).toBe(TAG)
    expect(parseLinenCode(`https://x.lk/#/${TAG}`)).toBe(TAG)
    expect(parseLinenCode(`Please scan ${TAG}.`)).toBe(TAG)
  })

  it('rejects text that is not a valid linen code', () => {
    expect(parseLinenCode('')).toBeNull()
    expect(parseLinenCode('   ')).toBeNull()
    expect(parseLinenCode('https://example.com')).toBeNull()
    expect(parseLinenCode('WIFI:S:HotelGuest;P:12345;;')).toBeNull()
    expect(parseLinenCode('A')).toBeNull()
  })
})
