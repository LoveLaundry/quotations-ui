import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Badge } from '../../../components/ui/badge'
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{quotation.category}</Badge>
            <Badge variant="secondary">{quotation.size}</Badge>
          </div>
          <DialogTitle>{quotation.item_name}</DialogTitle>
          <DialogDescription>
            Service pricing breakdown with all available types and unit rates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Service Type</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceEntries.map(([serviceType, price]) => (
                <TableRow key={serviceType}>
                  <TableCell>
                    <span className="font-medium text-slate-900">{serviceType}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-body-lg font-semibold text-brand-600">
                      {formatCurrency(price)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {priceEntries.length > 1 ? (
            <div className="flex items-center justify-between rounded-lg border border-surface-border bg-slate-50 px-5 py-4">
              <span className="text-body-lg font-medium text-slate-600">Price range</span>
              <span className="text-body-lg font-semibold text-slate-900">
                {formatCurrency(Math.min(...priceEntries.map(([, p]) => p)))}
                {' — '}
                {formatCurrency(Math.max(...priceEntries.map(([, p]) => p)))}
              </span>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
