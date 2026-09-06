import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../api/management-api'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Eye, Phone, Mail, MapPin } from 'lucide-react'

const TYPES = ['HOTEL', 'SHOP', 'INDIVIDUAL', 'RESTAURANT']
const BILLING = ['PER_ITEM', 'PER_KG', 'FIXED_MONTHLY']
const PAYMENT_TERMS = ['NET_15', 'NET_30', 'NET_60', 'CASH_ON_DELIVERY', 'PREPAID']

export default function ManagementCustomers() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [_viewCustomer, setViewCustomer] = useState<any>(null)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['mgmt-customers', search],
    queryFn: () => customersApi.list(search).then(r => r.data),
  })

  const { data: summaries = [] } = useQuery({
    queryKey: ['mgmt-customer-summary'],
    queryFn: () => customersApi.summary().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => customersApi.create(data),
    onSuccess: () => { toast.success('Customer created'); qc.invalidateQueries({ queryKey: ['mgmt-customers'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => customersApi.update(id, data),
    onSuccess: () => { toast.success('Customer updated'); qc.invalidateQueries({ queryKey: ['mgmt-customers'] }); setEditing(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => { toast.success('Customer deactivated'); qc.invalidateQueries({ queryKey: ['mgmt-customers'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Customers / Hotels / Shops</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
        className="w-full md:w-80 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-red-500" />

      {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c: any) => {
            const sum = summaries.find((s: any) => s.id === c.id) || {}
            return (
              <div key={c.id} className={`bg-white dark:bg-gray-800 rounded-xl border p-5 space-y-3 ${!c.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{c.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{c.customer_type}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setViewCustomer(c)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Eye size={14} /></button>
                    <button onClick={() => { setEditing(c); setShowForm(true) }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Pencil size={14} /></button>
                    <button onClick={() => deleteMut.mutate(c.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-500">
                  {c.phone && <p className="flex items-center gap-1"><Phone size={12} /> {c.phone}</p>}
                  {c.email && <p className="flex items-center gap-1"><Mail size={12} /> {c.email}</p>}
                  {c.address && <p className="flex items-center gap-1"><MapPin size={12} /> {c.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <p className="text-gray-400">Transactions</p>
                    <p className="font-medium">{sum.total_transactions || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Revenue</p>
                    <p className="font-medium">Rs. {(sum.total_revenue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Items</p>
                    <p className="font-medium">{(sum.total_items || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Outstanding</p>
                    <p className="font-medium text-red-600">Rs. {(sum.outstanding_payments || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }}><X size={20} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const data = Object.fromEntries(fd)
              if (editing) updateMut.mutate({ id: editing.id, data })
              else createMut.mutate(data)
            }} className="space-y-3">
              <input name="name" defaultValue={editing?.name} placeholder="Customer Name *" required className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select name="customer_type" defaultValue={editing?.customer_type || 'HOTEL'} className="px-3 py-2 border rounded-lg text-sm">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select name="billing_method" defaultValue={editing?.billing_method || 'PER_ITEM'} className="px-3 py-2 border rounded-lg text-sm">
                  {BILLING.map(b => <option key={b} value={b}>{b.replace('_', ' ')}</option>)}
                </select>
              </div>
              <input name="contact_person" defaultValue={editing?.contact_person} placeholder="Contact Person" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="phone" defaultValue={editing?.phone} placeholder="Phone" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input name="email" defaultValue={editing?.email} placeholder="Email" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input name="address" defaultValue={editing?.address} placeholder="Address" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select name="payment_terms" defaultValue={editing?.payment_terms || 'NET_30'} className="w-full px-3 py-2 border rounded-lg text-sm">
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <textarea name="notes" defaultValue={editing?.notes} placeholder="Notes" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
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
