import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react'
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
  name: z.string().trim().min(1, 'Service type is required'),
  price: z.string().trim().min(1, 'Price is required'),
})

const formSchema = z.object({
  category: z.string().trim().min(1, 'Category is required'),
  item_name: z.string().trim().min(1, 'Item name is required'),
  size: z.string().trim().min(1, 'Size is required'),
  options: z.array(optionSchema).min(1, 'At least one service type is required'),
})

const defaultValues: QuotationFormValues = {
  category: '',
  item_name: '',
  size: '',
  options: [{ id: crypto.randomUUID(), name: 'Wash & Fold', price: '' }],
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[12px] font-medium text-red-600">{message}</p>
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
    const set = new Set(quotations.map((q) => q.category?.trim()).filter(Boolean))
    return Array.from(set).sort()
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
        id: crypto.randomUUID(),
        name,
        price: String(price),
      })),
    })
  }, [quotation, reset])

  const onSubmit = (values: QuotationFormValues) => {
    const payload = {
      category: values.category.trim(),
      item_name: values.item_name,
      size: values.size,
      unit_price_with_options: Object.fromEntries(
        values.options.filter((o) => o.name.trim()).map((o) => [o.name.trim(), Number(o.price)]),
      ),
    }
    if (isEditing && id) {
      updateMutation.mutate({ id, payload }, { onSuccess: () => navigate('/quotations') })
    } else {
      createMutation.mutate(payload, { onSuccess: () => navigate('/quotations') })
    }
  }

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* Header */}
      <div className="space-y-1">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Quotations', href: '/quotations' },
          { label: isEditing ? 'Edit Item' : 'New Item' },
        ]} />
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Laundry Item' : 'New Laundry Item'}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-600" /> Item Details & Pricing
          </CardTitle>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Define item classification, size, and service prices.
          </p>
        </CardHeader>

        <CardContent className="pt-5">
          {isLoading && isEditing ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-[14px] text-slate-500 text-center">
              Loading item record…
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-input-label text-slate-700">Category</label>
                  <Input {...register('category')} list="category-suggestions" placeholder="e.g. Dry Cleaning" />
                  <datalist id="category-suggestions">
                    {existingCategories.map((cat) => <option key={cat} value={cat} />)}
                  </datalist>
                  {existingCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {existingCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setValue('category', cat)}
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border transition cursor-pointer ${
                            currentCategory === cat
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  <FormError message={errors.category?.message} />
                </div>

                {/* Item Name */}
                <div className="space-y-1.5">
                  <label className="text-input-label text-slate-700">Item Name</label>
                  <Input {...register('item_name')} placeholder="e.g. 2-Piece Suit" />
                  <FormError message={errors.item_name?.message} />
                </div>
              </div>

              {/* Size */}
              <div className="space-y-1.5">
                <label className="text-input-label text-slate-700">Size</label>
                <Input {...register('size')} placeholder="e.g. Standard, King Size" />
                <FormError message={errors.size?.message} />
              </div>

              {/* Service rates */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">Service Types & Rates</p>
                    <p className="text-[12px] text-slate-500">Set pricing for each service type</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => append({ id: crypto.randomUUID(), name: '', price: '' })}
                  >
                    <Plus className="h-3.5 w-3.5 text-red-600" /> Add Rate
                  </Button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end"
                    >
                      <div className="space-y-1">
                        <label className="text-input-label text-slate-600">Service Name</label>
                        <Input {...register(`options.${index}.name` as const)} placeholder="e.g. Dry Clean" />
                        <FormError message={errors.options?.[index]?.name?.message} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-input-label text-slate-600">Unit Price (₹ / $)</label>
                        <Input type="number" {...register(`options.${index}.price` as const)} placeholder="e.g. 450" />
                        <FormError message={errors.options?.[index]?.price?.message} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label="Remove"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => navigate('/quotations')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
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
