import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    SESSION_EXPIRED_EVENT,
    SUPPORT_SESSION_EXPIRED_EVENT,
    TOKEN_STORAGE_KEY,
    USER_STORAGE_KEY,
    decodeToken,
    getActiveToken,
    isTokenExpired,
    notifySessionExpired,
    resetSessionExpiryGuard,
    setSupportToken,
} from './auth-token'

function jwt(exp: number | null, extra: Record<string, unknown> = {}): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const payload: Record<string, unknown> = { sub: 'u1', ...extra }
    if (exp !== null) payload.exp = exp
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${header}.${body}.signature`
}

const FUTURE = Math.floor(Date.now() / 1000) + 60 * 60
const PAST = Math.floor(Date.now() / 1000) - 2 * 60 * 60

describe('isTokenExpired', () => {
    it('does not expire a valid token', () => {
        expect(isTokenExpired(jwt(FUTURE))).toBe(false)
    })

    it('expires a token well past its exp', () => {
        expect(isTokenExpired(jwt(PAST))).toBe(true)
    })

    it('tolerates a token that expired moments ago (clock skew)', () => {
        expect(isTokenExpired(jwt(Math.floor(Date.now() / 1000) - 5))).toBe(false)
    })

    it('never expires an undecodable or claim-less token', () => {
        expect(isTokenExpired('not-a-jwt')).toBe(false)
        expect(isTokenExpired(jwt(null))).toBe(false)
    })

    it('treats a missing token as expired', () => {
        expect(isTokenExpired(null)).toBe(true)
    })

    it('decodes base64url payloads containing - and _', () => {
        const token = jwt(FUTURE, { name: 'läundry-üñîcødé_✓' })
        expect(decodeToken(token)?.name).toBe('läundry-üñîcødé_✓')
        expect(isTokenExpired(token)).toBe(false)
    })
})

describe('getActiveToken', () => {
    it('prefers the in-memory support token while it is active', () => {
        resetSessionExpiryGuard()
        setSupportToken('support-token')
        expect(getActiveToken()).toBe('support-token')
        setSupportToken(null)
        expect(getActiveToken()).toBeNull()
    })
})

describe('session expiry notifications', () => {
    let store: Map<string, string>
    let dispatched: Event[]

    beforeEach(() => {
        store = new Map()
        dispatched = []
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => void store.set(key, value),
            removeItem: (key: string) => void store.delete(key),
            clear: () => store.clear(),
        })
        vi.stubGlobal('window', { dispatchEvent: (event: Event) => void dispatched.push(event) })
        store.set(TOKEN_STORAGE_KEY, jwt(FUTURE))
        store.set(USER_STORAGE_KEY, JSON.stringify({ id: 'platform-user' }))
        setSupportToken(null)
        resetSessionExpiryGuard()
    })

    afterEach(() => {
        setSupportToken(null)
        resetSessionExpiryGuard()
        vi.unstubAllGlobals()
    })

    it('drops only the support token when its short-lived session expires', () => {
        const support = jwt(PAST, { support_entry: true })
        setSupportToken(support)

        notifySessionExpired(support)

        expect(dispatched.map((event) => event.type)).toEqual([SUPPORT_SESSION_EXPIRED_EVENT])
        expect(store.get(TOKEN_STORAGE_KEY)).toBeTruthy()
        expect(store.get(USER_STORAGE_KEY)).toBeTruthy()
        expect(getActiveToken()).toBe(store.get(TOKEN_STORAGE_KEY))
    })

    it('clears the stored session when the platform token expires', () => {
        const platform = jwt(PAST)
        store.set(TOKEN_STORAGE_KEY, platform)

        notifySessionExpired(platform)

        expect(dispatched.map((event) => event.type)).toEqual([SESSION_EXPIRED_EVENT])
        expect(store.has(TOKEN_STORAGE_KEY)).toBe(false)
        expect(store.has(USER_STORAGE_KEY)).toBe(false)
    })

    it('allows a later platform expiry after a support token expires', () => {
        const support = jwt(PAST, { support_entry: true })
        setSupportToken(support)
        notifySessionExpired(support)
        setSupportToken(null)
        resetSessionExpiryGuard()

        notifySessionExpired(jwt(PAST))

        expect(dispatched.map((event) => event.type)).toEqual([
            SUPPORT_SESSION_EXPIRED_EVENT,
            SESSION_EXPIRED_EVENT,
        ])
    })
})
