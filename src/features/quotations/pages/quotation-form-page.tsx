import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2, GripVertical, X, Download, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { useDataGrid, mergeRefs } from '../../../hooks/use-data-grid'
import { useEnterFlow } from '../../../hooks/use-enter-flow'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { useAuth } from '../../../context/AuthContext'
import { listAllHotels } from '../../../lib/hotel-registry'
import { entityId, type RegistryEntity } from '../../platform/services/entity-registry.service'
import {
  quotationKeys, useCreateQuotation, useQuotation, useUpdateQuotation,
} from '../hooks/useQuotations'
import type {
  Quotation, QuotationFormValues, QuotationPayload,
} from '../../../types/quotation'
import {
  AutosaveIndicator, CharacterCounter, CollapsibleSection, DraftRestoreBanner,
  DuplicateWarning, FormErrorSummary, HelpTooltip, MultiStepProgress,
  RequiredMark, ResetButton,
} from '../../feature-pack/components'
import {
  useDraft, useOptimisticWrite, useSubmitGuard,
} from '../../feature-pack/hooks'
import {
  findDuplicateRows, itemIdentity, normalizeError,
} from '../../feature-pack/utils'
import {
  CAMELOT_TEMPLATE,
  CAMELOT_TEMPLATE_FILE_NAME,
  camelotTemplateCategories,
  camelotTemplateItemCount,
  camelotTemplateLineItems,
  parseCamelotTemplate,
  serializeCamelotTemplate,
  type CamelotTemplate,
} from '../lib/camelot-template'

function downloadCamelotTemplate() {
  const blob = new Blob([serializeCamelotTemplate(CAMELOT_TEMPLATE)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = CAMELOT_TEMPLATE_FILE_NAME
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const TITLE_MAX = 120

const specSchema = z.object({
  specification: z.string().trim().min(1, 'Required'),
  unit_price: z.string().trim().min(1, 'Required'),
})

const lineItemSchema = z.object({
  id: z.string(),
  item_name: z.string().trim().min(1, 'Required'),
  category: z.string(),
  unit_price: z.string().trim().min(1, 'Required'),
  notes: z.string(),
  specifications: z.array(specSchema),
})

const formSchema = z.object({
  client_name: z.string().trim().min(1, 'Client / hotel name is required'),
  hotelId: z.string(),
  quotation_title: z.string(),
  tag: z.enum(['shop', 'hotel']),
  line_items: z.array(lineItemSchema).min(1, 'Add at least one item'),
}).superRefine((values, ctx) => {
  if (values.tag === 'hotel' && !values.hotelId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hotelId'],
      message: 'Select a hotel from the hotels list',
    })
  }
})

const newItem = () => ({
  id: crypto.randomUUID(),
  item_name: '',
  category: '',
  unit_price: '',
  notes: '',
  specifications: [],
})

const createDefaults = (): QuotationFormValues => ({
  client_name: '',
  hotelId: '',
  quotation_title: '',
  tag: 'hotel' as 'shop' | 'hotel',
  line_items: [newItem()],
})

const defaultValues = createDefaults()

function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <label className={`block text-[12px] font-medium text-[var(--text-primary)] mb-1 ${className}`}>
      {children}
    </label>
  )
}

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-[11px] text-[var(--danger-text)]">{msg}</p> : null
}

