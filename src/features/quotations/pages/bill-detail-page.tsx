import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Building2, Calendar, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useBill, useDeleteBill } from '../hooks/useBills'

export default function BillDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: bill, isLoading, isError, error } = useBill(id)
  const deleteBill = useDeleteBill()

  const handleDelete = () => {
    if (!bill) return
    if (!window.confirm('Delete this bill? This cannot be undone.')) return
    deleteBill.mutate(bill._id, { onSuccess: () => navigate('/bills') })
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/' },
              { label: 'Bills', href: '/bills' },
              { label: bill?.client_name ?? '...' },
            ]}
          />
          <div className="flex items-center gap-3 mt-1">
            <Link to="/bills" className="text-[#98A2B3] hover:text-[#374151]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-dashboard-title">Bill</h1>
          </div>
        </div>

        {bill && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteBill.isPending}
              className="text-[#DC2626] hover:bg-[#FEF2F2]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      ) : isError ? (
        <ErrorState description={error instanceof Error ? error.message : 'Unable to load bill'} />
      ) : !bill ? (
        <EmptyState title="Bill not found" description="This bill may have been deleted." />
      ) : (
        <Card>
          <CardHeader className="border-b border-[#F2F4F7] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA]">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle>{bill.client_name}</CardTitle>
                <p className="text-[12px] text-[#98A2B3] mt-0.5">
                  {bill.quotation_title || 'Price List'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#98A2B3]">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(bill.created_at)}
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="divide-y divide-[#F2F4F7]">
              {bill.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#101828] truncate">
                      {item.item_name}
                    </p>
                    <p className="text-[12px] text-[#98A2B3]">
                      LKR {item.unit_price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-[#101828] shrink-0">
                    LKR {item.line_total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[#E4E7EC] pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                <span>Items</span>
                <span className="font-medium">{bill.items.length}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                <span>Total quantity</span>
                <span className="font-medium">{bill.total_quantity}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E4E7EC] pt-2 text-[16px] font-bold text-[#101828]">
                <span>Total Amount</span>
                <span className="text-[#DC2626]">LKR {bill.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}