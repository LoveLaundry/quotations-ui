import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, X, Pencil, Trash2, Phone } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog'
import { useAuth } from '../../../context/AuthContext'
import {
    DEPARTMENTS,
    type Worker,
    type WorkerCreate,
} from '../types'
import { useCreateWorker, useDeleteWorker, useUpdateWorker, useWorkers } from '../hooks/useWorkers'

const DEPARTMENT_LABELS: Record<string, string> = {
    WASHING: 'Washing',
    PRESSING: 'Pressing',
    FINISHING: 'Finishing',
    PACKING: 'Packing',
    DRY_CLEANING: 'Dry Cleaning',
    DELIVERY: 'Delivery',
    GENERAL: 'General',
}

const EMPTY_FORM: WorkerCreate = {
    worker_name: '',
    department: 'GENERAL',
    phone: '',
    is_active: true,
    joined_date: '',
    notes: '',
}

export default function WorkersPage() {
    const { user } = useAuth()
    const isAdmin = user?.role_id?.toUpperCase() === 'ADMIN'

    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Worker | null>(null)
    const [form, setForm] = useState<WorkerCreate>(EMPTY_FORM)

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300)
        return () => clearTimeout(t)
    }, [searchInput])

    const { data: workers = [], isLoading, isError } = useWorkers()
    const createWorker = useCreateWorker()
    const updateWorker = useUpdateWorker()
    const deleteWorker = useDeleteWorker()

    const filtered = workers.filter(w => w.worker_name.toLowerCase().includes(search))

    const openCreate = () => {
        setEditing(null)
        setForm(EMPTY_FORM)
        setDialogOpen(true)
    }

    const openEdit = (w: Worker) => {
        setEditing(w)
        setForm({
            worker_name: w.worker_name,
            department: w.department,
            phone: w.phone ?? '',
            is_active: w.is_active,
            joined_date: w.joined_date ?? '',
            notes: w.notes ?? '',
        })
        setDialogOpen(true)
    }

    const submit = () => {
        if (!form.worker_name.trim()) return
        const payload: WorkerCreate = {
            ...form,
            worker_name: form.worker_name.trim(),
            phone: form.phone?.trim() || null,
            joined_date: form.joined_date || null,
            notes: form.notes?.trim() || null,
        }
        if (editing) {
            updateWorker.mutate({ id: editing.id, data: payload })
        } else {
            createWorker.mutate(payload)
        }
        setDialogOpen(false)
    }

    const busy = createWorker.isPending || updateWorker.isPending

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Laundry Workers' }]} />
                    <h1 className="text-dashboard-title mt-1">Laundry Workers</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        Staff registry — who works here and in which department
                    </p>
                </div>
                <Button onClick={openCreate} className="shadow-lg shadow-red-600/20">
                    <Plus className="h-4 w-4" /> Add Worker
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search by name…"
                    className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 shadow-sm"
                />
                {searchInput && (
                    <button
                        type="button"
                        onClick={() => setSearchInput('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] cursor-pointer"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-[120px]" />
                    ))}
                </div>
            ) : isError ? (
                <ErrorState description="Could not reach the worker service. Is it running?" />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title={search ? 'No matching workers' : 'No workers yet'}
                    description={
                        search
                            ? 'Try a different name.'
                            : 'Add your laundry staff to start tracking their daily tasks.'
                    }
                    action={!search && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Worker</Button>}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map(w => (
                        <Card key={w.id} className="p-4 group relative">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-[#101828] truncate">
                                            {w.worker_name}
                                        </p>
                                        <p className="text-[11px] text-[#98A2B3] mt-0.5">
                                            {DEPARTMENT_LABELS[w.department] ?? w.department}
                                            {w.joined_date ? ` · joined ${w.joined_date}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${w.is_active
                                        ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                                        : 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]'
                                        }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${w.is_active ? 'bg-[#22C55E]' : 'bg-[#9CA3AF]'}`} />
                                    {w.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-[#F2F4F7] pt-3">
                                <span className="flex items-center gap-1.5 text-[12px] text-[#6B7280] truncate">
                                    <Phone className="h-3 w-3 shrink-0" /> {w.phone || '—'}
                                </span>
                                {isAdmin && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(w)}
                                            className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2563EB] cursor-pointer"
                                            title="Edit"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm(`Remove ${w.worker_name}?`)) deleteWorker.mutate(w.id)
                                            }}
                                            className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
                        <DialogDescription>
                            Worker details are encrypted before they touch the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <label className="block space-y-1">
                            <span className="text-[12px] font-medium text-[#344054]">Full name *</span>
                            <input
                                value={form.worker_name}
                                onChange={e => setForm({ ...form, worker_name: e.target.value })}
                                placeholder="e.g. Kasun Perera"
                                className="h-9 w-full rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10"
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Department</span>
                                <select
                                    value={form.department}
                                    onChange={e => setForm({ ...form, department: e.target.value })}
                                    className="h-9 w-full appearance-none rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] cursor-pointer"
                                >
                                    {DEPARTMENTS.map(d => (
                                        <option key={d} value={d}>{DEPARTMENT_LABELS[d] ?? d}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Phone</span>
                                <input
                                    value={form.phone ?? ''}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="07X XXX XXXX"
                                    className="h-9 w-full rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10"
                                />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Joined date</span>
                                <input
                                    type="date"
                                    value={form.joined_date ?? ''}
                                    onChange={e => setForm({ ...form, joined_date: e.target.value })}
                                    className="h-9 w-full rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626]"
                                />
                            </label>
                            <label className="flex items-end gap-2 pb-1.5">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="h-4 w-4 accent-[#DC2626] cursor-pointer"
                                />
                                <span className="text-[12px] font-medium text-[#344054]">Currently active</span>
                            </label>
                        </div>
                        <label className="block space-y-1">
                            <span className="text-[12px] font-medium text-[#344054]">Notes</span>
                            <textarea
                                value={form.notes ?? ''}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                rows={2}
                                placeholder="Anything worth remembering…"
                                className="w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-[13px] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 resize-none"
                            />
                        </label>
                    </DialogBody>
                    <DialogFooter>
                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="flex-1" disabled={!form.worker_name.trim() || busy} onClick={submit}>
                                {editing ? 'Save Changes' : 'Add Worker'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cross-link */}
            <p className="text-[12px] text-[#98A2B3]">
                Track what each worker did today on the{' '}
                <Link to="/workers/daily-tasks" className="font-medium text-[#DC2626] hover:underline">
                    Daily Tasks
                </Link>{' '}
                tab.
            </p>
        </div>
    )
}
