import { Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog'
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
        {/* Centered header with icon — matches deedlink "Secure Login" style */}
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <DialogTitle>{quotation.item_name}</DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5 mt-1">
              <span className="rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 uppercase tracking-wide">
                {quotation.category}
              </span>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                {quotation.size}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Service rows — clean list like deedlink form fields */}
          <div className="space-y-1.5">
            {priceEntries.map(([serviceType, price]) => (
              <div
                key={serviceType}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-2.5"
              >
                <span className="text-[13px] font-medium text-slate-700">{serviceType}</span>
                <span className="text-[13px] font-semibold text-red-600">{formatCurrency(price)}</span>
              </div>
            ))}
          </div>

          {priceEntries.length > 1 && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rate Range</span>
              <span className="text-[13px] font-semibold text-slate-700">
                {formatCurrency(Math.min(...priceEntries.map(([, p]) => p)))}
                <span className="mx-1.5 text-slate-300">—</span>
                {formatCurrency(Math.max(...priceEntries.map(([, p]) => p)))}
              </span>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
