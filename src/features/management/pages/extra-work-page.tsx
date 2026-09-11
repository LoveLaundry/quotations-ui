import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extraWorkApi, employeesApi } from '../api/management-api'
import { toast } from 'sonner'
import { Plus, X, Trash2, Tag, Zap } from 'lucide-react'

export default function ExtraWorkPage() {
  const qc = useQueryClient()
  const [showCatForm, setShowCatForm] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)

  const { data: employees = [] } = useQuery({
    queryKey: ['mgmt-employees'],
    queryFn: () => employeesApi.list('').then(r => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['extra-work-categories'],
    queryFn: () => extraWorkApi.categories({ is_active: true }).then(r => r.data),
  })

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['extra-work-records'],
    queryFn: () => extraWorkApi.records().then(r => r.data),
  })

  const createCat = useMutation({
    mutationFn: (data: any) => extraWorkApi.createCategory(data),
    onSuccess: () => { toast.success('Category created'); setShowCatForm(false); qc.invalidateQueries({ queryKey: ['extra-work-categories'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteCat = useMutation({
    mutationFn: (id: string) => extraWorkApi.deleteCategory(id),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['extra-work-categories'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const createRec = useMutation({
    mutationFn: (data: any) => extraWorkApi.createRecord(data),
    onSuccess: () => { toast.success('Record added'); setShowRecordForm(false); qc.invalidateQueries({ queryKey: ['extra-work-records'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteRec = useMutation({
    mutationFn: (id: string) => extraWorkApi.deleteRecord(id),
    onSuccess: () => { toast.success('Record deleted'); qc.invalidateQueries({ queryKey: ['extra-work-records'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const empName = (id: string) => (employees.find((e: any) => e.id === id) as any)?.name || id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Extra Work</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRecordForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <Zap size={16} /> Add Record
          </button>
          <button
            onClick={() => setShowCatForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            <Plus size={16} /> Category
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Tag size={18} /> Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 && <p className="text-sm text-gray-400">No active categories defined.</p>}
          {categories.map((c: any) => (
            <span key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
              {c.name}
              <span className="text-xs text-gray-500">Rs. {Number(c.rate || 0).toLocaleString()}/unit</span>
              {c.units_label && <span className="text-xs text-gray-400">({c.units_label})</span>}
              <button onClick={() => { if (confirm(`Delete category "${c.name}"?`)) deleteCat.mutate(c.id) }} className="text-red-500 hover:text-red-700">
                <Trash2 size={13} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Employee</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4 text-right">Units</th>
                <th className="pb-2 pr-4 text-right">Rate</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No extra work records.</td></tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{empName(r.employee_id)}</td>
                    <td className="py-2 pr-4">{r.date}</td>
                    <td className="py-2 pr-4">{r.category_name || r.category_id}</td>
                    <td className="py-2 pr-4 text-right">{r.units}</td>
                    <td className="py-2 pr-4 text-right">Rs. {Number(r.rate || 0).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right font-medium">Rs. {Number(r.amount || 0).toLocaleString()}</td>
                    <td className="py-2">
                      <button onClick={() => { if (confirm('Delete this record?')) deleteRec.mutate(r.id) }} className="text-red-500 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">New Category</h2>
              <button onClick={() => setShowCatForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              createCat.mutate({
                name: fd.get('name'),
                rate: Number(fd.get('rate')) || 0,
                description: fd.get('description'),
                units_label: fd.get('units_label'),
              })
            }} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Name *</label>
                <input name="name" required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Ironing" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Rate per unit (Rs.) *</label>
                <input name="rate" type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Unit label</label>
                <input name="units_label" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. hours, pieces" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <input name="description" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCatForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={createCat.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {createCat.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecordForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add Extra Work Record</h2>
              <button onClick={() => setShowRecordForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const cat = categories.find((c: any) => c.id === fd.get('category_id'))
              const units = Number(fd.get('units')) || 0
              createRec.mutate({
                employee_id: fd.get('employee_id'),
                date: fd.get('date'),
                category_id: fd.get('category_id'),
                units,
                rate: Number(fd.get('rate')) || Number(cat?.rate || 0),
                amount: units * (Number(fd.get('rate')) || Number(cat?.rate || 0)),
                description: fd.get('description'),
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
              <div>
                <label className="text-xs text-gray-500">Date *</label>
                <input name="date" type="date" required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Category *</label>
                <select name="category_id" required className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} — Rs. {Number(c.rate || 0).toLocaleString()}/unit</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Units *</label>
                  <input name="units" type="number" step="0.1" min="0" required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Rate (Rs.) *</label>
                  <input name="rate" type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <input name="description" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRecordForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={createRec.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {createRec.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}