import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Receipt, X, Calendar, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { VerificationStatus } from '../../../components/ui/verification-status'
import { formatDate } from '../../../lib/utils'
import { useBills } from '../hooks/useBills'

export default function BillsListPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error } = useBills({
    search: search || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    limit: 50,
  })

  const bills = data?.items ?? []
  const hasFilters = Boolean(search || dateFrom || dateTo)

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
  }
  
  const handleExportExcel = () => {
    if (!bills.length) return
    
    // Transform bills data for Excel
    const dataForExcel = bills.map(bill => ({
      'Bill ID': bill.id,
      'Client Name': bill.client_name,
      'Quotation Title': bill.quotation_title || 'N/A',
      'Total Quantity': bill.total_quantity,
      'Total Amount': bill.total_amount,
      'Paid Amount': bill.paid_amount || 0,
      'Outstanding Amount': bill.outstanding_amount ?? bill.total_amount,
      'Status': bill.payment_status || 'DRAFT',
      'Date': formatDate(bill.created_at)
    }))
    
    const ws = XLSX.utils.json_to_sheet(dataForExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Bills")
    XLSX.writeFile(wb, "bills_export.xlsx")
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Bills' }]} />
          <h1 className="text-dashboard-title mt-1">Bills</h1>
          <p className="text-[13px] text-[#98A2B3] mt-0.5">
            {data ? `${data.total} bill${data.total === 1 ? '' : 's'}` : 'Saved bills'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportExcel} disabled={!bills.length}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Link to="/bills/new">
            <Button>
              <Plus className="h-4 w-4" /> New Bill
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by client, quotation title, or item…"
            className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-8 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 shadow-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#374151] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-10 rounded-lg border border-[#E4E7EC] bg-white pl-8 pr-2.5 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 shadow-sm"
            />
          </div>
          <span className="text-[12px] text-[#98A2B3]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="h-10 rounded-lg border border-[#E4E7EC] bg-white px-2.5 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 shadow-sm"
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load bills'} />
      ) : bills.length === 0 ? (
        <EmptyState
          title="No bills found"
          description={
            hasFilters
              ? 'No bills match your search or date range.'
              : 'Create your first bill from an existing quotation.'
          }
          action={
            !hasFilters && (
              <Link to="/bills/new">
                <Button>
                  <Plus className="h-4 w-4" /> New Bill
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bills.map(bill => ( bill.id &&
            <Link key={bill.id} to={`/bills/${bill.id}`}>
              <Card hover className="cursor-pointer p-4 h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA]">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#101828] truncate">
                        {bill.client_name}
                      </p>
                      <p className="text-[12px] text-[#98A2B3] truncate">
                        {bill.quotation_title || 'Price List'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <VerificationStatus status={bill.verification?.status} showLabel={false} />
                    <Badge variant="secondary">{bill.total_quantity} items</Badge>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#F2F4F7] pt-3">
                  <span className="text-[11px] text-[#98A2B3]">{formatDate(bill.created_at)}</span>
                  <span className="text-[14px] font-bold text-[#101828]">
                    LKR {bill.total_amount.toFixed(2)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}