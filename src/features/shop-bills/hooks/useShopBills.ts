import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { shopBillService } from '../services/shop-bill.service'
import type { ShopBillCreate, ShopBillListParams, ShopBillPayment } from '../../../types/shop-bill'

export const shopBillKeys = {
  all: ['shop-bills'] as const,
  list: (params: ShopBillListParams) => [...shopBillKeys.all, 'list', params] as const,
  detail: (id: string) => [...shopBillKeys.all, id] as const,
}

export function useShopBills(params: ShopBillListParams = {}) {
  return useQuery({
    queryKey: shopBillKeys.list(params),
    queryFn: () => shopBillService.list(params),
  })
}

export function useShopBill(id?: string) {
  return useQuery({
    queryKey: shopBillKeys.detail(id ?? ''),
    queryFn: () => shopBillService.get(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateShopBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShopBillCreate) => shopBillService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Shop bill created')
    },
    onError: () => toast.error('Failed to create shop bill'),
  })
}

export function useUpdateShopBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ShopBillCreate> }) =>
      shopBillService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Shop bill updated')
    },
    onError: () => toast.error('Failed to update shop bill'),
  })
}

export function useRecordShopBillPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ShopBillPayment }) =>
      shopBillService.recordPayment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Payment recorded')
    },
    onError: () => toast.error('Failed to record payment'),
  })
}

export function useDeleteShopBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shopBillService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Shop bill deleted')
    },
    onError: () => toast.error('Failed to delete shop bill'),
  })
}
