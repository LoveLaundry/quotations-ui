import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(fileURLToPath(new URL('./ll-design-tokens.css', import.meta.url)), 'utf8')

type Rgb = [number, number, number]

function hex(value: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(value.trim())
  if (!m) throw new Error(`expected 6-digit hex, got "${value}"`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// CSS color-mix(in srgb, A p%, B) is a linear weighted average in sRGB space.
function mix(a: Rgb, b: Rgb, percent: number): Rgb {
  return a.map((v, i) => Math.round((v * percent + b[i] * (100 - percent)) / 100)) as Rgb
}

function luminance([r, g, b]: Rgb): number {
  const lin = (x: number) => {
    const s = x / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

interface ThemeBlock {
  name: string
  body: string
}

function themeBlocks(): ThemeBlock[] {
  const lines = CSS.split('\n')
  const blocks: ThemeBlock[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const match = /html:root\[data-theme='([^']+)'\]\s*\{/.exec(lines[i])
    if (!match) continue
    let depth = 0
    const body: string[] = []
    for (let j = i; j < lines.length; j += 1) {
      body.push(lines[j])
      depth += (lines[j].match(/\{/g)?.length ?? 0) - (lines[j].match(/\}/g)?.length ?? 0)
      if (j > i && depth <= 0) break
    }
    blocks.push({ name: match[1], body: body.join('\n') })
  }
  return blocks
}

function token(body: string, name: string): string {
  const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(body)
  if (!m) throw new Error(`missing --${name}`)
  return m[1].trim()
}

describe('sidebar active state contrast', () => {
  const blocks = themeBlocks()

  it('defines all 20 selectable themes', () => {
    expect(blocks.map((b) => b.name).sort()).toEqual(
      [
        'light', 'dark',
        'light-crimson', 'dark-crimson', 'light-ember', 'dark-ember',
        'light-amber', 'dark-amber', 'light-gold', 'dark-gold',
        'light-lime', 'dark-lime', 'light-emerald', 'dark-emerald',
        'light-forest', 'dark-forest', 'light-teal', 'dark-teal',
        'light-rose', 'dark-rose',
      ].sort(),
    )
  })

  it.each(blocks)('keeps active nav text readable in $name', ({ body }) => {
    const activeBg = token(body, 'sidebar-active-bg')
    const derived = /^color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, var\(--sidebar-bg\)\)$/i.exec(activeBg)
    expect(derived, `--sidebar-active-bg must derive from the sidebar surface, got "${activeBg}"`).not.toBeNull()

    const text = hex(token(body, 'sidebar-active'))
    const sidebar = hex(token(body, 'sidebar-bg'))
    const opposite = hex(derived![1])

    // The active surface must move AWAY from the text colour; tinting it
    // toward the text is what made the label invisible in the old themes.
    expect(contrast(text, opposite)).toBeGreaterThan(contrast(text, sidebar))

    const effectiveBg = mix(opposite, sidebar, Number(derived![2]))
    expect(contrast(text, effectiveBg)).toBeGreaterThanOrEqual(4.5)
  })
})
