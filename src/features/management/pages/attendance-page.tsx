import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi, attendanceApi } from '../api/management-api'
import { toast } from 'sonner'
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react'

const STATUSES = ['PRESENT', 'HALF_DAY', 'ON_LEAVE', 'ABSENT'] as const
const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Present',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
  ABSENT: 'Absent',
}
const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  HALF_DAY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ON_LEAVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function monthRange(year: number, month: number) {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const days: string[] = []
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10))
  }
  return { days, firstDow: first.getDay(), numDays: last.getDate() }
}

export default function AttendancePage() {
  const qc = useQueryClient()
  const now = new Date()
  const [selectedEmp, setSelectedEmp] = useState('')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [pickedDates, setPickedDates] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<string>('PRESENT')
  const [bulkOt, setBulkOt] = useState(0)

  const { data: employees = [] } = useQuery({
    queryKey: ['mgmt-employees'],
    queryFn: () => employeesApi.list('').then(r => r.data),
  })

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', selectedEmp, year, month],
    queryFn: () => attendanceApi.list(selectedEmp, {
      start_date: `${year}-${String(month).padStart(2, '0')}-01`,
      end_date: `${year}-${String(month).padStart(2, '0')}-31`,
    }).then(r => r.data),
    enabled: !!selectedEmp,
  })

  const { days, firstDow } = useMemo(() => monthRange(year, month), [year, month])

  const byDate = useMemo(() => {
    const map: Record<string, any> = {}
    for (const rec of attendance) map[rec.date || rec.day] = rec
    return map
  }, [attendance])

  const createMut = useMutation({
    mutationFn: (data: any) => attendanceApi.create(selectedEmp, data),
    onSuccess: () => {
      toast.success('Attendance saved')
      qc.invalidateQueries({ queryKey: ['attendance', selectedEmp] })
      qc.invalidateQueries({ queryKey: ['mgmt-attendance'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to save attendance'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => attendanceApi.update(id, data),
    onSuccess: () => {
      toast.success('Attendance updated')
      qc.invalidateQueries({ queryKey: ['attendance', selectedEmp] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to update attendance'),
  })

  const bulkMut = useMutation({
    mutationFn: () => attendanceApi.bulkSet(selectedEmp, Array.from(pickedDates), bulkStatus, bulkOt || undefined),
    onSuccess: () => {
      toast.success(`${pickedDates.size} record(s) saved as ${bulkStatus}`)
      setPickedDates(new Set())
      qc.invalidateQueries({ queryKey: ['attendance', selectedEmp] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Bulk save failed'),
  })

  const togglePick = (d: string) => {
    setPickedDates(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const cycleStatus = (day: string, rec: any) => {
    if (!rec) {
      createMut.mutate({ employee_id: selectedEmp, date: day, status: 'PRESENT' })
      return
    }
    const idx = STATUSES.indexOf(rec.status) === -1 ? 0 : STATUSES.indexOf(rec.status)
    updateMut.mutate({ id: rec.id, data: { status: STATUSES[(idx + 1) % STATUSES.length] } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance Entry</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays size={20} /> Monthly Attendance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
            <select
              value={selectedEmp}
              onChange={e => { setSelectedEmp(e.target.value); setPickedDates(new Set()) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Select Employee</option>
              {employees.filter((e: any) => e.is_active).map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.salary_type || 'MONTHLY'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => { setYear(Number(e.target.value)); setPickedDates(new Set()) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Month</label>
            <select
              value={month}
              onChange={e => { setMonth(Number(e.target.value)); setPickedDates(new Set()) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 min-w-[560px]">
            {DAY_NAMES.map(dn => (
              <div key={dn} className="bg-gray-50 dark:bg-gray-800 px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                {dn}
              </div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`blank-${i}`} className="bg-white dark:bg-gray-800 min-h-20" />
            ))}
            {days.map((d: string) => {
              const rec = byDate[d]
              const dow = new Date(d).getDay()
              const picked = pickedDates.has(d)
              return (
                <div
                  key={d}
                  onClick={() => togglePick(d)}
                  className={`bg-white dark:bg-gray-800 min-h-20 p-1.5 cursor-pointer flex flex-col gap-1 ${dow === 0 || dow === 6 ? 'opacity-90' : ''} ${picked ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{Number(d.slice(8))}</span>
                    {rec ? (
                      <button
                        onClick={e => { e.stopPropagation(); cycleStatus(d, rec) }}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[rec.status] || STATUS_STYLE.ABSENT}`}
                        title={rec.status}
                      >
                        {STATUS_LABEL[rec.status] || rec.status}
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </div>
                  {rec?.overtime_hours > 0 && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400">OT {rec.overtime_hours}h</span>
                  )}
                  {picked && (
                    <span className="text-[10px] text-indigo-600 flex items-center gap-1"><Check size={10} /> Selected</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {isLoading && <p className="text-sm text-gray-500">Loading attendance...</p>}

        <div className="flex flex-wrap items-end gap-3 border-t pt-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bulk status</label>
            <div className="relative">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="w-40 mt-1 px-3 py-2 border rounded-lg text-sm appearance-none pr-8"
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Overtime hrs</label>
            <input
              type="number"
              value={bulkOt}
              onChange={e => setBulkOt(Number(e.target.value) || 0)}
              className="w-24 mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={() => bulkMut.mutate()}
            disabled={!selectedEmp || pickedDates.size === 0 || bulkMut.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
          >
            Apply to {pickedDates.size} selected day(s)
          </button>
          {pickedDates.size > 0 && (
            <button
              onClick={() => setPickedDates(new Set())}
              className="px-3 py-2 border rounded-lg text-sm text-gray-500"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span>Click a day to select it for bulk apply. Click a status chip to cycle Present → Half Day → On Leave → Absent.</span>
        </div>
      </div>
    </div>
  )
}