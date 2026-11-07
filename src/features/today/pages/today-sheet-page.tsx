import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Printer,
  PackageCheck,
  PackageOpen,
  Truck,
  Receipt,
  Store,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { PageHeader } from '../../../components/ui/page-header'
import { Skeleton } from '../../../components/ui/skeleton'
import { todaySheetApi, type SheetClient, type SheetCommitResult } from '../services/ops.service'
import { expensesApi } from '../../management/api/management-api'
import { todayISO } from '../../../lib/time'

const inputClass =
  'h-7 w-full rounded border border-[var(--border-2)] bg-[var(--surface)] px-1.5 text-[11px] text-[var(--text-primary)] outline-none transition ' +
  'placeholder:text-[var(--text-placeholder)] hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:ring-2 ' +
  'focus:ring-[color-mix(in_srgb,var(--brand)_24%,transparent)]'
const fmtQty = (v: number) => (Number(v) || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })
const fmtMoney = (v: number) =>
  (Number(v) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface RecvLine { key: string; item_name: string; specification: string; quantity: string; unit: string }
interface DelLine { key: string; item_name: string; specification: string; quantity: string; gate_pass_id: string }
interface ExpLine { key: string; category_name: string; amount: string; client_name: string }

const uid = () => crypto.randomUUID()
const recv = (item_name = '', specification = ''): RecvLine => ({ key: uid(), item_name, specification, quantity: '', unit: 'pcs' })
const del = (item_name = '', specification = '', gate_pass_id = ''): DelLine => ({ key: uid(), item_name, specification, quantity: '', gate_pass_id })
const exp = (): ExpLine => ({ key: uid(), category_name: '', amount: '', client_name: '' })

interface ClientDraft { receives: RecvLine[]; deliveries: DelLine[]; receivedBy: string }

const cellLabel = 'text-[9.5px] font-semibold uppercase tracking-wide text-[var(--text-faint)]'

// ── Stock status pill — colour carries meaning: stocked / low / empty ──────────
function StockPill({ qty }: { qty: number }) {
  const tone =
    qty <= 0 ? 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
    : qty < 20
      ? 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]'
      : 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]'
  const word = qty <= 0 ? 'Empty' : qty < 20 ? 'Low' : 'OK'
  return (
    <span className={`inline-flex items-center rounded-sm border px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${tone}`}>
      {word}
    </span>
  )
}

// ── Summary chip for the sticky save bar — green in / blue out / amber spend ──
function SummaryPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Truck
  label: string
  value: string
  tone: 'success' | 'info' | 'warning'
}) {
  const tones = {
    success: 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]',
    info: 'border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info-text)]',
    warning: 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]',
  }[tone]
  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${tones}`}>
      <Icon size={12} aria-hidden />
      <span className="text-[9.5px] font-semibold uppercase tracking-wide opacity-80">{label}</span>
      <span className="text-[12px] font-bold tabular-nums">{value}</span>
    </div>
  )
}

// ── Column header chips — the column itself is tinted by meaning ──────────────
function ColChip({ icon: Icon, children, tone }: { icon: typeof Truck; children: React.ReactNode; tone: 'success' | 'info' }) {
  const tones = {
    success: 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]',
    info: 'border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info-text)]',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide ${tones}`}>
      <Icon size={11} aria-hidden /> {children}
    </span>
  )
}

