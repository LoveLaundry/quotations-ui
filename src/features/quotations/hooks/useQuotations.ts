import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { quotationService } from '../services/quotation.service'
import { useNotify } from '../../feature-pack/hooks'
import type { Quotation, QuotationPayload, OrderStatus } from '../../../types/quotation'
import { invalidateResource } from '../../../cache/invalidation'
import { useAuth } from '../../../context/AuthContext'
import { isPlatformOnly } from '../../../lib/session-scope'

export const quotationKeys = {
  all: ['quotations'] as const,
  list: () => [...quotationKeys.all] as const,
  detail: (id: string) => [...quotationKeys.all, id] as const,
  tags: (id: string) => [...quotationKeys.all, 'tags', id] as const,
}

export function useQuotations() {
  const { user, support } = useAuth()
  return useQuery({
    queryKey: quotationKeys.list(),
    queryFn: quotationService.getAllQuotations,
    // The app shell reads quotations for the top bar and hotel context, so this
    // runs on every page. A platform-only session has no business fetching
    // tenant data — doing so produced a 403 on each screen load.
    enabled: !isPlatformOnly(user, support),
  })
}

export function useQuotation(id?: string) {
  return useQuery({
    queryKey: quotationKeys.detail(id ?? ''),
    queryFn: () => quotationService.getQuotation(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateQuotation() {
  const qc = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: QuotationPayload) => quotationService.createQuotation(payload),
    onSuccess: (created) => {
      // Drop the optimistic placeholder written by the form before the server
      // responded, then insert the real record.
      qc.setQueryData<Quotation[]>(quotationKeys.list(), (prev = []) => [
        created,
        ...prev.filter((row) => !String(row.id).startsWith('temp-')),
      ])
      qc.invalidateQueries({ queryKey: quotationKeys.list() })
      notify.success('Quotation created')
    },
    onError: () => notify.error('Failed to create quotation'),
  })
}

export function useUpdateQuotation() {
  const qc = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuotationPayload }) =>
      quotationService.updateQuotation(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData<Quotation[]>(quotationKeys.list(), (prev = []) =>
        prev.map(q => (q.id === updated.id ? updated : q)),
      )
      qc.setQueryData<Quotation>(quotationKeys.detail(String(updated.id)), updated)
      qc.invalidateQueries({ queryKey: quotationKeys.list() })
      notify.success('Quotation updated')
    },
    onError: () => notify.error('Failed to update quotation'),
  })
}

export function useDeleteQuotation() {
  const qc = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (id: string) => quotationService.deleteQuotation(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: quotationKeys.list() })
      const previous = qc.getQueryData<Quotation[]>(quotationKeys.list())
      qc.setQueryData<Quotation[]>(quotationKeys.list(), (prev = []) =>
        prev.filter(q => String(q.id) !== id),
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(quotationKeys.list(), ctx.previous)
      notify.error('Deletion failed')
    },
    onSuccess: (_r, id) => {
      qc.removeQueries({ queryKey: quotationKeys.detail(id) })
      invalidateResource(qc, 'quotations')
      notify.success('Quotation deleted')
    },
  })
}

export function useAdvanceQuotationStatus() {
  const qc = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      quotationService.advanceStatus(id, status, note),
    onSuccess: (updated) => {
      qc.setQueryData<Quotation>(quotationKeys.detail(String(updated.id)), updated)
      qc.invalidateQueries({ queryKey: quotationKeys.list() })
      notify.success(`Moved to "${updated.status}"`)
    },
    onError: (e: Error) => notify.error(e.message || 'Failed to update status'),
  })
}

export function useQuotationTags(id?: string) {
  return useQuery({
    queryKey: quotationKeys.tags(id ?? ''),
    queryFn: () => quotationService.listTags(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateTags() {
  const qc = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: { count?: number; per_item?: boolean; label?: string }
    }) => quotationService.createTags(id, body),
    onSuccess: (data, variables) => {
      // `quotationKeys.tags` is read by useQuotationTags as a TagsResponse
      // ({ quotation_id, tags }). Writing only the array here would flip the
      // cached entry's shape and crash every consumer of `data.tags`.
      // Write the full response, and cover the case where the server echoes a
      // different id than the one requested.
      const written = String(data.quotation_id)
      qc.setQueryData(quotationKeys.tags(written), data)
      if (written !== variables.id) {
        qc.setQueryData(quotationKeys.tags(variables.id), data)
      }
      notify.success(
        data.tags.length === 1 ? 'Tag generated' : `${data.tags.length} tags generated`,
      )
    },
    onError: () => notify.error('Failed to generate tags'),
  })
}
