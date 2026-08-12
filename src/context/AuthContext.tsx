import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../types/auth'

interface AuthCtx {
    token: string | null
    user: User | null
    setUser: (user: User) => void
    login: (token: string, user: User) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('ll_token'))
    const [user, setUser] = useState<User | null>(() => {
        try { return JSON.parse(localStorage.getItem('ll_user') ?? 'null') } catch { return null }
    })

    const login = useCallback((tok: string, usr: User) => {
        localStorage.setItem('ll_token', tok)
        localStorage.setItem('ll_user', JSON.stringify(usr))
        setToken(tok)
        setUser(usr)
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem('ll_token')
        localStorage.removeItem('ll_user')
        setToken(null)
        setUser(null)
    }, [])

    const updateUser = useCallback((usr: User) => {
        localStorage.setItem('ll_user', JSON.stringify(usr))
        setUser(usr)
    }, [])

    return (
        <AuthContext.Provider value={{ token, user, setUser: updateUser, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
