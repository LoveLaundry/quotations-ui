import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * No DOM test environment is installed in this app, so these checks read the
 * JSX/CSS source directly. They guard the phone-specific markup contract that
 * cannot be verified by rendering a component to a string alone.
 */
function source(name: string): string {
  return readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')
}

describe('linen views use live tags', () => {
  it('gives every inventory row a compact tag in both layouts', () => {
    const page = source('linen-inventory.tsx')
    expect(page.match(/<LinenTagCompact /g)).toHaveLength(2)
    expect(page).toContain('data-linen-card="inventory"')
    expect(page).not.toContain('>{linen.linen_id}<')
  })

  it('uses the full tag on the profile and keeps its movement history', () => {
    const page = source('linen-profile.tsx')
    expect(page).toContain('<LinenTagFull code={linen.linen_id} />')
    expect(page).toContain('Movement History')
    expect(page).not.toContain('JsBarcode(')
    expect(page).not.toContain('<QRCodeSVG')
  })

  it('tags scan results in the scanner, bulk scan and scan session', () => {
    expect(source('linen-scanner.tsx')).toContain('<LinenTagCompact code={linen.linen_id} />')
    expect(source('linen-bulk-scan.tsx')).toContain('<LinenTagCompact code={p.linen_id} />')
    const session = source('linen-session.tsx')
    expect(session).toContain('<LinenTagCompact code={record.code} />')
    expect(session).toContain('<LinenTagCompact code={row.linen_id} />')
    expect(session).toContain('<LinenTagCompact code={linen.linen_id} />')
  })
})

describe('linen phone layout', () => {
  it('degrades the inventory table into readable cards on narrow screens', () => {
    const page = source('linen-inventory.tsx')
    expect(page).toMatch(/className="hidden[^"]*sm:block"/)
    expect(page).toContain('<div className="space-y-2 sm:hidden">')
    expect(page).toContain('break-words')
  })

  it('uses viewport-relative camera previews instead of fixed heights', () => {
    for (const file of ['linen-scanner.tsx', 'linen-session.tsx']) {
      const page = source(file)
      expect(page).toContain('linen-camera-preview')
      expect(page).not.toMatch(/minHeight: (260|300)/)
    }
    expect(source('../hooks/useLinenCamera.ts')).not.toContain('video.style.minHeight')

    const css = source('../../../index.css')
    expect(css).toContain('.linen-camera-preview {')
    expect(css).toMatch(/height: clamp\(200px, 42(?:d)?vh, 320px\)/)
    expect(css).toContain('.linen-camera-preview > video')
  })

  it('keeps mobile inputs comfortable on coarse pointers', () => {
    expect(source('../../../index.css')).toMatch(/@media \(pointer: coarse\)[\s\S]*font-size: 16px/)
    for (const file of [
      'linen-inventory.tsx',
      'linen-bulk-scan.tsx',
      'linen-session.tsx',
    ]) {
      expect(source(file)).toContain('min-h-10')
    }
  })
})
