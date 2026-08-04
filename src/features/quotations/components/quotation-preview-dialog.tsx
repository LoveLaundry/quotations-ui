import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { formatCurrency } from '../../../lib/utils'
import type { Quotation } from '../../../types/quotation'

interface QuotationPreviewDialogProps {
  quotation: Quotation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotationPreviewDialog({ quotation, open, onOpenChange }: QuotationPreviewDialogProps) {
  if (!quotation) return null

  const priceEntries = Object.entries(quotation.unit_price_with_options)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Header */}
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full bg-red-50 border border-red-100 px-3 py-0.5 text-[12px] font-semibold text-red-700 tracking-wide uppercase">
              {quotation.category}
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[12px] font-semibold text-slate-600 tracking-wide uppercase">
              {quotation.size}
            </span>
          </div>
          <DialogTitle>{quotation.item_name}</DialogTitle>
          <DialogDescription>
            Pricing breakdown by service type
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <DialogBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead className="text-right">Unit Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceEntries.map(([serviceType, price]) => (
                <TableRow key={serviceType}>
                  <TableCell className="font-medium text-slate-900 text-[14px] py-3.5">
                    {serviceType}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600 text-[15px] py-3.5">
                    {formatCurrency(price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {priceEntries.length > 1 ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">Rate Range</span>
              <span className="text-[16px] font-bold text-slate-900">
                {formatCurrency(Math.min(...priceEntries.map(([, p]) => p)))}
                {' — '}
                {formatCurrency(Math.max(...priceEntries.map(([, p]) => p)))}
              </span>
            </div>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
