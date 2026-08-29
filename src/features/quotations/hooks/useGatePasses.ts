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

export function useUpdateGatePassDate() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            receiving_date,
            reason,
        }: {
            id: string
            receiving_date: string
            reason?: string
        }) => gatepasses.updateDate(id, receiving_date, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: gatepassKeys.all })
            toast.success('Receiving date updated')
        },
        onError: () => toast.error('Failed to update receiving date'),
    })
}

export function useCreateBillFromGatePass() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            gate_pass_id,
            instant,
            notes,
            quotation_id,
            client_name,
        }: {
            gate_pass_id: string
            instant?: boolean
            notes?: string
            quotation_id?: string
            client_name?: string
        }) =>
            gatepasses.createBillFromGatePass(gate_pass_id, {
                instant,
                notes,
                quotation_id,
                client_name,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: gatepassKeys.all })
            toast.success('Bill created from gate pass')
        },
        onError: (e: any) => toast.error(e?.message || 'Failed to create bill'),
    })
}
