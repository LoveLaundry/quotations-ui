import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { gatepasses } from '../services/gatepass.service'
import type { GatePassCreate } from '../../../types/operations'

export const gatepassKeys = {
    all: ['gatepasses'] as const,
    list: (params?: object) => [...gatepassKeys.all, 'list', params] as const,
    detail: (id: string) => [...gatepassKeys.all, id] as const,
}

export function useGatePasses(params?: { client_name?: string; status?: string }) {
    return useQuery({
        queryKey: gatepassKeys.list(params),
        queryFn: () => gatepasses.list(params),
    })
}

export function useGatePass(id?: string) {
    return useQuery({
        queryKey: gatepassKeys.detail(id ?? ''),
        queryFn: () => gatepasses.get(id ?? ''),
        enabled: Boolean(id),
    })
}

export function useCreateGatePass() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: GatePassCreate) => gatepasses.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: gatepassKeys.all })
            toast.success('Gate pass created successfully')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to create gate pass'),
    })
}

export function useUpdateGatePassStatus() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            gatepasses.updateStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: gatepassKeys.all })
            toast.success('Status updated')
        },
        onError: () => toast.error('Failed to update status'),
    })
}

export function useAdjustGatePass() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            item_name,
            corrected_qty,
            reason,
        }: {
            id: string
            item_name: string
            corrected_qty: number
            reason: string
        }) => gatepasses.adjust(id, item_name, corrected_qty, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: gatepassKeys.all })
            toast.success('Item quantity adjusted')
        },
        onError: () => toast.error('Failed to adjust quantity'),
    })
}
