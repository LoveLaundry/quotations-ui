import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { quotationService } from '../services/quotation.service'
import type { Quotation, QuotationPayload } from '../../../types/quotation'

export const quotationKeys = {
  all: ['quotations'] as const,
  list: () => [...quotationKeys.all] as const,
  detail: (id: string) => [...quotationKeys.all, id] as const,
}

export function useQuotations() {
  return useQuery({
    queryKey: quotationKeys.list(),
    queryFn: quotationService.getAllQuotations,
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: QuotationPayload) => quotationService.createQuotation(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<Quotation[]>(quotationKeys.list(), (existing = []) => [created, ...existing])
      queryClient.invalidateQueries({ queryKey: quotationKeys.list() })
      toast.success('Quotation created successfully')
    },
    onError: () => {
      toast.error('Unable to create quotation right now')
    },
  })
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuotationPayload }) =>
      quotationService.updateQuotation(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<Quotation[]>(quotationKeys.list(), (existing = []) =>
        existing.map((item) => (item.id === updated.id ? updated : item)),
      )
      queryClient.setQueryData<Quotation | null>(quotationKeys.detail(String(updated.id)), updated)
      queryClient.invalidateQueries({ queryKey: quotationKeys.list() })
      toast.success('Quotation updated successfully')
    },
    onError: () => {
      toast.error('Unable to update quotation right now')
    },
  })
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => quotationService.deleteQuotation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: quotationKeys.list() })
      const previous = queryClient.getQueryData<Quotation[]>(quotationKeys.list())
      queryClient.setQueryData<Quotation[]>(quotationKeys.list(), (existing = []) =>
        existing.filter((item) => item.id !== id),
      )
      return { previous, id }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(quotationKeys.list(), context.previous)
      }
      toast.error('Deletion failed')
    },
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: quotationKeys.detail(id) })
      toast.success('Quotation removed', {
        action: {
          label: 'Undo',
          onClick: () => {
            void queryClient.invalidateQueries({ queryKey: quotationKeys.list() })
            toast.success('Changes restored')
          },
        },
      })
    },
  })
}
