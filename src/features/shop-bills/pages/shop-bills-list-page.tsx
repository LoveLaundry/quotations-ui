import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Receipt, X } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { useShopBills } from '../hooks/useShopBills'
import type { ShopBill } from '../../../types/shop-bill'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border border-blue-200',
  DELIVERED: 'bg-purple-50 text-purple-700 border border-purple-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border border-gray-200',
}

const PAYMENT_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500 border border-gray-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  PARTIALLY_PAID: 'bg-orange-50 text-orange-700 border border-orange-200',
  PAID: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border border-gray-200',
}

export default function ShopBillsListPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error } = useShopBills({
    search: search || undefined,
    status: statusFilter || undefined,
    payment_status: paymentFilter || undefined,
    limit: 50,
  })

  const bills = data?.items ?? []
  const hasFilters = Boolean(search || statusFilter || paymentFilter)

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatusFilter('')
    setPaymentFilter('')
  }

  const fmt = (v: number) => `Rs. ${v.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Shop Bills' }]} />
          <h1 className="text-dashboard-title mt-1">Shop Bills</h1>
          <p className="text-[13px] text-[#98A2B3] mt-0.5">
            {data ? `${data.total} bill${data.total === 1 ? '' : 's'}` : 'Shop bills'}
          </p>
        </div>
        <Link to="/shop-bills/new">
          <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white gap-2 cursor-pointer">
            <Plus size={16} /> New Bill
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by bill number or client…"
            className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-10 pr-9 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] transition"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] transition"
        >
          <option value="">All Payments</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="text-[12px] text-[#DC2626] hover:text-[#B91C1C] underline cursor-pointer">
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load shop bills'} />
      ) : bills.length === 0 ? (
        <EmptyState
          title="No shop bills found"
          description={
            hasFilters
              ? 'Try adjusting your filters.'
              : 'Create your first shop bill to get started.'
          }
          action={
            !hasFilters ? (
              <Link to="/shop-bills/new">
                <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white gap-2">
                  <Plus size={16} /> New Shop Bill
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {bills.map((bill: ShopBill) => (
            <Link key={bill.id} to={`/shop-bills/${bill.id}`}>
              <Card className="flex items-center gap-4 p-4 hover:border-[#DC2626]/40 transition cursor-pointer">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA]">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[#101828]">{bill.bill_number}</p>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[bill.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {bill.status}
                    </span>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${PAYMENT_COLORS[bill.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {bill.payment_status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">
                    {bill.client_name} &middot; {bill.items.length} item{bill.items.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-semibold text-[#101828]">{fmt(bill.grand_total)}</p>
                  {bill.outstanding_amount > 0 && (
                    <p className="text-[11px] text-[#DC2626]">{fmt(bill.outstanding_amount)} due</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
