import { getActiveToken } from '../../../lib/auth-token'
import type { LinenLiveStatus, LinenRealtimeEvent } from '../../../types/linen'

/**
 * The app's single live linen connection.
 *
 * One socket per tab serves every screen: channels are reference-counted, so a
 * scanner that follows one tag and an inventory list that follows the whole
 * laundry share the same transport instead of opening two handshakes.
 *
 * The connection is deliberately tolerant of a deployment that cannot hold a
 * WebSocket open at all (a serverless host rejects the upgrade). Failed
 * handshakes are retried with backoff and, after a few, reported as
 * `fallback` — the caller then resumes polling. The live channel is an
 * optimisation over the existing clock poll, never a hard dependency: no
 * screen may go blind because a socket is unavailable.
 */

export const CHANNEL_LAUNDRY = 'laundry'

export function linenChannel(code: string): string {
  return `linen:${String(code ?? '').trim().toUpperCase()}`
}

/**
 * Where `/ws/linen` lives for the configured bills API.
 *
 * `VITE_BILLS_API_URL` is either absolute (a hosted service) or a path prefix
 * (`/api/bills`, the docker build behind nginx). Both have to work without a
 * second environment variable that someone will forget to set.
 */
export function resolveSocketUrl(billsApiUrl?: string): string {
  const configured = (billsApiUrl ?? import.meta.env.VITE_BILLS_API_URL ?? '').trim()
  const base = configured.replace(/\/+$/, '')
  const path = '/ws/linen'

  if (/^https?:\/\//i.test(base)) {
    return `${base.replace(/^http/i, 'ws')}${path}`
  }

  // Relative prefix: reuse the page's origin and scheme so the upgrade is
  // same-origin (and therefore covered by `connect-src 'self'`).
  const prefix = base && base !== '/' ? (base.startsWith('/') ? base : `/${base}`) : ''
  if (typeof window === 'undefined' || !window.location) return `${prefix}${path}`
  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${scheme}//${window.location.host}${prefix}${path}`
}

type Listener<T> = (value: T) => void

/** Frames the server may send. Anything else is ignored, not fatal. */
interface ServerFrame {
  type?: string
  clock?: number
  channels?: string[]
  detail?: string
}

const HEARTBEAT_MS = 20_000
const PONG_TIMEOUT_MS = 10_000
/** After this many consecutive failures assume the transport is unavailable
 *  (serverless upgrade rejection) and settle into slow retries. */
const FAST_ATTEMPTS = 4

export interface SocketLike {
  readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
  onopen: ((event: unknown) => void) | null
  onclose: ((event: unknown) => void) | null
  onerror: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
}

export type SocketFactory = (url: string) => SocketLike

const defaultFactory: SocketFactory = (url) => new WebSocket(url) as unknown as SocketLike

const OPEN = 1

export class LinenSocket {
  private socket: SocketLike | null = null
  private token: string | null = null
  private status: LinenLiveStatus = 'idle'
  private attempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private pongTimer: ReturnType<typeof setTimeout> | null = null
  /** channel -> number of mounted subscribers. A channel is only sent to the
   *  server while at least one screen still cares about it. */
  private channelRefs = new Map<string, number>()
  /** Highest clock seen. Compared with the server's after a reconnect: a gap
   *  means this tab missed events while the socket was down. */
  private clock = 0
  private eventListeners = new Set<Listener<LinenRealtimeEvent>>()
  private resyncListeners = new Set<Listener<number>>()
  private statusListeners = new Set<Listener<LinenLiveStatus>>()

  // Explicit fields rather than constructor parameter properties: the project
  // compiles with `erasableSyntaxOnly`, which forbids syntax that emits runtime
  // code. The factory is injectable so the reconnect/channel logic can be
  // tested without a browser.
  private readonly factory: SocketFactory
  private readonly urlOf: (token: string) => string

  constructor(factory: SocketFactory = defaultFactory, urlOf?: (token: string) => string) {
    this.factory = factory
    this.urlOf = urlOf ?? ((token) => `${resolveSocketUrl()}?token=${encodeURIComponent(token)}`)
  }

  // ── public API ─────────────────────────────────────────────────────────
  getStatus(): LinenLiveStatus {
    return this.status
  }

  /** Highest clock this tab has seen; the fallback poll uses it to seed. */
  getClock(): number {
    return this.clock
  }

  /**
   * Open the socket for the current session token (idempotent).
   *
   * Called from the app-level sync hook and re-called whenever the token
   * changes (laundry switch, support entry), because the token decides which
   * laundry the server will stream at all.
   */
  connect(token?: string | null): void {
    const next = token ?? getActiveToken()
    if (!next) return

    if (next !== this.token) {
      // A new identity: whatever the old socket was subscribed to is wrong now.
      this.token = next
      this.attempt = 0
      this.teardown()
      this.open()
      return
    }
    if (this.socket && this.socket.readyState === OPEN) return
    if (this.reconnectTimer) return
    this.open()
  }

  disconnect(): void {
    this.token = null
    this.attempt = 0
    this.teardown()
    this.setStatus('idle')
  }

  /** Follow one tag (or `CHANNEL_LAUNDRY`). Returns a release function. */
  subscribe(channel: string): () => void {
    const name = channel.trim()
    if (!name) return () => undefined

    const count = this.channelRefs.get(name) ?? 0
    this.channelRefs.set(name, count + 1)
    if (count === 0) this.send({ type: 'subscribe', channels: [name] })

    let released = false
    return () => {
      if (released) return
      released = true
      const remaining = (this.channelRefs.get(name) ?? 1) - 1
      if (remaining > 0) {
        this.channelRefs.set(name, remaining)
        return
      }
      this.channelRefs.delete(name)
      this.send({ type: 'unsubscribe', channels: [name] })
    }
  }

