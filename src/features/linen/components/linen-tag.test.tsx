import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'
import { describe, expect, it } from 'vitest'
import { LinenTagCompact, LinenTagFull, linenTagValue } from './linen-tag'

const ID = 'BSG-A0001XL'

function render(element: ReactElement): string {
  return renderToStaticMarkup(element)
}

/** Compare the actual QR modules, not just the label next to them. The QR is
 * always the first SVG in these tags (the barcode has no QR path). */
function qrModules(markup: string): string | undefined {
  const svg = /<svg[^>]*>[\s\S]*?<\/svg>/.exec(markup)?.[0] ?? ''
  return /<path[^>]*fill="#000000"[^>]*d="([^"]+)"/.exec(svg)?.[1]
}

describe('linen tag value', () => {
  it('keeps the bare structured ID from a scanner deep link', () => {
    expect(linenTagValue(ID)).toBe(ID)
    expect(linenTagValue(`"${ID}"`)).toBe(ID)
    expect(linenTagValue(`\u0000https://scan.example/tag?code=${ID}\r`)).toBe(ID)
    expect(linenTagValue(null)).toBe('')
  })

  it('falls back to sanitised text for legacy labels', () => {
    expect(linenTagValue('  LL-123456  ')).toBe('LL-123456')
  })
})

describe('LinenTagCompact', () => {
  it('renders a visible QR and the ID, but no barcode', () => {
    const markup = render(createElement(LinenTagCompact, { code: ID }))
    expect(markup).toContain('data-linen-qr="compact"')
    expect(markup).toContain(`aria-label="QR code: ${ID}"`)
    expect(markup).toContain(ID)
    expect(markup).not.toContain('data-linen-barcode')
    expect(qrModules(markup)).toBe(
      qrModules(render(createElement(QRCodeSVG, { value: ID, size: 32, level: 'M' }))),
    )
  })

  it('escapes hostile IDs instead of creating HTML elements', () => {
    const markup = render(createElement(LinenTagCompact, { code: '<script>alert(1)</script>' }))
    expect(markup).not.toContain('<script>')
    expect(markup).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })
})

describe('LinenTagFull', () => {
  it('renders QR, CODE128 placeholder and ID for the bare structured ID', () => {
    const markup = render(createElement(LinenTagFull, { code: ID }))
    expect(markup.match(/data-linen-qr="full"/g)).toHaveLength(1)
    expect(markup).toContain('data-linen-barcode="full"')
    expect(markup).toContain(`aria-label="CODE128 barcode: ${ID}"`)
    expect(qrModules(markup)).toBe(
      qrModules(render(createElement(QRCodeSVG, { value: ID, size: 144, level: 'M', includeMargin: true }))),
    )
  })

  it('encodes only the bare ID when given a deep link', () => {
    const markup = render(createElement(LinenTagFull, {
      code: `https://scan.example/linen?code=${ID}`,
    }))
    expect(qrModules(markup)).toBe(
      qrModules(render(createElement(QRCodeSVG, { value: ID, size: 144, level: 'M', includeMargin: true }))),
    )
    expect(markup).toContain(`aria-label="CODE128 barcode: ${ID}"`)
  })

  it('truncates display text and skips unreadable-sized payloads', () => {
    const long = 'X'.repeat(400)
    const markup = render(createElement(LinenTagFull, { code: long }))
    expect(markup).not.toContain('data-linen-qr=')
    expect(markup).not.toContain('data-linen-barcode=')
    expect(markup).toContain(`${'X'.repeat(63)}…`)
    expect(markup).toContain(`title="${long}"`)
  })
})