export default function TodaySheetPage() {
  const date = todayISO()
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['today-sheet', date],
    queryFn: () => todaySheetApi.get(date),
  })
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.categories().then(r => r.data as Array<{ id: string; name: string }>),
    retry: 1,
  })
  const { data: recordedExpenses } = useQuery({
    queryKey: ['today-expenses', date],
    queryFn: () => expensesApi.list({ start_date: date, end_date: date, limit: 200 }).then(r => r.data as { items?: Array<{ id: string; category_name?: string; amount?: number; client_name?: string; allocation?: string; description?: string }> }),
    retry: 1,
  })

  const [drafts, setDrafts] = useState<Record<string, ClientDraft>>({})
  const [expenses, setExpenses] = useState<ExpLine[]>([exp()])
  const [results, setResults] = useState<SheetCommitResult[] | null>(null)

  const clients = useMemo(() => data?.clients ?? [], [data])

  const draftFor = (c: SheetClient): ClientDraft =>
    drafts[c.client_name] ?? {
      receives: [],
      deliveries: c.pending_passes.flatMap(p =>
        p.deliverable_items.map(i => del(i.item_name, i.specification ?? '', ''))
      ),
      receivedBy: '',
    }

  const patch = (name: string, fn: (d: ClientDraft) => ClientDraft) => {
    const c = clients.find(x => x.client_name === name)
    if (!c) return
    setDrafts(prev => ({ ...prev, [name]: fn(draftFor(c)) }))
  }

  const setRecv = (name: string, lines: RecvLine[]) => patch(name, d => ({ ...d, receives: lines }))
  const setDel = (name: string, lines: DelLine[]) => patch(name, d => ({ ...d, deliveries: lines }))

  const commit = useMutation({
    mutationFn: async () => {
      const receives = clients.flatMap(c => {
        const lines = (drafts[c.client_name]?.receives ?? []).filter(l => l.item_name.trim() && Number(l.quantity) > 0)
        return lines.length ? [{ client_name: c.client_name, items: lines.map(l => ({ item_name: l.item_name.trim(), specification: l.specification || undefined, unit: l.unit || undefined, quantity: Number(l.quantity) })) }] : []
      })
      const deliveries = clients.flatMap(c => {
        const lines = (drafts[c.client_name]?.deliveries ?? [])
          .filter(l => l.item_name.trim() && Number(l.quantity) > 0)
          .map(l => ({
            item_name: l.item_name.trim(),
            specification: l.specification || undefined,
            quantity: Number(l.quantity),
            gate_pass_id: l.gate_pass_id && l.gate_pass_id !== 'AUTO' ? l.gate_pass_id : undefined,
          }))
        return lines.length ? [{ client_name: c.client_name, items: lines, received_by: drafts[c.client_name]?.receivedBy?.trim() || undefined }] : []
      })
      const sheet = await todaySheetApi.commit({ date, receives, deliveries })
      const expLines = expenses.filter(e => e.category_name.trim() && Number(e.amount) > 0)
      const expResults = await Promise.allSettled(
        expLines.map(e => expensesApi.create({
          date,
          category_name: e.category_name.trim(),
          amount: Number(e.amount),
          client_name: e.client_name || undefined,
          allocation: e.client_name ? 'SHOP' : 'SHARED',
        }))
      )
      return { sheet, expResults }
    },
    onSuccess: ({ sheet, expResults }) => {
      setResults(sheet.results)
      const failed = sheet.results.filter(r => !r.ok).length + expResults.filter(r => r.status === 'rejected').length
      if (failed === 0) {
        toast.success('Day saved')
        setDrafts({})
        setExpenses([exp()])
      } else {
        toast.error(`${failed} row(s) failed — see details below`)
      }
      qc.invalidateQueries({ queryKey: ['today-sheet'] })
      qc.invalidateQueries({ queryKey: ['ops'] })
      qc.invalidateQueries({ queryKey: ['today-expenses'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || e?.message || 'Commit failed'),
  })

  const hasInput = useMemo(() =>
    clients.some(c => {
      const d = drafts[c.client_name]
      return (d?.receives ?? []).some(l => l.item_name.trim() && Number(l.quantity) > 0)
        || (d?.deliveries ?? []).some(l => l.item_name.trim() && Number(l.quantity) > 0)
    }) || expenses.some(e => e.category_name.trim() && Number(e.amount) > 0),
    [clients, drafts, expenses])

  const passOptions = (c: SheetClient) => c.pending_passes.filter(p => p.total_available_qty > 0)

  const itemNames = useMemo(() => {
    const s = new Set<string>()
    clients.forEach(c => {
      c.pending_passes.forEach(p => p.items.forEach(i => i.item_name && s.add(i.item_name)))
      c.receives.forEach(r => r.items.forEach(i => i.item_name && s.add(i.item_name)))
    })
    return [...s].sort()
  }, [clients])

  if (isLoading) return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-8 w-72" />
      {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  )
  if (isError) return <div className="p-6 text-[13px] text-[var(--danger-text)]">Could not load the today sheet.</div>

  const totals = {
    recv: clients.reduce((s, c) => s + (drafts[c.client_name]?.receives ?? []).reduce((a, l) => a + (Number(l.quantity) || 0), 0), 0),
    del: clients.reduce((s, c) => s + (drafts[c.client_name]?.deliveries ?? []).reduce((a, l) => a + (Number(l.quantity) || 0), 0), 0),
    exp: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
  }
  const enteredShops = clients.filter(c => {
    const d = drafts[c.client_name]
    return (d?.receives ?? []).some(l => l.item_name.trim() && Number(l.quantity) > 0)
      || (d?.deliveries ?? []).some(l => l.item_name.trim() && Number(l.quantity) > 0)
  }).length

  return (
    <div className="space-y-3 pb-6">
      <div className="print:hidden">
        <PageHeader
          title="Today Sheet"
          subtitle={`${date} · every shop on one sheet — received, delivered, expenses`}
          breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Today', href: '/today' }, { label: 'Today Sheet' }]}
          actions={
            <>
              <Badge tone="info" size="sm" mono>{clients.length} shops</Badge>
              {hasInput
                ? <Badge tone="warning" size="sm" dot>{enteredShops} unsaved</Badge>
                : <Badge tone="neutral" size="sm">Nothing entered</Badge>}
            </>
          }
        />
      </div>

      {results && (
        <Card className="p-3 print:hidden">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 size={15} className="text-[var(--success-text)]" />
            <h3 className="text-[12.5px] font-semibold text-[var(--text-primary)]">Commit results</h3>
            <Badge tone={results.every(r => r.ok) ? 'success' : 'danger'} size="xs">
              {results.filter(r => r.ok).length}/{results.length} ok
            </Badge>
          </div>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-[var(--success-text)]' : 'text-[var(--danger-text)]'}`}>
                {r.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                <span className="font-semibold">{r.section}</span>
                <span>{r.client_name}</span>
                {r.ok && r.gate_pass_number && <span className="text-[var(--text-faint)]">{r.gate_pass_number}</span>}
                {!r.ok && <span className="truncate">{String(r.error)}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── The sheet: dense, colour-coded columns ── */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 print:hidden">
          <div className="flex items-center gap-2">
            <Store size={13} className="text-[var(--text-faint)]" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Shops</span>
          </div>
          <span className="text-[10px] text-[var(--text-faint)]">Source pass “AUTO · FIFO” = oldest stock first</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-sunken)]">
                <th className="w-[168px] px-2 py-1.5 text-left font-semibold text-[var(--text-muted)]">Shop / Hotel</th>
                <th className="w-[96px] px-2 py-1.5 text-center font-semibold text-[var(--text-muted)]">On hand</th>
                <th className="px-2 py-1.5 text-left"><ColChip icon={PackageCheck} tone="success">Received</ColChip></th>
                <th className="px-2 py-1.5 text-left"><ColChip icon={Truck} tone="info">Delivered</ColChip></th>
                <th className="w-[72px] px-2 py-1.5 text-right font-semibold text-[var(--text-muted)]">In / Out</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <PackageOpen size={22} className="mx-auto mb-1.5 text-[var(--text-faint)]" aria-hidden />
                    <p className="text-[12px] text-[var(--text-muted)]">No active shops for this day yet.</p>
                  </td>
                </tr>
              )}
              {clients.map(c => {
                const d = draftFor(c)
                const passes = passOptions(c)
                const inQty = d.receives.reduce((a, l) => a + (Number(l.quantity) || 0), 0)
                const outQty = d.deliveries.reduce((a, l) => a + (Number(l.quantity) || 0), 0)
                const typed = d.receives.some(l => l.item_name.trim() && Number(l.quantity) > 0)
                  || d.deliveries.some(l => l.item_name.trim() && Number(l.quantity) > 0)
                return (
                  <tr
                    key={c.client_name}
                    className={`border-b border-[var(--border)] align-top transition-colors hover:bg-[var(--surface-hover)]/60 ${typed ? 'bg-[var(--brand-soft)]/25' : ''}`}
                  >
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          aria-hidden
                          className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[10px] font-bold text-[var(--brand-text)]"
                        >
                          {(c.client_name?.trim()?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[11.5px] font-semibold leading-tight text-[var(--text-primary)]" title={c.client_name}>
                            {c.client_name}
                          </div>
                          <div className="text-[9px] leading-tight text-[var(--text-faint)] tabular-nums">
                            r {fmtQty(c.received_qty)} · d {fmtQty(c.delivered_qty)}
                            {c.receives.length + c.deliveries.length > 0 && ` · ${c.receives.length + c.deliveries.length} logged`}
                          </div>
                        </div>
                      </div>
                      <input
                        className="mt-1 h-6 w-full rounded border border-[var(--border-2)] bg-[var(--surface-sunken)] px-1.5 text-[10px] text-[var(--text-tertiary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                        placeholder="Client rep (sign-off)"
                        value={d.receivedBy}
                        onChange={e => setDrafts(prev => ({ ...prev, [c.client_name]: { ...draftFor(c), receivedBy: e.target.value } }))}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="text-[15px] font-bold leading-none text-[var(--text-primary)] tabular-nums">{fmtQty(c.available_qty)}</div>
                      <div className="mt-1"><StockPill qty={c.available_qty} /></div>
                    </td>
                    <td className="bg-[var(--success-soft)]/30 px-2 py-1.5">
                      {d.receives.map((l, idx) => (
                        <div key={l.key} className="mb-1 grid grid-cols-[1fr_64px_48px_44px_22px] items-center gap-1">
                          <input list="sheet-items" className={inputClass} placeholder="Item" value={l.item_name}
                            onChange={e => setRecv(c.client_name, d.receives.map((x, i) => i === idx ? { ...x, item_name: e.target.value } : x))} />
                          <input className={inputClass} placeholder="Spec" value={l.specification}
                            onChange={e => setRecv(c.client_name, d.receives.map((x, i) => i === idx ? { ...x, specification: e.target.value } : x))} />
                          <input className={`${inputClass} text-right tabular-nums`} type="number" min="0" step="0.01" placeholder="Qty" value={l.quantity}
                            onChange={e => setRecv(c.client_name, d.receives.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
                          <input className={inputClass} placeholder="Unit" value={l.unit}
                            onChange={e => setRecv(c.client_name, d.receives.map((x, i) => i === idx ? { ...x, unit: e.target.value } : x))} />
                          <button aria-label="Remove line" className="flex size-5 cursor-pointer items-center justify-center rounded text-[var(--text-faint)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)]" onClick={() => setRecv(c.client_name, d.receives.filter((_, i) => i !== idx))}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button className="mt-0.5 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 text-[10px] font-semibold text-[var(--success-text)] transition-colors hover:bg-[var(--success-soft)]"
                        onClick={() => setRecv(c.client_name, [...d.receives, recv()])}>
                        <Plus size={11} /> received line
                      </button>
                    </td>
                    <td className="bg-[var(--info-soft)]/30 px-2 py-1.5">
                      {d.deliveries.map((l, idx) => (
                        <div key={l.key} className="mb-1 grid grid-cols-[1fr_64px_48px_112px_22px] items-center gap-1">
                          <input list="sheet-items" className={inputClass} placeholder="Item" value={l.item_name}
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, item_name: e.target.value } : x))} />
                          <input className={inputClass} placeholder="Spec" value={l.specification}
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, specification: e.target.value } : x))} />
                          <input className={`${inputClass} text-right tabular-nums`} type="number" min="0" step="0.01" placeholder="Qty" value={l.quantity}
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
                          <select className={inputClass} value={l.gate_pass_id || 'AUTO'} title="Source pass — AUTO uses oldest stock first (FIFO)"
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, gate_pass_id: e.target.value === 'AUTO' ? '' : e.target.value } : x))}>
                            <option value="AUTO">AUTO · FIFO</option>
                            {passes.map(p => (
                              <option key={p.gate_pass_id} value={p.gate_pass_id}>
                                {p.gate_pass_number} · {fmtQty(p.total_available_qty)} left
                              </option>
                            ))}
                          </select>
                          <button aria-label="Remove line" className="flex size-5 cursor-pointer items-center justify-center rounded text-[var(--text-faint)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)]" onClick={() => setDel(c.client_name, d.deliveries.filter((_, i) => i !== idx))}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button className="mt-0.5 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 text-[10px] font-semibold text-[var(--info-text)] transition-colors hover:bg-[var(--info-soft)]"
                        onClick={() => setDel(c.client_name, [...d.deliveries, del()])}>
                        <Plus size={11} /> delivered line
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      <div className="text-[11.5px] font-semibold leading-tight text-[var(--success-text)]">{inQty ? `+${fmtQty(inQty)}` : '—'}</div>
                      <div className="text-[11.5px] font-semibold leading-tight text-[var(--info-text)]">{outQty ? `−${fmtQty(outQty)}` : '—'}</div>
                    </td>
                  </tr>
                )
              })}
              {clients.length > 0 && (
                <tr className="border-t-2 border-[var(--border-2)] bg-[var(--surface-2)] font-bold text-[var(--text-primary)]">
                  <td className="px-2 py-1.5 text-[11px]">Day totals</td>
                  <td className="px-2 py-1.5 text-center text-[11px] tabular-nums">{fmtQty(clients.reduce((s, c) => s + c.available_qty, 0))}</td>
                  <td className="px-2 py-1.5 text-[11px] tabular-nums text-[var(--success-text)]">{fmtQty(totals.recv)} entering</td>
                  <td className="px-2 py-1.5 text-[11px] tabular-nums text-[var(--info-text)]">{fmtQty(totals.del)} leaving</td>
                  <td className={`px-2 py-1.5 text-right text-[11px] tabular-nums ${totals.recv - totals.del >= 0 ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'}`}>
                    {totals.recv - totals.del >= 0 ? '+' : ''}{fmtQty(totals.recv - totals.del)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Expenses — amber means money out ── */}
      <Card className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]">
              <Receipt size={14} aria-hidden />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold leading-tight text-[var(--text-primary)]">Expenses today</h3>
              <p className="text-[9.5px] text-[var(--text-faint)]">Blank shop = shared laundry cost</p>
            </div>
          </div>
          <Button size="xs" variant="outline" className="gap-1" onClick={() => setExpenses(prev => [...prev, exp()])}>
            <Plus size={12} /> Add expense
          </Button>
        </div>

        {(recordedExpenses?.items?.length ?? 0) > 0 && (
          <div className="mt-2 rounded-md border border-[var(--info-border)] bg-[var(--info-soft)] px-2.5 py-1.5">
            <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--info-text)]">
              Recorded today ({recordedExpenses!.items!.length})
            </p>
            <div className="space-y-0.5">
              {recordedExpenses!.items!.map(e => (
                <div key={e.id} className="flex items-center justify-between gap-2 text-[10.5px] text-[var(--info-text)]">
                  <span className="truncate text-[var(--text-secondary)]">{e.category_name || e.description || 'Expense'}</span>
                  <span className="shrink-0 tabular-nums">
                    {e.allocation === 'SHOP' && e.client_name ? `${e.client_name} · ` : ''}
                    LKR {fmtMoney(Number(e.amount || 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 grid grid-cols-[1fr_96px_150px_24px] gap-1.5 px-0.5 pb-1">
          {['Category', 'Amount (LKR)', 'Allocate to', ''].map(h => <span key={h} className={cellLabel}>{h}</span>)}
        </div>
        {expenses.map((e, idx) => (
          <div key={e.key} className="mb-1 grid grid-cols-[1fr_96px_150px_24px] items-center gap-1.5">
            <input className={inputClass} placeholder="e.g. Electricity, Water, Disposal" list="exp-categories" value={e.category_name}
              onChange={ev => setExpenses(prev => prev.map((x, i) => i === idx ? { ...x, category_name: ev.target.value } : x))} />
            <input className={`${inputClass} text-right tabular-nums`} type="number" min="0" step="0.01" placeholder="0.00" value={e.amount}
              onChange={ev => setExpenses(prev => prev.map((x, i) => i === idx ? { ...x, amount: ev.target.value } : x))} />
            <select className={inputClass} value={e.client_name} title="Shop allocation — blank means shared"
              onChange={ev => setExpenses(prev => prev.map((x, i) => i === idx ? { ...x, client_name: ev.target.value } : x))}>
              <option value="">Shared (laundry)</option>
              {clients.map(c => <option key={c.client_name} value={c.client_name}>{c.client_name}</option>)}
            </select>
            <button aria-label="Remove expense" className="flex size-6 cursor-pointer items-center justify-center rounded text-[var(--text-faint)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)]" onClick={() => setExpenses(prev => prev.filter((_, i) => i !== idx))}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <datalist id="exp-categories">{(categories ?? []).map(c => <option key={c.id} value={c.name} />)}</datalist>
        {totals.exp > 0 && (
          <p className="mt-1 text-right text-[11px] font-bold tabular-nums text-[var(--warning-text)]">
            Expense total: LKR {fmtMoney(totals.exp)}
          </p>
        )}
      </Card>

      {/* ── Sticky save bar — totals always visible, save always reachable ── */}
      <div className="sticky bottom-3 z-20 print:hidden">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border-2)] bg-[var(--surface)]/95 px-2.5 py-2 shadow-[var(--shadow-md)] backdrop-blur">
          <SummaryPill icon={PackageCheck} label="In" value={fmtQty(totals.recv)} tone="success" />
          <SummaryPill icon={Truck} label="Out" value={fmtQty(totals.del)} tone="info" />
          <SummaryPill icon={Receipt} label="Exp" value={`LKR ${fmtMoney(totals.exp)}`} tone="warning" />
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="secondary" size="sm" onClick={() => window.print()} className="gap-1.5" aria-label="Print sheet">
              <Printer size={14} aria-hidden />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => commit.mutate()} disabled={!hasInput || commit.isPending} loading={commit.isPending} className="gap-1.5">
              <Save size={14} aria-hidden />
              {commit.isPending ? 'Saving…' : 'Save Day'}
            </Button>
          </div>
        </div>
      </div>

      <datalist id="sheet-items">{itemNames.map(n => <option key={n} value={n} />)}</datalist>
    </div>
  )
}
