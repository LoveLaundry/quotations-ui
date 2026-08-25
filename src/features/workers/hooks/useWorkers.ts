import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dailyLogs, workersService } from '../services/worker.service'
import type { DailyLogCreate, WorkerCreate } from '../types'

export const workerKeys = {
    all: ['workers'] as const,
    list: (activeOnly?: boolean) => [...workerKeys.all, 'list', activeOnly] as const,
}

export const dailyLogKeys = {
    all: ['daily-logs'] as const,
    list: (params?: object) => [...dailyLogKeys.all, 'list', params] as const,
    summary: (date: string) => [...dailyLogKeys.all, 'summary', date] as const,
}

export function useWorkers(activeOnly = false) {
    return useQuery({
        queryKey: workerKeys.list(activeOnly),
        queryFn: () => workersService.list(activeOnly),
    })
}

export function useCreateWorker() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: WorkerCreate) => workersService.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: workerKeys.all })
            toast.success('Worker added successfully')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to add worker'),
    })
}

export function useUpdateWorker() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WorkerCreate> }) =>
            workersService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: workerKeys.all })
            toast.success('Worker updated')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to update worker'),
    })
}

export function useDeleteWorker() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => workersService.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: workerKeys.all })
            toast.success('Worker removed')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to remove worker'),
    })
}

export function useDailyLogs(params?: { work_date?: string; worker_name?: string }) {
    return useQuery({
        queryKey: dailyLogKeys.list(params),
        queryFn: () => dailyLogs.list(params),
    })
}

export function useDailySummary(date: string) {
    return useQuery({
        queryKey: dailyLogKeys.summary(date),
        queryFn: () => dailyLogs.dailySummary(date),
    })
}

export function useCreateDailyLog() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: DailyLogCreate) => dailyLogs.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: dailyLogKeys.all })
            toast.success('Daily task log saved')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to save daily log'),
    })
}

export function useUpdateDailyLog() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DailyLogCreate> }) =>
            dailyLogs.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: dailyLogKeys.all })
            toast.success('Daily log updated')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to update daily log'),
    })
}

export function useDeleteDailyLog() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => dailyLogs.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: dailyLogKeys.all })
            toast.success('Daily log deleted')
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to delete daily log'),
    })
}
