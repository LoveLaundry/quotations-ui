import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { RiCloseLine, RiSendPlaneLine, RiFileTextLine, RiEditLine, RiAddLine } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import type { Quotation } from '../../../types/quotation'
import { formatDate } from '../../../lib/utils'

interface NotificationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  type: 'quotation_pending' | 'quotation_accepted'
}

export function NotificationDetailDialog({ open, onOpenChange, quotation, type }: NotificationDetailDialogProps) {
  const navigate = useNavigate()

  if (!quotation) return null

  const handleClose = () => onOpenChange(false)

  const handlePrimaryAction = () => {
    onOpenChange(false)
    if (type === 'quotation_pending') {
      // Go to quotation form to edit/send
      navigate(`/quotations/${quotation.id}/edit`)
    } else {
      // Go to create bill page with this quotation pre-selected
      navigate(`/bills/new?quotation_id=${quotation.id}`)
    }
  }

  const handleViewDetails = () => {
    onOpenChange(false)
    navigate(`/quotations/${quotation.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                type === 'quotation_pending' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F0FDF4] text-[#16A34A]'
              }`}>
                {type === 'quotation_pending' ? <RiSendPlaneLine size={20} /> : <RiFileTextLine size={20} />}
              </div>
              <div>
                <DialogTitle className="text-[16px] font-semibold text-[#101828]">
                  {type === 'quotation_pending' ? 'Pending to Send' : 'Ready for Billing'}
                </DialogTitle>
                <DialogDescription className="text-[13px] text-[#6B7280]">
                  {type === 'quotation_pending'
                    ? 'This quotation is waiting to be sent to the client'
                    : 'This quotation has been accepted and is ready to create a bill'}
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#98A2B3] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
              aria-label="Close"
            >
              <RiCloseLine size={18} />
            </button>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Quotation Info */}
          <div className="rounded-lg border border-[#E4E7EC] bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">Client</p>
                <p className="text-[14px] font-medium text-[#101828]">{quotation.client_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">Title</p>
                <p className="text-[14px] font-medium text-[#101828]">{quotation.quotation_title || 'General Price List'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">Date</p>
                <p className="text-[14px] font-medium text-[#101828]">{quotation.created_at ? formatDate(quotation.created_at) : '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">Quotation #</p>
                <p className="text-[14px] font-medium text-[#101828] font-mono">{quotation.id}</p>
              </div>
            </div>

            {/* Items Preview */}
            <div className="border-t border-[#F2F4F7] pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-2">
                Items ({quotation.line_items?.length ?? 0})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {quotation.line_items?.slice(0, 10).map((item: typeof quotation.line_items[0], idx: number) => (
                  <div key={item.id ?? idx} className="flex items-center justify-between text-[13px]">
                    <span className="text-[#101828] truncate pr-2">{item.item_name}</span>
                    <span className="text-[#6B7280] shrink-0">{item.category || 'General'}</span>
                    <span className="font-semibold text-[#101828] shrink-0 ml-3">LKR {item.unit_price.toFixed(2)}</span>
                  </div>
                ))}
                {(quotation.line_items?.length ?? 0) > 10 && (
                  <p className="text-[12px] text-[#98A2B3] text-center py-2">
                    +{(quotation.line_items?.length ?? 0) - 10} more items
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
              quotation.status === 'draft' ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]' :
              quotation.status === 'sent' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' :
              quotation.status === 'accepted' ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' :
              'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]'
            }`}>
              {quotation.status?.toUpperCase()}
            </span>
            <span className="text-[13px] text-[#6B7280]">Tag: {quotation.tag?.toUpperCase() || '—'}</span>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleViewDetails}
          >
            <RiEditLine size={16} className="mr-1.5" />
            View Details
          </Button>
          <Button
            className="w-full sm:w-auto bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            onClick={handlePrimaryAction}
          >
            {type === 'quotation_pending' ? (
              <>
                <RiSendPlaneLine size={16} className="mr-1.5" />
                Send Quotation
              </>
            ) : (
              <>
                <RiAddLine size={16} className="mr-1.5" />
                Create Bill
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}