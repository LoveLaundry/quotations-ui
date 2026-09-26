import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deliveries as deliveriesApi } from '../services/delivery.service'
import { useQuotations } from './useQuotations'
import type { NotificationItem, GatePassPendingEntry } from '../../../types/notification'
import type { Quotation } from '../../../types/quotation'
import type { PendingGatePass } from '../services/delivery.service'

export function useNotifications() {
  // Pending items come from the balance engine via /deliveries/pending-gatepasses,
  // not from subtracting the raw records here. The local version dropped returns
  // and balance corrections, so a piece that was credited or handed back showed
  // as nothing pending in the notification badge while the delivery form still
  // offered it — the two counts disagreed about the same pass.
  const { data: pendingGPs = [], isLoading: gpLoading } = useQuery<PendingGatePass[]>({
    queryKey: ['notifications', 'pending-gatepasses'],
    queryFn: () => deliveriesApi.pendingGatePasses(),
    staleTime: 60_000,
  })

  const { data: quotations = [], isLoading: qLoading } = useQuotations()

  const gatePassPending: GatePassPendingEntry[] = useMemo(
    () =>
      pendingGPs.flatMap((gp) =>
        gp.items.map((item) => ({
          gate_pass_id: gp.gate_pass_id,
          gate_pass_number: gp.gate_pass_number,
          client_name: gp.client_name,
          item_name: item.item_name,
          received: item.received_qty,
          delivered: item.delivered_qty,
          returned: item.returned_qty,
          balance_adjusted: item.balance_adjustment_qty,
          pending: item.pending_qty,
        })),
      ),
    [pendingGPs],
  )

  const deliveredQuotations: Quotation[] = useMemo(
    () => quotations.filter((q) => q.status === 'delivered'),
    [quotations],
  )

  const pendingCount = gatePassPending.reduce((sum, e) => sum + e.pending, 0)
  const acceptedCount = deliveredQuotations.length
  const totalCount = pendingCount + acceptedCount

  const notificationItems: NotificationItem[] = useMemo(() => {
    const items: NotificationItem[] = []

    if (gatePassPending.length > 0) {
      const gpCount = new Set(gatePassPending.map((e) => e.gate_pass_number)).size
      items.push({
        id: 'gatepass_pending',
        type: 'gatepass_pending',
        title: 'Pending to Send',
        message: `${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending to be sent across ${gpCount} gate pass${gpCount !== 1 ? 'es' : ''}`,
        count: pendingCount,
        route: '/gate-passes',
        gatePassItems: gatePassPending,
      })
    }

    if (deliveredQuotations.length > 0) {
      items.push({
        id: 'quotation_delivered',
        type: 'quotation_delivered',
        title: 'Ready for Billing',
        message: `${deliveredQuotations.length} delivered order${deliveredQuotations.length !== 1 ? 's' : ''} awaiting billing`,
        count: deliveredQuotations.length,
        route: '/quotations',
        quotations: deliveredQuotations,
      })
    }

    return items
  }, [gatePassPending, pendingCount, deliveredQuotations])

  return {
    notificationItems,
    totalCount,
    pendingCount,
    acceptedCount,
    gatePassPending,
    deliveredQuotations,
    isLoading: gpLoading || qLoading,
  }
}
