import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deliveries } from '../services/delivery.service'
import { invalidateDeliveryData } from './useGatePasses'
import type { BalanceAdjustmentCreate, DeliveryCreate } from '../../../types/operations'

export const deliveryKeys = {
    all: ['deliveries'] as const,
    list: (params?: object) => [...deliveryKeys.all, 'list', params] as const,
    detail: (id: string) => [...deliveryKeys.all, id] as const,
    balanceReport: (id: string) => [...deliveryKeys.all, id, 'balance-report'] as const,
    adjustments: (params: object) => [...deliveryKeys.all, 'adjustments', params] as const,
}

export function useDeliveries(params?: { client_name?: string; gate_pass_id?: string }) {
    return useQuery({
        queryKey: deliveryKeys.list(params),
        queryFn: () => deliveries.list(params),
    })
}

export function useDelivery(id?: string) {
    return useQuery({
        queryKey: deliveryKeys.detail(id ?? ''),
        queryFn: () => deliveries.get(id ?? ''),
        enabled: Boolean(id),
    })
}

export function useCreateDelivery() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: DeliveryCreate) => deliveries.create(data),
        onSuccess: () => {
            invalidateDeliveryData(qc)
            toast.success('Delivery recorded successfully')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to record delivery'),
    })
}

export function useUpdateDeliveryDate() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, delivery_date, reason }: { id: string; delivery_date: string; reason?: string }) =>
            deliveries.updateDate(id, delivery_date, reason),
        onSuccess: () => {
            invalidateDeliveryData(qc)
            toast.success('Delivery date updated')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to update delivery date'),
    })
}

export function useDeliveryBalanceReport(deliveryId?: string) {
    return useQuery({
        queryKey: deliveryKeys.balanceReport(deliveryId ?? ''),
        queryFn: () => deliveries.balanceReport(deliveryId ?? ''),
        enabled: Boolean(deliveryId),
    })
}

export function useDeliveryAdjustments(params: { gate_pass_id?: string; delivery_id?: string }) {
    return useQuery({
        queryKey: deliveryKeys.adjustments(params),
        queryFn: () => deliveries.adjustments(params),
        enabled: Boolean(params.gate_pass_id || params.delivery_id),
    })
}

export function useCreateBalanceAdjustment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: BalanceAdjustmentCreate) => deliveries.createAdjustment(data),
        onSuccess: () => {
            invalidateDeliveryData(qc)
            qc.invalidateQueries({ queryKey: deliveryKeys.all })
            toast.success('Balance adjustment recorded')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to record balance adjustment'),
    })
}

export function useVoidBalanceAdjustment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => deliveries.voidAdjustment(id, reason),
        onSuccess: () => {
            invalidateDeliveryData(qc)
            qc.invalidateQueries({ queryKey: deliveryKeys.all })
            toast.success('Balance adjustment voided')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to void balance adjustment'),
    })
}
