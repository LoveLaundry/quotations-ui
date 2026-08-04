import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { useCreateQuotation, useQuotation, useUpdateQuotation } from '../hooks/useQuotations'
import type { QuotationFormValues } from '../../../types/quotation'

const optionSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Option name is required'),
  price: z.string().trim().min(1, 'Price is required'),
})

const formSchema = z.object({
  item_name: z.string().trim().min(1, 'Item name is required'),
  size: z.string().trim().min(1, 'Size is required'),
  options: z.array(optionSchema).min(1, 'At least one pricing option is required'),
})

const defaultValues = {
  item_name: '',
  size: '',
  options: [{ id: crypto.randomUUID(), name: 'Wash', price: '500' }],
}

export default function QuotationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { data: quotation, isLoading } = useQuotation(id)
  const createMutation = useCreateQuotation()
  const updateMutation = useUpdateQuotation()

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  })

  useEffect(() => {
    if (!quotation) return
    reset({
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
      item_name: values.item_name,
      size: values.size,
      unit_price_with_options: Object.fromEntries(
        values.options.filter((option) => option.name.trim()).map((option) => [option.name.trim(), Number(option.price)]),
      ),
    }

    if (isEditing && id) {
      updateMutation.mutate({ id, payload }, { onSuccess: () => navigate(`/quotations/${id}`) })
      return
    }

    createMutation.mutate(payload, { onSuccess: () => navigate('/quotations') })
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div>
            <h3 className="text-lg font-semibold">{isEditing ? 'Edit quotation' : 'Create quotation'}</h3>
            <p className="text-sm text-slate-500">Build a polished offer with dynamic pricing options.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/quotations')}>Cancel</Button>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="space-y-3">Loading quotation...</div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Item name</label>
                  <Input {...register('item_name')} placeholder="Curtain" />
                  {errors.item_name ? <p className="mt-2 text-sm text-rose-600">{errors.item_name.message}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Size</label>
                  <Input {...register('size')} placeholder="Large" />
                  {errors.size ? <p className="mt-2 text-sm text-rose-600">{errors.size.message}</p> : null}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Unit price options</h4>
                  <Button type="button" variant="secondary" size="sm" onClick={() => append({ id: crypto.randomUUID(), name: '', price: '' })}>
                    <Plus className="mr-2 h-4 w-4" /> Add option
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 md:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <label className="mb-2 block text-sm">Option name</label>
                      <Input {...register(`options.${index}.name` as const)} placeholder="Wash" />
                      {errors.options?.[index]?.name ? <p className="mt-2 text-sm text-rose-600">{errors.options[index]?.name?.message}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">Price</label>
                      <Input type="number" {...register(`options.${index}.price` as const)} placeholder="500" />
                      {errors.options?.[index]?.price ? <p className="mt-2 text-sm text-rose-600">{errors.options[index]?.price?.message}</p> : null}
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {errors.options?.message ? <p className="text-sm text-rose-600">{errors.options.message}</p> : null}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => navigate('/quotations')}>Discard</Button>
                <Button type="submit">{isEditing ? 'Save changes' : 'Create quotation'}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
