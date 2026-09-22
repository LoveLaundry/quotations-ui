import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { gatepasses } from '../services/gatepass.service'
import type { GatePass, GatePassCreate, GatePassMarkDelivered } from '../../../types/operations'

export const gatepassKeys = {
    all: ['gatepasses'] as const,
    list: (params?: object) => [...gatepassKeys.all, 'list', params] as const,
    detail: (id: string) => [...gatepassKeys.all, id] as const,
}

/**
 * Query keys whose results depend on gate pass delivery state.
 * Any delivery / status / quantity change must invalidate all of these or
 * dashboards and reports keep showing stale pending totals.
 */
export const DELIVERY_DEPENDENT_KEYS = [
    ['gatepasses'],
    ['deliveries'],
    ['dashboard'],
    ['reports'],
    ['notifications'],
    ['pending-gatepasses'],
    ['client-summary'],
    ['events'],
] as const

export function invalidateDeliveryData(qc: QueryClient) {
    for (const queryKey of DELIVERY_DEPENDENT_KEYS) {
        qc.invalidateQueries({ queryKey })
    }
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
            invalidateDeliveryData(qc)
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
            invalidateDeliveryData(qc)
            toast.success('Status updated')
        },
        onError: () => toast.error('Failed to update status'),
    })
}

export function useMarkGatePassDelivered() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: GatePassMarkDelivered }) =>
            gatepasses.markDelivered(id, data),
        onSuccess: (res: GatePass) => {
            invalidateDeliveryData(qc)
            toast.success(`Gate pass marked delivered${res?.marked_delivered ? ' with note' : ''}`)
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail || e?.message || 'Failed to mark delivered'),
    })
}

export function useReopenLegacyGatePass() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => gatepasses.reopenLegacy(id),
        onSuccess: () => {
            invalidateDeliveryData(qc)
            toast.success('Gate pass reopened — it is pending delivery again')
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail || e?.message || 'Failed to reopen gate pass'),
    })
}

export function useReopenLegacyBatch() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => gatepasses.reopenLegacyBatch(),
        onSuccess: (res) => {
            invalidateDeliveryData(qc)
            const n = res?.reopened?.length ?? 0
            toast.success(
                n > 0
                    ? `${n} legacy gate pass${n !== 1 ? 'es' : ''} reopened — pending delivery again`
                    : 'Nothing to migrate — no eligible legacy note closures',
            )
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail || e?.message || 'Failed to run legacy migration'),
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
            invalidateDeliveryData(qc)
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
            invalidateDeliveryData(qc)
            toast.success('Receiving date updated')
        },
        onError: () => toast.error('Failed to update receiving date'),
    })
}

export function useUpdateGatePass() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string
            payload: Parameters<typeof gatepasses.update>[1]
        }) => gatepasses.update(id, payload),
        onSuccess: () => {
            invalidateDeliveryData(qc)
            toast.success('Gate pass updated')
        },
        onError: () => toast.error('Failed to update gate pass'),
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
            invalidateDeliveryData(qc)
            toast.success('Bill created from gate pass')
        },
        onError: (e: any) => toast.error(e?.message || 'Failed to create bill'),
    })
}
