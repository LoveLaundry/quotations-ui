import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from 'react'
import type { User } from '../types/auth'
import { deleteCacheDb } from '../cache/db'
import { cacheScopeFor } from '../cache/scope'
import {
    SESSION_EXPIRED_EVENT,
    SUPPORT_SESSION_EXPIRED_EVENT,
    TOKEN_STORAGE_KEY,
    USER_STORAGE_KEY,
    clearStoredSession,
    isTokenExpired,
    resetSessionExpiryGuard,
    setSupportToken,
} from '../lib/auth-token'
import authApi from '../api/auth-api'

/**
 * A support session is scoped to exactly one kind of entity.
 *
 * Laundry support uses the laundry operations surface. Hotel and shop support
 * is entity-scoped and must never be handed to a laundry page: the token has no
 * `laundry_id` claim, so treating it as laundry support fails every data call
 * and is how "enter shop" used to open a broken laundry session.
 */
export type SupportSession =
    | {
        kind: 'laundry'
        token: string
        user: User
        laundryId: string
        laundryName: string
      }
    | {
        kind: 'hotel' | 'shop'
        token: string
        user: User
        entityId: string
        entityName: string
      }

export function supportSessionLabel(session: SupportSession): string {
    return session.kind === 'laundry' ? session.laundryName : session.entityName
}

interface AuthCtx {
    token: string | null
    user: User | null
    setUser: (user: User) => void
    login: (token: string, user: User) => void
    logout: () => void
    /** Swap the active laundry for a multi-laundry user. */
    switchLaundry: (laundryId: string) => Promise<void>
    isAuthenticated: boolean
    /** Audited platform support entry (short-lived, memory-only). */
    support: SupportSession | null
    enterSupport: (session: SupportSession) => void
    exitSupport: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
    const [support, setSupport] = useState<SupportSession | null>(null)
    const [user, setUser] = useState<User | null>(() => {
        try { return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) ?? 'null') } catch { return null }
    })

    const login = useCallback((tok: string, usr: User) => {
        // A lingering support token (memory-only, from an earlier support
        // entry in this tab) would override the freshly issued token on every
        // request and get the new session rejected with 401.
        setSupportToken(null)
        setSupport(null)
        resetSessionExpiryGuard()
        localStorage.setItem(TOKEN_STORAGE_KEY, tok)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usr))
        setToken(tok)
        setUser(usr)
    }, [])

    const logout = useCallback(() => {
        const scope = user?.id
        clearStoredSession()
        setSupport(null)
        setToken(null)
        setUser(null)
        // Drop that user's local_cache_db so the next sign-in starts clean —
        // never leak one account's cached data into another's session.
        if (scope) void deleteCacheDb(cacheScopeFor(user))
    }, [user])

    const updateUser = useCallback((usr: User) => {
        if (!support) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usr))
        setUser(usr)
    }, [support])

    const switchLaundry = useCallback(
        async (laundryId: string) => {
            const previous = user
            const res = await authApi.post('/auth/laundry', { laundry_id: laundryId })
            const { access_token, user: nextUser } = res.data as {
                access_token: string
                token_type: string
                user: User
            }
            // This response replaces the active session: no stale support
            // token or expiry flag may survive it.
            setSupportToken(null)
            setSupport(null)
            resetSessionExpiryGuard()
            localStorage.setItem(TOKEN_STORAGE_KEY, access_token)
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
            setToken(access_token)
            setUser(nextUser)
            if (previous) void deleteCacheDb(cacheScopeFor(previous))
        },
        [user],
    )

    // Platform support entry: the admin's own session stays stored; the
    // support token lives only in memory, so a reload always drops back to
    // the platform session instead of stranding anyone in support mode.
    const enterSupport = useCallback((session: SupportSession) => {
        setSupportToken(session.token)
        setSupport(session)
        setToken(session.token)
        setUser(session.user)
    }, [])

    const exitSupport = useCallback(() => {
        // Drop the support session's cached data — it must never linger for
        // the next person on this device.
        if (support) void deleteCacheDb(cacheScopeFor(support.user))
        setSupportToken(null)
        resetSessionExpiryGuard()
        setSupport(null)
        setToken(localStorage.getItem(TOKEN_STORAGE_KEY))
        try {
            setUser(JSON.parse(localStorage.getItem(USER_STORAGE_KEY) ?? 'null'))
        } catch {
            setUser(null)
        }
    }, [support])

    // The API layer announces a confirmed session expiry; keep the refs fresh
    // so the listeners can stay mounted once and still call the latest handlers.
    const logoutRef = useRef(logout)
    useEffect(() => { logoutRef.current = logout }, [logout])
    const exitSupportRef = useRef(exitSupport)
    useEffect(() => { exitSupportRef.current = exitSupport }, [exitSupport])
    const tokenRef = useRef(token)
    useEffect(() => { tokenRef.current = token }, [token])

    useEffect(() => {
        const onExpired = () => logoutRef.current()
        // A support token is deliberately ephemeral. Its expiry must return to
        // the stored platform session instead of destroying it.
        const onSupportExpired = () => exitSupportRef.current()
        // When another tab signs out, follow it. Without this the two tabs
        // drift apart: one has no stored token while the other still believes
        // it is signed in, and the next click looks like a random logout.
        const onStorage = (e: StorageEvent) => {
            if (e.key === TOKEN_STORAGE_KEY && e.newValue === null && tokenRef.current) {
                logoutRef.current()
            }
        }
        window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
        window.addEventListener(SUPPORT_SESSION_EXPIRED_EVENT, onSupportExpired)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
            window.removeEventListener(SUPPORT_SESSION_EXPIRED_EVENT, onSupportExpired)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    // Proactively detect an expired JWT so the user is sent to login cleanly
    // instead of hitting a silent 401 on the first data request. The helper
    // allows clock skew, so a server-issued token is never discarded just
    // because the two clocks differ slightly.
    useEffect(() => {
        if (!token) return
        if (isTokenExpired(token)) {
            // Expiring a support token should drop back to the platform
            // session, not sign the platform user out entirely.
            if (support) exitSupport()
            else logout()
        }
    }, [token, support, logout, exitSupport])

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                setUser: updateUser,
                login,
                logout,
                switchLaundry,
                isAuthenticated: !!token,
                support,
                enterSupport,
                exitSupport,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
