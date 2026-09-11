import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi, advancesApi } from '../api/management-api'
import { toast } from 'sonner'
import { Plus, X, Trash2 } from 'lucide-react'

export default function AdvancesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [empFilter, setEmpFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('OUTSTANDING')

  const { data: employees = [] } = useQuery({
    queryKey: ['mgmt-employees'],
    queryFn: () => employeesApi.list('').then(r => r.data),
  })

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ['advances', empFilter, statusFilter],
    queryFn: () => advancesApi.list({
      employee_id: empFilter || undefined,
      status: statusFilter || undefined,
    }).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => advancesApi.create(data),
    onSuccess: () => {
      toast.success('Advance recorded')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['advances'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => advancesApi.cancel(id),
    onSuccess: () => {
      toast.success('Advance cancelled')
      qc.invalidateQueries({ queryKey: ['advances'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const totalOutstanding = advances
    .filter((a: any) => a.status === 'OUTSTANDING')
    .reduce((sum: number, a: any) => sum + (a.outstanding || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Salary Advances</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          <Plus size={16} /> Record Advance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Outstanding</div>
          <div className="text-2xl font-bold text-red-600">Rs. {totalOutstanding.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Records Shown</div>
          <div className="text-2xl font-bold">{advances.length}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
            <select
              value={empFilter}
              onChange={e => setEmpFilter(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Employees</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All</option>
              <option value="OUTSTANDING">Outstanding</option>
              <option value="FULLY_DEDUCTED">Fully Deducted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-700/50">
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Employee</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-right px-4 py-3 font-medium">Deducted</th>
              <th className="text-right px-4 py-3 font-medium">Outstanding</th>
              <th className="text-left px-4 py-3 font-medium">Reason</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : advances.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No advances found</td></tr>
            ) : (
              advances.map((adv: any) => {
                const emp = employees.find((e: any) => e.id === adv.employee_id)
                return (
                  <tr key={adv.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">{adv.date}</td>
                    <td className="px-4 py-3">{emp?.name || adv.employee_id}</td>
                    <td className="px-4 py-3 text-right">Rs. {adv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">Rs. {adv.total_deducted.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">Rs. {adv.outstanding.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{adv.reason || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        adv.status === 'OUTSTANDING' ? 'bg-yellow-100 text-yellow-800' :
                        adv.status === 'FULLY_DEDUCTED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {adv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {adv.status === 'OUTSTANDING' && (
                        <button
                          onClick={() => {
                            if (confirm('Cancel this advance?')) cancelMut.mutate(adv.id)
                          }}
                          className="p-1.5 hover:bg-red-100 text-red-500 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Record Advance</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              createMut.mutate({
                employee_id: fd.get('employee_id'),
                amount: parseFloat(fd.get('amount') as string) || 0,
                date: fd.get('date'),
                reason: fd.get('reason'),
              })
            }} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Employee *</label>
                <select name="employee_id" required className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Employee</option>
                  {employees.filter((e: any) => e.is_active).map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Amount (Rs.) *</label>
                  <input name="amount" type="number" step="0.01" min="0.01" required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date *</label>
                  <input name="date" type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Reason</label>
                <input name="reason" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Reason for advance" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {createMut.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
