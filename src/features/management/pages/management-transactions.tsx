import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi, customersApi } from '../api/management-api'
import { toast } from 'sonner'
import { Eye, Trash2, X, Search } from 'lucide-react'

export default function ManagementTransactions() {
  const qc = useQueryClient()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [search, setSearch] = useState('')
  const [viewTxn, setViewTxn] = useState<any>(null)

  const { data: customers = [] } = useQuery({
    queryKey: ['mgmt-customers-list'],
    queryFn: () => customersApi.list().then(r => r.data),
  })

  const { data: transactions = [], isLoading: _isLoading } = useQuery({
    queryKey: ['mgmt-transactions', startDate, endDate, customerId, search],
    queryFn: () => transactionsApi.list({ start_date: startDate, end_date: endDate, customer_id: customerId, search, limit: 200 }).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => { toast.success('Transaction deleted'); qc.invalidateQueries({ queryKey: ['mgmt-transactions'] }) },
  })

  const totalAmount = transactions.reduce((s: number, t: any) => s + t.total_amount, 0)
  const totalProfit = transactions.reduce((s: number, t: any) => s + t.total_profit, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Transactions</h1>

      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Customers</option>
          {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-xl font-bold">{transactions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-xl font-bold">Rs. {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Profit</p>
          <p className="text-xl font-bold text-green-600">Rs. {totalProfit.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-3 py-2.5 text-left">Date</th>
              <th className="px-3 py-2.5 text-left">Customer</th>
              <th className="px-3 py-2.5 text-left">Invoice</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5 text-right">Cost</th>
              <th className="px-3 py-2.5 text-right">Profit</th>
              <th className="px-3 py-2.5 text-center">Source</th>
              <th className="px-3 py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t: any) => (
              <tr key={t.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2">{t.transaction_date}</td>
                <td className="px-3 py-2 font-medium">{t.customer_name}</td>
                <td className="px-3 py-2 text-gray-500">{t.invoice_number || '—'}</td>
                <td className="px-3 py-2 text-right">{t.total_quantity}</td>
                <td className="px-3 py-2 text-right">Rs. {t.total_amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">Rs. {t.total_cost.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-green-600">Rs. {t.total_profit.toLocaleString()}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.source === 'IMPORT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {t.source}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => setViewTxn(t)} className="p-1 hover:bg-gray-100 rounded"><Eye size={14} /></button>
                  <button onClick={() => { if (confirm('Delete this transaction?')) deleteMut.mutate(t.id) }} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No transactions found</td></tr>}
          </tbody>
        </table>
      </div>

      {viewTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Transaction Details</h2>
              <button onClick={() => setViewTxn(null)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><p className="text-gray-500">Date</p><p className="font-medium">{viewTxn.transaction_date}</p></div>
              <div><p className="text-gray-500">Customer</p><p className="font-medium">{viewTxn.customer_name}</p></div>
              <div><p className="text-gray-500">Invoice</p><p className="font-medium">{viewTxn.invoice_number || '—'}</p></div>
              <div><p className="text-gray-500">Source</p><p className="font-medium">{viewTxn.source}</p></div>
            </div>
            <table className="w-full text-sm mb-4">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-1.5 text-left">Item</th>
                  <th className="px-2 py-1.5 text-left">Category</th>
                  <th className="px-2 py-1.5 text-right">Recv</th>
                  <th className="px-2 py-1.5 text-right">Washed</th>
                  <th className="px-2 py-1.5 text-right">Rate</th>
                  <th className="px-2 py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewTxn.items.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-2 py-1.5">{item.item_name}</td>
                    <td className="px-2 py-1.5"><span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 rounded">{item.category_name}</span></td>
                    <td className="px-2 py-1.5 text-right">{item.quantity_received}</td>
                    <td className="px-2 py-1.5 text-right">{item.quantity_washed}</td>
                    <td className="px-2 py-1.5 text-right">Rs. {item.rate}</td>
                    <td className="px-2 py-1.5 text-right font-medium">Rs. {item.line_total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-6 text-sm font-semibold border-t pt-3">
              <span>Total: Rs. {viewTxn.total_amount.toLocaleString()}</span>
              <span>Cost: Rs. {viewTxn.total_cost.toLocaleString()}</span>
              <span className="text-green-600">Profit: Rs. {viewTxn.total_profit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
