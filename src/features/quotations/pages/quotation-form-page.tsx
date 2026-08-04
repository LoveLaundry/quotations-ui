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

const defaultValues = {
  category: '',
  item_name: '',
  size: '',
  options: [{ id: crypto.randomUUID(), name: 'Wash & Fold', price: '' }],
}

export default function QuotationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { data: quotation, isLoading } = useQuotation(id)
  const { data: quotations = [] } = useQuotations()
  const createMutation = useCreateQuotation()
  const updateMutation = useUpdateQuotation()

  // Collect all unique existing categories so users can easily pick from them or type a new one!
  const existingCategories = useMemo(() => {
    const set = new Set(quotations.map((q) => q.category?.trim()).filter(Boolean))
    return Array.from(set).sort()
  }, [quotations])

  // Form schema allows multiple items to share the SAME category
  const formSchema = z.object({
    category: z.string().trim().min(1, 'Category is required'),
    item_name: z.string().trim().min(1, 'Item name is required'),
    size: z.string().trim().min(1, 'Size is required'),
    options: z.array(optionSchema).min(1, 'At least one service type is required'),
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

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
        values.options
          .filter((o) => o.name.trim())
          .map((o) => [o.name.trim(), Number(o.price)]),
      ),
    }

    if (isEditing && id) {
      updateMutation.mutate({ id, payload }, { onSuccess: () => navigate('/quotations') })
      return
    }

    createMutation.mutate(payload, { onSuccess: () => navigate('/quotations') })
  }

  return (
    <div className="space-y-10 pb-16 select-none">
      {/* Navigation Header */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Laundry Accounts', href: '/quotations' },
            { label: isEditing ? 'Edit Item' : 'New Laundry Item' },
          ]}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Laundry Item' : 'Create Laundry Quotation'}
          </h1>
          <Button variant="secondary" size="lg" onClick={() => navigate('/quotations')} className="font-bold text-[20px]">
            <ArrowLeft className="mr-2 h-7 w-7" /> Back to Ledger
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200/90 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-6">
          <CardTitle className="text-card-title font-extrabold text-slate-900 flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-red-600" /> Item Details & Service Options
          </CardTitle>
          <p className="text-[18px] text-slate-500 font-medium pt-1">
            Define item classification, size standards, and individual service prices (Dry Clean, Pressing, Wash & Fold).
          </p>
        </CardHeader>
        <CardContent className="pt-8">
          {isLoading && isEditing ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-12 text-[22px] font-semibold text-slate-500 text-center">
              Loading laundry item record...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Category Input with Existing Category Selector */}
                <div className="space-y-3">
                  <label className="text-input-label text-slate-800">Category Name</label>
                  <Input
                    {...register('category')}
                    list="category-suggestions"
                    placeholder="e.g. Dry Cleaning, Guest Laundry, Suit Care"
                    className="h-16 text-[22px]"
                  />
                  <datalist id="category-suggestions">
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {existingCategories.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[16px] font-semibold text-slate-400 uppercase">Existing Categories:</span>
                      {existingCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setValue('category', cat)}
                          className={`rounded-xl px-3 py-1 text-[16px] font-bold border transition cursor-pointer ${
                            currentCategory === cat
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {errors.category ? (
                    <p className="text-[18px] font-semibold text-red-600">{errors.category.message}</p>
                  ) : null}
                </div>

                {/* Item Name Input */}
                <div className="space-y-3">
                  <label className="text-input-label text-slate-800">Item Name</label>
                  <Input
                    {...register('item_name')}
                    placeholder="e.g. 2-Piece Suit, Silk Scarf, Bed Linen"
                    className="h-16 text-[22px]"
                  />
                  {errors.item_name ? (
                    <p className="text-[18px] font-semibold text-red-600">{errors.item_name.message}</p>
                  ) : null}
                </div>
              </div>

              {/* Size Specification Input */}
              <div className="space-y-3">
                <label className="text-input-label text-slate-800">Size Specification</label>
                <Input
                  {...register('size')}
                  placeholder="e.g. Standard, King Size, Deluxe, Regular"
                  className="h-16 text-[22px]"
                />
                {errors.size ? (
                  <p className="text-[18px] font-semibold text-red-600">{errors.size.message}</p>
                ) : null}
              </div>

              {/* Service Types & Pricing Options Matrix */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-card-title font-extrabold text-slate-900">Service Types & Unit Rates</h3>
                    <p className="text-[18px] text-slate-500 font-medium pt-1">
                      Set pricing options for each service type available for this item
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="font-bold text-[18px]"
                    onClick={() => append({ id: crypto.randomUUID(), name: '', price: '' })}
                  >
                    <Plus className="mr-2 h-6 w-6 text-red-600" /> Add Service Rate
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid gap-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 md:grid-cols-[1fr_1fr_auto] items-end shadow-xs"
                    >
                      <div className="space-y-2">
                        <label className="text-input-label text-slate-700">Service Name</label>
                        <Input
                          {...register(`options.${index}.name` as const)}
                          placeholder="e.g. Dry Clean, Press Only, Steam"
                          className="h-16 text-[22px]"
                        />
                        {errors.options?.[index]?.name ? (
                          <p className="text-[17px] font-semibold text-red-600">
                            {errors.options[index]?.name?.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-input-label text-slate-700">Unit Price (₹ / $)</label>
                        <Input
                          type="number"
                          {...register(`options.${index}.price` as const)}
                          placeholder="e.g. 450"
                          className="h-16 text-[22px]"
                        />
                        {errors.options?.[index]?.price ? (
                          <p className="text-[17px] font-semibold text-red-600">
                            {errors.options[index]?.price?.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => fields.length > 1 && remove(index)}
                          disabled={fields.length <= 1}
                          className="h-16 w-16 rounded-2xl text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-7 w-7" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.options?.message ? (
                  <p className="text-[18px] font-semibold text-red-600">{errors.options.message}</p>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="font-bold text-[22px]"
                  onClick={() => navigate('/quotations')}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg" className="font-bold text-[22px] shadow-lg shadow-red-600/25">
                  {isEditing ? 'Save Changes' : 'Save Laundry Item'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
