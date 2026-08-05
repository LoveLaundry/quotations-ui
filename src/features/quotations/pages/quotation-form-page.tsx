import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { useCreateQuotation, useQuotation, useUpdateQuotation } from '../hooks/useQuotations'
import type { QuotationFormValues } from '../../../types/quotation'

// ── Common item suggestions from real quotation data ──────────────────────
const COMMON_ITEMS = [
  'Bed Sheet', 'Bed Cover (Duvet Cover)', 'Bath Towel', 'Face Towel', 'Bath Mat',
  'Pillow Case', 'Duster', 'Table Runner', 'Table Cloth', 'Top Cloth', 'Napkin',
  'Chair Cover', 'Shirt / T-Shirt', 'Trouser', 'Stain Cloth', 'Protector',
  'Hand Towel', 'Pillow Protector', 'Pool Towel', 'Staff Bed Sheet', 'Bath Robe',
  'Shower Curtain', 'Carpet', 'Sarong', 'Jacket', 'Blazer', 'Curtain (1 Kg)',
  'Blanket', 'Duvet Protector', 'Mattress Protector', 'Pool Umbrella Cover',
  'Chef Coat', 'Spa Bed Sheet', 'Spa Bath Towel', 'Spa Face Towel',
]

const COMMON_CATEGORIES = [
  'Bed Linen', 'Towels', 'Restaurant Linen', 'Staff Clothing', 'Guest Clothing',
  'Spa Items', 'Curtains & Covers', 'Miscellaneous',
]

// ── Schemas ───────────────────────────────────────────────────────────────
const lineItemSchema = z.object({
  id:          z.string(),
  item_name:   z.string().trim().min(1, 'Required'),
  category:    z.string(),
  unit_price:  z.string().trim().min(1, 'Required'),
  notes:       z.string(),
})

const formSchema = z.object({
  client_name:       z.string().trim().min(1, 'Client / hotel name is required'),
  quotation_title:   z.string(),
  line_items: z.array(lineItemSchema).min(1, 'Add at least one item'),
})

const newItem = () => ({
  id: crypto.randomUUID(), item_name: '', category: '', unit_price: '', notes: '',
})

