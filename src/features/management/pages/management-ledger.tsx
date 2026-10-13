import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionsApi, customersApi, paymentsApi, reportsApi } from '../api/management-api'
import { Search, BookOpen, Scale, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { PageHeader } from '../../../components/ui/page-header'
import { StatCard } from '../../../components/ui/stat-card'
import { FilterBar } from '../../../components/ui/filter-bar'
import { DataTable } from '../../../components/ui/data-table'
import { EmptyState } from '../../../components/ui/empty-state'
import { LoadingSpinner } from '../../../components/ui/loading-spinner'
import { ExportButton } from '../../../components/ui/export-button'
import { Pagination } from '../../../components/ui/pagination'

const PAGE_SIZE = 20
const FETCH_LIMIT = 1000

type LedgerRow = {
  id: string
  date: string
  kind: 'INVOICE' | 'PAYMENT'
  customer_id: string
  customer_name: string
  reference: string
  detail: string
  debit: number
  credit: number
  balance: number
}

function dayBefore(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Ledger — chronological debits (billed invoices) and credits (payments
 * received) with a running balance per the selected scope.
 *
 * There is no dedicated ledger endpoint: the ledger is derived client-side
 * from Transactions (debits) + Payments (credits), the same two collections
 * the Outstanding report joins server-side (billed − paid). Opening balance
 * is the lifetime billed − paid strictly before the From date.
 */
export default function ManagementLedger() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = PAGE_SIZE

  useEffect(() => {
    setOffset(0)
  }, [startDate, endDate, customerId, search])

  const { data: customersData = { items: [] } } = useQuery({
    queryKey: ['mgmt-customers-list'],
    queryFn: () => customersApi.list('', 500, 0).then((r) => r.data),
  })
  const customers = customersData.items

  const txnParams = useMemo(
    () => ({ start_date: startDate, end_date: endDate, customer_id: customerId, limit: FETCH_LIMIT, offset: 0 }),
    [startDate, endDate, customerId],
  )
  const payParams = useMemo(
    () => ({ customer_id: customerId, start_date: startDate, end_date: endDate, limit: 500, offset: 0 }),
    [startDate, endDate, customerId],
  )

  const { data: txnData, isLoading: txnLoading } = useQuery({
    queryKey: ['mgmt-ledger-txns', txnParams],
    queryFn: () => transactionsApi.list(txnParams).then((r) => r.data),
  })
  const { data: payData, isLoading: payLoading } = useQuery({
    queryKey: ['mgmt-ledger-pays', payParams],
    queryFn: () => paymentsApi.list(payParams).then((r) => r.data),
  })

  // Lifetime outstanding per customer — doubles as the closing-balance check.
  const { data: outstandingRows = [] } = useQuery({
    queryKey: ['mgmt-outstanding'],
    queryFn: () => reportsApi.outstanding().then((r) => r.data),
  })

  // Opening balance: billed − paid strictly before From. Skipped when no
  // From date (period starts at the beginning of history → opening is 0).
  const openingParams = useMemo(() => {
    if (!startDate) return null
    const before = dayBefore(startDate)
    return { customerId, before }
  }, [startDate, customerId])
  const { data: openingData } = useQuery({
    queryKey: ['mgmt-ledger-opening', openingParams],
    queryFn: async () => {
      if (!openingParams) return { billed: 0, paid: 0 }
      const [txns, pays] = await Promise.all([
        transactionsApi
          .list({ customer_id: openingParams.customerId, end_date: openingParams.before, limit: FETCH_LIMIT, offset: 0 })
          .then((r) => r.data),
        paymentsApi
          .list({ customer_id: openingParams.customerId, end_date: openingParams.before, limit: 500, offset: 0 })
          .then((r) => r.data),
      ])
      const billed = (txns.items ?? []).reduce((s: number, t: any) => s + Number(t.total_amount || 0), 0)
      const paid = (pays.items ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
      return { billed, paid }
    },
    enabled: Boolean(openingParams),
  })
  const openingBalance = (openingData?.billed ?? 0) - (openingData?.paid ?? 0)

  const allRows: LedgerRow[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    const debits: LedgerRow[] = (txnData?.items ?? [])
      .filter((t: any) => {
        if (!q) return true
        return [t.customer_name, t.invoice_number].some((v) => String(v ?? '').toLowerCase().includes(q))
      })
      .map((t: any) => ({
        id: `txn-${t.id}`,
        date: t.transaction_date,
        kind: 'INVOICE' as const,
        customer_id: String(t.customer_id ?? ''),
        customer_name: t.customer_name ?? 'Unknown',
        reference: t.invoice_number || '—',
        detail: `${Number(t.total_quantity || 0)} pcs`,
        debit: Number(t.total_amount || 0),
        credit: 0,
        balance: 0,
      }))
    const credits: LedgerRow[] = (payData?.items ?? [])
      .filter((p: any) => {
        if (!q) return true
        return [p.customer_name, p.reference, p.payment_method, p.notes].some((v) =>
          String(v ?? '').toLowerCase().includes(q),
        )
      })
      .map((p: any) => ({
        id: `pay-${p.id}`,
        date: p.payment_date,
        kind: 'PAYMENT' as const,
        customer_id: String(p.customer_id ?? ''),
        customer_name: p.customer_name ?? 'Unknown',
        reference: p.reference || p.payment_method || '—',
        detail: p.payment_method ? String(p.payment_method).replace('_', ' ') : '',
        debit: 0,
        credit: Number(p.amount || 0),
        balance: 0,
      }))
    const merged = [...debits, ...credits].sort((a, b) =>
      a.date === b.date ? (a.kind === b.kind ? 0 : a.kind === 'INVOICE' ? -1 : 1) : a.date < b.date ? -1 : 1,
    )
    let running = openingBalance
    for (const row of merged) {
      running += row.debit - row.credit
      row.balance = running
    }
    return merged
  }, [txnData, payData, search, openingBalance])

  const totalDebit = allRows.reduce((s, r) => s + r.debit, 0)
  const totalCredit = allRows.reduce((s, r) => s + r.credit, 0)
  const closingBalance = allRows.length ? allRows[allRows.length - 1].balance : openingBalance

  const lifetimeOutstanding = customerId
    ? (outstandingRows.find((o: any) => String(o.customer_id) === customerId)?.outstanding ?? closingBalance)
    : outstandingRows.reduce((s: number, o: any) => s + Number(o.outstanding || 0), 0)

  const truncated = (txnData?.total ?? 0) > FETCH_LIMIT || (payData?.total ?? 0) > 500

  const pageRows = allRows.slice(offset, offset + limit)

  const columns = [
    { key: 'date', header: 'Date', render: (r: LedgerRow) => <span className="whitespace-nowrap">{r.date}</span> },
    {
      key: 'kind',
      header: 'Type',
      align: 'center' as const,
      render: (r: LedgerRow) =>
        r.kind === 'INVOICE' ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><ArrowUpCircle size={13} /> Invoice</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><ArrowDownCircle size={13} /> Payment</span>
        ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (r: LedgerRow) => <span className="font-medium">{r.customer_name}</span>,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (r: LedgerRow) => (
        <span className="text-gray-500">{r.reference}{r.detail ? ` · ${r.detail}` : ''}</span>
      ),
    },
    {
      key: 'debit',
      header: 'Debit (Billed)',
      align: 'right' as const,
      render: (r: LedgerRow) => (r.debit ? `LKR ${r.debit.toLocaleString()}` : '—'),
    },
    {
      key: 'credit',
      header: 'Credit (Paid)',
      align: 'right' as const,
      render: (r: LedgerRow) =>
        r.credit ? <span className="text-green-700">LKR {r.credit.toLocaleString()}</span> : '—',
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right' as const,
      render: (r: LedgerRow) => (
        <span className={`font-semibold ${r.balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
          LKR {r.balance.toLocaleString()}
        </span>
      ),
    },
  ]

  const exportCols = [
    { key: 'date', label: 'Date' },
    { key: 'kind', label: 'Type' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'reference', label: 'Reference' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
    { key: 'balance', label: 'Balance' },
  ]

  const isLoading = txnLoading || payLoading
  const customerName = customerId
    ? (customers.find((c: any) => String(c.id) === customerId)?.name ?? 'Customer')
    : 'All customers'

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ledger"
        subtitle={`${customerName} · opening LKR ${openingBalance.toLocaleString()} → closing LKR ${closingBalance.toLocaleString()} · ${allRows.length} entries`}
        actions={<ExportButton data={allRows} filename={`ledger-${customerId || 'all'}`} columns={exportCols} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Opening Balance" value={`LKR ${openingBalance.toLocaleString()}`} icon={<BookOpen size={20} />} color="gray" />
        <StatCard label="Billed (Debit)" value={`LKR ${totalDebit.toLocaleString()}`} icon={<ArrowUpCircle size={20} />} color="amber" to="/management/income" />
        <StatCard label="Received (Credit)" value={`LKR ${totalCredit.toLocaleString()}`} icon={<ArrowDownCircle size={20} />} color="green" to="/management/payments" />
        <StatCard label="Closing Balance" value={`LKR ${closingBalance.toLocaleString()}`} icon={<Scale size={20} />} color="red" />
      </div>

      <FilterBar>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Customers</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, invoice, reference..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </FilterBar>

      {truncated && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          More than {FETCH_LIMIT} entries match — the ledger shows the most recent {FETCH_LIMIT}. Narrow the date range for a complete running balance.
        </p>
      )}

      {!customerId && !startDate && !endDate && (
        <p className="text-xs text-gray-500">
          Lifetime outstanding across all customers: <span className="font-semibold">LKR {Number(lifetimeOutstanding || 0).toLocaleString()}</span>.
          Pick a customer and a date range for a statement-style ledger.
        </p>
      )}

      {isLoading ? (
        <LoadingSpinner label="Loading ledger..." className="py-12" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={pageRows}
            emptyState={<EmptyState title="No ledger entries" description="No invoices or payments match your filters." />}
          />
          <Pagination total={allRows.length} limit={limit} offset={offset} onChange={setOffset} className="px-1" />
        </>
      )}
    </div>
  )
}
