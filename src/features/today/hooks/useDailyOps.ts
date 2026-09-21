import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ops } from '../services/ops.service'
import { deliveries, type PendingGatePass } from '../../quotations/services/delivery.service'
import { invalidateDeliveryData } from '../../quotations/hooks/useGatePasses'

export const opsKeys = {
  all: ['ops'] as const,
  adjustments: (status?: string) => [...opsKeys.all, 'adjustments', status ?? 'ALL'] as const,
  reconciliation: (status?: string) => [...opsKeys.all, 'reconciliation', status ?? 'ALL'] as const,
  events: (date?: string) => [...opsKeys.all, 'events', date ?? 'ALL'] as const,
}

export function useAdjustments(status?: string) {
  return useQuery({
    queryKey: opsKeys.adjustments(status),
    queryFn: () => ops.adjustments.list(status ? { status } : undefined),
  })
}

export function useApproveAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ops.adjustments.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: opsKeys.all })
      invalidateDeliveryData(qc)
      toast.success('Adjustment approved')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to approve adjustment'),
  })
}

export function useRejectAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ops.adjustments.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: opsKeys.all })
      invalidateDeliveryData(qc)
      toast.success('Adjustment rejected')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to reject adjustment'),
  })
}

export function useReconciliationIssues(status?: string) {
  return useQuery({
    queryKey: opsKeys.reconciliation(status),
    queryFn: () => ops.reconciliation.issues(status ? { status } : undefined),
  })
}

export function useEvents(date?: string) {
  return useQuery({
    queryKey: opsKeys.events(date),
    queryFn: () => ops.events.list(date ? { date } : undefined),
  })
}

export function usePendingGatePasses() {
  return useQuery<PendingGatePass[]>({
    queryKey: [...opsKeys.all, 'pending-gatepasses'],
    queryFn: () => deliveries.pendingGatePasses(),
  })
}
