import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getActiveToken: vi.fn<() => string | null>(() => 'fresh.jwt'),
  unauthorized: vi.fn(),
}))

vi.mock('../lib/auth-token', () => ({
  getActiveToken: mocks.getActiveToken,
}))

import { attachResponseInterceptor, setUnauthorizedHandler } from './interceptors'

type RejectHandler = (err: unknown) => Promise<unknown>

const store = new Map<string, string>()

function fakeInstance() {
  let onRejected: RejectHandler | undefined
  const instance = {
    interceptors: {
      response: {
        use: (_ok: unknown, rejected: RejectHandler) => {
          onRejected = rejected
        },
      },
    },
  }
  attachResponseInterceptor(instance as never)
  return (err: unknown) => onRejected!(err)
}

function unauthorized401(url: string, authorization?: string) {
  const config = {
    url,
    headers: authorization ? { Authorization: authorization } : {},
  }
  return { config, response: { status: 401, data: { detail: 'Invalid credentials' } } }
}

beforeAll(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  store.clear()
  store.set('ll_token', 'fresh.jwt')
  store.set('ll_user', '{"id":"u1"}')
  mocks.getActiveToken.mockReturnValue('fresh.jwt')
  // Re-registering also clears the one-shot redirect guard.
  setUnauthorizedHandler(mocks.unauthorized)
})

describe('401 session teardown', () => {
  it('ends the session when the rejected token is still the active one', async () => {
    const reject = fakeInstance()

    await expect(reject(unauthorized401('/bills', 'Bearer fresh.jwt'))).rejects.toThrow(
      'Invalid credentials',
    )

    expect(store.has('ll_token')).toBe(false)
    expect(mocks.unauthorized).toHaveBeenCalledTimes(1)
  })

  it('leaves a fresh sign-in alone when a request carrying the old token 401s', async () => {
    const reject = fakeInstance()

    await expect(reject(unauthorized401('/bills', 'Bearer stale.jwt'))).rejects.toThrow()

    expect(store.get('ll_token')).toBe('fresh.jwt')
    expect(store.get('ll_user')).toBe('{"id":"u1"}')
    expect(mocks.unauthorized).not.toHaveBeenCalled()
  })

  it('leaves a fresh sign-in alone when a tokenless pre-login request 401s', async () => {
    // Reproduces the reported bug: the app shell fetched tenant data while the
    // visitor was still on the login page, and the 401 landed a second later,
    // after the user had already signed in.
    const reject = fakeInstance()

    await expect(reject(unauthorized401('/gatepasses'))).rejects.toThrow()

    expect(store.get('ll_token')).toBe('fresh.jwt')
    expect(mocks.unauthorized).not.toHaveBeenCalled()
  })

  it('never tears the session down over a rejected sign-in attempt', async () => {
    const reject = fakeInstance()

    await expect(reject(unauthorized401('/auth/login', 'Bearer fresh.jwt'))).rejects.toThrow()

    expect(store.get('ll_token')).toBe('fresh.jwt')
    expect(mocks.unauthorized).not.toHaveBeenCalled()
  })

  it('logs out only once while several requests fail with the current token', async () => {
    const reject = fakeInstance()

    await expect(reject(unauthorized401('/bills', 'Bearer fresh.jwt'))).rejects.toThrow()
    await expect(reject(unauthorized401('/gatepasses', 'Bearer fresh.jwt'))).rejects.toThrow()

    expect(mocks.unauthorized).toHaveBeenCalledTimes(1)
  })
})
