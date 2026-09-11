import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../api/management-api'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, DollarSign, UserCheck, Filter } from 'lucide-react'

const DEPARTMENTS = ['WASHING', 'PRESSING', 'FINISHING', 'PACKING', 'DRY_CLEANING', 'DELIVERY', 'GENERAL']
const SALARY_TYPES = ['MONTHLY', 'WEEKLY', 'DAILY']
const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'INACTIVE', label: 'Inactive' },
] as const

export default function ManagementEmployees() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showSalary, setShowSalary] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const { data: employees = [], isLoading: _isLoading } = useQuery({
    queryKey: ['mgmt-employees', search],
    queryFn: () => employeesApi.list(search).then(r => r.data),
  })

  const filtered = statusFilter === 'ALL'
    ? employees
    : employees.filter((e: any) => (statusFilter === 'ACTIVE' ? e.is_active !== false : e.is_active === false))

  const createMut = useMutation({
    mutationFn: (data: any) => employeesApi.create(data),
    onSuccess: () => { toast.success('Employee added'); qc.invalidateQueries({ queryKey: ['mgmt-employees'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => employeesApi.update(id, data),
    onSuccess: () => { toast.success('Employee updated'); qc.invalidateQueries({ queryKey: ['mgmt-employees'] }); setEditing(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: () => { toast.success('Employee deactivated'); qc.invalidateQueries({ queryKey: ['mgmt-employees'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const activateMut = useMutation({
    mutationFn: (id: string) => employeesApi.activate(id),
    onSuccess: () => { toast.success('Employee activated'); qc.invalidateQueries({ queryKey: ['mgmt-employees'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const createSalaryMut = useMutation({
    mutationFn: ({ empId, data }: any) => employeesApi.createSalary(empId, data),
    onSuccess: () => { toast.success('Salary recorded'); setShowSalary(null); qc.invalidateQueries({ queryKey: ['mgmt-employees'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Employees & Salaries</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
          className="flex-1 md:w-80 px-3 py-2 border rounded-lg text-sm" />
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Filter size={14} className="ml-1 text-gray-400" />
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === f.key ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emp: any) => {
          const isActive = emp.is_active !== false
          const hasLeft = !!emp.leaving_date
          return (
            <div key={emp.id} className={`bg-white dark:bg-gray-800 rounded-xl border p-5 space-y-3 ${!isActive ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{emp.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{emp.employee_code ? `#${emp.employee_code}` : ''} {emp.position || emp.department}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(emp)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Edit"><Pencil size={14} /></button>
                  {isActive ? (
                    <button
                      onClick={() => { if (confirm(`Deactivate ${emp.name}?`)) deactivateMut.mutate(emp.id) }}
                      className="p-1.5 hover:bg-red-100 text-red-500 rounded" title="Deactivate"><Trash2 size={14} /></button>
                  ) : (
                    <button
                      onClick={() => activateMut.mutate(emp.id)}
                      className="p-1.5 hover:bg-green-100 text-green-600 rounded" title="Activate"><UserCheck size={14} /></button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">Basic Salary</p>
                  <p className="font-medium">Rs. {emp.basic_salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Daily Rate</p>
                  <p className="font-medium">Rs. {emp.daily_rate.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Department</p>
                  <p className="font-medium">{emp.department}</p>
                </div>
                <div>
                  <p className="text-gray-400">Salary Type</p>
                  <p className="font-medium">{emp.salary_type || 'MONTHLY'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Phone</p>
                  <p className="font-medium">{emp.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Joined</p>
                  <p className="font-medium">{emp.joined_date || '—'}</p>
                </div>
                {hasLeft && (
                  <div className="col-span-2">
                    <p className="text-gray-400">Leaving Date</p>
                    <p className="font-medium text-red-500">{emp.leaving_date}</p>
                  </div>
                )}
              </div>

              <button onClick={() => setShowSalary(emp)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100">
                <DollarSign size={14} /> Record Salary
              </button>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400 col-span-full">No employees found.</div>
      )}

      {/* Add/Edit Employee */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} Employee</h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const data: any = Object.fromEntries(fd)
              data.basic_salary = String(parseFloat(data.basic_salary as string) || 0)
              data.daily_rate = String(parseFloat(data.daily_rate as string) || 0)
              data.allowance = String(parseFloat(data.allowance as string) || 0)
              data.epf_rate = String(parseFloat(data.epf_rate as string) || 0)
              data.etf_rate = String(parseFloat(data.etf_rate as string) || 0)
              ;['position', 'phone', 'nic', 'joined_date', 'leaving_date', 'notes'].forEach(k => {
                if (!data[k]) delete data[k]
              })
              if (!data.salary_type) data.salary_type = 'MONTHLY'
              if (!data.allowance_type) data.allowance_type = 'FIXED'
              if (!data.epf_base) data.epf_base = 'ADJUSTED'
              if (editing) {
                const fd2 = new FormData(e.currentTarget)
                data.is_active = fd2.get('is_active') === 'on'
                updateMut.mutate({ id: editing.id, data })
              }
              else createMut.mutate(data)
            }} className="space-y-3">
              <input name="name" defaultValue={editing?.name} placeholder="Full Name *" required className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="position" defaultValue={editing?.position} placeholder="Position" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <select name="department" defaultValue={editing?.department || 'GENERAL'} className="px-3 py-2 border rounded-lg text-sm">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Salary Type</label>
                <select name="salary_type" defaultValue={editing?.salary_type || 'MONTHLY'} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {SALARY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="phone" defaultValue={editing?.phone} placeholder="Phone" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input name="nic" defaultValue={editing?.nic} placeholder="NIC" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Basic Salary (Rs.)</label>
                  <input name="basic_salary" type="number" step="0.01" defaultValue={editing?.basic_salary} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Daily Rate (Rs.)</label>
                  <input name="daily_rate" type="number" step="0.01" defaultValue={editing?.daily_rate} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Allowance (Rs.)</label>
                  <input name="allowance" type="number" step="0.01" defaultValue={editing?.allowance} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Allowance Type</label>
                  <select name="allowance_type" defaultValue={editing?.allowance_type || 'FIXED'} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="FIXED">Fixed (full amount every period)</option>
                    <option value="DAYS">Days worked (adjusted)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">EPF Rate %</label>
                  <input name="epf_rate" type="number" step="0.01" defaultValue={editing?.epf_rate} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">ETF Rate %</label>
                  <input name="etf_rate" type="number" step="0.01" defaultValue={editing?.etf_rate} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">EPF Base</label>
                <select name="epf_base" defaultValue={editing?.epf_base || 'ADJUSTED'} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="ADJUSTED">Adjusted base (period, after absences/leaves)</option>
                  <option value="FULL">Full base (basic salary, always)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Joined Date</label>
                  <input name="joined_date" type="date" defaultValue={editing?.joined_date} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Leaving Date (set when employee leaves)</label>
                  <input name="leaving_date" type="date" defaultValue={editing?.leaving_date} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm">
                  <input name="is_active" type="checkbox" defaultChecked={editing.is_active !== false} className="rounded" />
                  Employee is active
                </label>
              )}
              <textarea name="notes" defaultValue={editing?.notes} placeholder="Notes" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Salary Modal */}
      {showSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Record Salary - {showSalary.name}</h2>
              <button onClick={() => setShowSalary(null)}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const data = Object.fromEntries(fd)
              data.basic_salary = String(parseFloat(data.basic_salary as string) || 0)
              data.overtime_hours = String(parseFloat(data.overtime_hours as string) || 0)
              data.overtime_rate = String(parseFloat(data.overtime_rate as string) || 0)
              data.allowances = String(parseFloat(data.allowances as string) || 0)
              data.epf_deduction = String(parseFloat(data.epf_deduction as string) || 0)
              data.etf_deduction = String(parseFloat(data.etf_deduction as string) || 0)
              data.loan_deduction = String(parseFloat(data.loan_deduction as string) || 0)
              data.advance_deduction = String(parseFloat(data.advance_deduction as string) || 0)
              data.amount_paid = String(parseFloat(data.amount_paid as string) || 0)
              createSalaryMut.mutate({ empId: showSalary.id, data })
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Month</label>
                  <select name="month" className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', {month:'long'})}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Year</label>
                  <input name="year" type="number" defaultValue={new Date().getFullYear()} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Basic Salary</label>
                <input name="basic_salary" type="number" step="0.01" defaultValue={showSalary.basic_salary} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">OT Hours</label>
                  <input name="overtime_hours" type="number" step="0.5" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">OT Rate (Rs./hr)</label>
                  <input name="overtime_rate" type="number" step="0.01" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Allowances (Rs.)</label>
                <input name="allowances" type="number" step="0.01" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">EPF Deduction</label>
                  <input name="epf_deduction" type="number" step="0.01" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">ETF Deduction</label>
                  <input name="etf_deduction" type="number" step="0.01" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Loan Deduction</label>
                  <input name="loan_deduction" type="number" step="0.01" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Advance Deduction</label>
                  <input name="advance_deduction" type="number" step="0.01" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Amount Paid</label>
                  <input name="amount_paid" type="number" step="0.01" defaultValue={0} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Payment Date</label>
                  <input name="payment_date" type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <textarea name="notes" placeholder="Notes" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSalary(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Save Salary</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
