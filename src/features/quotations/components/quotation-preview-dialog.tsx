import { Tag } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody,
  DialogTitle, DialogDescription,
} from '../../../components/ui/dialog'
import { formatCurrency } from '../../../lib/utils'
import type { Quotation } from '../../../types/quotation'

interface Props {
  quotation: Quotation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotationPreviewDialog({ quotation, open, onOpenChange }: Props) {
  if (!quotation) return null

  const entries = Object.entries(quotation.unit_price_with_options)
  const prices  = entries.map(([, p]) => p)
  const min     = Math.min(...prices)
  const max     = Math.max(...prices)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA]">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <DialogTitle>{quotation.item_name}</DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5 mt-2 justify-center">
              <span className="rounded-md bg-[#FFF1F1] border border-[#FECACA] px-2 py-0.5 text-[11px] font-medium text-[#DC2626]">
                {quotation.category}
              </span>
              <span className="rounded-md bg-[#F9FAFB] border border-[#E4E7EC] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                {quotation.size}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Service rows */}
          <div className="space-y-1.5">
            {entries.map(([type, price]) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-lg border border-[#E4E7EC] bg-[#FAFAFA] px-4 py-2.5 hover:bg-white hover:border-[#D1D5DB] transition-colors"
              >
                <span className="text-[13px] font-medium text-[#374151]">{type}</span>
                <span className="text-[13px] font-semibold text-[#DC2626]">{formatCurrency(price)}</span>
              </div>
            ))}
          </div>

          {/* Range footer */}
          {entries.length > 1 && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] px-4 py-2.5">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Range</span>
              <span className="text-[13px] font-semibold text-[#101828]">
                {formatCurrency(min)}
                <span className="mx-2 text-[#D1D5DB]">—</span>
                {formatCurrency(max)}
              </span>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
