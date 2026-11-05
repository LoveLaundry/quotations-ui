import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  CHANNEL_LAUNDRY,
  LinenSocket,
  linenChannel,
  resolveSocketUrl,
  type SocketLike,
} from './linen-socket'

/** A socket that behaves like the browser's, without a network. */
class FakeSocket implements SocketLike {
  readyState = 0
  sent: string[] = []
  url: string
  onopen: ((event: unknown) => void) | null = null
  onclose: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null

  // Explicit field, not a parameter property: the app compiles with
  // `erasableSyntaxOnly`, and test files are type-checked with the app.
  constructor(url: string) {
    this.url = url
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(code = 1000): void {
    this.readyState = 3
    this.onclose?.({ code })
  }

  // ── test controls ──────────────────────────────────────────────────────
  open(): void {
    this.readyState = 1
    this.onopen?.({})
  }

  receive(frame: unknown): void {
    this.onmessage?.({ data: JSON.stringify(frame) })
  }

  drop(code = 1006): void {
    this.readyState = 3
    this.onclose?.({ code })
  }

  frames(): Array<Record<string, unknown>> {
    return this.sent.map((frame) => JSON.parse(frame))
  }
}

function build() {
  const created: FakeSocket[] = []
  const socket = new LinenSocket((url) => {
    const fake = new FakeSocket(url)
    created.push(fake)
    return fake
  })
  return { socket, created, current: () => created[created.length - 1] }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('resolveSocketUrl', () => {
  it('upgrades an absolute API url to ws and keeps its path', () => {
    expect(resolveSocketUrl('https://bills.example.com')).toBe('wss://bills.example.com/ws/linen')
    expect(resolveSocketUrl('http://localhost:8000/')).toBe('ws://localhost:8000/ws/linen')
  })

  it('extends a path prefix instead of replacing it', () => {
    // The docker build serves the API under /api/bills behind nginx.
    expect(resolveSocketUrl('/api/bills')).toBe('/api/bills/ws/linen')
  })

  it('defaults to the same origin path when nothing is configured', () => {
    expect(resolveSocketUrl('')).toBe('/ws/linen')
  })
})

describe('channels', () => {
  it('names a tag channel in upper case, as the server stores it', () => {
    expect(linenChannel(' ll-7k4p92 ')).toBe('linen:LL-7K4P92')
  })

  it('sends one subscribe for two screens following the same channel', () => {
    const { socket, current } = build()
    socket.connect('token')
    current().open()
    current().sent.length = 0

    const releaseA = socket.subscribe(linenChannel('LL-1'))
    const releaseB = socket.subscribe(linenChannel('LL-1'))

    const subscribes = current().frames().filter((frame) => frame.type === 'subscribe')
    expect(subscribes).toHaveLength(1)
    expect(subscribes[0].channels).toEqual(['linen:LL-1'])

    releaseA()
    expect(current().frames().filter((frame) => frame.type === 'unsubscribe')).toHaveLength(0)

    releaseB()
    expect(current().frames().filter((frame) => frame.type === 'unsubscribe')).toHaveLength(1)
  })

  it('re-asserts every channel after a reconnect', () => {
    const { socket, created, current } = build()
    socket.connect('token')
    current().open()
    socket.subscribe(CHANNEL_LAUNDRY)
    socket.subscribe(linenChannel('LL-9'))

    current().drop()
    expect(socket.getStatus()).toBe('fallback')

    vi.advanceTimersByTime(1_000)
    expect(created).toHaveLength(2)
    created[1].open()

    const subscribe = created[1].frames().find((frame) => frame.type === 'subscribe')
    expect(subscribe?.channels).toEqual([CHANNEL_LAUNDRY, 'linen:LL-9'])
  })
})

describe('events', () => {
  it('delivers a linen event to every listener and tracks the clock', () => {
    const { socket, current } = build()
    const seen: string[] = []
    socket.onEvent((event) => seen.push(event.event))
    socket.onEvent((event) => seen.push(`second:${event.event}`))

    socket.connect('token')
    current().open()
    current().receive({
      type: 'linen.event',
      event: 'scan',
      laundry_id: 'a',
      clock: 4,
      at: '2026-11-05T10:00:00Z',
      linen: { id: '1', linen_id: 'LL-1', status: 'WASHING' },
    })

    expect(seen).toEqual(['scan', 'second:scan'])
    expect(socket.getClock()).toBe(4)
  })

  it('asks for a resync when the server clock ran ahead while disconnected', () => {
    const { socket, created, current } = build()
    const gaps: number[] = []
    socket.onResync((gap) => gaps.push(gap))

    socket.connect('token')
    current().open()
    current().receive({ type: 'hello', laundry_id: 'a', clock: 5 })

    current().drop()
    vi.advanceTimersByTime(1_000)
    created[1].open()
    created[1].receive({ type: 'hello', laundry_id: 'a', clock: 9 })

    expect(gaps).toEqual([4])
  })

  it('ignores a malformed frame instead of throwing', () => {
    const { socket, current } = build()
    socket.connect('token')
    current().open()
    expect(() => current().onmessage?.({ data: 'not-json' })).not.toThrow()
  })
})

describe('reconnect policy', () => {
  it('stops retrying a rejected token and reports fallback', () => {
    const { socket, created, current } = build()
    socket.connect('expired-token')
    current().open()
    current().drop(4401)

    expect(socket.getStatus()).toBe('fallback')
    vi.advanceTimersByTime(120_000)
    expect(created).toHaveLength(1)
  })

  it('keeps retrying a network drop', () => {
    const { socket, created, current } = build()
    socket.connect('token')
    current().open()
    current().drop(1006)

    vi.advanceTimersByTime(1_000)
    expect(created).toHaveLength(2)
    created[1].drop(1006)
    vi.advanceTimersByTime(2_000)
    expect(created.length).toBeGreaterThanOrEqual(3)
  })
})
