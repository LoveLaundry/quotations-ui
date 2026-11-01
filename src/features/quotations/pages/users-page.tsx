import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    RiUserAddLine, RiCloseLine, RiEyeLine, RiEyeOffLine,
    RiRefreshLine, RiShieldCheckLine, RiEditLine, RiBuilding2Line,
    RiUserFollowLine, RiUserUnfollowLine, RiHotelLine, RiStore2Line
} from 'react-icons/ri'
import { toast } from 'sonner'
import authApi from '../../../api/auth-api'
import { laundryService } from '../../platform/services/laundry.service'
import { entityService, type PlatformEntity } from '../../platform/services/entity.service'
import { useAuth } from '../../../context/AuthContext'
import type { Laundry, LaundryMembership } from '../../../types/auth'
import { EmptyState } from '../../../components/ui/empty-state'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Portal } from '../../../components/ui/portal'
import { useEscape } from '../../../hooks/use-escape'

interface UserForm {
    user_name: string
    auth_id: string
    password: string
    email: string
    mobile_number: string
    employee_id: string
    role_id: string
    status: string
    laundry_id: string
    hotel_id: string
    shop_id: string
    entity_type: 'laundry' | 'hotel' | 'shop' | 'none'
}

const PLATFORM_ROLES = [
    'ADMIN',
    'HOTEL_ADMIN',
    'SHOP_ADMIN',
    'HOTEL_MANAGER',
    'SHOP_STAFF',
    'MANAGER',
    'STAFF',
    'PLATFORM_ADMIN',
]
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
    laundry_id: '',
    hotel_id: '',
    shop_id: '',
    entity_type: 'laundry',
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
    laundry_id?: string | null
    platform_admin?: boolean | null
    laundries?: Array<{ id: string; name?: string; role?: string; status?: string }>
    hotels?: Array<{ id: string; name?: string; role?: string; status?: string }>
    shops?: Array<{ id: string; name?: string; role?: string; status?: string }>
    created_at?: string
}

interface Membership {
    laundry_id: string
    name: string
    role: string
}

function buildMembershipMap(
    laundries: Laundry[],
    results: { data?: LaundryMembership[] }[],
): Map<string, Membership[]> {
    const map = new Map<string, Membership[]>()
    laundries.forEach((l, idx) => {
        const members = results[idx]?.data ?? []
        for (const m of members) {
            const list = map.get(m.auth_id) ?? []
            list.push({ laundry_id: l.laundry_id, name: l.name, role: m.role })
            map.set(m.auth_id, list)
        }
    })
    return map
}

