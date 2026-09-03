import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { shopBillService } from '../services/shop-bill.service'
import type { ShopBillCreate, ShopBillListParams, ShopBillPayment, BillTemplateCreate } from '../../../types/shop-bill'

export const shopBillKeys = {
  all: ['shop-bills'] as const,
  list: (params: ShopBillListParams) => [...shopBillKeys.all, 'list', params] as const,
  detail: (id: string) => [...shopBillKeys.all, id] as const,
  templates: ['shop-bill-templates'] as const,
  templateList: (search?: string) => [...shopBillKeys.templates, search] as const,
  templateDetail: (id: string) => [...shopBillKeys.templates, id] as const,
  recurringDue: ['shop-bills', 'recurring-due'] as const,
  expiring: (days: number) => ['shop-bills', 'expiring', days] as const,
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
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) =>
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

export function useDuplicateShopBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shopBillService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Bill duplicated')
    },
    onError: () => toast.error('Failed to duplicate bill'),
  })
}

export function useBulkUpdateShopBillStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      shopBillService.bulkStatus(ids, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success(`${data.updated} bill(s) updated`)
    },
    onError: () => toast.error('Failed to update bills'),
  })
}

export function useShopBillTemplates(search?: string) {
  return useQuery({
    queryKey: shopBillKeys.templateList(search),
    queryFn: () => shopBillService.listTemplates(search),
  })
}

export function useCreateBillTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BillTemplateCreate) => shopBillService.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.templates })
      toast.success('Template created')
    },
    onError: () => toast.error('Failed to create template'),
  })
}

export function useDeleteBillTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shopBillService.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.templates })
      toast.success('Template deleted')
    },
    onError: () => toast.error('Failed to delete template'),
  })
}

export function useQuickBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clientName, templateId }: { clientName: string; templateId?: string }) =>
      shopBillService.quickBill(clientName, templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Quick bill created')
    },
    onError: () => toast.error('Failed to create quick bill'),
  })
}

export function useManualBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clientName, amount, date, notes }: { clientName: string; amount: number; date?: string; notes?: string }) =>
      shopBillService.manualBill(clientName, amount, date, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Bill created')
    },
    onError: () => toast.error('Failed to create bill'),
  })
}

export function useSplitShopBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, itemIndices }: { billId: string; itemIndices: number[] }) =>
      shopBillService.split(billId, itemIndices),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Bill split successfully')
    },
    onError: () => toast.error('Failed to split bill'),
  })
}

export function useMergeShopBills() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (billIds: string[]) => shopBillService.merge(billIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Bills merged successfully')
    },
    onError: () => toast.error('Failed to merge bills'),
  })
}

export function useMakeRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, interval, endDate }: { billId: string; interval: string; endDate?: string }) =>
      shopBillService.makeRecurring(billId, interval, endDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shopBillKeys.all })
      toast.success('Recurring schedule set')
    },
    onError: () => toast.error('Failed to set recurring'),
  })
}

export function useExpiringBills(days: number = 7) {
  return useQuery({
    queryKey: shopBillKeys.expiring(days),
    queryFn: () => shopBillService.getExpiring(days),
  })
}
