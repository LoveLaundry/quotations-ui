import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package,
  PackageCheck,
  Plus,
  Receipt,
  Save,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { addDaysISO, formatCalendarDate, todayISO } from '../../../lib/time'
import type { AvailabilityGatePass } from '../../../types/operations'
import { useReducedMotion } from '../../feature-pack/hooks'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState, ErrorState } from '../../../components/ui/empty-state'
import { Input, Select } from '../../../components/ui/input'
import { Notice } from '../../../components/ui/notice'
import { PageHeader } from '../../../components/ui/page-header'
import { Skeleton } from '../../../components/ui/skeleton'
import { StatCard } from '../../../components/ui/stat-card'
import {
  useExpenseCategories,
  useSaveTodaySheet,
  useTodayExpenses,
  useTodaySheet,
  type SaveTodaySheetResult,
} from '../hooks/useTodaySheet'
import type {
  TodayExpenseInput,
  TodayExpenseRecord,
  TodaySheetClient,
  TodaySheetCommitPayload,
  TodaySheetDeliveryInput,
  TodaySheetItemLine,
  TodaySheetReceiveInput,
} from '../services/today-sheet.service'

// ── Local draft shapes ────────────────────────────────────────────────────────
// Quantities stay as strings while being typed so a partially entered "1." is
// not silently rewritten by the browser. They are parsed once at save time.

interface ReceiveLine {
  id: string
  itemName: string
  specification: string
  quantity: string
  unit: string
}

interface DeliveryLine {
  id: string
  itemName: string
  specification: string
  quantity: string
  /** Empty means AUTO — the server allocates FIFO across open gate passes. */
  sourcePassId: string
}

interface ExpenseLine {
  id: string
  category: string
  amount: string
  /** Empty means SHARED; a shop name means SHOP. */
  clientName: string
}

interface ClientDraft {
  receivedBy: string
  receives: ReceiveLine[]
  deliveries: DeliveryLine[]
}

interface BuiltSheet {
  payload: TodaySheetCommitPayload
  expenses: TodayExpenseInput[]
  issues: string[]
  hasEntries: boolean
}

const EMPTY_CLIENTS: TodaySheetClient[] = []
const EASE = [0.16, 1, 0.3, 1] as const
const DEFAULT_CATEGORIES = ['Transport', 'Fuel', 'Loading', 'Water', 'Electricity', 'Office']
const DEFAULT_UNITS = ['pcs', 'kg', 'sets']

let sequence = 0
function uid(prefix: string): string {
  sequence += 1
  return `${prefix}-${sequence}`
}

function newReceiveLine(): ReceiveLine {
  return { id: uid('recv'), itemName: '', specification: '', quantity: '', unit: 'pcs' }
}

function newDeliveryLine(): DeliveryLine {
  return { id: uid('del'), itemName: '', specification: '', quantity: '', sourcePassId: '' }
}

function newExpenseLine(): ExpenseLine {
  return { id: uid('exp'), category: '', amount: '', clientName: '' }
}

function blankDraft(): ClientDraft {
  return { receivedBy: '', receives: [], deliveries: [] }
}

function clean(value?: string | null): string {
  return String(value ?? '').trim()
}

/** Prefill one AUTO line per distinct deliverable item across all open passes.
 *  This matches the mobile sheet: the operator types quantities, AUTO handles
 *  which batch they come from. Explicit pass selection stays available. */
