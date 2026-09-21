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
    const ik = (name?: string, spec?: string) => (spec ? `${name}||${spec}` : name ?? '')

    const deliveredByPass = new Map<string, Map<string, number>>()
    for (const d of deliveryList) {
      const key = d.gate_pass_id
      let m = deliveredByPass.get(key)
      if (!m) {
        m = new Map()
        deliveredByPass.set(key, m)
      }
      for (const it of d.items ?? []) {
        const k = ik(it.item_name, it.specification)
        m.set(k, (m.get(k) ?? 0) + (Number(it.quantity) || 0))
      }
    }

    // Built returned items map: gate_pass_id → { item||spec → qty }. Returns
    // carry their own gate_pass_id so they only count for the pass they were
    // raised on — never another pass of the same client.
    const returnedByPass = new Map<string, Map<string, number>>()
    for (const ret of returnsList) {
      const passId = String(ret.gate_pass_id ?? '')
      if (!passId) continue
      let m = returnedByPass.get(passId)
      if (!m) {
        m = new Map()
        returnedByPass.set(passId, m)
      }
      for (const item of (ret.items ?? []) as ReturnItem[]) {
        if ((item.action === 'RECEIVE_BACK' || item.action === 'RE_WASH') && item.resend_status !== 'SENT') {
          const k = ik(item.item_name, item.specification)
          m.set(k, (m.get(k) ?? 0) + (Number(item.returned_qty) || 0))
        }
      }
    }

    const result: GatePassPendingEntry[] = []
    for (const gp of gatePasses) {
      const isMarkedDelivered = Boolean(gp.marked_delivered)
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

      const passReturned = returnedByPass.get(gp.id ?? (gp as { _id?: string })._id ?? '') ?? new Map()

      for (const item of gp.items ?? []) {
        const k = ik(item.item_name, item.specification)
        const received = Number(item.received_qty) || 0
        const delivered = isMarkedDelivered ? received : Number(delMap?.get(k) ?? 0)
        const retQty = Number(passReturned.get(k) ?? 0)
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