export default function UsersPage() {
    const { user: currentUser } = useAuth()
    const isPlatformAdmin =
        currentUser?.role_id?.toUpperCase() === 'PLATFORM_ADMIN' || currentUser?.platform_admin === true

    const [users, setUsers] = useState<UserRecord[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState<UserForm>(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [showPw, setShowPw] = useState(false)
    const [manageUser, setManageUser] = useState<UserRecord | null>(null)

    useEscape(showModal, () => setShowModal(false))

    // Platform registries — laundries, hotels, and shops
    const { data: platformLaundriesData } = useQuery({
        queryKey: ['platform-laundries'],
        queryFn: () => laundryService.list({ limit: 200 }),
        enabled: isPlatformAdmin,
    })
    const platformLaundries = platformLaundriesData?.items ?? []

    const { data: activeLaundriesData } = useQuery({
        queryKey: ['platform-laundries', 'ACTIVE'],
        queryFn: () => laundryService.list({ status: 'ACTIVE', limit: 200 }),
        enabled: isPlatformAdmin,
    })
    const activeLaundries = activeLaundriesData?.items ?? []

    const { data: activeHotelsData } = useQuery({
        queryKey: ['platform-entities', 'hotel', 'ACTIVE'],
        queryFn: () => entityService.list('hotel', { status: 'ACTIVE', limit: 200 }),
        enabled: isPlatformAdmin,
    })
    const activeHotels = activeHotelsData?.items ?? []

    const { data: activeShopsData } = useQuery({
        queryKey: ['platform-entities', 'shop', 'ACTIVE'],
        queryFn: () => entityService.list('shop', { status: 'ACTIVE', limit: 200 }),
        enabled: isPlatformAdmin,
    })
    const activeShops = activeShopsData?.items ?? []

    // Laundry membership map
    const memberQueries = useQueries({
        queries: platformLaundries.map(l => ({
            queryKey: ['platform-laundry-members', l.laundry_id],
            queryFn: () => laundryService.members(l.laundry_id),
            enabled: isPlatformAdmin,
        })),
    })
    const membershipMap = buildMembershipMap(platformLaundries, memberQueries)
    //const membersLoading = memberQueries.some(q => q.isLoading)

    const fetchUsers = async () => {
        setLoadingUsers(true)
        try {
            const res = await authApi.get<UserRecord[]>('/users')
            setUsers(res.data)
        } catch (err: any) {
            toast.error(err.message || 'Failed to load users')
        } finally {
            setLoadingUsers(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleRoleChange = (role: string) => {
        let nextType: 'laundry' | 'hotel' | 'shop' | 'none' = form.entity_type
        if (role === 'PLATFORM_ADMIN') nextType = 'none'
        else if (role.startsWith('HOTEL_')) nextType = 'hotel'
        else if (role.startsWith('SHOP_')) nextType = 'shop'
        else nextType = 'laundry'

        setForm(f => ({
            ...f,
            role_id: role,
            entity_type: nextType,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.user_name || !form.auth_id) {
            toast.error('Full name and Username are required')
            return
        }
        if (!editId && !form.password) {
            toast.error('Password is required for new users')
            return
        }
        setSubmitting(true)
        try {
            const payload: any = {
                user_name: form.user_name,
                auth_id: form.auth_id,
                role_id: form.role_id,
                status: form.status,
            }
            if (form.email) payload.email = form.email
            if (form.mobile_number) payload.mobile_number = form.mobile_number
            if (form.employee_id) payload.employee_id = form.employee_id

            if (!editId && isPlatformAdmin && form.role_id !== 'PLATFORM_ADMIN') {
                if (form.entity_type === 'hotel' && form.hotel_id) {
                    payload.hotel_id = form.hotel_id
                } else if (form.entity_type === 'shop' && form.shop_id) {
                    payload.shop_id = form.shop_id
                } else if (form.entity_type === 'laundry' && form.laundry_id) {
                    payload.laundry_id = form.laundry_id
                }
            }

            if (editId) {
                await authApi.put(`/users/${editId}`, payload)
                if (form.password) {
                    await authApi.patch(`/users/${editId}/password`, { password: form.password })
                }
                toast.success(`User "${form.user_name}" updated successfully`)
            } else {
                await authApi.post('/users', { ...payload, password: form.password })
                toast.success(`User "${form.user_name}" created successfully`)
            }
            setShowModal(false)
            setForm(emptyForm)
            setEditId(null)
            fetchUsers()
        } catch (err: any) {
            toast.error(err.response?.data?.detail || err.message || `Failed to ${editId ? 'update' : 'create'} user`)
        } finally {
            setSubmitting(false)
        }
    }

    const openModal = () => {
        setForm(emptyForm)
        setEditId(null)
        setShowPw(false)
        setShowModal(true)
    }

    const openEdit = (u: UserRecord) => {
        const role = (u.role_id || 'STAFF').toUpperCase()
        let type: 'laundry' | 'hotel' | 'shop' | 'none' = 'laundry'
        if (role === 'PLATFORM_ADMIN') type = 'none'
        else if (role.startsWith('HOTEL_')) type = 'hotel'
        else if (role.startsWith('SHOP_')) type = 'shop'

        setForm({
            user_name: u.user_name,
            auth_id: u.auth_id,
            password: '',
            email: u.email || '',
            mobile_number: u.mobile_number || '',
            employee_id: u.employee_id || '',
            role_id: role,
            status: (u.status || 'active').toLowerCase(),
            laundry_id: u.laundry_id || '',
            hotel_id: u.hotels?.[0]?.id || '',
            shop_id: u.shops?.[0]?.id || '',
            entity_type: type,
        })
        setEditId(u.id)
        setShowPw(false)
        setShowModal(true)
    }

    const roleOptions = isPlatformAdmin ? PLATFORM_ROLES : ['MANAGER', 'STAFF']

    const inputClass =
        'h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3.5 text-[13px] text-[var(--text-primary)] placeholder:text-[#98A2B3] outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)] transition-all duration-150'

    const roleColor: Record<string, string> = {
        ADMIN: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
        MANAGER: 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]',
        STAFF: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
        HOTEL_ADMIN: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
        HOTEL_MANAGER: 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]',
        SHOP_ADMIN: 'bg-[#CCFBF1] text-[#115E59] border-[#99F6E4]',
        SHOP_STAFF: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
        PLATFORM_ADMIN: 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]',
    }

    const statusColor: Record<string, string> = {
        active: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
        inactive: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
        unset: 'bg-[var(--surface-3)] text-[#6B7280] border-[var(--border)]',
    }

    return (
        <div className="space-y-5 pb-10 select-none">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Users' }]} />
                    <h1 className="text-dashboard-title mt-1">User & Administrator Management</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        {isPlatformAdmin
                            ? 'Manage users, laundry admins, hotel admins, and shop admins across all platform entities'
                            : 'Create and manage system users'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={fetchUsers}
                        disabled={loadingUsers}
                        className="flex items-center gap-1.5"
                    >
                        <RiRefreshLine size={15} className={loadingUsers ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                    <Button onClick={openModal} className="flex items-center gap-1.5">
                        <RiUserAddLine size={15} />
                        Create User / Admin
                    </Button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Users', value: users.length, color: 'text-[var(--text-primary)]' },
                    { label: 'Active', value: users.filter(u => u.status === 'active').length, color: 'text-[#16A34A]' },
                    { label: 'Laundry Admins', value: users.filter(u => ['ADMIN', 'PLATFORM_ADMIN'].includes(u.role_id?.toUpperCase() ?? '')).length, color: 'text-[#92400E]' },
                    { label: 'Hotel & Shop Admins', value: users.filter(u => ['HOTEL_ADMIN', 'SHOP_ADMIN'].includes(u.role_id?.toUpperCase() ?? '')).length, color: 'text-[#6B21A8]' },
                ].map(stat => (
                    <Card key={stat.label}>
                        <CardContent className="pt-4 pb-4 text-center">
                            <p className={`text-[24px] font-bold ${stat.color}`}>{loadingUsers ? '—' : stat.value}</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* User list */}
            {loadingUsers ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 rounded-xl bg-[var(--surface-3)] animate-pulse" />
                    ))}
                </div>
            ) : users.length === 0 ? (
                <EmptyState
                    kind="first-run"
                    title="No users found"
                    description="Create the first user to give someone access to this system."
                    action={
                        <Button onClick={openModal}>
                            <RiUserAddLine aria-hidden /> Create first user
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map(u => {
                        const memberships = membershipMap.get(u.auth_id) ?? []
                        const hotelMemberships = u.hotels ?? []
                        const shopMemberships = u.shops ?? []
                        const hasAnyMembership =
                            memberships.length > 0 || hotelMemberships.length > 0 || shopMemberships.length > 0

                        return (
                            <motion.div
                                key={u.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm hover:shadow-md hover:border-[#D0D5DD] transition-all duration-150 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                                                {u.user_name}
                                            </p>
                                            <p className="text-[12px] font-mono text-[#6B7280] truncate">
                                                @{u.auth_id}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${roleColor[u.role_id?.toUpperCase()] || roleColor.STAFF}`}>
                                            {u.role_id?.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Memberships badge (Laundries, Hotels, Shops) */}
                                    {isPlatformAdmin && (
                                        <div className="mt-2.5 flex flex-wrap gap-1">
                                            {memberships.map(m => (
                                                <span
                                                    key={`l-${m.laundry_id}`}
                                                    className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] border border-[var(--border-2)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
                                                >
                                                    🏭 {m.name} ({m.role})
                                                </span>
                                            ))}
                                            {hotelMemberships.map(h => (
                                                <span
                                                    key={`h-${h.id}`}
                                                    className="inline-flex items-center gap-1 rounded-md bg-[#F3E8FF] border border-[#E9D5FF] px-2 py-0.5 text-[11px] text-[#6B21A8]"
                                                >
                                                    🏨 {h.name || h.id} ({h.role || 'HOTEL_ADMIN'})
                                                </span>
                                            ))}
                                            {shopMemberships.map(s => (
                                                <span
                                                    key={`s-${s.id}`}
                                                    className="inline-flex items-center gap-1 rounded-md bg-[#CCFBF1] border border-[#99F6E4] px-2 py-0.5 text-[11px] text-[#115E59]"
                                                >
                                                    🏪 {s.name || s.id} ({s.role || 'SHOP_ADMIN'})
                                                </span>
                                            ))}
                                            {!hasAnyMembership && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-3)] px-2 py-0.5 text-[11px] text-[#98A2B3]">
                                                    No entity membership
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-2 space-y-1 text-[12px] text-[#6B7280]">
                                        {u.email && <p className="truncate">✉ {u.email}</p>}
                                        {u.mobile_number && <p className="truncate">📞 {u.mobile_number}</p>}
                                        {u.employee_id && <p className="truncate">ID: {u.employee_id}</p>}
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${statusColor[u.status?.toLowerCase()] || statusColor.unset}`}>
                                        {u.status}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {isPlatformAdmin && (
                                            <button
                                                onClick={() => setManageUser(u)}
                                                className="px-2.5 py-1 rounded-lg border border-[var(--border)] text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-1"
                                                title="Manage memberships across laundries, hotels, and shops"
                                            >
                                                <RiBuilding2Line size={12} />
                                                Manage
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="px-2.5 py-1 rounded-lg border border-[var(--border)] text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-1"
                                        >
                                            <RiEditLine size={12} />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <Portal><motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                        >
                            <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white shadow-2xl overflow-hidden my-8">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-primary)] text-white">
                                            <RiUserAddLine size={16} />
                                        </div>
                                        <div>
                                            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                                                {editId ? 'Edit User' : 'Create User / Administrator'}
                                            </h2>
                                            <p className="text-[12px] text-[#98A2B3]">
                                                {editId ? 'Update user credentials and details' : 'Provision a new administrator or staff account'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#98A2B3] hover:text-[#374151] hover:bg-[var(--surface-2)] transition-colors"
                                    >
                                        <RiCloseLine size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                                                placeholder="e.g. John Doe"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                                                Username / Auth ID <span className="text-[#DC2626]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.auth_id}
                                                onChange={e => setForm(f => ({ ...f, auth_id: e.target.value }))}
                                                className={inputClass}
                                                placeholder="e.g. john.doe"
                                                disabled={!!editId}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                                            {editId ? 'New Password' : 'Password'} {!editId && <span className="text-[#DC2626]">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPw ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                                className={`${inputClass} pr-10`}
                                                placeholder={editId ? 'Leave blank to keep current' : 'Secure password'}
                                                required={!editId}
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
                                                onChange={e => handleRoleChange(e.target.value)}
                                                className={inputClass}
                                            >
                                                {roleOptions.map(r => (
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

                                    {/* Entity Enrollment for Platform Admin */}
                                    {isPlatformAdmin && form.role_id !== 'PLATFORM_ADMIN' && !editId && (
                                        <div className="rounded-xl border border-[var(--border-2)] bg-[var(--surface-2)] p-3.5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[12px] font-semibold text-[#374151]">
                                                    Enroll in Platform Entity
                                                </label>
                                                <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-[var(--border)] text-xs">
                                                    {(['laundry', 'hotel', 'shop'] as const).map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setForm(f => ({ ...f, entity_type: type }))}
                                                            className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
                                                                form.entity_type === type
                                                                    ? 'bg-[var(--brand)] text-white font-medium'
                                                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                                            }`}
                                                        >
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {form.entity_type === 'laundry' && (
                                                <div>
                                                    <select
                                                        value={form.laundry_id}
                                                        onChange={e => setForm(f => ({ ...f, laundry_id: e.target.value }))}
                                                        className={inputClass}
                                                    >
                                                        <option value="">— Select active laundry —</option>
                                                        {activeLaundries.map(l => (
                                                            <option key={l.laundry_id} value={l.laundry_id}>{l.name} ({l.laundry_id})</option>
                                                        ))}
                                                    </select>
                                                    <p className="text-[11px] text-[#98A2B3] mt-1">Assigns this user to the selected laundry.</p>
                                                </div>
                                            )}

                                            {form.entity_type === 'hotel' && (
                                                <div>
                                                    <select
                                                        value={form.hotel_id}
                                                        onChange={e => setForm(f => ({ ...f, hotel_id: e.target.value }))}
                                                        className={inputClass}
                                                    >
                                                        <option value="">— Select active hotel —</option>
                                                        {activeHotels.map(h => (
                                                            <option key={h.hotel_id} value={h.hotel_id}>{h.name} ({h.hotel_id})</option>
                                                        ))}
                                                    </select>
                                                    <p className="text-[11px] text-[#98A2B3] mt-1">Assigns this user as administrator/manager of the selected hotel.</p>
                                                </div>
                                            )}

                                            {form.entity_type === 'shop' && (
                                                <div>
                                                    <select
                                                        value={form.shop_id}
                                                        onChange={e => setForm(f => ({ ...f, shop_id: e.target.value }))}
                                                        className={inputClass}
                                                    >
                                                        <option value="">— Select active shop —</option>
                                                        {activeShops.map(s => (
                                                            <option key={s.shop_id} value={s.shop_id}>{s.name} ({s.shop_id})</option>
                                                        ))}
                                                    </select>
                                                    <p className="text-[11px] text-[#98A2B3] mt-1">Assigns this user as administrator/staff of the selected shop outlet.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            className={inputClass}
                                            placeholder="admin@domain.lk"
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

                                    {/* Admin notice */}
                                    <div className="flex items-start gap-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2.5">
                                        <RiShieldCheckLine size={14} className="text-[#16A34A] mt-0.5 shrink-0" />
                                        <p className="text-[11px] text-[#166534]">
                                            {editId
                                                ? 'Changes are saved immediately. Enter a new password only if you want to reset it.'
                                                : 'User will be created with the selected role. They can log in immediately using their username and password.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-white text-[13px] font-medium text-[#374151] hover:bg-[var(--surface-2)] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 h-10 rounded-xl bg-[var(--text-primary)] text-[13px] font-medium text-white hover:bg-[#1D2939] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <RiRefreshLine size={14} className="animate-spin" />
                                                    {editId ? 'Saving…' : 'Creating…'}
                                                </>
                                            ) : (
                                                <>
                                                    <RiEditLine size={14} />
                                                    {editId ? 'Save Changes' : 'Create User / Admin'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div></Portal>
                    </>
                )}
            </AnimatePresence>

            {/* Manage memberships modal (platform admins) */}
            <ManageMembershipsModal
                user={manageUser}
                laundries={platformLaundries}
                hotels={activeHotels}
                shops={activeShops}
                memberships={manageUser ? membershipMap.get(manageUser.auth_id) ?? [] : []}
                onClose={() => setManageUser(null)}
                onChanged={fetchUsers}
            />
        </div>
    )
}

function ManageMembershipsModal({
    user,
    laundries,
    hotels,
    shops,
    memberships,
    onClose,
    onChanged,
}: {
    user: UserRecord | null
    laundries: Laundry[]
    hotels: PlatformEntity[]
    shops: PlatformEntity[]
    memberships: Membership[]
    onClose: () => void
    onChanged: () => void
}) {
    const qc = useQueryClient()
    useEscape(!!user, onClose)

    const [tab, setTab] = useState<'laundries' | 'hotels' | 'shops'>('laundries')

    const refresh = () => {
        void qc.invalidateQueries({ queryKey: ['platform-laundries'] })
        void qc.invalidateQueries({ queryKey: ['platform-entities'] })
        void qc.invalidateQueries({ queryKey: ['users'] })
        onChanged()
    }

    const addLaundryMut = useMutation({
        mutationFn: ({ laundryId, role }: { laundryId: string; role: string }) =>
            laundryService.addMember(laundryId, { auth_id: user?.auth_id ?? '', role }),
        onSuccess: () => {
            toast.success('Laundry membership updated')
            refresh()
        },
        onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Add failed'),
    })

    const removeLaundryMut = useMutation({
        mutationFn: (laundryId: string) => laundryService.removeMember(laundryId, user?.auth_id ?? ''),
        onSuccess: () => {
            toast.success('Laundry membership removed')
            refresh()
        },
        onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Remove failed'),
    })

    const addHotelMut = useMutation({
        mutationFn: ({ hotelId, role }: { hotelId: string; role: string }) =>
            entityService.addMember('hotel', hotelId, { auth_id: user?.auth_id ?? '', role }),
        onSuccess: () => {
            toast.success('Hotel membership updated')
            refresh()
        },
        onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Add failed'),
    })

    const removeHotelMut = useMutation({
        mutationFn: (hotelId: string) => entityService.removeMember('hotel', hotelId, user?.auth_id ?? ''),
        onSuccess: () => {
            toast.success('Hotel membership removed')
            refresh()
        },
        onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Remove failed'),
    })

    const addShopMut = useMutation({
        mutationFn: ({ shopId, role }: { shopId: string; role: string }) =>
            entityService.addMember('shop', shopId, { auth_id: user?.auth_id ?? '', role }),
        onSuccess: () => {
            toast.success('Shop membership updated')
            refresh()
        },
        onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Add failed'),
    })

    const removeShopMut = useMutation({
        mutationFn: (shopId: string) => entityService.removeMember('shop', shopId, user?.auth_id ?? ''),
        onSuccess: () => {
            toast.success('Shop membership removed')
            refresh()
        },
        onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Remove failed'),
    })

    const laundryRoleOf = new Map(memberships.map(m => [m.laundry_id, m.role]))
    const hotelRoleOf = new Map((user?.hotels ?? []).map(h => [h.id, h.role || 'HOTEL_ADMIN']))
    const shopRoleOf = new Map((user?.shops ?? []).map(s => [s.id, s.role || 'SHOP_ADMIN']))

    return (
        <Portal>
            <AnimatePresence>
                {user && (
                    <>
                        <motion.div
                            key="manage-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                            onClick={onClose}
                        />
                        <motion.div
                            key="manage-modal"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-white shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--text-primary)] text-white">
                                            <RiBuilding2Line size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">
                                                Manage Memberships — {user.user_name}
                                            </h2>
                                            <p className="text-[12px] font-mono text-[#98A2B3] truncate">
                                                @{user.auth_id}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#98A2B3] hover:text-[#374151] hover:bg-[var(--surface-2)] transition-colors"
                                    >
                                        <RiCloseLine size={18} />
                                    </button>
                                </div>

                                {/* Category Tabs */}
                                <div className="flex border-b border-[var(--border)] px-6 pt-2 bg-[var(--surface-2)]">
                                    <button
                                        type="button"
                                        onClick={() => setTab('laundries')}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                                            tab === 'laundries'
                                                ? 'border-[var(--brand)] text-[var(--brand)]'
                                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        <RiBuilding2Line size={14} /> Laundries ({laundries.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTab('hotels')}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                                            tab === 'hotels'
                                                ? 'border-[var(--brand)] text-[var(--brand)]'
                                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        <RiHotelLine size={14} /> Hotels ({hotels.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTab('shops')}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                                            tab === 'shops'
                                                ? 'border-[var(--brand)] text-[var(--brand)]'
                                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        <RiStore2Line size={14} /> Shops ({shops.length})
                                    </button>
                                </div>

                                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
                                    {tab === 'laundries' && (
                                        <>
                                            {laundries.map(l => (
                                                <MembershipRow
                                                    key={l.laundry_id}
                                                    id={l.laundry_id}
                                                    name={l.name}
                                                    icon="🏭"
                                                    currentRole={laundryRoleOf.get(l.laundry_id)}
                                                    roles={['ADMIN', 'MANAGER', 'STAFF']}
                                                    onAdd={(role) => addLaundryMut.mutate({ laundryId: l.laundry_id, role })}
                                                    onRemove={() => removeLaundryMut.mutate(l.laundry_id)}
                                                />
                                            ))}
                                            {laundries.length === 0 && (
                                                <p className="text-center py-6 text-xs text-[#98A2B3]">No registered laundries.</p>
                                            )}
                                        </>
                                    )}

                                    {tab === 'hotels' && (
                                        <>
                                            {hotels.map(h => (
                                                <MembershipRow
                                                    key={h.hotel_id}
                                                    id={h.hotel_id!}
                                                    name={h.name}
                                                    icon="🏨"
                                                    currentRole={hotelRoleOf.get(h.hotel_id!)}
                                                    roles={['HOTEL_ADMIN', 'HOTEL_MANAGER']}
                                                    onAdd={(role) => addHotelMut.mutate({ hotelId: h.hotel_id!, role })}
                                                    onRemove={() => removeHotelMut.mutate(h.hotel_id!)}
                                                />
                                            ))}
                                            {hotels.length === 0 && (
                                                <p className="text-center py-6 text-xs text-[#98A2B3]">No registered hotels.</p>
                                            )}
                                        </>
                                    )}

                                    {tab === 'shops' && (
                                        <>
                                            {shops.map(s => (
                                                <MembershipRow
                                                    key={s.shop_id}
                                                    id={s.shop_id!}
                                                    name={s.name}
                                                    icon="🏪"
                                                    currentRole={shopRoleOf.get(s.shop_id!)}
                                                    roles={['SHOP_ADMIN', 'SHOP_STAFF']}
                                                    onAdd={(role) => addShopMut.mutate({ shopId: s.shop_id!, role })}
                                                    onRemove={() => removeShopMut.mutate(s.shop_id!)}
                                                />
                                            ))}
                                            {shops.length === 0 && (
                                                <p className="text-center py-6 text-xs text-[#98A2B3]">No registered shops.</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--surface-2)] flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-lg bg-white border border-[var(--border)] px-4 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface)]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    )
}

function MembershipRow({
    id,
    name,
    icon,
    currentRole,
    roles,
    onAdd,
    onRemove,
}: {
    id: string
    name: string
    icon: string
    currentRole?: string
    roles: string[]
    onAdd: (role: string) => void
    onRemove: () => void
}) {
    const isMember = Boolean(currentRole)
    const [role, setRole] = useState(currentRole ?? roles[0])

    return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-white hover:border-[#D0D5DD] transition-all">
            <div className="min-w-0 flex-1 flex items-center gap-2.5">
                <span className="text-lg">{icon}</span>
                <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{name}</p>
                    <p className="text-[11px] text-[#98A2B3] truncate">{id}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={isMember ? currentRole : role}
                    onChange={(e) => {
                        const next = e.target.value
                        setRole(next)
                        if (isMember) onAdd(next)
                    }}
                    className="h-8 rounded-lg border border-[var(--border)] bg-white px-2 text-[12px] text-[var(--text-primary)] outline-none"
                >
                    {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>

                {isMember ? (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="flex h-8 items-center gap-1 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2.5 text-[11px] font-medium text-[#DC2626] hover:bg-[#FEE2E2]"
                    >
                        <RiUserUnfollowLine size={13} />
                        Remove
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => onAdd(role)}
                        className="flex h-8 items-center gap-1 rounded-lg bg-[var(--text-primary)] px-2.5 text-[11px] font-medium text-white hover:bg-[#1D2939]"
                    >
                        <RiUserFollowLine size={13} />
                        Grant
                    </button>
                )}
            </div>
        </div>
    )
}
