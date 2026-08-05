import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { useCreateQuotation, useQuotation, useQuotations, useUpdateQuotation } from '../hooks/useQuotations'
import type { QuotationFormValues } from '../../../types/quotation'

const optionSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Required'),
  price: z.string().trim().min(1, 'Required'),
})
const formSchema = z.object({
  category: z.string().trim().min(1, 'Required'),
  item_name: z.string().trim().min(1, 'Required'),
  size: z.string().trim().min(1, 'Required'),
  options: z.array(optionSchema).min(1, 'At least one service required'),
})
const defaultValues: QuotationFormValues = {
  category: '', item_name: '', size: '',
  options: [{ id: crypto.randomUUID(), name: 'Wash & Fold', price: '' }],
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-medium text-[#475467] mb-1">{children}</label>
}
function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-[11px] text-[#DC2626]">{msg}</p> : null
}

export default function QuotationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { data: quotation, isLoading } = useQuotation(id)
  const { data: quotations = [] } = useQuotations()
  const createMutation = useCreateQuotation()
  const updateMutation = useUpdateQuotation()

  const existingCategories = useMemo(() => {
    const s = new Set(quotations.map(q => q.category?.trim()).filter(Boolean))
    return Array.from(s).sort()
  }, [quotations])

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<QuotationFormValues>({ resolver: zodResolver(formSchema), defaultValues })

  const currentCategory = watch('category')
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })

  useEffect(() => {
    if (!quotation) return
    reset({
      category: quotation.category ?? '',
      item_name: quotation.item_name,
      size: quotation.size,
      options: Object.entries(quotation.unit_price_with_options).map(([name, price]) => ({
        id: crypto.randomUUID(), name, price: String(price),
      })),
    })
  }, [quotation, reset])

  const onSubmit = (v: QuotationFormValues) => {
    const payload = {
      category: v.category.trim(),
      item_name: v.item_name,
      size: v.size,
      unit_price_with_options: Object.fromEntries(
        v.options.filter(o => o.name.trim()).map(o => [o.name.trim(), Number(o.price)]),
      ),
    }
    if (isEditing && id) updateMutation.mutate({ id, payload }, { onSuccess: () => navigate('/quotations') })
    else createMutation.mutate(payload, { onSuccess: () => navigate('/quotations') })
  }

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Quotations', href: '/quotations' }, { label: isEditing ? 'Edit' : 'New' }]} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-dashboard-title">{isEditing ? 'Edit Laundry Item' : 'New Laundry Item'}</h1>
          <Button variant="secondary" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-[#F2F4F7] pb-4">
          <div>
            <CardTitle>Item Details & Pricing</CardTitle>
            <p className="text-[12px] text-[#98A2B3] mt-1">Fill in the classification, size, and pricing options.</p>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {isLoading && isEditing ? (
            <div className="rounded-xl border border-[#E4E7EC] bg-[#FAFAFA] p-8 text-[13px] text-[#98A2B3] text-center">
              Loading item…
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category */}
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Input {...register('category')} list="cat-list" placeholder="e.g. Dry Cleaning" />
                  <datalist id="cat-list">
                    {existingCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {existingCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {existingCategories.map(c => (
                        <button
                          key={c} type="button" onClick={() => setValue('category', c)}
                          className={[
                            'rounded-md px-2 py-0.5 text-[11px] font-medium border transition cursor-pointer',
                            currentCategory === c
                              ? 'bg-[#DC2626] text-white border-[#DC2626]'
                              : 'bg-white text-[#374151] border-[#E4E7EC] hover:border-[#D1D5DB]',
                          ].join(' ')}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  <FieldError msg={errors.category?.message} />
                </div>

                {/* Item name */}
                <div>
                  <FieldLabel>Item Name</FieldLabel>
                  <Input {...register('item_name')} placeholder="e.g. 2-Piece Suit" />
                  <FieldError msg={errors.item_name?.message} />
                </div>
              </div>

              {/* Size */}
              <div>
                <FieldLabel>Size</FieldLabel>
                <Input {...register('size')} placeholder="e.g. Standard, King Size" />
                <FieldError msg={errors.size?.message} />
              </div>

              {/* Service rates section */}
              <div className="pt-4 border-t border-[#F2F4F7]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#101828]">Service Types & Rates</p>
                    <p className="text-[12px] text-[#98A2B3] mt-0.5">Set a price for each service type</p>
                  </div>
                  <Button
                    type="button" variant="secondary" size="sm"
                    onClick={() => append({ id: crypto.randomUUID(), name: '', price: '' })}
                  >
                    <Plus className="h-3.5 w-3.5 text-[#DC2626]" /> Add Rate
                  </Button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="grid gap-3 rounded-xl border border-[#E4E7EC] bg-[#FAFAFA] p-3 sm:grid-cols-[1fr_1fr_auto] items-end"
                    >
                      <div>
                        <FieldLabel>Service Name</FieldLabel>
                        <Input {...register(`options.${idx}.name` as const)} placeholder="e.g. Dry Clean" />
                        <FieldError msg={errors.options?.[idx]?.name?.message} />
                      </div>
                      <div>
                        <FieldLabel>Unit Price (₹ / $)</FieldLabel>
                        <Input type="number" {...register(`options.${idx}.price` as const)} placeholder="450" />
                        <FieldError msg={errors.options?.[idx]?.price?.message} />
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => remove(idx)}
                        disabled={fields.length === 1}
                        aria-label="Remove"
                        className="text-[#DC2626] hover:bg-[#FFF1F1] disabled:opacity-30 self-end"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#F2F4F7]">
                <Button type="button" variant="secondary" onClick={() => navigate('/quotations')}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {isEditing ? 'Save Changes' : 'Create Quotation'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
