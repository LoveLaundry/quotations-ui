import { describe, it, expect } from 'vitest'
import { parseLinenCode } from './linen-code'

describe('parseLinenCode', () => {
  it('accepts the bare code a LoveLaundry tag prints', () => {
    expect(parseLinenCode('LL-7K4P92')).toBe('LL-7K4P92')
    expect(parseLinenCode('ll-7k4p92')).toBe('LL-7K4P92')
    expect(parseLinenCode('  LL-7K4P92\n')).toBe('LL-7K4P92')
  })

  it('accepts codes wrapped by a scanner or a wallet app', () => {
    expect(parseLinenCode('"LL-7K4P92"')).toBe('LL-7K4P92')
    expect(parseLinenCode('[LL-7K4P92]')).toBe('LL-7K4P92')
    // A Bluetooth HID scanner in keyboard mode emits the code with control bytes.
    expect(parseLinenCode('\u0002LL-7K4P92\r')).toBe('LL-7K4P92')
  })

  it('extracts the code from a deep link or a re-printed URL tag', () => {
    expect(parseLinenCode('https://manager.lovelaundry.lk/linen/scanner?code=LL-7K4P92')).toBe('LL-7K4P92')
    expect(parseLinenCode('https://lovelaundry.lk/track?tag=ll-7k4p92')).toBe('LL-7K4P92')
    expect(parseLinenCode('https://lovelaundry.lk/linen/LL-7K4P92')).toBe('LL-7K4P92')
    expect(parseLinenCode('https://lovelaundry.lk/linen/LL-7K4P92?ref=qr')).toBe('LL-7K4P92')
    expect(parseLinenCode('https://lovelaundry.lk/linen/LL-7K4P92%20')).toBe('LL-7K4P92')
  })

  it('finds the code when a label carries more than the code', () => {
    expect(parseLinenCode('LOVE LAUNDRY LL-7K4P92 KING BEDSHEET')).toBe('LL-7K4P92')
    expect(parseLinenCode('https://x.lk/#/LL-7K4P92')).toBe('LL-7K4P92')
    expect(parseLinenCode('Please scan LL-7K4P92.')).toBe('LL-7K4P92')
  })

  it('rejects text that is not a linen code', () => {
    expect(parseLinenCode('')).toBeNull()
    expect(parseLinenCode('   ')).toBeNull()
    expect(parseLinenCode('https://example.com')).toBeNull()
    expect(parseLinenCode('WIFI:S:HotelGuest;P:12345;;')).toBeNull()
    expect(parseLinenCode('A')).toBeNull()
  })
})
