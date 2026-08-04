import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Badge } from '../../../components/ui/badge'
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

  const formSchema = z.object({
    category: z.string().trim().min(1, 'Category is required'),
    item_name: z.string().trim().min(1, 'Item name is required'),
    size: z.string().trim().min(1, 'Size is required'),
    options: z.array(optionSchema).min(1, 'At least one service type is required'),
  }).superRefine((values, ctx) => {
    const normalizedCategory = values.category.trim().toLowerCase()
    if (!normalizedCategory) return

    const hasDuplicate = quotations.some(
      (existing) => existing.id !== id && existing.category?.trim().toLowerCase() === normalizedCategory,
    )

    if (hasDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: 'This category is already used by another quotation',
      })
    }
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

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
      updateMutation.mutate({ id, payload }, { onSuccess: () => navigate(`/quotations/${id}`) })
      return
    }

    createMutation.mutate(payload, { onSuccess: () => navigate('/quotations') })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Quotations', href: '/quotations' },
            { label: isEditing ? 'Edit' : 'New' },
          ]}
        />
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="mr-2 h-7 w-7" /> Back
          </Button>
          <Badge>{isEditing ? 'Edit' : 'Create'}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Quotation' : 'New Quotation'}</CardTitle>
          <p className="text-body text-slate-500">
            Add item details and define pricing for each service type.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="rounded-lg border border-surface-border bg-slate-50 p-8 text-body text-slate-500">
              Loading quotation...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-label text-slate-700">Category</label>
                  <Input {...register('category')} placeholder="Hotel, Guest, Residence" />
                  {errors.category ? <p className="mt-2 text-body text-red-600">{errors.category.message}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-label text-slate-700">Item Name</label>
                  <Input {...register('item_name')} placeholder="Curtain, Suit, Blanket" />
                  {errors.item_name ? <p className="mt-2 text-body text-red-600">{errors.item_name.message}</p> : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-label text-slate-700">Size</label>
                <Input {...register('size')} placeholder="Standard, Large, Deluxe" />
                {errors.size ? <p className="mt-2 text-body text-red-600">{errors.size.message}</p> : null}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-card-title text-slate-900">Service Types & Pricing</h4>
                    <p className="text-body text-slate-500">Add each service type with its unit price</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => append({ id: crypto.randomUUID(), name: '', price: '' })}
                  >
                    <Plus className="mr-2 h-6 w-6" /> Add Type
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-4 rounded-lg border border-surface-border bg-slate-50/50 p-5 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <div>
                      <label className="mb-2 block text-label text-slate-700">Service Type</label>
                      <Input
                        {...register(`options.${index}.name` as const)}
                        placeholder="Wash & Fold, Dry Clean, Press"
                      />
                      {errors.options?.[index]?.name ? (
                        <p className="mt-2 text-body text-red-600">{errors.options[index]?.name?.message}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-label text-slate-700">Unit Price</label>
                      <Input
                        type="number"
                        {...register(`options.${index}.price` as const)}
                        placeholder="500"
                      />
                      {errors.options?.[index]?.price ? (
                        <p className="mt-2 text-body text-red-600">{errors.options[index]?.price?.message}</p>
                      ) : null}
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-7 w-7" />
                      </Button>
                    </div>
                  </div>
                ))}
                {errors.options?.message ? (
                  <p className="text-body text-red-600">{errors.options.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => navigate('/quotations')}>
                  Cancel
                </Button>
                <Button type="submit" size="lg">
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