  onEvent(listener: Listener<LinenRealtimeEvent>): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  /** Fired when the server's clock is ahead of ours (events were missed). */
  onResync(listener: Listener<number>): () => void {
    this.resyncListeners.add(listener)
    return () => this.resyncListeners.delete(listener)
  }

  onStatus(listener: Listener<LinenLiveStatus>): () => void {
    this.statusListeners.add(listener)
    listener(this.status)
    return () => this.statusListeners.delete(listener)
  }

  // ── internals ──────────────────────────────────────────────────────────
  private open(): void {
    if (!this.token) return
    if (typeof WebSocket === 'undefined') {
      // Non-browser runtime: polling is the only option.
      this.setStatus('fallback')
      return
    }

    this.setStatus(this.attempt === 0 ? 'connecting' : this.status)
    let socket: SocketLike
    try {
      socket = this.factory(this.urlOf(this.token))
    } catch {
      this.scheduleReconnect()
      return
    }
    this.socket = socket

    socket.onopen = () => {
      this.attempt = 0
      this.setStatus('live')
      // Re-assert every channel: the server starts a fresh connection with no
      // subscriptions, so a reconnect without this would stream nothing.
      const channels = Array.from(this.channelRefs.keys())
      if (channels.length) this.send({ type: 'subscribe', channels })
      this.send({ type: 'resync' })
      this.startHeartbeat()
    }

    socket.onmessage = (event) => this.handleFrame(event?.data)

    socket.onerror = () => {
      // `close` always follows; nothing to do but let it.
    }

    socket.onclose = (event) => {
      const code = (event as { code?: number })?.code
      this.stopHeartbeat()
      this.socket = null
      if (!this.token) {
        this.setStatus('idle')
        return
      }
      if (code === 4401 || code === 4403) {
        // Token rejected / laundries changed. Retrying the same credentials can
        // only fail; wait for `connect()` with a fresh token.
        this.setStatus('fallback')
        return
      }
      this.setStatus('fallback')
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (!this.token || this.reconnectTimer) return
    const fast = this.attempt < FAST_ATTEMPTS
    // Jitter keeps every tab of a shift from reconnecting in lockstep after a
    // server restart.
    const base = fast ? Math.min(500 * 2 ** this.attempt, 8_000) : 30_000
    const delay = base + Math.floor(Math.random() * 250)
    this.attempt += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.open()
    }, delay)
  }

  private teardown(): void {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    const socket = this.socket
    this.socket = null
    if (socket) {
      socket.onopen = null
      socket.onclose = null
      socket.onerror = null
      socket.onmessage = null
      try {
        socket.close()
      } catch {
        // Already closed.
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (!this.socket || this.socket.readyState !== OPEN) return
      this.send({ type: 'ping' })
      if (this.pongTimer) clearTimeout(this.pongTimer)
      this.pongTimer = setTimeout(() => {
        // A half-open socket (phone lost signal, laptop slept) never fires
        // `close`; without this the tab looks live while receiving nothing.
        this.teardown()
        this.setStatus('fallback')
        this.scheduleReconnect()
      }, PONG_TIMEOUT_MS)
    }, HEARTBEAT_MS)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
    if (this.pongTimer) clearTimeout(this.pongTimer)
    this.pongTimer = null
  }

  private send(frame: Record<string, unknown>): void {
    const socket = this.socket
    if (!socket || socket.readyState !== OPEN) return
    try {
      socket.send(JSON.stringify(frame))
    } catch {
      // Transport died between the check and the write; `close` will follow.
    }
  }

  private handleFrame(raw: unknown): void {
    if (typeof raw !== 'string') return
    let frame: ServerFrame
    try {
      frame = JSON.parse(raw)
    } catch {
      return
    }
    if (!frame || typeof frame !== 'object') return

    switch (frame.type) {
      case 'hello':
        this.noteClock(Number(frame.clock ?? 0))
        return
      case 'pong':
        if (this.pongTimer) clearTimeout(this.pongTimer)
        this.pongTimer = null
        this.noteClock(Number(frame.clock ?? 0))
        return
      case 'linen.event':
        this.noteClock(Number((frame as LinenRealtimeEvent).clock ?? 0))
        for (const listener of this.eventListeners) {
          try {
            listener(frame as unknown as LinenRealtimeEvent)
          } catch {
            // One broken subscriber must not stop the others.
          }
        }
        return
      default:
        return
    }
  }

  private noteClock(next: number): void {
    if (!Number.isFinite(next) || next <= this.clock) return
    const previous = this.clock
    this.clock = next
    // `previous > 0` means this is a reconnect, not the first hello: anything
    // published while the socket was down was missed.
    if (previous > 0) {
      for (const listener of this.resyncListeners) {
        try {
          listener(next - previous)
        } catch {
          // ignore
        }
      }
    }
  }

  private setStatus(next: LinenLiveStatus): void {
    if (this.status === next) return
    this.status = next
    for (const listener of this.statusListeners) {
      try {
        listener(next)
      } catch {
        // ignore
      }
    }
  }
}

/** One connection for the whole tab. */
export const linenSocket = new LinenSocket()
