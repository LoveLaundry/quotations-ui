import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gatepasses } from '../services/gatepass.service'
import { returns as returnsApi } from '../services/returns.service'
import { useDeliveries } from './useDeliveries'
import { useQuotations } from './useQuotations'
import type { NotificationItem, GatePassPendingEntry } from '../../../types/notification'
import type { Quotation } from '../../../types/quotation'
import type { GatePass, Return, ReturnItem } from '../../../types/operations'

export function useNotifications() {
  const { data: gatePasses = [], isLoading: gpLoading } = useQuery<GatePass[]>({
    queryKey: ['notifications', 'gatepasses'],
    queryFn: () => gatepasses.list(),
    staleTime: 60_000,
  })

  const { data: deliveryList = [], isLoading: dLoading } = useDeliveries()

  const { data: quotations = [], isLoading: qLoading } = useQuotations()

  const { data: returnsList = [], isLoading: rLoading } = useQuery<Return[]>({
    queryKey: ['notifications', 'returns'],
    queryFn: () => returnsApi.list().then((r: any) => Array.isArray(r) ? r : r?.items ?? []),
    staleTime: 60_000,
  })

  const gatePassPending: GatePassPendingEntry[] = useMemo(() => {
    const deliveredByPass = new Map<string, Map<string, number>>()
    for (const d of deliveryList) {
      const key = d.gate_pass_id
      let m = deliveredByPass.get(key)
      if (!m) {
        m = new Map()
        deliveredByPass.set(key, m)
      }
      for (const it of d.items ?? []) {
        m.set(it.item_name, (m.get(it.item_name) ?? 0) + (Number(it.quantity) || 0))
      }
    }

    // Build returned items map: client_name → { item_name → qty }
    const returnedByClient = new Map<string, Map<string, number>>()
    for (const ret of returnsList) {
      for (const item of (ret.items ?? []) as ReturnItem[]) {
        if ((item.action === 'RECEIVE_BACK' || item.action === 'RE_WASH') && item.resend_status !== 'SENT') {
          const client = (ret.client_name ?? '').trim()
          if (!client) continue
          let m = returnedByClient.get(client)
          if (!m) {
            m = new Map()
            returnedByClient.set(client, m)
          }
          m.set(item.item_name, (m.get(item.item_name) ?? 0) + (Number(item.returned_qty) || 0))
        }
      }
    }

    const result: GatePassPendingEntry[] = []
    for (const gp of gatePasses) {
      const lookupKeys = [gp.id, (gp as { _id?: string })._id, gp.gate_pass_number].filter(
        Boolean,
      ) as string[]
      let delMap: Map<string, number> | undefined
      for (const k of lookupKeys) {
        const found = deliveredByPass.get(k)
        if (found) {
          delMap = found
          break
        }
      }

      const clientReturned = returnedByClient.get((gp.client_name ?? '').trim()) ?? new Map()

      for (const item of gp.items ?? []) {
        const received = Number(item.received_qty) || 0
        const delivered = Number(delMap?.get(item.item_name) ?? 0)
        const retQty = Number(clientReturned.get(item.item_name) ?? 0)
        const pending = Math.max(0, received - delivered + retQty)
        if (pending > 0) {
          result.push({
            gate_pass_id: gp.id ?? (gp as { _id?: string })._id ?? '',
            gate_pass_number: gp.gate_pass_number,
            client_name: gp.client_name,
            item_name: item.item_name,
            received,
            delivered,
            pending,
          })
        }
      }
    }
    return result
  }, [gatePasses, deliveryList, returnsList])

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
    isLoading: gpLoading || dLoading || qLoading || rLoading,
  }
}
