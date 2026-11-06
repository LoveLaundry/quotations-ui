import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Save, CheckCircle2, AlertCircle, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Skeleton } from '../../../components/ui/skeleton'
import { todaySheetApi, type SheetClient, type SheetCommitResult } from '../services/ops.service'
import { expensesApi } from '../../management/api/management-api'
import { todayISO } from '../../../lib/time'

const inputClass = 'h-8 w-full rounded-md border border-[#E4E7EC] bg-white px-2 text-[12px] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition'
const fmtQty = (v: number) => (Number(v) || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })

interface RecvLine { key: string; item_name: string; specification: string; quantity: string; unit: string }
interface DelLine { key: string; item_name: string; specification: string; quantity: string; gate_pass_id: string }
interface ExpLine { key: string; category_name: string; amount: string; client_name: string }

const uid = () => crypto.randomUUID()
const recv = (item_name = '', specification = ''): RecvLine => ({ key: uid(), item_name, specification, quantity: '', unit: 'pcs' })
const del = (item_name = '', specification = '', gate_pass_id = ''): DelLine => ({ key: uid(), item_name, specification, quantity: '', gate_pass_id })
const exp = (): ExpLine => ({ key: uid(), category_name: '', amount: '', client_name: '' })

interface ClientDraft { receives: RecvLine[]; deliveries: DelLine[]; receivedBy: string }

