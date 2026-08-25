import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    Shirt,
    Sparkles,
    PackageCheck,
    Layers,
    MoreHorizontal,
    Pencil,
    Trash2,
    Clock,
    AlertTriangle,
} from 'lucide-react'
import { motion } from 'framer-motion'
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
import {
    ATTENDANCE_STATUSES,
    DEPARTMENTS,
    SHIFTS,
    TASK_TYPES,
    TASK_UNITS,
    todayISO,
    type DailyLog,
    type TaskEntry,
} from '../types'
import {
    useCreateDailyLog,
    useDailyLogs,
    useDailySummary,
    useDeleteDailyLog,
    useUpdateDailyLog,
    useWorkers,
} from '../hooks/useWorkers'

const ATTENDANCE_STYLE: Record<string, string> = {
    PRESENT: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    HALF_DAY: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    ABSENT: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    ON_LEAVE: 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
}

interface LogFormState {
    worker_name: string
    department: string
    shift: string
    attendance_status: string
    check_in_time: string
    check_out_time: string
    overtime_hours: number
    washed_count: number
    pressed_count: number
    folded_count: number
    packed_count: number
    other_count: number
    total_weight_kg: number
    tasks: TaskEntry[]
    rewash_count: number
    damaged_items: number
    complaints: number
    machines_used: string
    chemicals_used: string
    notes: string
    performance_rating: string
}

const EMPTY_FORM = (workerName = '', department = 'GENERAL'): LogFormState => ({
    worker_name: workerName,
    department,
    shift: 'FULL_DAY',
    attendance_status: 'PRESENT',
    check_in_time: '',
    check_out_time: '',
    overtime_hours: 0,
    washed_count: 0,
    pressed_count: 0,
    folded_count: 0,
    packed_count: 0,
    other_count: 0,
    total_weight_kg: 0,
    tasks: [],
    rewash_count: 0,
    damaged_items: 0,
    complaints: 0,
    machines_used: '',
    chemicals_used: '',
    notes: '',
    performance_rating: '',
})

