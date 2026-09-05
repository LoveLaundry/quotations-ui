import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi, customersApi } from '../api/management-api'
import { toast } from 'sonner'
import { Plus, Trash2, X, CreditCard } from 'lucide-react'

const METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'ONLINE']

export default function ManagementPayments() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [customerId, setCustomerId] = useState('')

  const { data: customers = [] } = useQuery({
    queryKey: ['mgmt-customers-list'],
    queryFn: () => customersApi.list().then(r => r.data),
  })

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['mgmt-payments', customerId],
    queryFn: () => paymentsApi.list({ customer_id: customerId }).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => paymentsApi.create(data),
    onSuccess: () => { toast.success('Payment recorded'); qc.invalidateQueries({ queryKey: ['mgmt-payments'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => { toast.success('Payment deleted'); qc.invalidateQueries({ queryKey: ['mgmt-payments'] }) },
  })

  const totalPaid = payments.reduce((s: number, p: any) => s + p.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div className="flex gap-3 items-end">
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Customers</option>
          {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-xl font-bold">Rs. {totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2.5 text-left">Date</th>
              <th className="px-3 py-2.5 text-left">Customer</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5 text-left">Method</th>
              <th className="px-3 py-2.5 text-left">Reference</th>
              <th className="px-3 py-2.5 text-left">Notes</th>
              <th className="px-3 py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2">{p.payment_date}</td>
                <td className="px-3 py-2 font-medium">{p.customer_name}</td>
                <td className="px-3 py-2 text-right font-medium text-green-600">Rs. {p.amount.toLocaleString()}</td>
                <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{p.payment_method}</span></td>
                <td className="px-3 py-2 text-gray-400">{p.reference}</td>
                <td className="px-3 py-2 text-gray-400">{p.notes}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => { if (confirm('Delete this payment?')) deleteMut.mutate(p.id) }} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No payments recorded</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const data = Object.fromEntries(fd)
              data.amount = parseFloat(data.amount as string) || 0
              createMut.mutate(data)
            }} className="space-y-3">
              <select name="customer_id" required className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select Customer *</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="amount" type="number" step="0.01" placeholder="Amount *" required className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select name="payment_method" className="px-3 py-2 border rounded-lg text-sm">
                  {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
                <input name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input name="reference" placeholder="Reference" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea name="notes" placeholder="Notes" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