function SpecFields({
  index,
  register,
  control,
  errors,
  currency,
}: {
  index: number
  register: any
  control: any
  errors: any
  currency: string
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `line_items.${index}.specifications`,
  })
  const specErrors = errors?.line_items?.[index]?.specifications

  return (
    <CollapsibleSection
      title="Specifications / Variants"
      count={fields.length}
      defaultOpen={fields.length > 0}
    >
      <div className="flex items-center justify-end mb-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ specification: '', unit_price: '' })}
          className="text-[var(--brand-text)] hover:bg-[var(--surface-2)]"
        >
          <Plus className="h-3.5 w-3.5" /> Add Specification
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-[11px] text-[var(--text-faint)]">
          No variants for this item — it uses the unit price above. Add a colour / size with its own
          price if needed.
        </p>
      ) : (
        <div className="space-y-1.5">
          {fields.map((field, sIdx) => (
            <div key={field.id} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  {...register(`line_items.${index}.specifications.${sIdx}.specification` as const)}
                  placeholder="e.g. White - M"
                  aria-label={`Specification ${sIdx + 1} for item ${index + 1}`}
                />
                <FieldErr msg={specErrors?.[sIdx]?.specification?.message} />
              </div>
              <div className="relative w-28">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-faint)]">
                  {currency}
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  {...register(`line_items.${index}.specifications.${sIdx}.unit_price` as const)}
                  placeholder="150.00"
                  aria-label={`Specification ${sIdx + 1} unit price for item ${index + 1}`}
                  className="pl-9"
                />
                <FieldErr msg={specErrors?.[sIdx]?.unit_price?.message} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(sIdx)}
                aria-label={`Remove specification ${sIdx + 1} from item ${index + 1}`}
                className="text-[var(--danger-text)] hover:bg-[var(--danger-soft)] shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}

export default function QuotationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: existing, isLoading } = useQuotation(id)
  const createMutation = useCreateQuotation()
  const updateMutation = useUpdateQuotation()
  const optimisticWrite = useOptimisticWrite()
  const submit = useSubmitGuard(async (payload: QuotationPayload) => {
    let previousList: Quotation[] | undefined
    let previousDetail: Quotation | undefined
    const tempId = `temp-${Date.now()}`
    const optimisticRow: Quotation = {
      id: isEdit && id ? id : tempId,
      client_name: payload.client_name,
      quotation_title: payload.quotation_title,
      tag: payload.tag,
      status: existing?.status,
      created_at: existing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      line_items: payload.line_items.map((line, index) => ({
        ...line,
        id: existing?.line_items?.[index]?.id ?? `${tempId}-${index}`,
      })),
    }
    const detailKey = quotationKeys.detail(id ?? '')
    const listKey = quotationKeys.list()

    const ok = await optimisticWrite({
      optimistic: () => {
        previousList = qc.getQueryData<Quotation[]>(listKey)
        if (isEdit && id) previousDetail = qc.getQueryData<Quotation>(detailKey)
        qc.setQueryData<Quotation[]>(listKey, (prev = []) =>
          isEdit && id
            ? prev.map((row) => (String(row.id) === id ? optimisticRow : row))
            : [optimisticRow, ...prev],
        )
        if (isEdit && id) qc.setQueryData(detailKey, optimisticRow)
      },
      rollback: () => {
        qc.setQueryData(listKey, previousList ?? [])
        if (isEdit && id) {
          if (previousDetail) qc.setQueryData(detailKey, previousDetail)
          else qc.removeQueries({ queryKey: detailKey })
        }
      },
      commit: async () => {
        try {
          if (isEdit && id) await updateMutation.mutateAsync({ id, payload })
          else await createMutation.mutateAsync(payload)
        } catch (error) {
          setFormError(normalizeError(error))
          throw error
        }
      },
      silentErrors: true,
    })

    if (!ok) return
    setFormError('')
    clearDraft()
    setDraftBannerOpen(false)
    navigate('/quotations')
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })

  const grid = useDataGrid({
    columns: 4,
    rows: fields.length,
    onAppendRow: () => append(newItem()),
  })

  const flow = useEnterFlow<HTMLDivElement>()
  const tagRef = useRef<HTMLSelectElement | null>(null)
  const regTag = register('tag')
  const regHotelId = register('hotelId')

  const [hotels, setHotels] = useState<RegistryEntity[]>([])
  const [hotelsLoading, setHotelsLoading] = useState(true)
  const [hotelsError, setHotelsError] = useState('')

  useEffect(() => {
    let active = true
    setHotelsLoading(true)
    setHotelsError('')
    listAllHotels()
      .then((records) => {
        if (!active) return
        setHotels(records)
        setHotelsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setHotels([])
        setHotelsError('Could not load the hotels list. Hotel quotations need a registered hotel.')
        setHotelsLoading(false)
      })
    return () => { active = false }
  }, [])

  const values = watch()
  const lineItems = values.line_items ?? []
  const clientName = values.client_name ?? ''
  const title = values.quotation_title ?? ''

  const { draft, hasDraft, clearDraft, status: autosaveStatus } = useDraft(
    user?.id,
    isEdit ? `quotation:${id}` : 'quotation:new',
    values,
    !isEdit && !existing,
  )
  const [draftBannerOpen, setDraftBannerOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [importedTemplate, setImportedTemplate] = useState<CamelotTemplate | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [importNotice, setImportNotice] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (hasDraft && !isEdit && !existing) setDraftBannerOpen(true)
  }, [hasDraft, isEdit, existing])

  const duplicateIndexes = useMemo(
    () => findDuplicateRows(lineItems, (line) => itemIdentity(line)),
    [lineItems],
  )
  const duplicateNames = useMemo(
    () => Array.from(new Set(
      duplicateIndexes
        .map((index) => lineItems[index]?.item_name?.trim())
        .filter((name): name is string => Boolean(name)),
    )),
    [duplicateIndexes, lineItems],
  )

  const isFormReady = useMemo(() => {
    if (!clientName.trim() || lineItems.length === 0) return false
    if (values.tag === 'hotel' && !values.hotelId?.trim()) return false
    return lineItems.every((line) => {
      if (!line.item_name?.trim() || !line.unit_price?.trim()) return false
      if (!Number.isFinite(Number(line.unit_price)) || Number(line.unit_price) < 0) return false
      return (line.specifications ?? []).every((spec) =>
        Boolean(spec.specification?.trim()) === Boolean(spec.unit_price?.trim()),
      )
    })
  }, [clientName, lineItems, values.tag, values.hotelId])

  const canSubmit = isFormReady && duplicateIndexes.length === 0 &&
    !submit.pending && !createMutation.isPending && !updateMutation.isPending
  const currentStep = !clientName.trim() ? 0 : isFormReady ? 2 : 1

  const validationErrors = useMemo(() => {
    const out = new Set<string>()
    const add = (message?: unknown) => {
      if (typeof message === 'string' && message.trim()) out.add(message.trim())
    }
    add(errors.client_name?.message)
    add(errors.hotelId?.message)
    add(errors.line_items?.message)
    lineItems.forEach((_, index) => {
      add(errors.line_items?.[index]?.item_name?.message)
      add(errors.line_items?.[index]?.unit_price?.message)
      const specs = errors.line_items?.[index]?.specifications
      if (Array.isArray(specs)) {
        specs.forEach((spec) => {
          add(spec?.specification?.message)
          add(spec?.unit_price?.message)
        })
      }
    })
    if (duplicateNames.length > 0) {
      out.add(`Duplicate item names: ${duplicateNames.slice(0, 3).join(', ')}.`)
    }
    add(formError)
    return [...out]
  }, [errors, lineItems, duplicateNames, formError])

  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    flow.handleKeyDown(e)
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !e.defaultPrevented &&
      e.target === tagRef.current
    ) {
      e.preventDefault()
      grid.focusCell(0, 0)
    }
  }

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter' || e.defaultPrevented) return
    const target = e.target as HTMLElement
    if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.tagName !== 'TEXTAREA') return
    e.preventDefault()
  }

  useEffect(() => {
    if (!existing) return
    reset({
      client_name: existing.client_name,
      hotelId: existing.hotel_id ?? '',
      quotation_title: existing.quotation_title ?? '',
      tag: (existing.tag ?? 'hotel') as 'shop' | 'hotel',
      line_items: (existing.line_items ?? []).map((li) => ({
        id: crypto.randomUUID(),
        item_name: li.item_name,
        category: li.category ?? '',
        unit_price: String(li.unit_price),
        notes: li.notes ?? '',
        specifications: (li.specifications ?? []).map((s) => ({
          specification: s.specification,
          unit_price: String(s.unit_price),
        })),
      })),
    })
  }, [existing, reset])

  const activeTemplate = importedTemplate ?? CAMELOT_TEMPLATE

  const cats = useMemo(
    () => Array.from(new Set([
      ...camelotTemplateCategories(activeTemplate),
      ...lineItems.map((line) => line.category?.trim()).filter((value): value is string => Boolean(value)),
    ])).sort(),
    [activeTemplate, lineItems],
  )

  const itemSuggestions = useMemo(
    () => Array.from(new Set([
      ...camelotTemplateLineItems(activeTemplate).map((line) => line.item_name),
      ...lineItems.map((line) => line.item_name?.trim()).filter((value): value is string => Boolean(value)),
    ])),
    [activeTemplate, lineItems],
  )

  const handleJsonFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsImporting(true)
    setImportError('')
    setImportNotice('')
    setImportedTemplate(null)
    setImportFileName(file.name)
    try {
      const parsed = parseCamelotTemplate(await file.text())
      setImportedTemplate(parsed)
      setImportNotice(
        `${file.name} is ready: ${camelotTemplateItemCount(parsed)} items across ${parsed.sections.length} sections.`,
      )
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read this JSON file.')
    } finally {
      setIsImporting(false)
    }
  }

  /** Replace the form rows with the uploaded JSON quotation. */
  const applyImportedTemplate = () => {
    if (!importedTemplate) return
    const lines = camelotTemplateLineItems(importedTemplate).map((line) => ({
      ...line,
      id: crypto.randomUUID(),
    }))
    setValue('line_items', lines, { shouldValidate: true, shouldDirty: true })
    if (!getValues('quotation_title').trim()) {
      setValue('quotation_title', importedTemplate.title, { shouldDirty: true })
    }
    setImportNotice(`Loaded ${lines.length} items from ${importFileName}. Select the hotel below, then create the quotation.`)
    setImportedTemplate(null)
    setImportFileName('')
  }

  const handleReset = () => {
    reset(createDefaults())
    clearDraft()
    setDraftBannerOpen(false)
    setFormError('')
    setImportError('')
    setImportNotice('')
    setImportedTemplate(null)
    setImportFileName('')
  }

  const onSubmit = (v: QuotationFormValues) => {
    setFormError('')
    if (!canSubmit) return
    const payload: QuotationPayload = {
      client_name: v.client_name.trim(),
      quotation_title: v.quotation_title.trim() || undefined,
      tag: v.tag,
      hotel_id: v.tag === 'hotel' ? v.hotelId.trim() : undefined,
      line_items: v.line_items.map((li) => {
        const item: {
          item_name: string
          category?: string
          unit_price: number
          notes?: string
          specifications?: Array<{ specification: string; unit_price: number }>
        } = {
          item_name: li.item_name.trim(),
          category: li.category.trim() || undefined,
          unit_price: Number(li.unit_price),
          notes: li.notes.trim() || undefined,
        }
        const specs = (li.specifications ?? [])
          .filter((s) => s.specification.trim() && s.unit_price.trim())
          .map((s) => ({ specification: s.specification.trim(), unit_price: Number(s.unit_price) }))
        if (specs.length > 0) item.specifications = specs
        return item
      }),
    }
    void submit.run(payload).catch(() => undefined)
  }

  return (
    <div className="space-y-5 pb-10 select-none">
      <div>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Quotations', href: '/quotations' },
            { label: isEdit ? 'Edit Quotation' : 'New Quotation' },
          ]}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-dashboard-title">
              {isEdit ? 'Edit Quotation' : 'New Quotation'}
            </h1>
            <p className="text-[13px] text-[var(--text-faint)] mt-0.5">
              {isEdit
                ? 'Update pricing for this hotel'
                : 'Create a price list for a hotel or client'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEdit && <AutosaveIndicator status={autosaveStatus} />}
            <Button variant="secondary" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <MultiStepProgress steps={['Client', 'Items', 'Review']} current={currentStep} />
        </div>
      </div>

      {draftBannerOpen && (
        <DraftRestoreBanner
          onRestore={() => {
            if (draft) reset({ ...createDefaults(), ...draft, hotelId: draft.hotelId ?? '' })
            setDraftBannerOpen(false)
          }}
          onDiscard={() => {
            clearDraft()
            setDraftBannerOpen(false)
          }}
        />
      )}

      {isLoading && isEdit ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-10 text-[13px] text-[var(--text-faint)] text-center">
          Loading quotation…
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-4" noValidate>
          <FormErrorSummary errors={validationErrors} />

          <Card>
            <CardHeader className="border-b border-[var(--border)] pb-4">
              <div>
                <CardTitle>Import JSON Quotation</CardTitle>
                <p className="text-[12px] text-[var(--text-faint)] mt-0.5">
                  Upload a Camelot-format JSON file to fill the line items. Download the template,
                  edit rates if needed, then upload it here.
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <input
                id="camelot-json-input"
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={handleJsonFile}
                disabled={isImporting}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" disabled={isImporting}>
                  <label htmlFor="camelot-json-input" className="cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    {isImporting ? 'Reading…' : 'Choose JSON file'}
                  </label>
                </Button>
                <Button type="button" variant="ghost" onClick={downloadCamelotTemplate}>
                  <Download className="h-3.5 w-3.5" /> Download template
                </Button>
              </div>

              {importError ? (
                <p className="mt-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-2 text-[12px] text-[var(--danger-text)]" role="alert">
                  {importError}
                </p>
              ) : null}
              {importNotice ? (
                <p className="mt-3 rounded-lg border border-[var(--info-border)] bg-[var(--info-soft)] px-3 py-2 text-[12px] text-[var(--info-text)]" role="status">
                  {importNotice}
                </p>
              ) : null}

              {importedTemplate ? (
                <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                        {importedTemplate.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                        {camelotTemplateItemCount(importedTemplate)} items ·{' '}
                        {importedTemplate.sections.length} sections ·{' '}
                        {importedTemplate.months.map((month) => month.label).join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={applyImportedTemplate}>
                        Load items into form
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setImportedTemplate(null)
                          setImportFileName('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {importedTemplate.sections.map((section) => (
                      <span
                        key={section.id}
                        className="rounded-md border border-[var(--border)] bg-white px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                      >
                        {section.title} ({section.items.length})
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                    Hotel details are not part of the JSON — choose the hotel from the registry below.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-[var(--border)] pb-4">
              <div>
                <CardTitle>Client / Hotel Details</CardTitle>
                <p className="text-[12px] text-[var(--text-faint)] mt-0.5">
                  Hotel quotations are coupled to a record from the hotels list; the name is read from that record.
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div ref={flow.ref} onKeyDown={handleHeaderKeyDown} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {values.tag === 'hotel' ? (
                  <div>
                    <Label>Hotel <RequiredMark /></Label>
                    <select
                      {...regHotelId}
                      onChange={(event) => {
                        regHotelId.onChange(event)
                        const selected = hotels.find((hotel) => entityId(hotel) === event.target.value)
                        if (selected) {
                          setValue('client_name', selected.name, { shouldValidate: true, shouldDirty: true })
                        }
                      }}
                      aria-label="Hotel"
                      aria-invalid={Boolean(errors.hotelId)}
                      className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[14px] ring-offset-white focus:outline-none focus:ring-2 focus:ring-[var(--success)] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {hotelsLoading ? 'Loading hotels…' : hotelsError ? 'Hotels unavailable' : 'Select a hotel from the list'}
                      </option>
                      {hotels.map((hotel) => (
                        <option key={entityId(hotel)} value={entityId(hotel)}>
                          {hotel.name}{hotel.hotel_code ? ` — ${hotel.hotel_code}` : ''}
                        </option>
                      ))}
                      {values.hotelId && !hotels.some((hotel) => entityId(hotel) === values.hotelId) ? (
                        <option value={values.hotelId}>Selected hotel (not in current list)</option>
                      ) : null}
                    </select>
                    <FieldErr msg={errors.hotelId?.message} />
                    {hotelsError ? (
                      <p className="mt-1 text-[11px] text-[var(--danger-text)]" role="alert">{hotelsError}</p>
                    ) : null}
                  </div>
                ) : null}
                <div>
                  <Label>Hotel / Client Name <RequiredMark /></Label>
                  <Input
                    {...register('client_name')}
                    autoFocus={!isEdit && values.tag !== 'hotel'}
                    readOnly={values.tag === 'hotel'}
                    placeholder={values.tag === 'hotel' ? 'Choose a hotel above' : 'e.g. Walk-in client'}
                    aria-invalid={Boolean(errors.client_name)}
                    aria-describedby={errors.client_name ? 'client-name-error' : undefined}
                  />
                  <span id="client-name-error"><FieldErr msg={errors.client_name?.message} /></span>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label>Quotation Title</Label>
                    <CharacterCounter value={title} max={TITLE_MAX} />
                  </div>
                  <Input
                    {...register('quotation_title')}
                    maxLength={TITLE_MAX}
                    placeholder="e.g. 2026 Price List, Annual Contract"
                    aria-label="Quotation title"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    Quotation Type <RequiredMark />
                    <HelpTooltip text="Shop quotations are visible to guests. Hotel quotations stay private." />
                  </Label>
                  <select
                    {...regTag}
                    ref={mergeRefs(regTag.ref, tagRef)}
                    aria-label="Quotation type"
                    className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[14px] ring-offset-white focus:outline-none focus:ring-2 focus:ring-[var(--success)] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="shop">Shop (Public)</option>
                    <option value="hotel">Hotel (Private)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-[var(--brand-text)]">Shop quotations are visible to guests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-[var(--border)] pb-4">
              <div>
                <CardTitle>
                  Line Items
                  <span className="ml-2 text-[var(--text-faint)] font-normal text-[12px]">
                    ({fields.length} items)
                  </span>
                </CardTitle>
                <p className="text-[12px] text-[var(--text-faint)] mt-0.5">
                  Each row = one item with its unit price in {activeTemplate.currency}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => append(newItem())}>
                  <Plus className="h-3.5 w-3.5 text-[var(--danger-text)]" /> Add Item
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <p className="mb-3 text-[11px] text-[var(--text-faint)]">
                Item names and rates come from the JSON template above. Add rows manually or upload
                a JSON quotation to replace all rows at once.
              </p>
              <div className="hidden sm:grid sm:grid-cols-[28px_1fr_180px_120px_120px_36px] gap-2 mb-2 px-1">
                {['', 'Item Name', 'Category', `Unit Price (${activeTemplate.currency})`, 'Notes / Variant', ''].map(
                  (h, i) => (
                    <p
                      key={i}
                      className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]"
                    >
                      {h}
                    </p>
                  ),
                )}
              </div>

              <datalist id="item-suggestions">
                {itemSuggestions.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
              <datalist id="cat-suggestions">
                {cats.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              <div className="mt-3 space-y-2" onKeyDown={grid.handleKeyDown}>
                {fields.map((field, idx) => {
                  const regItem = register(`line_items.${idx}.item_name` as const)
                  const regCat = register(`line_items.${idx}.category` as const)
                  const regPrice = register(`line_items.${idx}.unit_price` as const)
                  const regNotes = register(`line_items.${idx}.notes` as const)
                  const isDuplicate = duplicateIndexes.includes(idx)
                  return (
                    <div
                      key={field.id}
                      className={`rounded-lg border bg-white p-3 hover:border-[var(--border)] transition-colors ${
                        isDuplicate ? 'border-[var(--warning-border)]' : 'border-[var(--border)]'
                      }`}
                    >
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-[28px_1fr_180px_120px_120px_36px] items-center">
                        <div className="hidden sm:flex items-center justify-center text-[var(--text-faint)]">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-[11px] text-[var(--text-faint)] mb-1 sm:hidden">Item Name</p>
                          <Input
                            {...regItem}
                            ref={mergeRefs(regItem.ref, grid.registerCell(idx, 0))}
                            list="item-suggestions"
                            placeholder="e.g. Bed Sheet"
                            aria-label={`Item ${idx + 1} name`}
                          />
                          <FieldErr msg={errors.line_items?.[idx]?.item_name?.message} />
                        </div>

                        <div>
                          <p className="text-[11px] text-[var(--text-faint)] mb-1 sm:hidden">Category</p>
                          <Input
                            {...regCat}
                            ref={mergeRefs(regCat.ref, grid.registerCell(idx, 1))}
                            list="cat-suggestions"
                            placeholder="e.g. Bed Linen"
                            aria-label={`Item ${idx + 1} category`}
                          />
                        </div>

                        <div>
                          <p className="text-[11px] text-[var(--text-faint)] mb-1 sm:hidden">
                            Unit Price ({activeTemplate.currency})
                          </p>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[var(--text-faint)]">
                              {activeTemplate.currency}
                            </span>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              {...regPrice}
                              ref={mergeRefs(regPrice.ref, grid.registerCell(idx, 2))}
                              placeholder="125.00"
                              aria-label={`Item ${idx + 1} unit price`}
                              className="pl-11"
                            />
                          </div>
                          <FieldErr msg={errors.line_items?.[idx]?.unit_price?.message} />
                        </div>

                        <div>
                          <p className="text-[11px] text-[var(--text-faint)] mb-1 sm:hidden">Notes</p>
                          <Input
                            {...regNotes}
                            ref={mergeRefs(regNotes.ref, grid.registerCell(idx, 3))}
                            placeholder="e.g. (S, D)"
                            aria-label={`Item ${idx + 1} notes`}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(idx)}
                          disabled={fields.length === 1}
                          aria-label={`Remove item ${idx + 1}`}
                          className="text-[var(--danger-text)] hover:bg-[var(--danger-soft)] disabled:opacity-20 justify-self-end sm:justify-self-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <SpecFields
                        index={idx}
                        register={register}
                        control={control}
                        errors={errors}
                        currency={activeTemplate.currency}
                      />
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => append(newItem())}
                className="mt-3 w-full rounded-lg border border-dashed border-[var(--border)] py-2.5 text-[12px] font-medium text-[var(--text-muted)] hover:border-[var(--danger-border)] hover:text-[var(--danger-text)] hover:bg-[var(--danger-soft)] transition-all cursor-pointer"
              >
                + Add another item
              </button>

              <FieldErr
                msg={
                  typeof errors.line_items?.message === 'string'
                    ? errors.line_items.message
                    : undefined
                }
              />
              <DuplicateWarning names={duplicateNames} />

              {fields.length > 0 && (
                <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[var(--text-muted)]">
                    {fields.length} items in this quotation
                  </span>
                  <span className="text-[11px] text-[var(--text-faint)]">
                    Prices shown in {activeTemplate.currency}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ResetButton onClick={handleReset} disabled={submit.pending} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/quotations')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submit.pending || createMutation.isPending || updateMutation.isPending
                ? 'Saving…'
                : isEdit ? 'Save Changes' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
