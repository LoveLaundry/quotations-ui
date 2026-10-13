import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionsApi, customersApi, paymentsApi, reportsApi } from '../api/management-api'
import { Eye, Search, X, Banknote, TrendingUp, Wallet, AlertCircle } from 'lucide-react'
import { PageHeader } from '../../../components/ui/page-header'
import { StatCard } from '../../../components/ui/stat-card'
import { FilterBar } from '../../../components/ui/filter-bar'
import { Badge } from '../../../components/ui/badge'
import { DataTable } from '../../../components/ui/data-table'
import { EmptyState } from '../../../components/ui/empty-state'
import { LoadingSpinner } from '../../../components/ui/loading-spinner'
import { ExportButton } from '../../../components/ui/export-button'
import { Pagination } from '../../../components/ui/pagination'

const PAGE_SIZE = 20
const LIST_LIMIT = 500
const SUMMARY_LIMIT = 1000

/**
 * Income — every billed income line (management transactions) in one place.
 *
 * Transactions are the receivables ledger: each row is income billed to a
 * customer. Collected cash lives in Payments; the Outstanding report joins
 * the two per customer (billed − paid). Summary cards combine all three so
 * this tab answers "how much did we bill, collect, and still owed?".
 */
export default function ManagementIncome() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [search, setSearch] = useState('')
  const [viewTxn, setViewTxn] = useState<any>(null)
  const [offset, setOffset] = useState(0)
  const limit = PAGE_SIZE

  useEffect(() => {
    setOffset(0)
  }, [startDate, endDate, customerId, search])

  const { data: customersData = { items: [] } } = useQuery({
    queryKey: ['mgmt-customers-list'],
    queryFn: () => customersApi.list('', LIST_LIMIT, 0).then((r) => r.data),
  })
  const customers = customersData.items

  const { data: page = { items: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['mgmt-income', startDate, endDate, customerId, search, offset, limit],
    queryFn: () =>
      transactionsApi
        .list({
          start_date: startDate,
          end_date: endDate,
          customer_id: customerId,
          search,
          limit,
          offset,
        })
        .then((r) => r.data),
  })
  const incomes = page.items

  // Period totals come from the profit-loss report (server-side aggregation,
  // not just the visible page) so the cards stay correct with paging.
  const { data: pl } = useQuery({
    queryKey: ['mgmt-income-pl', startDate, endDate, customerId],
    queryFn: () =>
      reportsApi
        .profitLoss({ start_date: startDate, end_date: endDate, customer_id: customerId })
        .then((r) => r.data),
  })

  // Cash collected in the same period (payments are capped at 500 rows per
  // request — enough for a period summary; the Payments tab pages the rest).
  const { data: paidData = { items: [], total: 0 } } = useQuery({
    queryKey: ['mgmt-income-paid', startDate, endDate, customerId],
    queryFn: () =>
      paymentsApi
        .list({
          customer_id: customerId,
          start_date: startDate,
          end_date: endDate,
          limit: SUMMARY_LIMIT,
          offset: 0,
        })
        .then((r) => r.data),
  })
  const collected = (paidData.items ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  // Lifetime outstanding per customer (authoritative billed − paid join).
  const { data: outstandingRows = [] } = useQuery({
    queryKey: ['mgmt-outstanding'],
    queryFn: () => reportsApi.outstanding().then((r) => r.data),
  })
  const outstandingTotal = customerId
    ? (outstandingRows.find((o: any) => String(o.customer_id) === customerId)?.outstanding ?? 0)
    : outstandingRows.reduce((s: number, o: any) => s + Number(o.outstanding || 0), 0)

  const billed = Number(pl?.total_revenue ?? 0)
  const profit = Number(pl?.gross_profit ?? 0)

  const columns = [
    { key: 'transaction_date', header: 'Date', render: (t: any) => t.transaction_date },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (t: any) => <span className="font-medium">{t.customer_name}</span>,
    },
    {
      key: 'invoice_number',
      header: 'Invoice',
      render: (t: any) => <span className="text-gray-500">{t.invoice_number || '—'}</span>,
    },
    { key: 'total_quantity', header: 'Qty', align: 'right' as const, render: (t: any) => t.total_quantity },
    {
      key: 'total_amount',
      header: 'Income',
      align: 'right' as const,
      render: (t: any) => <span className="font-medium text-green-700">LKR {Number(t.total_amount || 0).toLocaleString()}</span>,
    },
    {
      key: 'total_cost',
      header: 'Cost',
      align: 'right' as const,
      render: (t: any) => `LKR ${Number(t.total_cost || 0).toLocaleString()}`,
    },
    {
      key: 'total_profit',
      header: 'Profit',
      align: 'right' as const,
      render: (t: any) => <span className="text-green-600">LKR {Number(t.total_profit || 0).toLocaleString()}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      align: 'center' as const,
      render: (t: any) => <Badge variant={t.source === 'IMPORT' ? 'info' : 'neutral'}>{t.source}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as const,
      render: (t: any) => (
        <button onClick={() => setViewTxn(t)} className="p-1 hover:bg-gray-100 rounded" aria-label="View income details">
          <Eye size={14} />
        </button>
      ),
    },
  ]

  const exportCols = [
    { key: 'transaction_date', label: 'Date' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'invoice_number', label: 'Invoice' },
    { key: 'total_quantity', label: 'Qty' },
    { key: 'total_amount', label: 'Income' },
    { key: 'total_cost', label: 'Cost' },
    { key: 'total_profit', label: 'Profit' },
    { key: 'source', label: 'Source' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Income"
        subtitle={`${page.total} income entries · billed LKR ${billed.toLocaleString()} · collected LKR ${collected.toLocaleString()}`}
        actions={<ExportButton data={incomes} filename="income" columns={exportCols} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Billed" value={`LKR ${billed.toLocaleString()}`} icon={<Banknote size={20} />} color="green" />
        <StatCard label="Collected" value={`LKR ${collected.toLocaleString()}`} icon={<Wallet size={20} />} color="blue" to="/management/payments" />
        <StatCard label="Outstanding" value={`LKR ${Number(outstandingTotal || 0).toLocaleString()}`} icon={<AlertCircle size={20} />} color="red" to="/management/ledger" />
        <StatCard label="Gross Profit" value={`LKR ${profit.toLocaleString()}`} icon={<TrendingUp size={20} />} color="green" />
      </div>

      <FilterBar>
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Customers</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSpinner label="Loading income..." className="py-12" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={incomes}
            emptyState={<EmptyState title="No income found" description="No billed income matches your filters." />}
          />
          <Pagination total={page.total} limit={limit} offset={offset} onChange={setOffset} className="px-1" />
        </>
      )}

      {viewTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Income Details</h2>
              <button onClick={() => setViewTxn(null)} aria-label="Close details"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><p className="text-gray-500">Date</p><p className="font-medium">{viewTxn.transaction_date}</p></div>
              <div><p className="text-gray-500">Customer</p><p className="font-medium">{viewTxn.customer_name}</p></div>
              <div><p className="text-gray-500">Invoice</p><p className="font-medium">{viewTxn.invoice_number || '—'}</p></div>
              <div><p className="text-gray-500">Source</p><p className="font-medium">{viewTxn.source}</p></div>
            </div>
            <div className="mb-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Item</th>
                    <th className="px-2 py-1.5 text-left">Category</th>
                    <th className="px-2 py-1.5 text-right">Qty</th>
                    <th className="px-2 py-1.5 text-right">Rate</th>
                    <th className="px-2 py-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewTxn.items ?? []).map((item: any, i: number) => (
                    <tr key={item.id ?? i} className="border-t">
                      <td className="px-2 py-1.5">{item.item_name}</td>
                      <td className="px-2 py-1.5"><span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 rounded">{item.category_name}</span></td>
                      <td className="px-2 py-1.5 text-right">{item.quantity_washed ?? item.quantity_received}</td>
                      <td className="px-2 py-1.5 text-right">LKR {item.rate}</td>
                      <td className="px-2 py-1.5 text-right font-medium">LKR {Number(item.line_total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm font-semibold border-t pt-3 sm:justify-end">
              <span>Total: LKR {Number(viewTxn.total_amount || 0).toLocaleString()}</span>
              <span>Cost: LKR {Number(viewTxn.total_cost || 0).toLocaleString()}</span>
              <span className="text-green-600">Profit: LKR {Number(viewTxn.total_profit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
