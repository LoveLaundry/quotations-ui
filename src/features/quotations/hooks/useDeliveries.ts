import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deliveries } from '../services/delivery.service'
import { invalidateDeliveryData } from './useGatePasses'
import type { DeliveryCreate } from '../../../types/operations'

export const deliveryKeys = {
    all: ['deliveries'] as const,
    list: (params?: object) => [...deliveryKeys.all, 'list', params] as const,
    detail: (id: string) => [...deliveryKeys.all, id] as const,
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
