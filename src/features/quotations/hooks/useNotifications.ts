import { useQuotations } from './useQuotations'
import { useBills } from './useBills'
import type { Quotation } from '../../../types/quotation'
import type { Bill } from '../../../types/bill'

export interface NotificationItem {
  id: string
  type: 'quotation_pending' | 'quotation_accepted'
  title: string
  message: string
  count: number
  items: (Quotation | Bill)[]
  route: string
}

export interface NotificationState {
  pendingQuotations: Quotation[]
  acceptedQuotations: Quotation[]
  pendingCount: number
  acceptedCount: number
  totalCount: number
}

export function useNotifications() {
  const { data: quotations = [], isLoading: quotationsLoading } = useQuotations()
  const { data: billsData, isLoading: billsLoading } = useBills({ limit: 1000 })
  const bills = billsData?.items ?? []

  const billQuotationIds = new Set(bills.map(b => String(b.quotation_id)))

  const pendingQuotations = quotations.filter(
    q => q.status === 'draft'
  )

  const acceptedQuotations = quotations.filter(
    q => q.status === 'accepted' && !billQuotationIds.has(String(q.id))
  )

  const pendingCount = pendingQuotations.length
  const acceptedCount = acceptedQuotations.length
  const totalCount = pendingCount + acceptedCount

  const allNotifications: NotificationItem[] = [
    {
      id: 'quotation_pending',
      type: 'quotation_pending' as const,
      title: 'Pending to Send',
      message: `${pendingCount} quotation${pendingCount !== 1 ? 's' : ''} waiting to be sent`,
      count: pendingCount,
      items: pendingQuotations,
      route: '/quotations?filter=draft',
    },
    {
      id: 'quotation_accepted',
      type: 'quotation_accepted' as const,
      title: 'Ready for Billing',
      message: `${acceptedCount} accepted quotation${acceptedCount !== 1 ? 's' : ''} need billing`,
      count: acceptedCount,
      items: acceptedQuotations,
      route: '/quotations?filter=accepted',
    },
  ]

  const notificationItems = allNotifications.filter(item => item.count > 0)

  return {
    pendingQuotations,
    acceptedQuotations,
    pendingCount,
    acceptedCount,
    totalCount,
    notificationItems,
    isLoading: quotationsLoading || billsLoading,
  }
}