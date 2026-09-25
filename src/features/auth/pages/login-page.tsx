import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import { authService } from '../services/auth.service'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await authService.login({ username: username.trim(), password })
            login(res.access_token, res.user)
            navigate('/', { replace: true })
        } catch (err: any) {
            setError(err.message || 'Invalid username or password')
        } finally {
            setLoading(false)
        }
    }

    const inputClass =
        'h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] outline-none focus:border-[var(--border-2)] focus:ring-1 focus:ring-[var(--ring)] transition-colors duration-150'

    return (
        <div className="min-h-screen bg-[var(--surface-2)] flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[400px]"
            >
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
                    {/* Logo & Brand */}
                    <div className="flex flex-col items-center mb-8">
                        <img
                            src="/icon.png"
                            alt="LoveLaundry Logo"
                            className="h-16 w-16 object-contain mb-4"
                        />
                        <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
                            Welcome back
                        </h1>
                        <p className="text-[14px] text-[var(--text-muted)] mt-1">
                            Sign in to your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
                                Username or Email
                            </label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className={inputClass}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`${inputClass} pr-11`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                                    tabIndex={-1}
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg bg-[var(--red-50)] px-4 py-3 text-[13px] text-[var(--red-600)] font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading || !username || !password}
                            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--surface)] text-[14px] font-medium text-white hover:bg-[var(--surface-2)] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    {/* Guest Pass */}
                    <div className="mt-6 border-t border-[var(--border)] pt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/guest/shop')}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[14px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-2)] transition-colors duration-150 cursor-pointer"
                        >
                            Guest Pass
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
