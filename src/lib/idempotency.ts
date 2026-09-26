/**
 * Idempotency keys for create requests.
 *
 * A client that may retry a POST (network drop, double click, offline queue
 * replay) sends an `X-Idempotency-Key` header; the backend memorizes
 * key -> created entity and returns the original instead of duplicating.
 *
 * The key therefore has to identify ONE LOGICAL SUBMISSION, not the shape of
 * the payload. It used to be a hash of the canonicalised body, which made two
 * genuinely different submissions indistinguishable: posting "+3 pieces
 * missing in transit" on the same item twice returned the first correction and
 * created nothing, so the second one silently vanished and the balance stayed
 * wrong with no way to fix it from the UI. The same trap swallowed a second
 * identical payment. A submission-scoped key keeps the retry guarantee and
 * stops discarding real work.
 *
 * The offline adapter carries that exact key into the outbox, so a queued write
 * replays under the key its first attempt used and the retry guard still fires.
 */

const HEX = '0123456789abcdef'

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  const webCrypto: Crypto | undefined =
    typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  let out = ''
  for (let i = 0; i < buf.length; i++) {
    out += HEX[buf[i] >> 4] + HEX[buf[i] & 15]
  }
  return out
}

let counter = 0

/**
 * A key unique to this submission. Call it once per user action and reuse the
 * returned string for every network attempt of that action.
 *
 * The monotonic counter is mixed in so two keys minted inside the same
 * millisecond — which a double tap can produce — can never collide even if the
 * platform's random source is weak.
 */
export function newIdempotencyKey(): string {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER
  return `s2-${Date.now().toString(36)}-${counter.toString(36)}-${randomHex(8)}`
}
