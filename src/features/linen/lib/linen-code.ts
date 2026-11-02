/**
 * Turns whatever a scanned tag carries into the identifier
 * `/linens/by-code/{code}` expects, or `null` when the text is not a code.
 *
 * A freshly printed tag holds the bare `linen_id`, but a tag that has been
 * through a phone wallet, a re-printed label, or a Bluetooth scanner in
 * keyboard mode arrives as a deep link, a quoted string, or with control
 * bytes glued on. Port of `parseLinenCode` in the mobile app
 * (`skaner/lib/features/linen/_linen_shared.dart`) so both clients accept the
 * same set of payloads and reject the same set of noise.
 */
const CODE_PARAM = /[?&#](?:code|linen_id|linen|tag|id)=([^&#\s]+)/i
const LL_TOKEN = /\bLL-[A-Za-z0-9][A-Za-z0-9._-]*/
const CODE_SHAPE = /^[A-Z0-9][A-Z0-9._-]{1,63}$/
/** Codes that arrive inside a URL must be one of ours: `example.com` is a
 * perfectly shaped token but never a linen, and looking it up produces a
 * puzzling "no linen registered under EXAMPLE.COM". */
const CODE_IN_URL = /^LL-[A-Z0-9][A-Z0-9._-]*$/
const WRAPPERS = /^[\s"'`<([{]+|[\s"'`>)[\]}]+$/g
/** NFC/keyboard artefacts: NUL, the URI-record status byte, CR/LF, TAB. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g

export function parseLinenCode(raw: string | null | undefined): string | null {
  const original = (raw ?? '').replace(CONTROL_CHARS, ' ').replace(WRAPPERS, '').trim()
  if (!original) return null

  const fromUrl = original.includes('://') || original.toLowerCase().startsWith('www.')
  let candidate = original

  const param = CODE_PARAM.exec(original)
  if (param) {
    candidate = percentDecode(param[1])
  } else if (fromUrl) {
    // In a deep link the code is a path segment; a query string or fragment
    // after it belongs to the link, not to the tag.
    const segments = original.split(/[?#]/)[0].split('/').filter(Boolean)
    if (segments.length) candidate = percentDecode(segments[segments.length - 1])
  }

  candidate = candidate.replace(CONTROL_CHARS, ' ').replace(WRAPPERS, '').trim().toUpperCase()
  if (fromUrl ? CODE_IN_URL.test(candidate) : CODE_SHAPE.test(candidate)) return candidate

  // A partly-read tag still identifies the piece: take the code out of the
  // surrounding label text rather than rejecting the scan.
  const embedded = LL_TOKEN.exec(original.toUpperCase())
  return embedded ? embedded[0].replace(/[._-]+$/, '') : null
}

function percentDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