function shiftDate(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00`)
    d.setDate(d.getDate() + days)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function prettyDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export default function DailyTasksPage() {
    const [date, setDate] = useState(todayISO())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<DailyLog | null>(null)
    const [form, setForm] = useState<LogFormState>(EMPTY_FORM())

    const { data: workers = [] } = useWorkers(true)
    const { data: logs = [], isLoading, isError } = useDailyLogs({ work_date: date })
    const { data: summary } = useDailySummary(date)
    const createLog = useCreateDailyLog()
    const updateLog = useUpdateDailyLog()
    const deleteLog = useDeleteDailyLog()

    const activeWorkers = useMemo(
        () =>
            workers.map(w => ({
                name: w.worker_name,
                department: w.department || 'GENERAL',
            })),
        [workers]
    )

    // Merge workers seen in logs but missing from registry (e.g. offboarded)
    const knownWorkers = useMemo(() => {
        const map = new Map(activeWorkers.map(w => [w.name.toLowerCase(), w]))
        logs.forEach(l => {
            if (!map.has(l.worker_name.toLowerCase())) {
                map.set(l.worker_name.toLowerCase(), {
                    name: l.worker_name,
                    department: l.department || 'GENERAL',
                })
            }
        })
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
    }, [activeWorkers, logs])

    const openCreate = () => {
        setEditing(null)
        setForm(EMPTY_FORM())
        setDialogOpen(true)
    }

    const openEdit = (log: DailyLog) => {
        setEditing(log)
        setForm({
            ...EMPTY_FORM(),
            worker_name: log.worker_name,
            department: log.department,
            shift: log.shift,
            attendance_status: log.attendance_status,
            check_in_time: log.check_in_time ?? '',
            check_out_time: log.check_out_time ?? '',
            overtime_hours: log.overtime_hours,
            washed_count: log.washed_count,
            pressed_count: log.pressed_count,
            folded_count: log.folded_count,
            packed_count: log.packed_count,
            other_count: log.other_count,
            total_weight_kg: log.total_weight_kg,
            tasks: (log.tasks ?? []).map(t => ({ ...t })),
            rewash_count: log.rewash_count,
            damaged_items: log.damaged_items,
            complaints: log.complaints,
            machines_used: log.machines_used ?? '',
            chemicals_used: log.chemicals_used ?? '',
            notes: log.notes ?? '',
            performance_rating: log.performance_rating ? String(log.performance_rating) : '',
        })
        setDialogOpen(true)
    }

    const submit = () => {
        if (!form.worker_name.trim()) return
        const payload = {
            work_date: date,
            worker_name: form.worker_name.trim(),
            department: form.department,
            shift: form.shift,
            attendance_status: form.attendance_status,
            check_in_time: form.check_in_time || null,
            check_out_time: form.check_out_time || null,
            overtime_hours: Number(form.overtime_hours) || 0,
            washed_count: Number(form.washed_count) || 0,
            pressed_count: Number(form.pressed_count) || 0,
            folded_count: Number(form.folded_count) || 0,
            packed_count: Number(form.packed_count) || 0,
            other_count: Number(form.other_count) || 0,
            total_weight_kg: Number(form.total_weight_kg) || 0,
            tasks: form.tasks.filter(t => t.task_type && t.quantity > 0),
            rewash_count: Number(form.rewash_count) || 0,
            damaged_items: Number(form.damaged_items) || 0,
            complaints: Number(form.complaints) || 0,
            machines_used: form.machines_used.trim() || null,
            chemicals_used: form.chemicals_used.trim() || null,
            notes: form.notes.trim() || null,
            performance_rating: form.performance_rating ? Number(form.performance_rating) : null,
        }
        if (editing) {
            updateLog.mutate({ id: editing.id, data: payload })
        } else {
            createLog.mutate(payload)
        }
        setDialogOpen(false)
    }

    const addTaskRow = () =>
        setForm(f => ({
            ...f,
            tasks: [...f.tasks, { task_type: 'WASHING', description: '', quantity: 1, unit: 'PIECES' }],
        }))

    const updateTaskRow = (idx: number, patch: Partial<TaskEntry>) =>
        setForm(f => ({
            ...f,
            tasks: f.tasks.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
        }))

    const removeTaskRow = (idx: number) =>
        setForm(f => ({ ...f, tasks: f.tasks.filter((_, i) => i !== idx) }))

    const busy = createLog.isPending || updateLog.isPending

    const statCards = summary
        ? [
            { label: 'Washed', value: summary.total_washed, icon: Shirt, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Pressed', value: summary.total_pressed, icon: Sparkles, color: '#C2410C', bg: '#FFF7ED' },
            { label: 'Folded', value: summary.total_folded, icon: Layers, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Packed', value: summary.total_packed, icon: PackageCheck, color: '#15803D', bg: '#F0FDF4' },
        ]
        : []

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Worker Daily Tasks' }]} />
                    <h1 className="text-dashboard-title mt-1">Worker Daily Tasks</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        What each person washed, pressed and did today — all records encrypted at rest
                    </p>
                </div>
                <Button onClick={openCreate} className="shadow-lg shadow-red-600/20">
                    <Plus className="h-4 w-4" /> Log Daily Tasks
                </Button>
            </div>

            {/* Date navigator */}
            <Card className="p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="icon" onClick={() => setDate(d => shiftDate(d, -1))} title="Previous day">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <label className="relative flex items-center gap-2">
                            <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-[#98A2B3]" />
                            <input
                                type="date"
                                value={date}
                                onChange={e => e.target.value && setDate(e.target.value)}
                                className="h-9 appearance-none rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-3 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] shadow-sm cursor-pointer"
                            />
                        </label>
                        <Button variant="secondary" size="icon" onClick={() => setDate(d => shiftDate(d, 1))} title="Next day">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDate(todayISO())}>
                            Today
                        </Button>
                    </div>
                    <p className="text-[12px] font-medium text-[#667085]">{prettyDate(date)}</p>
                </div>

                {/* Summary strip */}
                {summary && (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8 pt-3 mt-3 border-t border-[#F2F4F7]">
                        {statCards.map(s => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2.5 rounded-lg border border-[#EAECF0] px-3 py-2"
                                style={{ background: s.bg }}
                            >
                                <s.icon className="h-4 w-4 shrink-0" style={{ color: s.color }} />
                                <div className="min-w-0">
                                    <p className="text-[15px] font-bold leading-none text-[#101828]">{s.value}</p>
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#667085] mt-1">
                                        {s.label}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                        <div className="flex items-center gap-2.5 rounded-lg border border-[#EAECF0] bg-white px-3 py-2">
                            <Clock className="h-4 w-4 shrink-0 text-[#0891B2]" />
                            <div className="min-w-0">
                                <p className="text-[15px] font-bold leading-none text-[#101828]">
                                    {summary.total_overtime_hours}
                                </p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-[#667085] mt-1">OT hrs</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 rounded-lg border border-[#EAECF0] bg-white px-3 py-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-[#DC2626]" />
                            <div className="min-w-0">
                                <p className="text-[15px] font-bold leading-none text-[#101828]">
                                    {summary.total_rewash}
                                </p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-[#667085] mt-1">Rewash</p>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Logs list */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-[110px]" />
                    ))}
                </div>
            ) : isError ? (
                <ErrorState description="Could not reach the worker service. Is it running?" />
            ) : logs.length === 0 ? (
                <EmptyState
                    title="No task logs for this day"
                    description="Record what each worker washed, pressed, folded or packed today."
                    action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Log Daily Tasks</Button>}
                />
            ) : (
                <div className="space-y-3">
                    {logs.map(log => {
                        const pieces =
                            log.washed_count + log.pressed_count + log.folded_count + log.packed_count + log.other_count
                        return (
                            <Card key={log.id} className="p-4 group">
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] text-[13px] font-bold text-[#2563EB]">
                                            {log.worker_name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-semibold text-[#101828] truncate">
                                                {log.worker_name}
                                                <span className="ml-2 text-[11px] font-normal text-[#98A2B3]">
                                                    {log.department}
                                                </span>
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#667085]">
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 font-semibold ${ATTENDANCE_STYLE[log.attendance_status] ?? ATTENDANCE_STYLE.PRESENT}`}
                                                >
                                                    {log.attendance_status.replace('_', ' ')}
                                                </span>
                                                <span>·</span>
                                                <span>{log.shift.replace('_', ' ')}</span>
                                                {(log.check_in_time || log.check_out_time) && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="font-mono">
                                                            {log.check_in_time || '--:--'} → {log.check_out_time || '--:--'}
                                                        </span>
                                                    </>
                                                )}
                                                {log.overtime_hours > 0 && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="text-[#D97706] font-medium">
                                                            +{log.overtime_hours}h OT
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(log)}
                                            className="p-1.5 rounded-md text-[#98A2B3] hover:bg-[#F3F4F6] hover:text-[#2563EB] cursor-pointer transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm(`Delete the daily log for ${log.worker_name}?`)) deleteLog.mutate(log.id)
                                            }}
                                            className="p-1.5 rounded-md text-[#98A2B3] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Counts */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-[#667085] border-t border-[#F2F4F7] pt-3">
                                    <span><Shirt className="inline h-3 w-3 mr-1 -mt-0.5 text-[#2563EB]" /><b className="text-[#374151]">{log.washed_count}</b> washed</span>
                                    <span><Sparkles className="inline h-3 w-3 mr-1 -mt-0.5 text-[#C2410C]" /><b className="text-[#374151]">{log.pressed_count}</b> pressed</span>
                                    <span><Layers className="inline h-3 w-3 mr-1 -mt-0.5 text-[#7C3AED]" /><b className="text-[#374151]">{log.folded_count}</b> folded</span>
                                    <span><PackageCheck className="inline h-3 w-3 mr-1 -mt-0.5 text-[#15803D]" /><b className="text-[#374151]">{log.packed_count}</b> packed</span>
                                    <span><MoreHorizontal className="inline h-3 w-3 mr-1 -mt-0.5 text-[#667085]" /><b className="text-[#374151]">{log.other_count}</b> other</span>
                                    <span className="text-[#374151]"><b>{pieces}</b> pcs total</span>
                                    {log.total_weight_kg > 0 && (
                                        <span><b className="text-[#374151]">{log.total_weight_kg}</b> kg</span>
                                    )}
                                    {log.rewash_count > 0 && (
                                        <span className="text-[#DC2626]"><b>{log.rewash_count}</b> rewash</span>
                                    )}
                                    {log.damaged_items > 0 && (
                                        <span className="text-[#DC2626]"><b>{log.damaged_items}</b> damaged</span>
                                    )}
                                    {log.performance_rating && (
                                        <span className="text-[#D97706]">
                                            {'★'.repeat(log.performance_rating)}
                                            {'☆'.repeat(Math.max(0, 5 - log.performance_rating))}
                                        </span>
                                    )}
                                </div>

                                {/* Detailed task entries */}
                                {log.tasks?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {log.tasks.map((t, i) => (
                                            <span
                                                key={`${t.task_type}-${i}`}
                                                className="inline-flex items-center rounded-md bg-[#F9FAFB] border border-[#EAECF0] px-2 py-0.5 text-[11px] text-[#475467]"
                                            >
                                                <b className="mr-1">{t.quantity} {t.unit.toLowerCase()}</b>
                                                {t.task_type.replace(/_/g, ' ').toLowerCase()}
                                                {t.description ? ` · ${t.description}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Notes / machines */}
                                {(log.notes || log.machines_used || log.quality_notes) && (
                                    <p className="mt-2.5 text-[12px] text-[#667085] italic truncate">
                                        {[
                                            log.machines_used && `Machines: ${log.machines_used}`,
                                            log.quality_notes,
                                            log.notes,
                                        ]
                                            .filter(Boolean)
                                            .join(' — ')}
                                    </p>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Create / edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-[560px] max-h-[92vh] overflow-y-auto">
                    <DialogHeader className="text-left">
                        <DialogTitle>
                            {editing ? `Edit — ${editing.worker_name}` : 'Log Daily Tasks'}
                        </DialogTitle>
                        <DialogDescription>
                            {prettyDate(date)} · counts sync automatically with detailed task rows
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {/* Worker */}
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Worker *</span>
                                <select
                                    value={form.worker_name}
                                    onChange={e => {
                                        const match = knownWorkers.find(w => w.name === e.target.value)
                                        setForm(f => ({
                                            ...f,
                                            worker_name: e.target.value,
                                            department: match?.department ?? f.department,
                                        }))
                                    }}
                                    className="h-9 w-full appearance-none rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] cursor-pointer"
                                >
                                    <option value="">Select…</option>
                                    {knownWorkers.map(w => (
                                        <option key={w.name} value={w.name}>{w.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Department</span>
                                <select
                                    value={form.department}
                                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                                    className="h-9 w-full appearance-none rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] cursor-pointer"
                                >
                                    {DEPARTMENTS.map(d => (
                                        <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {/* Attendance */}
                        <div className="grid grid-cols-3 gap-3">
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Shift</span>
                                <select
                                    value={form.shift}
                                    onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                                    className="h-9 w-full appearance-none rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] cursor-pointer"
                                >
                                    {SHIFTS.map(s => (
                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Attendance</span>
                                <select
                                    value={form.attendance_status}
                                    onChange={e => setForm(f => ({ ...f, attendance_status: e.target.value }))}
                                    className="h-9 w-full appearance-none rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] cursor-pointer"
                                >
                                    {ATTENDANCE_STATUSES.map(a => (
                                        <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Overtime (h)</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={form.overtime_hours}
                                    onChange={e => setForm(f => ({ ...f, overtime_hours: Number(e.target.value) }))}
                                    className="h-9 w-full rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626]"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Check in</span>
                                <input
                                    type="time"
                                    value={form.check_in_time}
                                    onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))}
                                    className="h-9 w-full rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626]"
                                />
                            </label>
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Check out</span>
                                <input
                                    type="time"
                                    value={form.check_out_time}
                                    onChange={e => setForm(f => ({ ...f, check_out_time: e.target.value }))}
                                    className="h-9 w-full rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626]"
                                />
                            </label>
                        </div>

                        {/* Quick counts */}
                        <fieldset className="rounded-lg border border-[#EAECF0] p-3 space-y-2">
                            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                                Work done today
                            </legend>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                {([
                                    ['washed_count', 'Washed'],
                                    ['pressed_count', 'Pressed'],
                                    ['folded_count', 'Folded'],
                                    ['packed_count', 'Packed'],
                                    ['other_count', 'Other'],
                                    ['total_weight_kg', 'Kg'],
                                ] as const).map(([key, label]) => (
                                    <label key={key} className="block space-y-0.5">
                                        <span className="block text-[10px] font-medium uppercase tracking-wide text-[#667085]">
                                            {label}
                                        </span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={key === 'total_weight_kg' ? 0.1 : 1}
                                            value={form[key]}
                                            onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                                            className="h-8 w-full rounded-md border border-[#E4E7EC] px-2 text-[12px] outline-none focus:border-[#DC2626]"
                                        />
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* Detailed task rows */}
                        <fieldset className="rounded-lg border border-[#EAECF0] p-3 space-y-2">
                            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                                Detailed tasks (optional)
                            </legend>
                            {form.tasks.length === 0 && (
                                <p className="text-[11px] text-[#98A2B3]">
                                    Break down the day into specific jobs — e.g. “40 shirts pressing”.
                                </p>
                            )}
                            {form.tasks.map((t, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <select
                                        value={t.task_type}
                                        onChange={e => updateTaskRow(idx, { task_type: e.target.value })}
                                        className="h-8 w-[130px] shrink-0 appearance-none rounded-md border border-[#E4E7EC] px-2 text-[11px] outline-none focus:border-[#DC2626] cursor-pointer"
                                    >
                                        {TASK_TYPES.map(tt => (
                                            <option key={tt} value={tt}>{tt.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                    <input
                                        value={t.description ?? ''}
                                        onChange={e => updateTaskRow(idx, { description: e.target.value })}
                                        placeholder="What exactly?"
                                        className="h-8 min-w-0 flex-1 rounded-md border border-[#E4E7EC] px-2 text-[11px] outline-none focus:border-[#DC2626]"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        value={t.quantity}
                                        onChange={e => updateTaskRow(idx, { quantity: Number(e.target.value) })}
                                        className="h-8 w-16 shrink-0 rounded-md border border-[#E4E7EC] px-2 text-[11px] outline-none focus:border-[#DC2626]"
                                    />
                                    <select
                                        value={t.unit}
                                        onChange={e => updateTaskRow(idx, { unit: e.target.value })}
                                        className="h-8 w-[80px] shrink-0 appearance-none rounded-md border border-[#E4E7EC] px-2 text-[11px] outline-none focus:border-[#DC2626] cursor-pointer"
                                    >
                                        {TASK_UNITS.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => removeTaskRow(idx)}
                                        className="shrink-0 p-1 rounded text-[#98A2B3] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                            <Button type="button" variant="secondary" size="sm" onClick={addTaskRow}>
                                <Plus className="h-3.5 w-3.5" /> Add task row
                            </Button>
                        </fieldset>

                        {/* Quality + extras */}
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                ['rewash_count', 'Rewash', 1],
                                ['damaged_items', 'Damaged', 1],
                                ['complaints', 'Complaints', 1],
                            ] as const).map(([key, label]) => (
                                <label key={key} className="block space-y-0.5">
                                    <span className="block text-[10px] font-medium uppercase tracking-wide text-[#667085]">
                                        {label}
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form[key]}
                                        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                                        className="h-8 w-full rounded-md border border-[#E4E7EC] px-2 text-[12px] outline-none focus:border-[#DC2626]"
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Machines used</span>
                                <input
                                    value={form.machines_used}
                                    onChange={e => setForm(f => ({ ...f, machines_used: e.target.value }))}
                                    placeholder="Washer #2, Steam press A…"
                                    className="h-9 w-full rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626]"
                                />
                            </label>
                            <label className="block space-y-1">
                                <span className="text-[12px] font-medium text-[#344054]">Performance rating</span>
                                <select
                                    value={form.performance_rating}
                                    onChange={e => setForm(f => ({ ...f, performance_rating: e.target.value }))}
                                    className="h-9 w-full appearance-none rounded-lg border border-[#E4E7EC] px-3 text-[13px] outline-none focus:border-[#DC2626] cursor-pointer"
                                >
                                    <option value="">—</option>
                                    {[5, 4, 3, 2, 1].map(r => (
                                        <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label className="block space-y-1">
                            <span className="text-[12px] font-medium text-[#344054]">Notes</span>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                placeholder="Anything else worth recording about this worker's day…"
                                className="w-full rounded-lg border border-[#E4E7EC] px-3 py-2 text-[13px] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/10 resize-none"
                            />
                        </label>
                    </DialogBody>
                    <DialogFooter>
                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={!form.worker_name || busy}
                                onClick={submit}
                            >
                                {editing ? 'Save Changes' : 'Save Daily Log'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cross-link */}
            <p className="text-[12px] text-[#98A2B3]">
                Manage who works here on the{' '}
                <Link to="/workers" className="font-medium text-[#DC2626] hover:underline">
                    Laundry Workers
                </Link>{' '}
                page.
            </p>
        </div>
    )
}
