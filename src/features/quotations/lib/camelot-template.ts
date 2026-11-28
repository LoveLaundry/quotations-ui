import { z } from 'zod'
import templateJson from '../../../data/camelot-2026-quotation.json'

/**
 * The Camelot quotation is data, not code. `src/data/camelot-2026-quotation.json`
 * is the single source of truth: the catalog page, the monthly summary and the
 * quotation-create JSON upload all read through this module. No item names,
 * rates or month labels are hard-coded in TypeScript.
 */

const rateSchema = z.union([
  z.number(),
  z.string().trim().regex(/^\d+(?:\.\d+)?$/, 'Use a non-negative number'),
]).transform((value) => Number(value))

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  rate: rateSchema.nullable(),
  note: z.string().trim().optional(),
})

const sectionSchema = z.object({
  id: z.string().trim().min(1, 'Section id is required'),
  title: z.string().trim().min(1, 'Section title is required'),
  items: z.array(itemSchema).min(1, 'Each section needs at least one item'),
})

const monthSchema = z.object({
  id: z.string().trim().min(1, 'Month id is required'),
  label: z.string().trim().min(1, 'Month label is required'),
  days: z.number().int().min(1).max(31),
})

export const camelotTemplateSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().trim().min(1, 'Quotation title is required'),
  currency: z.string().trim().min(1).default('LKR'),
  source: z.string().trim().optional(),
  description: z.string().trim().optional(),
  months: z.array(monthSchema).min(1, 'Add at least one month'),
  sections: z.array(sectionSchema).min(1, 'Add at least one section'),
}).superRefine((value, ctx) => {
  const monthIds = new Set<string>()
  value.months.forEach((month, index) => {
    const key = month.id.toLowerCase()
    if (monthIds.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['months', index, 'id'],
        message: `Duplicate month id: ${month.id}`,
      })
    }
    monthIds.add(key)
  })

  const sectionIds = new Set<string>()
  value.sections.forEach((section, sectionIndex) => {
    const key = section.id.toLowerCase()
    if (sectionIds.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sections', sectionIndex, 'id'],
        message: `Duplicate section id: ${section.id}`,
      })
    }
    sectionIds.add(key)

    const names = new Set<string>()
    section.items.forEach((item, itemIndex) => {
      if (item.rate !== null && (!Number.isFinite(item.rate) || item.rate < 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', sectionIndex, 'items', itemIndex, 'rate'],
          message: `Invalid rate for ${item.name}`,
        })
      }
      if (/#VALUE!|Err:\d+/i.test(item.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', sectionIndex, 'items', itemIndex, 'name'],
          message: `Spreadsheet error cells cannot be imported as items: ${item.name}`,
        })
      }
      const nameKey = item.name.toLowerCase()
      if (names.has(nameKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', sectionIndex, 'items', itemIndex, 'name'],
          message: `Duplicate item in ${section.title}: ${item.name}`,
        })
      }
      names.add(nameKey)
    })
  })
})

export type CamelotTemplate = z.infer<typeof camelotTemplateSchema>
export type CamelotTemplateSection = CamelotTemplate['sections'][number]
export type CamelotTemplateItem = CamelotTemplateSection['items'][number]
export type CamelotTemplateMonth = CamelotTemplate['months'][number]

export interface CamelotLineItem {
  item_name: string
  category: string
  unit_price: string
  notes: string
  specifications: Array<{ specification: string; unit_price: string }>
}

export const CAMELOT_TEMPLATE_FILE_NAME = 'camelot-2026-quotation.json'

/** The bundled template, validated once at module load. */
export const CAMELOT_TEMPLATE: CamelotTemplate = camelotTemplateSchema.parse(templateJson)

function issueMessage(error: z.ZodError): string {
  const first = error.issues[0]
  if (!first) return 'Invalid Camelot quotation JSON'
  const path = first.path.join('.')
  return path ? `${path}: ${first.message}` : first.message
}

/** Parse a user-supplied JSON file into a validated Camelot template. */
export function parseCamelotTemplate(text: string): CamelotTemplate {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  const parsed = camelotTemplateSchema.safeParse(raw)
  if (!parsed.success) throw new Error(issueMessage(parsed.error))
  return parsed.data
}

/** Pretty JSON for the bundled template download. */
export function serializeCamelotTemplate(template: CamelotTemplate): string {
  return `${JSON.stringify(template, null, 2)}\n`
}

export function camelotTemplateItems(
  template: CamelotTemplate,
  sectionIds?: readonly string[],
): Array<{ item: CamelotTemplateItem; section: CamelotTemplateSection }> {
  const wanted = sectionIds ? new Set(sectionIds) : null
  return template.sections
    .filter((section) => !wanted || wanted.has(section.id))
    .flatMap((section) => section.items.map((item) => ({ item, section })))
}

/** Form-ready quotation rows. Empty source rates become `0` with a note. */
export function camelotTemplateLineItems(
  template: CamelotTemplate,
  sectionIds?: readonly string[],
): CamelotLineItem[] {
  return camelotTemplateItems(template, sectionIds).map(({ item, section }) => ({
    item_name: item.name,
    category: section.title,
    unit_price: String(item.rate ?? 0),
    notes: item.rate === null
      ? `${item.note ?? 'Rate missing in template'} — confirm price`
      : (item.note ?? ''),
    specifications: [],
  }))
}

export function camelotTemplateItemCount(template: CamelotTemplate): number {
  return template.sections.reduce((sum, section) => sum + section.items.length, 0)
}

export function camelotTemplateSectionCount(
  template: CamelotTemplate,
  sectionId: string,
): number {
  return template.sections.find((section) => section.id === sectionId)?.items.length ?? 0
}

export function camelotTemplateCategories(template: CamelotTemplate): string[] {
  return template.sections.map((section) => section.title)
}

export function camelotTemplateMissingRates(template: CamelotTemplate): string[] {
  return template.sections.flatMap((section) =>
    section.items.filter((item) => item.rate === null).map((item) => item.name),
  )
}
