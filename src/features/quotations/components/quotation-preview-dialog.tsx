import { Printer } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody,
  DialogTitle, DialogDescription,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import type { Quotation } from '../../../types/quotation'

interface Props {
  quotation: Quotation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotationPreviewDialog({ quotation, open, onOpenChange }: Props) {
  if (!quotation) return null

  const items = quotation.line_items ?? []
  const groups: Record<string, typeof items> = {}
  for (const item of items) {
    const cat = item.category?.trim() || 'General'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  const groupEntries = Object.entries(groups)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA] text-[16px] font-bold">
              {(quotation.client_name ?? '?').charAt(0).toUpperCase()}
            </div>
          </div>
          <DialogTitle>{quotation.client_name ?? '(Unnamed)'}</DialogTitle>
          <DialogDescription>
            {quotation.quotation_title || 'Price List'} · {items.length} items
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="max-h-[380px] overflow-y-auto -mx-1 px-1 space-y-3">
            {groupEntries.map(([cat, catItems]) => (
              <div key={cat}>
                {groupEntries.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-1.5 px-1">
                    {cat}
                  </p>
                )}
                <div className="space-y-1">
                  {catItems.map((li, idx) => {
                    const globalNum = items.indexOf(li) + 1
                    return (
                      <div
                        key={li.id ?? idx}
                        className="flex items-center justify-between rounded-lg border border-[#E4E7EC] bg-[#FAFAFA] px-3 py-2 hover:bg-white hover:border-[#D1D5DB] transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-[#D1D5DB] w-5 shrink-0 text-right">
                            {globalNum}
                          </span>
                          <div className="min-w-0">
                            <span className="text-[13px] font-medium text-[#374151] truncate block">
                              {li.item_name}
                            </span>
                            {li.notes && (
                              <span className="text-[11px] text-[#98A2B3]">{li.notes}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-[#101828] shrink-0 ml-3">
                          {li.unit_price.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] px-3 py-2.5">
            <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              {items.length} items · LKR
            </span>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Printer className="h-3 w-3" /> Print
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
