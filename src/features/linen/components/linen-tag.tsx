import { useEffect, useRef, type RefObject } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import { parseLinenCode } from '../lib/linen-code'

/**
 * A live on-screen counterpart of the printed tag. The QR and CODE128 payload is
 * always the bare structured ID (`BSG-A0001XL`) — the same string the printer
 * encodes — even when the value came from a deep link or a keyboard-wedge scan.
 */

/** Above this length a value is not a linen ID; refuse to build synchronously
 * generated codes from arbitrary pasted text / malformed scanner payloads. */
const MAX_SCANNABLE_LENGTH = 128
const MAX_DISPLAY_LENGTH = 64

export interface LinenTagProps {
  code: string | null | undefined
  className?: string
}

/** Normalises anything a scanner can produce into the value the tag encodes. */
export function linenTagValue(code: string | null | undefined): string {
  // NFC/keyboard-wedge payloads can carry NUL and CR/LF artefacts; strip them
  // before both the structured-ID parser and the QR/barcode encoders see them.
  const clean = Array.from(code ?? '')
    .filter(character => {
      const point = character.codePointAt(0) ?? 0
      return point > 31 && point !== 127
    })
    .join('')
    .trim()
  return parseLinenCode(clean) ?? clean
}

function displayValue(value: string): string {
  if (!value) return '—'
  return value.length > MAX_DISPLAY_LENGTH ? `${value.slice(0, MAX_DISPLAY_LENGTH - 1)}…` : value
}

/** JsBarcode writes straight into an SVG element; mirror the tag generator's
 * settings and keep a changed value from appending a second barcode. */
function useBarcode(value: string): RefObject<SVGSVGElement | null> {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    svg.style.display = ''
    if (!value) return

    try {
      JsBarcode(svg, value, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0,
      })
    } catch {
      // CODE128 rejects non-Latin-1 input. Keep the visible ID and QR usable.
      while (svg.firstChild) svg.removeChild(svg.firstChild)
      svg.style.display = 'none'
    }
  }, [value])

  return ref
}

/** Small QR + ID for inventory rows, scan results and queue rows. */
export function LinenTagCompact({ code, className = '' }: LinenTagProps) {
  const value = linenTagValue(code)
  const payload = value.length > 0 && value.length <= MAX_SCANNABLE_LENGTH ? value : ''

  return (
    <span className={`linen-tag linen-tag-compact inline-flex min-w-0 max-w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 ${className}`}>
      {payload && (
        <QRCodeSVG
          value={payload}
          size={32}
          level="M"
          data-linen-qr="compact"
          aria-label={`QR code: ${value}`}
          className="h-8 w-8 shrink-0"
        />
      )}
      {/* React escapes this text; break-all keeps even malformed codes readable. */}
      <span
        className="min-w-0 break-all font-mono text-[11px] font-semibold leading-tight text-[var(--text-primary)]"
        title={value}
      >
        {displayValue(value)}
      </span>
    </span>
  )
}

/** Full tag: QR + CODE128 + ID, matching the printable tag's payload. */
export function LinenTagFull({ code, className = '' }: LinenTagProps) {
  const value = linenTagValue(code)
  const payload = value.length > 0 && value.length <= MAX_SCANNABLE_LENGTH ? value : ''
  const barcodeRef = useBarcode(payload)

  return (
    <div className={`linen-tag linen-tag-full flex w-full min-w-0 flex-col items-center gap-3 ${className}`}>
      {payload && (
        <QRCodeSVG
          value={payload}
          size={144}
          level="M"
          includeMargin
          data-linen-qr="full"
          aria-label={`QR code: ${value}`}
          className="h-auto max-w-full"
        />
      )}
      {payload && (
        <svg
          ref={barcodeRef}
          data-linen-barcode="full"
          role="img"
          aria-label={`CODE128 barcode: ${value}`}
          className="h-auto w-full max-w-full"
        />
      )}
      <span
        className="w-full min-w-0 break-all text-center font-mono text-lg font-bold tracking-wider text-[var(--text-primary)]"
        title={value}
      >
        {displayValue(value)}
      </span>
    </div>
  )
}

export default LinenTagFull