const cellLabel = 'text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]'

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

  if (isLoading) return <div className="space-y-3 p-6"><Skeleton className="h-10 w-64" />{[0, 1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
  if (isError) return <div className="p-6 text-[13px] text-[#DC2626]">Could not load the today sheet.</div>

  const totals = {
    recv: clients.reduce((s, c) => s + (drafts[c.client_name]?.receives ?? []).reduce((a, l) => a + (Number(l.quantity) || 0), 0), 0),
    del: clients.reduce((s, c) => s + (drafts[c.client_name]?.deliveries ?? []).reduce((a, l) => a + (Number(l.quantity) || 0), 0), 0),
    exp: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="print:hidden">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Today' }, { label: 'Today Sheet' }]} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E4E7EC] bg-white px-4 py-3 shadow-sm">
          <div>
            <h1 className="text-[17px] font-extrabold text-[#101828]">Today Sheet — {date}</h1>
            <p className="text-[11px] text-[#98A2B3]">Every shop on one sheet. Enter received &amp; delivered quantities, pick a source pass or leave AUTO (FIFO), add expenses, then Save Day.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#6B7280]">
              Entering: <b>{fmtQty(totals.recv)}</b> recv · <b>{fmtQty(totals.del)}</b> del · <b>{totals.exp.toLocaleString('en-LK')}</b> exp
            </span>
            <Button variant="outline" onClick={() => window.print()} className="gap-2 cursor-pointer print:hidden">
              <Printer size={16} /> Print
            </Button>
            <Button onClick={() => commit.mutate()} disabled={!hasInput || commit.isPending} className="gap-2 cursor-pointer">
              <Save size={16} /> {commit.isPending ? 'Saving…' : 'Save Day'}
            </Button>
          </div>
        </div>
      </div>

      {results && (
        <Card className="p-4 print:hidden">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-[#16A34A]" />
            <h3 className="text-[13px] font-semibold">Commit results</h3>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 text-[12px] ${r.ok ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                {r.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                <span className="font-medium">{r.section}</span>
                <span>{r.client_name}</span>
                {r.ok && r.gate_pass_number && <span className="text-[#98A2B3]">{r.gate_pass_number}</span>}
                {!r.ok && <span className="truncate">{String(r.error)}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── The sheet: one row per shop, everything visible at once ── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                <th className="px-3 py-2 text-left font-semibold text-[#6B7280] w-[180px]">Shop / Hotel</th>
                <th className="px-3 py-2 text-left font-semibold text-[#6B7280] w-[110px] text-center">On hand</th>
                <th className="px-3 py-2 text-left font-semibold text-[#6B7280]">Received today — item · spec · qty · unit</th>
                <th className="px-3 py-2 text-left font-semibold text-[#6B7280]">Delivered today — item · spec · qty · source pass</th>
                <th className="px-3 py-2 text-right font-semibold text-[#6B7280] w-[90px]">In / Out</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#98A2B3]">No active shops for this day yet.</td></tr>
              )}
              {clients.map(c => {
                const d = draftFor(c)
                const passes = passOptions(c)
                const inQty = d.receives.reduce((a, l) => a + (Number(l.quantity) || 0), 0)
                const outQty = d.deliveries.reduce((a, l) => a + (Number(l.quantity) || 0), 0)
                return (
                  <tr key={c.client_name} className="border-b border-[#F2F4F7] align-top hover:bg-[#F9FAFB]/50">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-[#101828] text-[13px]">{c.client_name}</div>
                      <div className="text-[10px] text-[#98A2B3] mt-0.5">
                        recv {fmtQty(c.received_qty)} · del {fmtQty(c.delivered_qty)}
                        {c.receives.length + c.deliveries.length > 0 && ` · ${c.receives.length + c.deliveries.length} record(s) today`}
                      </div>
                      <input
                        className="mt-1 h-6 w-full rounded border border-[#E4E7EC] px-1.5 text-[10px] text-[#6B7280] outline-none focus:border-[#2563EB]"
                        placeholder="Client rep (delivery sign-off)"
                        value={d.receivedBy}
                        onChange={e => setDrafts(prev => ({ ...prev, [c.client_name]: { ...draftFor(c), receivedBy: e.target.value } }))}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="font-bold text-[#101828]">{fmtQty(c.available_qty)}</div>
                      <div className={cellLabel}>avail</div>
                    </td>
                    <td className="px-3 py-2">
                      {d.receives.map((l, idx) => (
                        <div key={l.key} className="grid grid-cols-[1fr_90px_64px_28px] gap-1 mb-1 items-center">
                          <input list="sheet-items" className={inputClass} placeholder="Item" value={l.item_name}
                            onChange={e => setRecv(c.client_name, d.receives.map((x, i) => i === idx ? { ...x, item_name: e.target.value } : x))} />
                          <input className={inputClass} placeholder="Spec" value={l.specification}
                            onChange={e => setRecv(c.client_name, d.receives.map((x, i) => i === idx ? { ...x, specification: e.target.value } : x))} />
                          <input className={`${inputClass} text-right`} type="number" min="0" step="0.01" placeholder="Qty" value={l.quantity}
                            onChange={e => setRecv(c.client_name, d.receives.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
                          <button className="p-1 text-[#98A2B3] hover:text-[#DC2626] cursor-pointer" onClick={() => setRecv(c.client_name, d.receives.filter((_, i) => i !== idx))}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline cursor-pointer"
                        onClick={() => setRecv(c.client_name, [...d.receives, recv()])}>
                        <Plus size={12} /> received line
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      {d.deliveries.map((l, idx) => (
                        <div key={l.key} className="grid grid-cols-[1fr_80px_64px_150px_28px] gap-1 mb-1 items-center">
                          <input list="sheet-items" className={inputClass} placeholder="Item" value={l.item_name}
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, item_name: e.target.value } : x))} />
                          <input className={inputClass} placeholder="Spec" value={l.specification}
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, specification: e.target.value } : x))} />
                          <input className={`${inputClass} text-right`} type="number" min="0" step="0.01" placeholder="Qty" value={l.quantity}
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
                          <select className={inputClass} value={l.gate_pass_id} title="Source pass — AUTO uses oldest stock first (FIFO)"
                            onChange={e => setDel(c.client_name, d.deliveries.map((x, i) => i === idx ? { ...x, gate_pass_id: e.target.value } : x))}>
                            <option value="AUTO">AUTO · FIFO</option>
                            {passes.map(p => (
                              <option key={p.gate_pass_id} value={p.gate_pass_id}>
                                {p.gate_pass_number} · {fmtQty(p.total_available_qty)} left
                              </option>
                            ))}
                          </select>
                          <button className="p-1 text-[#98A2B3] hover:text-[#DC2626] cursor-pointer" onClick={() => setDel(c.client_name, d.deliveries.filter((_, i) => i !== idx))}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline cursor-pointer"
                        onClick={() => setDel(c.client_name, [...d.deliveries, del()])}>
                        <Plus size={12} /> delivered line
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-semibold text-[#101828]">{inQty ? `+${fmtQty(inQty)}` : '—'}</div>
                      <div className="font-semibold text-[#B91C1C]">{outQty ? `−${fmtQty(outQty)}` : '—'}</div>
                    </td>
                  </tr>
                )
              })}
              {clients.length > 0 && (
                <tr className="bg-[#F9FAFB] border-t-2 border-[#E4E7EC] font-bold text-[#101828]">
                  <td className="px-3 py-2.5">Day totals</td>
                  <td className="px-3 py-2.5 text-center">{fmtQty(clients.reduce((s, c) => s + c.available_qty, 0))}</td>
                  <td className="px-3 py-2.5">{fmtQty(totals.recv)} entering</td>
                  <td className="px-3 py-2.5">{fmtQty(totals.del)} leaving</td>
                  <td className="px-3 py-2.5 text-right">{fmtQty(totals.recv - totals.del)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Expenses strip ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-[13px] font-semibold text-[#101828]">Expenses today</h3>
            <p className="text-[11px] text-[#98A2B3]">Category · amount · shop (blank = shared laundry cost).</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1 cursor-pointer" onClick={() => setExpenses(prev => [...prev, exp()])}>
            <Plus size={13} /> Add expense
          </Button>
        </div>
        {(recordedExpenses?.items?.length ?? 0) > 0 && (
          <div className="mb-3 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-2.5">
            <p className={cellLabel + ' mb-1.5'}>Already recorded today ({recordedExpenses!.items!.length})</p>
            <div className="space-y-1">
              {recordedExpenses!.items!.map(e => (
                <div key={e.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-[#101828]">{e.category_name || e.description || 'Expense'}</span>
                  <span className="text-[#6B7280]">
                    {e.allocation === 'SHOP' && e.client_name ? `${e.client_name} · ` : ''}
                    LKR {Number(e.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-[1fr_110px_180px_32px] gap-2 mb-1.5 px-0.5">
          {['Category', 'Amount (LKR)', 'Allocate to', ''].map(h => <span key={h} className={cellLabel}>{h}</span>)}
        </div>
        {expenses.map((e, idx) => (
          <div key={e.key} className="grid grid-cols-[1fr_110px_180px_32px] gap-2 mb-1.5 items-center">
            <input className={inputClass} placeholder="e.g. Electricity, Water, Disposal" list="exp-categories" value={e.category_name}
              onChange={ev => setExpenses(prev => prev.map((x, i) => i === idx ? { ...x, category_name: ev.target.value } : x))} />
            <input className={`${inputClass} text-right`} type="number" min="0" step="0.01" placeholder="0.00" value={e.amount}
              onChange={ev => setExpenses(prev => prev.map((x, i) => i === idx ? { ...x, amount: ev.target.value } : x))} />
            <select className={inputClass} value={e.client_name} title="Shop allocation — blank means shared"
              onChange={ev => setExpenses(prev => prev.map((x, i) => i === idx ? { ...x, client_name: ev.target.value } : x))}>
              <option value="">Shared (laundry)</option>
              {clients.map(c => <option key={c.client_name} value={c.client_name}>{c.client_name}</option>)}
            </select>
            <button className="p-1.5 text-[#98A2B3] hover:text-[#DC2626] cursor-pointer" onClick={() => setExpenses(prev => prev.filter((_, i) => i !== idx))}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <datalist id="exp-categories">{(categories ?? []).map(c => <option key={c.id} value={c.name} />)}</datalist>
        {totals.exp > 0 && <p className="mt-2 text-right text-[12px] font-semibold text-[#101828]">Expense total: {totals.exp.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>}
      </Card>

      <datalist id="sheet-items">{itemNames.map(n => <option key={n} value={n} />)}</datalist>
    </div>
  )
}
