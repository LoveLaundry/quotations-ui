import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '../../management/api/management-api'
import { invalidateDeliveryData } from '../../quotations/hooks/useGatePasses'
import {
    todaySheetApi,
    type TodayExpenseInput,
    type TodayExpenseRecord,
    type TodaySheetCommitPayload,
    type TodaySheetCommitResponse,
} from '../services/today-sheet.service'

export const todaySheetKeys = {
    all: ['today-sheet'] as const,
    sheet: (date: string) => [...todaySheetKeys.all, 'sheet', date] as const,
    expenses: (date: string) => [...todaySheetKeys.all, 'expenses', date] as const,
    categories: () => [...todaySheetKeys.all, 'expense-categories'] as const,
}

export function useTodaySheet(date: string) {
    return useQuery({
        queryKey: todaySheetKeys.sheet(date),
        queryFn: () => todaySheetApi.get(date),
        enabled: Boolean(date),
    })
}

function asExpenses(payload: unknown): TodayExpenseRecord[] {
    if (Array.isArray(payload)) return payload as TodayExpenseRecord[]
    const items = (payload as { items?: unknown } | null)?.items
    return Array.isArray(items) ? items as TodayExpenseRecord[] : []
}

/** Expenses are recorded in the management service; the sheet only reads them. */
export function useTodayExpenses(date: string) {
    return useQuery<TodayExpenseRecord[]>({
        queryKey: todaySheetKeys.expenses(date),
        queryFn: () => expensesApi
            .list({ start_date: date, end_date: date, limit: 200 })
            .then(r => asExpenses(r.data)),
        enabled: Boolean(date),
        retry: 1,
    })
}

export function useExpenseCategories() {
    return useQuery<string[]>({
        queryKey: todaySheetKeys.categories(),
        queryFn: () => expensesApi.categories().then(r => {
            const payload = r.data as unknown
            const rows = Array.isArray(payload)
                ? payload
                : ((payload as { items?: unknown[] } | null)?.items ?? [])
            return rows
                .map(row => {
                    if (typeof row === 'string') return row
                    const obj = row as Record<string, unknown>
                    return String(obj.category_name ?? obj.name ?? '').trim()
                })
                .filter(Boolean)
        }),
        retry: 1,
    })
}

export interface SaveTodaySheetArgs {
    sheet: TodaySheetCommitPayload
    expenses: TodayExpenseInput[]
}

export interface FailedGroup {
    kind: 'receive' | 'delivery'
    client_name: string
    error?: string
}

export interface SaveTodaySheetResult {
    commit?: TodaySheetCommitResponse
    expenseFailures: number
    /** Positions in the submitted expense array that must stay in the editor. */
    failedExpenseIndexes: number[]
    failedGroups: FailedGroup[]
    failures: number
    saved: boolean
}

/** One "Save Day": commit the linen sheet, then post each expense line.
 *
 *  Results are returned per row (not just as a boolean) so the page can clear
 *  only the entries that were actually written and leave failed rows staged for
 *  correction. A retry must never duplicate a row that succeeded the first time.
 */
export function useSaveTodaySheet() {
    const qc = useQueryClient()

    return useMutation<SaveTodaySheetResult, Error, SaveTodaySheetArgs>({
        mutationFn: async ({ sheet, expenses }) => {
            const hasLinen = sheet.receives.length > 0 || sheet.deliveries.length > 0
            const commit = hasLinen ? await todaySheetApi.commit(sheet) : undefined

            const failedExpenseIndexes: number[] = []
            for (const [index, expense] of expenses.entries()) {
                try {
                    await expensesApi.create(expense)
                } catch {
                    failedExpenseIndexes.push(index)
                }
            }

            const failedGroups: FailedGroup[] = (commit?.results ?? [])
                .filter(row => !row.ok)
                .map(row => ({ kind: row.kind, client_name: row.client_name, error: row.error }))

            return {
                commit,
                expenseFailures: failedExpenseIndexes.length,
                failedExpenseIndexes,
                failedGroups,
                failures: failedGroups.length + failedExpenseIndexes.length,
                saved: Boolean(commit || expenses.length),
            }
        },
        onSuccess: result => {
            if (!result.saved) return
            // Refresh even on partial success: committed rows belong in history.
            qc.invalidateQueries({ queryKey: todaySheetKeys.all })
            qc.invalidateQueries({ queryKey: ['ops'] })
            invalidateDeliveryData(qc)
        },
    })
}