function defaultDraft(client: TodaySheetClient): ClientDraft {
  const seen = new Set<string>()
  const deliveries: DeliveryLine[] = []

  for (const pass of client.pending_passes ?? []) {
    const items = pass.deliverable_items?.length
      ? pass.deliverable_items
      : (pass.items ?? []).filter(item => Number(item.available_qty) > 0)

    for (const item of items) {
      const itemName = clean(item.item_name)
      if (!itemName) continue
      const specification = clean(item.specification)
      const key = `${itemName.toLocaleLowerCase()}||${specification.toLocaleLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      deliveries.push({
        id: uid('del'),
        itemName,
        specification,
        quantity: '',
        sourcePassId: '',
      })
    }
  }

  return { receivedBy: '', receives: [], deliveries }
}

function fmtQty(value: number | string | null | undefined): string {
  const number = Number(value ?? 0)
  return Number.isFinite(number)
    ? number.toLocaleString('en-LK', { maximumFractionDigits: 2 })
    : '0'
}

function fmtMoney(value: number | string | null | undefined): string {
  const number = Number(value ?? 0)
  return `LKR ${Number.isFinite(number) ? number.toLocaleString('en-LK', { maximumFractionDigits: 2 }) : '0'}`
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function historyText(items: TodaySheetItemLine[] | undefined): string {
  const text = (items ?? [])
    .map(item => {
      const spec = clean(item.specification)
      return `${item.item_name}${spec ? ` · ${spec}` : ''} ×${fmtQty(item.quantity)}`
    })
    .join(', ')
  return text || '—'
}

function parseQuantity(
  raw: string,
  itemName: string,
  label: string,
  issues: string[],
): number | null {
  const text = clean(raw)
  if (!text) return null
  const quantity = Number(text)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    issues.push(`${label}: quantity must be greater than zero.`)
    return null
  }
  // Mirrors the delivery engine: only curtains are measured in kilograms.
  if (!Number.isInteger(quantity) && !itemName.toLocaleLowerCase().includes('curtain')) {
    issues.push(`${label}: only curtain quantities may be fractional.`)
    return null
  }
  return quantity
}

function buildSheet(
  date: string,
  shops: string[],
  drafts: Record<string, ClientDraft>,
  expenseLines: ExpenseLine[],
): BuiltSheet {
  const issues: string[] = []
  const receives: TodaySheetReceiveInput[] = []
  const deliveries: TodaySheetDeliveryInput[] = []

  for (const clientName of shops) {
    const draft = drafts[clientName]
    if (!draft) continue

    const receiveItems: TodaySheetReceiveInput['items'] = []
    for (const line of draft.receives) {
      const itemName = clean(line.itemName)
      const rawQty = clean(line.quantity)
      if (
        !itemName &&
        !rawQty &&
        !clean(line.specification) &&
        clean(line.unit) === 'pcs'
      ) {
        continue
      }
      if (!itemName) {
        issues.push(`${clientName}: received item name is required.`)
        continue
      }
      if (!rawQty) {
        issues.push(`${clientName} · ${itemName} (received): quantity is required.`)
        continue
      }
      const quantity = parseQuantity(
        rawQty,
        itemName,
        `${clientName} · ${itemName} (received)`,
        issues,
      )
      if (quantity === null) continue
      receiveItems.push({
        item_name: itemName,
        specification: clean(line.specification) || null,
        unit: clean(line.unit) || null,
        quantity,
      })
    }
    if (receiveItems.length > 0) {
      receives.push({
        client_name: clientName,
        items: receiveItems,
        received_by: clean(draft.receivedBy) || null,
      })
    }

    const deliveryItems: TodaySheetDeliveryInput['items'] = []
    for (const line of draft.deliveries) {
      const itemName = clean(line.itemName)
      const rawQty = clean(line.quantity)
      if (!itemName && !rawQty && !clean(line.specification)) continue
      if (!itemName) {
        issues.push(`${clientName}: delivered item name is required.`)
        continue
      }
      if (!rawQty) {
        issues.push(`${clientName} · ${itemName} (delivered): quantity is required.`)
        continue
      }
      const quantity = parseQuantity(
        rawQty,
        itemName,
        `${clientName} · ${itemName} (delivered)`,
        issues,
      )
      if (quantity === null) continue
      deliveryItems.push({
        item_name: itemName,
        specification: clean(line.specification) || null,
        quantity,
        gate_pass_id: clean(line.sourcePassId) || null,
      })
    }
    if (deliveryItems.length > 0) {
      deliveries.push({
        client_name: clientName,
        items: deliveryItems,
        received_by: clean(draft.receivedBy) || null,
      })
    }
  }

  const expenses: TodayExpenseInput[] = []
  expenseLines.forEach((line, index) => {
    const category = clean(line.category)
    const rawAmount = clean(line.amount)
    const clientName = clean(line.clientName)
    if (!category && !rawAmount && !clientName) return

    const label = `Expense ${index + 1}`
    let valid = true
    if (!category) {
      issues.push(`${label}: category is required.`)
      valid = false
    }
    const amount = Number(rawAmount)
    if (!rawAmount || !Number.isFinite(amount) || amount <= 0) {
      issues.push(`${label}: amount must be greater than zero.`)
      valid = false
    }
    if (!valid) return

    expenses.push({
      date,
      category_name: category,
      amount: Math.round(amount * 100) / 100,
      client_name: clientName || null,
      allocation: clientName ? 'SHOP' : 'SHARED',
    })
  })

  return {
    payload: { date, receives, deliveries },
    expenses,
    issues,
    hasEntries: receives.length > 0 || deliveries.length > 0 || expenses.length > 0,
  }
}

// ── Small shared pieces ───────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  tone,
  title,
  action,
}: {
  icon: LucideIcon
  tone: 'success' | 'info'
  title: string
  action: ReactNode
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p
        className={cn(
          'section-label flex items-center gap-1.5',
          tone === 'success' ? 'text-[var(--success-text)]' : 'text-[var(--info-text)]',
        )}
      >
        <Icon size={13} aria-hidden />
        {title}
      </p>
      {action}
    </div>
  )
}

interface ReceiveLinesProps {
  lines: ReceiveLine[]
  reduce: boolean
  onUpdate: (updater: (draft: ClientDraft) => ClientDraft) => void
}

function ReceiveLines({ lines, reduce, onUpdate }: ReceiveLinesProps) {
  const patch = (id: string, fields: Partial<ReceiveLine>) =>
    onUpdate(draft => ({
      ...draft,
      receives: draft.receives.map(line => (line.id === id ? { ...line, ...fields } : line)),
    }))
  const remove = (id: string) =>
    onUpdate(draft => ({ ...draft, receives: draft.receives.filter(line => line.id !== id) }))

  return (
    <section>
      <SectionHeading
        icon={PackageCheck}
        tone="success"
        title="Received today"
        action={
          <Button size="sm" variant="ghost" onClick={() => onUpdate(draft => ({
            ...draft,
            receives: [...draft.receives, newReceiveLine()],
          }))}>
            <Plus aria-hidden />
            Add received line
          </Button>
        }
      />
      {lines.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--border-2)] px-3 py-2.5 text-[12px] text-[var(--text-faint)]">
          No received lines staged for this shop.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {lines.map(line => (
              <motion.div
                key={line.id}
                layout
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 overflow-hidden md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_84px_84px_32px]"
              >
                <Input
                  list="today-sheet-item-options"
                  value={line.itemName}
                  onChange={event => patch(line.id, { itemName: event.target.value })}
                  placeholder="Item"
                  aria-label="Received item name"
                  className="col-span-2 md:col-span-1"
                />
                <Input
                  value={line.specification}
                  onChange={event => patch(line.id, { specification: event.target.value })}
                  placeholder="Spec"
                  aria-label="Received item specification"
                />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={event => patch(line.id, { quantity: event.target.value })}
                  placeholder="Qty"
                  aria-label="Received quantity"
                />
                <Input
                  list="today-sheet-unit-options"
                  value={line.unit}
                  onChange={event => patch(line.id, { unit: event.target.value })}
                  placeholder="Unit"
                  aria-label="Received unit"
                />
                <Button
                  size="icon-sm"
                  variant="danger-ghost"
                  onClick={() => remove(line.id)}
                  aria-label="Remove received line"
                  title="Remove received line"
                  className="justify-self-end"
                >
                  <X aria-hidden />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}

interface DeliveryLinesProps {
  lines: DeliveryLine[]
  passes: AvailabilityGatePass[]
  reduce: boolean
  onUpdate: (updater: (draft: ClientDraft) => ClientDraft) => void
}

function DeliveryLines({ lines, passes, reduce, onUpdate }: DeliveryLinesProps) {
  const patch = (id: string, fields: Partial<DeliveryLine>) =>
    onUpdate(draft => ({
      ...draft,
      deliveries: draft.deliveries.map(line => (line.id === id ? { ...line, ...fields } : line)),
    }))
  const remove = (id: string) =>
    onUpdate(draft => ({ ...draft, deliveries: draft.deliveries.filter(line => line.id !== id) }))

  return (
    <section>
      <SectionHeading
        icon={Truck}
        tone="info"
        title="Delivered today"
        action={
          <Button size="sm" variant="ghost" onClick={() => onUpdate(draft => ({
            ...draft,
            deliveries: [...draft.deliveries, newDeliveryLine()],
          }))}>
            <Plus aria-hidden />
            Add delivered line
          </Button>
        }
      />
      {lines.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--border-2)] px-3 py-2.5 text-[12px] text-[var(--text-faint)]">
          No delivered lines staged for this shop.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {lines.map(line => (
              <motion.div
                key={line.id}
                layout
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 overflow-hidden md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_80px_minmax(0,1.5fr)_32px]"
              >
                <Input
                  list="today-sheet-item-options"
                  value={line.itemName}
                  onChange={event => patch(line.id, { itemName: event.target.value })}
                  placeholder="Item"
                  aria-label="Delivered item name"
                  className="col-span-2 md:col-span-1"
                />
                <Input
                  value={line.specification}
                  onChange={event => patch(line.id, { specification: event.target.value })}
                  placeholder="Spec"
                  aria-label="Delivered item specification"
                />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={event => patch(line.id, { quantity: event.target.value })}
                  placeholder="Qty"
                  aria-label="Delivered quantity"
                />
                <div className="col-span-2 md:col-span-1">
                  <Select
                    value={line.sourcePassId}
                    onChange={event => patch(line.id, { sourcePassId: event.target.value })}
                    aria-label="Source gate pass"
                  >
                    <option value="">AUTO · FIFO</option>
                    {passes.map(pass => (
                      <option key={pass.gate_pass_id} value={pass.gate_pass_id}>
                        {pass.gate_pass_number} · {fmtQty(pass.total_available_qty)} left
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  size="icon-sm"
                  variant="danger-ghost"
                  onClick={() => remove(line.id)}
                  aria-label="Remove delivered line"
                  title="Remove delivered line"
                  className="justify-self-end"
                >
                  <X aria-hidden />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          <p className="text-[11px] text-[var(--text-faint)]">
            {passes.length === 0
              ? 'No open gate pass yet — AUTO will use any pass received in this same save.'
              : 'AUTO takes the oldest pass with stock first, then spills into the next.'}
          </p>
        </div>
      )}
    </section>
  )
}

interface ShopCardProps {
  name: string
  client?: TodaySheetClient
  draft: ClientDraft
  isCustom: boolean
  reduce: boolean
  onUpdate: (updater: (draft: ClientDraft) => ClientDraft) => void
  onRemove?: () => void
}

function ShopCard({ name, client, draft, isCustom, reduce, onUpdate, onRemove }: ShopCardProps) {
  const repId = useRef(uid('rep')).current
  const passes = (client?.pending_passes ?? []).filter(
    pass => Number(pass.total_available_qty) > 0,
  )
  const recordedReceives = client?.receives ?? []
  const recordedDeliveries = client?.deliveries ?? []
  const receivedQty = recordedReceives.reduce(
    (sum, row) => sum + row.items.reduce((inner, item) => inner + Number(item.quantity || 0), 0),
    0,
  )
  const deliveredQty = recordedDeliveries.reduce(
    (sum, row) => sum + row.items.reduce((inner, item) => inner + Number(item.quantity || 0), 0),
    0,
  )

  return (
    <motion.div
      layout
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-sm border',
                isCustom
                  ? 'border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info-text)]'
                  : 'border-[var(--border-2)] bg-[var(--surface-3)] text-[var(--text-muted)]',
              )}
            >
              <Building2 size={16} aria-hidden />
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate text-[14px]">{name}</CardTitle>
              <p className="mt-0.5 truncate text-[11.5px] text-[var(--text-muted)]">
                {passes.length} open source pass{passes.length === 1 ? '' : 'es'} ·{' '}
                {fmtQty(client?.available_qty ?? 0)} on hand
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="info" size="xs">
              {fmtQty(client?.available_qty ?? 0)} on hand
            </Badge>
            {recordedReceives.length > 0 && (
              <Badge tone="success" size="xs">
                {recordedReceives.length} received · {fmtQty(receivedQty)}
              </Badge>
            )}
            {recordedDeliveries.length > 0 && (
              <Badge tone="brand" size="xs">
                {recordedDeliveries.length} delivered · {fmtQty(deliveredQty)}
              </Badge>
            )}
            {isCustom && onRemove && (
              <Button
                size="icon-sm"
                variant="danger-ghost"
                onClick={onRemove}
                aria-label={`Remove ${name} from this sheet`}
                title="Remove this shop"
              >
                <X aria-hidden />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-1.5 sm:max-w-sm">
            <label htmlFor={repId} className="section-label">
              Client representative (delivery sign-off)
            </label>
            <Input
              id={repId}
              value={draft.receivedBy}
              onChange={event => onUpdate(current => ({ ...current, receivedBy: event.target.value }))}
              placeholder="Who received the linen?"
              aria-label={`Client representative for ${name}`}
            />
          </div>

          <details className="rounded-sm border border-[var(--border)] bg-[var(--surface-2)]">
            <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)]">
              Recorded today ({recordedReceives.length + recordedDeliveries.length})
            </summary>
            <div className="border-t border-[var(--border)] px-3 py-2">
              {recordedReceives.length === 0 && recordedDeliveries.length === 0 ? (
                <p className="text-[12px] text-[var(--text-faint)]">
                  Nothing recorded for this shop on this day yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {recordedReceives.map((row, index) => (
                    <li key={`recv-${row.gate_pass_id}-${index}`} className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                      <Badge tone="success" size="xs">Received</Badge>
                      <span className="text-[var(--text-secondary)]">
                        {row.gate_pass_number || 'Gate pass'} · {historyText(row.items)}
                        {row.received_by ? ` · ${row.received_by}` : ''}
                      </span>
                    </li>
                  ))}
                  {recordedDeliveries.map((row, index) => (
                    <li key={`del-${row.delivery_id}-${index}`} className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                      <Badge tone="brand" size="xs">Delivered</Badge>
                      <span className="text-[var(--text-secondary)]">
                        {historyText(row.items)}
                        {row.received_by ? ` · ${row.received_by}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>

          <ReceiveLines lines={draft.receives} reduce={reduce} onUpdate={onUpdate} />
          <DeliveryLines lines={draft.deliveries} passes={passes} reduce={reduce} onUpdate={onUpdate} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ExpenseCardProps {
  lines: ExpenseLine[]
  recorded: TodayExpenseRecord[]
  shops: string[]
  queryError: string | null
  reduce: boolean
  onRetry: () => void
  onLinesChange: (lines: ExpenseLine[]) => void
}

function ExpenseCard({
  lines,
  recorded,
  shops,
  queryError,
  reduce,
  onRetry,
  onLinesChange,
}: ExpenseCardProps) {
  const recordedTotal = recorded.reduce((sum, row) => sum + Number(row.amount || 0), 0)

  const patch = (id: string, fields: Partial<ExpenseLine>) =>
    onLinesChange(lines.map(line => (line.id === id ? { ...line, ...fields } : line)))
  const remove = (id: string) => onLinesChange(lines.filter(line => line.id !== id))

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2">
          <Receipt size={15} aria-hidden className="text-[var(--text-muted)]" />
          Expenses for this day
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => onLinesChange([...lines, newExpenseLine()])}>
          <Plus aria-hidden />
          Add expense
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {queryError && (
          <Notice
            tone="warning"
            title="Expense history unavailable"
            action={<Button size="xs" variant="secondary" onClick={onRetry}>Retry</Button>}
          >
            {queryError} New expenses can still be staged, but saved totals may be incomplete.
          </Notice>
        )}

        {recorded.length > 0 && (
          <Notice
            tone="info"
            title={`Already recorded · ${recorded.length} line(s) · ${fmtMoney(recordedTotal)}`}
          >
            <ul className="mt-1 space-y-0.5">
              {recorded.map((row, index) => {
                const toShop = row.allocation === 'SHOP' && clean(row.client_name)
                return (
                  <li key={row.id ?? `expense-${index}`} className="flex flex-wrap justify-between gap-x-3">
                    <span className="min-w-0 truncate">
                      {row.category_name || row.description || 'Expense'}
                      {toShop && <span className="text-[var(--text-faint)]"> · {row.client_name}</span>}
                    </span>
                    <span className="tabular-nums">{fmtMoney(row.amount)}</span>
                  </li>
                )
              })}
            </ul>
          </Notice>
        )}

        {lines.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[var(--border-2)] px-3 py-2.5 text-[12px] text-[var(--text-faint)]">
            No expense lines staged. Add one to allocate transport, fuel, water or other day costs.
          </p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {lines.map(line => (
                <motion.div
                  key={line.id}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-2 overflow-hidden md:grid-cols-[minmax(0,2fr)_120px_minmax(0,1.4fr)_32px]"
                >
                  <Input
                    list="today-sheet-expense-categories"
                    value={line.category}
                    onChange={event => patch(line.id, { category: event.target.value })}
                    placeholder="Category (Transport, Water…)"
                    aria-label="Expense category"
                    className="col-span-2 md:col-span-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={line.amount}
                    onChange={event => patch(line.id, { amount: event.target.value })}
                    placeholder="Amount"
                    aria-label="Expense amount"
                  />
                  <div className="col-span-2 md:col-span-1">
                    <Select
                      value={line.clientName}
                      onChange={event => patch(line.id, { clientName: event.target.value })}
                      aria-label="Expense allocation"
                    >
                      <option value="">Shared · whole day</option>
                      {shops.map(shop => (
                        <option key={shop} value={shop}>Shop · {shop}</option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="danger-ghost"
                    onClick={() => remove(line.id)}
                    aria-label="Remove expense line"
                    title="Remove expense line"
                    className="justify-self-end"
                  >
                    <X aria-hidden />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TodaySheetPage() {
  const [date, setDate] = useState(todayISO)
  const [drafts, setDrafts] = useState<Record<string, ClientDraft>>({})
  const [customShops, setCustomShops] = useState<string[]>([])
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>(() => [newExpenseLine()])
  const [newShop, setNewShop] = useState('')
  const [validation, setValidation] = useState<string[]>([])
  const [saveResult, setSaveResult] = useState<SaveTodaySheetResult | null>(null)
  const addShopRef = useRef<HTMLInputElement>(null)

  const reduce = useReducedMotion()
  const sheet = useTodaySheet(date)
  const expenses = useTodayExpenses(date)
  const categories = useExpenseCategories()
  const save = useSaveTodaySheet()

  const data = sheet.data
  const sheetClients = data?.clients ?? EMPTY_CLIENTS

  useEffect(() => {
    setDrafts({})
    setCustomShops([])
    setExpenseLines([newExpenseLine()])
    setNewShop('')
    setValidation([])
    setSaveResult(null)
  }, [date])

  useEffect(() => {
    if (!data || data.date !== date) return
    setDrafts(previous => {
      let changed = false
      const next = { ...previous }
      for (const client of data.clients) {
        if (!next[client.client_name]) {
          next[client.client_name] = defaultDraft(client)
          changed = true
        }
      }
      return changed ? next : previous
    })
  }, [data, date])

  const shopNames = useMemo(() => {
    const names = new Set<string>()
    for (const client of sheetClients) names.add(client.client_name)
    for (const shop of customShops) names.add(shop)
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [sheetClients, customShops])

  const clientByName = useMemo(
    () => new Map(sheetClients.map(client => [client.client_name, client])),
    [sheetClients],
  )

  const itemNames = useMemo(() => {
    const names = new Set<string>()
    const addItems = (items: Array<{ item_name?: string | null }> | undefined) => {
      for (const item of items ?? []) {
        const name = clean(item.item_name)
        if (name) names.add(name)
      }
    }
    for (const client of sheetClients) {
      for (const pass of client.pending_passes ?? []) {
        addItems(pass.deliverable_items)
        addItems(pass.items)
      }
      for (const row of client.receives ?? []) addItems(row.items)
      for (const row of client.deliveries ?? []) addItems(row.items)
    }
    for (const draft of Object.values(drafts)) {
      for (const line of draft.receives) if (clean(line.itemName)) names.add(clean(line.itemName))
      for (const line of draft.deliveries) if (clean(line.itemName)) names.add(clean(line.itemName))
    }
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [sheetClients, drafts])

  const staged = useMemo(() => {
    let receives = 0
    let deliveries = 0
    for (const draft of Object.values(drafts)) {
      receives += draft.receives.filter(line => clean(line.itemName) && clean(line.quantity)).length
      deliveries += draft.deliveries.filter(line => clean(line.itemName) && clean(line.quantity)).length
    }
    return { receives, deliveries }
  }, [drafts])

  const updateDraft = (name: string, updater: (draft: ClientDraft) => ClientDraft) => {
    setDrafts(previous => {
      const current = previous[name] ?? blankDraft()
      return { ...previous, [name]: updater(current) }
    })
  }

  const addShop = () => {
    const name = clean(newShop)
    if (!name) return
    if (shopNames.some(shop => shop.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      toast.info('That shop is already on the sheet.')
      setNewShop('')
      return
    }
    setCustomShops(previous => [...previous, name])
    setDrafts(previous => ({ ...previous, [name]: previous[name] ?? blankDraft() }))
    setNewShop('')
    addShopRef.current?.focus()
  }

  const removeShop = (name: string) => {
    setCustomShops(previous => previous.filter(shop => shop !== name))
    setDrafts(previous => {
      const next = { ...previous }
      delete next[name]
      return next
    })
  }

  const handleSave = () => {
    const built = buildSheet(date, shopNames, drafts, expenseLines)
    setValidation(built.issues)
    if (built.issues.length > 0) {
      toast.error('Fix the highlighted rows before saving.')
      return
    }
    if (!built.hasEntries) {
      toast.info('Nothing entered yet')
      return
    }

    setSaveResult(null)
    save.mutate(
      { sheet: built.payload, expenses: built.expenses },
      {
        onSuccess: result => {
          setSaveResult(result)

          // Clear only what was written. Failed rows stay staged so a retry
          // cannot duplicate the groups and expenses that already succeeded.
          setDrafts(previous => {
            const next = { ...previous }
            for (const row of result.commit?.results ?? []) {
              if (!row.ok) continue
              const draft = next[row.client_name]
              if (!draft) continue
              next[row.client_name] = row.kind === 'receive'
                ? { ...draft, receives: [] }
                : { ...draft, deliveries: [] }
            }
            for (const [name, draft] of Object.entries(next)) {
              if (
                draft.receives.length === 0 &&
                draft.deliveries.length === 0 &&
                !clean(draft.receivedBy)
              ) {
                delete next[name]
              }
            }
            return next
          })

          const failedExpenses = new Set(result.failedExpenseIndexes)
          setExpenseLines(previous =>
            previous.filter((_line, index) => failedExpenses.has(index)),
          )

          const expensesSaved = built.expenses.length - result.expenseFailures
          const linenSaved = result.commit?.summary.succeeded ?? 0
          if (result.failures === 0) {
            toast.success(`Day saved · ${linenSaved} linen group(s), ${expensesSaved} expense line(s)`)
          } else {
            toast.error(`${result.failures} row(s) failed — the rest were saved`)
          }
        },
        onError: error => {
          setSaveResult(null)
          toast.error(errorText(error, 'Save failed — please retry'))
        },
      },
    )
  }

  const saveButton = (
    <Button
      variant="primary"
      loading={save.isPending}
      disabled={sheet.isLoading}
      onClick={handleSave}
    >
      {save.isPending ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden /> : <Save aria-hidden />}
      Save Day
    </Button>
  )

  const header = (
    <PageHeader
      title="Today Sheet"
      subtitle="One screen for receiving, delivering and daily costs — per shop."
      breadcrumb={[{ label: 'Today' }, { label: 'Sheet' }]}
      actions={saveButton}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setDate(current => addDaysISO(current, -1))}
          aria-label="Previous day"
          title="Previous day"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Input
          type="date"
          value={date}
          onChange={event => {
            if (event.target.value) setDate(event.target.value)
          }}
          aria-label="Sheet date"
          className="w-[160px]"
        />
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setDate(current => addDaysISO(current, 1))}
          aria-label="Next day"
          title="Next day"
        >
          <ChevronRight aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDate(todayISO())}
          disabled={date === todayISO()}
        >
          Today
        </Button>
        <Badge tone="info">
          <CalendarDays size={12} aria-hidden />
          {formatCalendarDate(date)}
        </Badge>
      </div>
    </PageHeader>
  )

  if (sheet.isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (sheet.isError || !data) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        {header}
        <ErrorState
          title="Could not load the Today Sheet"
          description={errorText(sheet.error, 'The daily operations API did not respond. Check the connection and try again.')}
          onRetry={() => void sheet.refetch()}
        />
      </div>
    )
  }

  const totals = data.totals
  const expenseError = expenses.isError
    ? errorText(expenses.error, 'The management service did not respond.')
    : null

  return (
    <div className="space-y-4 p-4 md:p-6">
      {header}

      <datalist id="today-sheet-item-options">
        {itemNames.map(name => <option key={name} value={name} />)}
      </datalist>
      <datalist id="today-sheet-unit-options">
        {DEFAULT_UNITS.map(unit => <option key={unit} value={unit} />)}
      </datalist>
      <datalist id="today-sheet-expense-categories">
        {Array.from(new Set([...DEFAULT_CATEGORIES, ...(categories.data ?? [])])).map(category => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Shops on sheet"
          value={totals.clients + customShops.length}
          icon={<Building2 aria-hidden />}
          tone="neutral"
          description={`${totals.pending_passes} open source pass(es)`}
        />
        <StatCard
          label="Linen on hand"
          value={fmtQty(totals.available_qty)}
          icon={<Package aria-hidden />}
          tone="info"
          description="Across all active shops"
        />
        <StatCard
          label="Received today"
          value={fmtQty(totals.received_qty)}
          icon={<PackageCheck aria-hidden />}
          tone="success"
          description={`${totals.received_lines} recorded line(s)`}
        />
        <StatCard
          label="Delivered today"
          value={fmtQty(totals.delivered_qty)}
          icon={<Truck aria-hidden />}
          tone="brand"
          description={`${totals.delivery_lines} recorded line(s)`}
        />
      </div>

      <Notice tone="info" title="How this sheet works">
        Enter received and returned linen per shop, then press <strong>Save Day</strong>. Delivery
        lines default to AUTO — the server takes stock from the oldest gate pass first. Expenses can
        be shared across the day or attached to one shop.
      </Notice>

      {validation.length > 0 && (
        <Notice tone="danger" title="Check these entries">
          <ul className="list-disc space-y-0.5 pl-4">
            {validation.map(issue => <li key={issue}>{issue}</li>)}
          </ul>
        </Notice>
      )}

      {saveResult && (
        <Notice
          tone={saveResult.failures === 0 ? 'success' : 'warning'}
          title={
            saveResult.failures === 0
              ? 'Day saved'
              : `${saveResult.failures} row(s) failed — successful rows were saved`
          }
          action={
            <Button size="xs" variant="ghost" onClick={() => setSaveResult(null)}>
              Dismiss
            </Button>
          }
        >
          <p>
            {saveResult.commit?.summary.succeeded ?? 0} linen group(s) written ·{' '}
            {saveResult.expenseFailures} expense line(s) failed.
          </p>
          {saveResult.failedGroups.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {saveResult.failedGroups.map((row, index) => (
                <li key={`${row.kind}-${row.client_name}-${index}`}>
                  <span className="font-medium">{row.client_name}</span> · {row.kind}: {row.error || 'not saved'}
                </li>
              ))}
            </ul>
          )}
        </Notice>
      )}

      <Card>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="today-sheet-add-shop" className="section-label">
              Add a shop to this sheet
            </label>
            <Input
              id="today-sheet-add-shop"
              ref={addShopRef}
              value={newShop}
              onChange={event => setNewShop(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addShop()
                }
              }}
              placeholder="Hotel or shop name"
              aria-label="New shop name"
            />
          </div>
          <Button variant="secondary" onClick={addShop} disabled={!clean(newShop)}>
            <Plus aria-hidden />
            Add shop
          </Button>
        </CardContent>
      </Card>

      {shopNames.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={18} aria-hidden />}
          title="No active shops for this day"
          description="Add a shop above to start recording linen, or choose another date."
          action={<Button size="sm" variant="secondary" onClick={() => addShopRef.current?.focus()}>Add a shop</Button>}
        />
      ) : (
        <div className="space-y-3">
          {shopNames.map(name => (
            <ShopCard
              key={name}
              name={name}
              client={clientByName.get(name)}
              draft={drafts[name] ?? blankDraft()}
              isCustom={customShops.includes(name)}
              reduce={reduce}
              onUpdate={updater => updateDraft(name, updater)}
              onRemove={customShops.includes(name) ? () => removeShop(name) : undefined}
            />
          ))}
        </div>
      )}

      <ExpenseCard
        lines={expenseLines}
        recorded={expenses.data ?? []}
        shops={shopNames}
        queryError={expenseError}
        reduce={reduce}
        onRetry={() => void expenses.refetch()}
        onLinesChange={setExpenseLines}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-primary)] tabular-nums">{staged.receives}</span> received ·{' '}
            <span className="font-medium text-[var(--text-primary)] tabular-nums">{staged.deliveries}</span> delivered ·{' '}
            <span className="font-medium text-[var(--text-primary)] tabular-nums">{expenseLines.length}</span> expense line(s) staged
          </p>
          {saveButton}
        </CardContent>
      </Card>
    </div>
  )
}
