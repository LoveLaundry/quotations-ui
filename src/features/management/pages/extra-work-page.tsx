import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extraWorkApi } from '../api/management-api'
import { toast } from 'sonner'
import { Plus, X, Pencil, Power } from 'lucide-react'

export default function ExtraWorkPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['extra-work-categories'],
    queryFn: () => extraWorkApi.categories().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => extraWorkApi.createCategory(data),
    onSuccess: () => {
      toast.success('Category created')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['extra-work-categories'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => extraWorkApi.updateCategory(id, data),
    onSuccess: () => {
      toast.success('Category updated')
      setShowForm(false)
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['extra-work-categories'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => extraWorkApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deactivated')
      qc.invalidateQueries({ queryKey: ['extra-work-categories'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const METHODS = ['FIXED', 'PER_UNIT', 'PER_HOUR', 'PER_DAY']
  const UNITS = ['DAY', 'HOUR', 'UNIT', 'TASK']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Extra Work Categories</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-700/50">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-right px-4 py-3 font-medium">Rate (Rs.)</th>
              <th className="text-left px-4 py-3 font-medium">Method</th>
              <th className="text-left px-4 py-3 font-medium">Unit</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No categories defined</td></tr>
            ) : (
              categories.map((cat: any) => (
                <tr key={cat.id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!cat.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.description || '—'}</td>
                  <td className="px-4 py-3 text-right">Rs. {cat.rate.toLocaleString()}</td>
                  <td className="px-4 py-3">{cat.calculation_method}</td>
                  <td className="px-4 py-3">{cat.unit}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditing(cat); setShowForm(true) }}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      {cat.is_active && (
                        <button
                          onClick={() => {
                            if (confirm('Deactivate this category?'))
                              deactivateMut.mutate(cat.id)
                          }}
                          className="p-1.5 hover:bg-red-100 text-red-500 rounded"
                        >
                          <Power size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} Category</h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const data = {
                name: fd.get('name'),
                description: fd.get('description'),
                rate: parseFloat(fd.get('rate') as string) || 0,
                calculation_method: fd.get('calculation_method'),
                unit: fd.get('unit'),
                is_active: true,
              }
              if (editing) updateMut.mutate({ id: editing.id, data })
              else createMut.mutate(data)
            }} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Name *</label>
                <input name="name" defaultValue={editing?.name} required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Overtime, Special Task" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <input name="description" defaultValue={editing?.description} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Rate (Rs.) *</label>
                <input name="rate" type="number" step="0.01" min="0" defaultValue={editing?.rate} required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Calculation Method</label>
                  <select name="calculation_method" defaultValue={editing?.calculation_method || 'FIXED'} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Unit</label>
                  <select name="unit" defaultValue={editing?.unit || 'DAY'} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
