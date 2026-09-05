import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '../api/management-api'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, DollarSign } from 'lucide-react'

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'ONLINE']

export default function ManagementExpenses() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['mgmt-expense-cats'],
    queryFn: () => expensesApi.categories().then(r => r.data),
  })

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['mgmt-expenses', startDate, endDate, catFilter],
    queryFn: () => expensesApi.list({ start_date: startDate, end_date: endDate, category_id: catFilter }).then(r => r.data),
  })

  const { data: summary = [] } = useQuery({
    queryKey: ['mgmt-expense-summary', startDate, endDate],
    queryFn: () => expensesApi.summary({ start_date: startDate, end_date: endDate }).then(r => r.data),
  })

  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0)

  const createMut = useMutation({
    mutationFn: (data: any) => expensesApi.create(data),
    onSuccess: () => { toast.success('Expense added'); qc.invalidateQueries({ queryKey: ['mgmt-expenses'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => expensesApi.update(id, data),
    onSuccess: () => { toast.success('Expense updated'); qc.invalidateQueries({ queryKey: ['mgmt-expenses'] }); setEditing(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => { toast.success('Expense deleted'); qc.invalidateQueries({ queryKey: ['mgmt-expenses'] }) },
  })

  const createCatMut = useMutation({
    mutationFn: (data: any) => expensesApi.createCategory(data),
    onSuccess: () => { toast.success('Category created'); qc.invalidateQueries({ queryKey: ['mgmt-expense-cats'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Expense Management</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Categories</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
        {summary.slice(0, 3).map((s: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-sm text-gray-500">{s.category}</p>
            <p className="text-xl font-bold">Rs. {s.total.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{s.count} entries</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2.5 text-left">Date</th>
              <th className="px-3 py-2.5 text-left">Category</th>
              <th className="px-3 py-2.5 text-left">Description</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5 text-left">Payment</th>
              <th className="px-3 py-2.5 text-left">Reference</th>
              <th className="px-3 py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e: any) => (
              <tr key={e.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2">{e.date}</td>
                <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">{e.category_name}</span></td>
                <td className="px-3 py-2">{e.description}</td>
                <td className="px-3 py-2 text-right font-medium">Rs. {e.amount.toLocaleString()}</td>
                <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{e.payment_method}</span></td>
                <td className="px-3 py-2 text-gray-400">{e.reference}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => { setEditing(e); setShowForm(true) }} className="p-1 hover:bg-gray-100 rounded"><Pencil size={14} /></button>
                  <button onClick={() => deleteMut.mutate(e.id)} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No expenses found</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} Expense</h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const data = Object.fromEntries(fd)
              data.amount = parseFloat(data.amount as string) || 0
              if (editing) updateMut.mutate({ id: editing.id, data })
              else createMut.mutate(data)
            }} className="space-y-3">
              <input name="date" type="date" defaultValue={editing?.date || new Date().toISOString().split('T')[0]} required className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select name="category_id" defaultValue={editing?.category_id || ''} required className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select Category *</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="amount" type="number" step="0.01" defaultValue={editing?.amount} placeholder="Amount *" required className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input name="description" defaultValue={editing?.description} placeholder="Description" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select name="payment_method" defaultValue={editing?.payment_method || 'CASH'} className="px-3 py-2 border rounded-lg text-sm">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
                <input name="reference" defaultValue={editing?.reference} placeholder="Reference" className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <textarea name="notes" defaultValue={editing?.notes} placeholder="Notes" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
