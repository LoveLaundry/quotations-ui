import { describe, expect, it } from 'vitest'
import { buildTagPrintHtml, type PrintableTag } from './tag-print'

function tag(id: string): PrintableTag {
  return {
    linen_id: id,
    qrSvg: `<svg data-qr="${id}"></svg>`,
    barcodeSvg: `<svg data-barcode="${id}"></svg>`,
  }
}

describe('batch tag printing', () => {
  it('puts every generated tag in one print job, in order', () => {
    const ids = ['BSG-A0001XL', 'BSG-A0002XT', 'BSG-A0003XP']
    const html = buildTagPrintHtml(ids.map(tag), 'Printed 28 Nov 2026')

    expect(html.match(/class="tag-card"/g)).toHaveLength(ids.length)
    // Each ID appears once in its card's text (plus inside the fake SVGs).
    const positions = ids.map(id => html.indexOf(`class="tag-id">${id}<`))
    expect(positions.every(position => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    for (const id of ids) {
      expect(html).toContain(`data-qr="${id}"`)
      expect(html).toContain(`data-barcode="${id}"`)
    }
    expect(html).toContain('3 tags')
  })

  it('keeps whole labels together and paginates an A4 sheet', () => {
    const html = buildTagPrintHtml([tag('BSG-A0001XL')], 'today')
    expect(html).toContain('@page { size: A4; margin: 8mm; }')
    expect(html).toContain('break-inside: avoid')
    expect(html).toContain('page-break-inside: avoid')
  })

  it('sends one guarded print call for the whole batch', () => {
    const html = buildTagPrintHtml([tag('BSG-A0001XL'), tag('BSG-A0002XT')], 'today')
    expect(html.match(/window\.print\(\)/g)).toHaveLength(1)
    expect(html).toContain('if (llPrinted) return;')
  })

  it('handles a large batch without dropping labels', () => {
    const ids = Array.from({ length: 500 }, (_, index) => {
      const base = `BSG-A${String(index + 1).padStart(4, '0')}`
      return `${base}XX`
    })
    const html = buildTagPrintHtml(ids.map(tag), 'today')
    expect(html.match(/class="tag-card"/g)).toHaveLength(500)
    expect(html).toContain('BSG-A0500XX')
  })

  it('escapes IDs before writing them into the document', () => {
    const html = buildTagPrintHtml([{
      linen_id: '<script>alert(1)</script>',
      qrSvg: '',
      barcodeSvg: '',
    }], 'today')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })
})
