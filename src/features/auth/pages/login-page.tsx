import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from 'lucide-react'
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
        'h-11 w-full rounded-xl border border-[#E4E7EC] bg-white/80 px-4 text-[14px] text-[#101828] placeholder:text-[#98A2B3] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 transition-all duration-150 shadow-sm'

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0FDF4] via-[#F9FAFB] to-[#EFF6FF] flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#16A34A]/8 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#2563EB]/8 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[400px]"
            >
                {/* Card */}
                <div className="rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_24px_64px_-8px_rgba(16,24,40,0.12)] p-8">
                    {/* Logo & Brand */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803D] shadow-lg shadow-[#16A34A]/30 mb-4">
                            <ShieldCheck className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-[22px] font-bold text-[#101828] tracking-tight">LoveLaundry.LK</h1>
                        <p className="text-[13px] text-[#6B7280] mt-1">Sign in to management system</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
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
                            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                                Password
                            </label>
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] transition-colors cursor-pointer"
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
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-[13px] text-[#DC2626] font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading || !username || !password}
                            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#15803D] text-[14px] font-semibold text-white shadow-md shadow-[#16A34A]/30 hover:shadow-lg hover:shadow-[#16A34A]/40 hover:from-[#15803D] hover:to-[#166534] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer note */}
                    <p className="mt-6 text-center text-[12px] text-[#98A2B3]">
                        Secure access via JWT authentication
                    </p>
                </div>

                {/* Version badge */}
                <p className="mt-4 text-center text-[11px] text-[#C0C7D4]">
                    LoveLaundry Management System · v1.0
                </p>
            </motion.div>
        </div>
    )
}
