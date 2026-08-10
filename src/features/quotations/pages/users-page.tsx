import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiUserAddLine, RiUserLine, RiShieldLine, RiCloseLine, RiEyeLine, RiEyeOffLine, RiRefreshLine } from 'react-icons/ri'
import { toast } from 'sonner'
import { useAuth } from '../../../context/AuthContext'
import authApi from '../../../api/auth-api'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'

interface UserForm {
    user_name: string
    auth_id: string
    password: string
    email: string
    mobile_number: string
    employee_id: string
    role_id: string
    status: string
}

const ROLES = ['ADMIN', 'MANAGER', 'STAFF']
const STATUSES = ['active', 'inactive', 'unset']

const emptyForm: UserForm = {
    user_name: '',
    auth_id: '',
    password: '',
    email: '',
    mobile_number: '',
    employee_id: '',
    role_id: 'STAFF',
    status: 'active',
}

interface UserRecord {
    id: string
    user_name: string
    auth_id: string
    email?: string
    mobile_number?: string
    employee_id?: string
    role_id: string
    status: string
    created_at?: string
}

export default function UsersPage() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<UserRecord[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState<UserForm>(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [showPw, setShowPw] = useState(false)
    const [fetched, setFetched] = useState(false)

    const isAdmin = currentUser?.role_id?.toUpperCase() === 'ADMIN'

    const fetchUsers = async () => {
        setLoadingUsers(true)
        try {
            const res = await authApi.get<UserRecord[]>('/users')
            setUsers(res.data)
            setFetched(true)
        } catch (err: any) {
            toast.error(err.message || 'Failed to load users')
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.user_name || !form.auth_id || !form.password) {
            toast.error('Username, Auth ID and Password are required')
            return
        }
        setSubmitting(true)
        try {
            const payload: any = { ...form }
            if (!payload.email) delete payload.email
            if (!payload.mobile_number) delete payload.mobile_number
            if (!payload.employee_id) delete payload.employee_id
            await authApi.post('/users', payload)
            toast.success(`User "${form.user_name}" created successfully`)
            setShowModal(false)
            setForm(emptyForm)
            if (fetched) fetchUsers()
        } catch (err: any) {
            toast.error(err.message || 'Failed to create user')
        } finally {
            setSubmitting(false)
        }
    }

    const inputClass =
        'h-10 w-full rounded-xl border border-[#E4E7EC] bg-white px-3.5 text-[13px] text-[#101828] placeholder:text-[#98A2B3] outline-none focus:border-[#101828] focus:ring-1 focus:ring-[#101828] transition-all duration-150'

    const roleColor: Record<string, string> = {
        ADMIN: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
        MANAGER: 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]',
        STAFF: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    }

    const statusColor: Record<string, string> = {
        active: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
        inactive: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
        unset: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] select-none">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626] mb-4">
                    <RiShieldLine size={32} />
                </div>
                <h2 className="text-[18px] font-bold text-[#101828]">Access Restricted</h2>
                <p className="text-[13px] text-[#6B7280] mt-1 text-center max-w-xs">
                    Only administrators can access user management.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-5 pb-10 select-none">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Users' }]} />
                    <h1 className="text-dashboard-title mt-1">User Management</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">Create and manage system users</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={fetchUsers}
                        disabled={loadingUsers}
                        className="flex items-center gap-1.5"
                    >
                        <RiRefreshLine size={15} className={loadingUsers ? 'animate-spin' : ''} />
                        {fetched ? 'Refresh' : 'Load Users'}
                    </Button>
                    <Button onClick={() => setShowModal(true)} className="flex items-center gap-1.5">
                        <RiUserAddLine size={15} />
                        Create User
                    </Button>
                </div>
            </div>

            {/* User list */}
            {!fetched ? (
                <Card>
                    <CardContent className="py-16 flex flex-col items-center justify-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#6B7280]">
                            <RiUserLine size={28} />
                        </div>
                        <p className="text-[14px] font-semibold text-[#101828]">No users loaded</p>
                        <p className="text-[13px] text-[#6B7280]">Click "Load Users" to fetch the user list</p>
                    </CardContent>
                </Card>
            ) : loadingUsers ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 rounded-xl bg-[#F3F4F6] animate-pulse" />
                    ))}
                </div>
            ) : users.length === 0 ? (
                <Card>
                    <CardContent className="py-16 flex flex-col items-center justify-center gap-3">
                        <p className="text-[14px] font-semibold text-[#101828]">No users found</p>
                        <p className="text-[13px] text-[#6B7280]">Create the first user to get started</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((u, idx) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                        >
                            <Card className="hover:border-[#D1D5DB] transition-colors">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#101828] to-[#374151] text-white font-bold text-[15px]">
                                            {u.user_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[14px] font-semibold text-[#101828] truncate">{u.user_name}</p>
                                            <p className="text-[12px] text-[#6B7280] truncate">{u.email || u.auth_id}</p>
                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${roleColor[u.role_id?.toUpperCase()] || roleColor.STAFF}`}>
                                                    {u.role_id?.toUpperCase()}
                                                </span>
                                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusColor[u.status?.toLowerCase()] || statusColor.unset}`}>
                                                    {u.status}
                                                </span>
                                                {u.employee_id && (
                                                    <span className="inline-flex items-center rounded-md border border-[#E4E7EC] bg-[#F9FAFB] px-2 py-0.5 text-[10px] text-[#6B7280]">
                                                        #{u.employee_id}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create User Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white shadow-2xl overflow-hidden">
                                {/* Modal header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101828] text-white">
                                            <RiUserAddLine size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#101828]">Create User</p>
                                            <p className="text-[11px] text-[#6B7280]">Add a new system user</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#101828] transition-colors"
                                    >
                                        <RiCloseLine size={16} />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                                                Full Name <span className="text-[#DC2626]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.user_name}
                                                onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
                                                className={inputClass}
                                                placeholder="John Silva"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                                                Auth ID / Username <span className="text-[#DC2626]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.auth_id}
                                                onChange={e => setForm(f => ({ ...f, auth_id: e.target.value }))}
                                                className={inputClass}
                                                placeholder="john.silva"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                                            Password <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPw ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                                className={`${inputClass} pr-10`}
                                                placeholder="Secure password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPw ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Role</label>
                                            <select
                                                value={form.role_id}
                                                onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}
                                                className={inputClass}
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Status</label>
                                            <select
                                                value={form.status}
                                                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                                className={inputClass}
                                            >
                                                {STATUSES.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            className={inputClass}
                                            placeholder="john@lovelaundry.lk"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Mobile</label>
                                            <input
                                                type="text"
                                                value={form.mobile_number}
                                                onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))}
                                                className={inputClass}
                                                placeholder="+94 77 123 4567"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Employee ID</label>
                                            <input
                                                type="text"
                                                value={form.employee_id}
                                                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                                                className={inputClass}
                                                placeholder="EMP-001"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 h-10 rounded-xl border border-[#E4E7EC] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 h-10 rounded-xl bg-[#101828] text-[13px] font-medium text-white hover:bg-[#1D2939] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Creating...' : 'Create User'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