const defaultValues: QuotationFormValues = {
  client_name: '', quotation_title: '', line_items: [newItem()],
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-medium text-[#475467] mb-1">{children}</label>
}
function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-[11px] text-[#DC2626]">{msg}</p> : null
}

export default function QuotationFormPage() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = Boolean(id)

  const { data: existing, isLoading } = useQuotation(id)
  const createMutation = useCreateQuotation()
  const updateMutation = useUpdateQuotation()

  const { register, control, handleSubmit, reset, formState: { errors } } =
    useForm<QuotationFormValues>({ resolver: zodResolver(formSchema), defaultValues })

  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })

  useEffect(() => {
    if (!existing) return
    reset({
      client_name:     existing.client_name,
      quotation_title: existing.quotation_title ?? '',
      line_items: (existing.line_items ?? []).map(li => ({
        id:         crypto.randomUUID(),
        item_name:  li.item_name,
        category:   li.category ?? '',
        unit_price: String(li.unit_price),
        notes:      li.notes ?? '',
      })),
    })
  }, [existing, reset])

  // Collect existing categories for quick-select
  const cats = useMemo(() =>
    Array.from(new Set([
      ...COMMON_CATEGORIES,
      ...(existing?.line_items?.map(l => l.category ?? '').filter(Boolean) ?? []),
    ])).sort(),
  [existing])

  const onSubmit = (v: QuotationFormValues) => {
    const payload = {
      client_name:     v.client_name.trim(),
      quotation_title: v.quotation_title.trim() || undefined,
      line_items: v.line_items.map(li => ({
        item_name:  li.item_name.trim(),
        category:   li.category.trim() || undefined,
        unit_price: Number(li.unit_price),
        notes:      li.notes.trim() || undefined,
      })),
    }
    if (isEdit && id) {
      updateMutation.mutate({ id, payload }, { onSuccess: () => navigate('/quotations') })
    } else {
      createMutation.mutate(payload, { onSuccess: () => navigate('/quotations') })
    }
  }

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Quotations', href: '/quotations' },
          { label: isEdit ? 'Edit Quotation' : 'New Quotation' },
        ]} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-dashboard-title">
              {isEdit ? 'Edit Quotation' : 'New Quotation'}
            </h1>
            <p className="text-[13px] text-[#98A2B3] mt-0.5">
              {isEdit ? 'Update pricing for this hotel' : 'Create a price list for a hotel or client'}
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        </div>
      </div>

      {isLoading && isEdit ? (
        <div className="rounded-xl border border-[#E4E7EC] bg-[#FAFAFA] p-10 text-[13px] text-[#98A2B3] text-center">
          Loading quotation…
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Client info ── */}
          <Card>
            <CardHeader className="border-b border-[#F2F4F7] pb-4">
              <div>
                <CardTitle>Client / Hotel Details</CardTitle>
                <p className="text-[12px] text-[#98A2B3] mt-0.5">Name of the hotel or client this quotation is for</p>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Hotel / Client Name *</Label>
                  <Input {...register('client_name')} placeholder="e.g. Nilawin Hotel, Avenra Garden Hotel" />
                  <FieldErr msg={errors.client_name?.message} />
                </div>
                <div>
                  <Label>Quotation Title (optional)</Label>
                  <Input {...register('quotation_title')} placeholder="e.g. 2026 Price List, Annual Contract" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Line items ── */}
          <Card>
            <CardHeader className="border-b border-[#F2F4F7] pb-4">
              <div>
                <CardTitle>
                  Line Items
                  <span className="ml-2 text-[#98A2B3] font-normal text-[12px]">({fields.length} items)</span>
                </CardTitle>
                <p className="text-[12px] text-[#98A2B3] mt-0.5">
                  Each row = one item with its unit price in LKR
                </p>
              </div>
              <Button
                type="button" variant="secondary" size="sm"
                onClick={() => append(newItem())}
              >
                <Plus className="h-3.5 w-3.5 text-[#DC2626]" /> Add Item
              </Button>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Column headers (desktop) */}
              <div className="hidden sm:grid sm:grid-cols-[28px_1fr_180px_120px_120px_36px] gap-2 mb-2 px-1">
                {['', 'Item Name', 'Category', 'Unit Price (LKR)', 'Notes / Variant', ''].map((h, i) => (
                  <p key={i} className="text-[11px] font-semibold uppercase tracking-wider text-[#98A2B3]">{h}</p>
                ))}
              </div>

              {/* Common item suggestions */}
              <div className="mb-4 p-3 rounded-lg border border-[#E4E7EC] bg-[#FAFAFA]">
                <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                  Quick-add common items
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ITEMS.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => append({ ...newItem(), item_name: item })}
                      className="rounded-md border border-[#E4E7EC] bg-white px-2 py-0.5 text-[11px] font-medium text-[#374151] hover:border-[#FECACA] hover:bg-[#FFF1F1] hover:text-[#DC2626] transition-all cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              <datalist id="item-suggestions">
                {COMMON_ITEMS.map(i => <option key={i} value={i} />)}
              </datalist>
              <datalist id="cat-suggestions">
                {cats.map(c => <option key={c} value={c} />)}
              </datalist>

              {/* Rows */}
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="grid gap-2 rounded-lg border border-[#E4E7EC] bg-white p-3
                               grid-cols-1 sm:grid-cols-[28px_1fr_180px_120px_120px_36px] items-center
                               hover:border-[#D1D5DB] transition-colors"
                  >
                    {/* Drag handle */}
                    <div className="hidden sm:flex items-center justify-center text-[#D1D5DB]">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Item name */}
                    <div>
                      <p className="text-[11px] text-[#98A2B3] mb-1 sm:hidden">Item Name</p>
                      <Input
                        {...register(`line_items.${idx}.item_name` as const)}
                        list="item-suggestions"
                        placeholder="e.g. Bed Sheet"
                      />
                      <FieldErr msg={errors.line_items?.[idx]?.item_name?.message} />
                    </div>

                    {/* Category */}
                    <div>
                      <p className="text-[11px] text-[#98A2B3] mb-1 sm:hidden">Category</p>
                      <Input
                        {...register(`line_items.${idx}.category` as const)}
                        list="cat-suggestions"
                        placeholder="e.g. Bed Linen"
                      />
                    </div>

                    {/* Unit price */}
                    <div>
                      <p className="text-[11px] text-[#98A2B3] mb-1 sm:hidden">Unit Price (LKR)</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#9CA3AF]">LKR</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          {...register(`line_items.${idx}.unit_price` as const)}
                          placeholder="125.00"
                          className="pl-11"
                        />
                      </div>
                      <FieldErr msg={errors.line_items?.[idx]?.unit_price?.message} />
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-[11px] text-[#98A2B3] mb-1 sm:hidden">Notes</p>
                      <Input
                        {...register(`line_items.${idx}.notes` as const)}
                        placeholder="e.g. (S, D)"
                      />
                    </div>

                    {/* Remove */}
                    <Button
                      type="button" variant="ghost" size="icon"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1}
                      aria-label="Remove"
                      className="text-[#DC2626] hover:bg-[#FFF1F1] disabled:opacity-20 justify-self-end sm:justify-self-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add button below */}
              <button
                type="button"
                onClick={() => append(newItem())}
                className="mt-3 w-full rounded-lg border border-dashed border-[#E4E7EC] py-2.5 text-[12px] font-medium text-[#6B7280] hover:border-[#FECACA] hover:text-[#DC2626] hover:bg-[#FFF8F8] transition-all cursor-pointer"
              >
                + Add another item
              </button>

              <FieldErr msg={typeof errors.line_items?.message === 'string' ? errors.line_items.message : undefined} />

              {/* Summary */}
              {fields.length > 0 && (
                <div className="mt-4 rounded-lg border border-[#E4E7EC] bg-[#FAFAFA] px-4 py-3 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#6B7280]">
                    {fields.length} items in this quotation
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/quotations')}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? 'Save Changes' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
