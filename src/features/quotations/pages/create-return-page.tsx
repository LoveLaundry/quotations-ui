import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { returns as returnsApi } from '../services/returns.service'
import { gatepasses as gatepassApi } from '../services/gatepass.service'
import type { GatePass, ReturnItem, BillAdjustment } from '../../../types/operations'

const REASONS = [
  { value: 'WRONG_ITEM', label: 'Wrong Item Sent' },
  { value: 'DAMAGED', label: 'Damaged / Stained' },
  { value: 'MISSING', label: 'Missing Items' },
  { value: 'OTHER', label: 'Other' },
]

const CONDITIONS = [
  { value: 'GOOD', label: 'Good (re-usable)' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'STAINED', label: 'Stained' },
  { value: 'LOST', label: 'Lost (not returned)' },
]

const ACTIONS = [
  { value: 'RECEIVE_BACK', label: 'Receive Back' },
  { value: 'RE_WASH', label: 'Re-wash Cycle' },
  { value: 'DISCARD', label: 'Discard' },
  { value: 'COMPENSATE', label: 'Compensate Client' },
]

const ADJ_TYPES = [
  { value: 'NONE', label: 'No Adjustment' },
  { value: 'QUANTITY_REDUCE', label: 'Reduce Bill Quantity' },
  { value: 'AMOUNT_REDUCE', label: 'Reduce Bill Amount' },
  { value: 'COMPENSATE', label: 'Compensation' },
]

function emptyItem(): ReturnItem {
  return {
    item_name: '',
    returned_qty: 1,
    reason: 'WRONG_ITEM',
    condition: 'GOOD',
    action: 'RECEIVE_BACK',
    notes: '',
  }
}

export default function CreateReturnPage() {
  const navigate = useNavigate()
  const [gatePasses, setGatePasses] = useState<GatePass[]>([])
  const [selectedGP, setSelectedGP] = useState<GatePass | null>(null)
  const [gpSearch, setGpSearch] = useState('')
  const [gpLoading, setGpLoading] = useState(true)
  const [gpError, setGpError] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [items, setItems] = useState<ReturnItem[]>([emptyItem()])
  const [adjustment, setAdjustment] = useState<BillAdjustment>({ adjustment_type: 'NONE', amount: 0, notes: '' })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setGpLoading(true)
    setGpError(null)
    gatepassApi.list()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.items || data?.gatepasses || []
        setGatePasses(list)
        setGpLoading(false)
      })
      .catch((err: any) => {
        setGpError(err?.response?.data?.detail || err?.message || 'Failed to load gate passes')
        setGpLoading(false)
      })
  }, [])

  const addItem = () => setItems([...items, emptyItem()])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof ReturnItem, value: any) => {
    const copy = [...items]
    ;(copy[idx] as any)[field] = value
    setItems(copy)
  }

  const handleSubmit = async () => {
    if (!selectedGP) {
      setError('Select a gate pass')
      return
    }
    if (items.length === 0 || items.every((i) => !i.item_name.trim())) {
      setError('Add at least one return item')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const validItems = items.filter((i) => i.item_name.trim()).map((item) => ({
        ...item,
        resend_status: item.action === 'RECEIVE_BACK' || item.action === 'RE_WASH' ? 'PENDING' as const : undefined,
      }))
      await returnsApi.create({
        gate_pass_id: selectedGP.id!,
        client_name: clientName,
        items: validItems,
        bill_adjustment: adjustment.adjustment_type !== 'NONE' ? adjustment : undefined,
        notes: notes || undefined,
      })
      navigate('/returns')
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to create return')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Returns', href: '/returns' },
            { label: 'Record Return' },
          ]}
        />
        <h1 className="text-dashboard-title mt-1">Record Return</h1>
        <p className="text-[13px] text-[#98A2B3] mt-0.5">
          Record garments returned by a client
        </p>
      </div>

      {/* Gate Pass Selection */}
      <Card className="p-5">
        <h3 className="text-[14px] font-semibold text-[#101828] mb-3">Gate Pass</h3>
        {gpLoading ? (
          <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
        ) : gpError ? (
          <div className="text-[13px] text-red-600">{gpError}</div>
        ) : (
          <>
            <input
              type="text"
              value={gpSearch}
              onChange={(e) => setGpSearch(e.target.value)}
              placeholder="Search gate pass number or client…"
              className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706] mb-2"
            />
            <div className="max-h-48 overflow-y-auto border border-[#E4E7EC] rounded-lg">
              {gatePasses
                .filter((gp) => {
                  if (!gpSearch.trim()) return true
                  const q = gpSearch.toLowerCase()
                  return (
                    gp.gate_pass_number.toLowerCase().includes(q) ||
                    gp.client_name.toLowerCase().includes(q)
                  )
                })
                .map((gp) => (
                  <button
                    key={gp.id}
                    type="button"
                    onClick={() => {
                      setSelectedGP(gp)
                      setClientName(gp.client_name)
                      setGpSearch('')
                    }}
                    className={`w-full text-left px-3 py-2.5 text-[13px] border-b border-gray-50 last:border-0 hover:bg-gray-50 transition cursor-pointer ${
                      selectedGP?.id === gp.id ? 'bg-amber-50 font-semibold' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[#6B7280]">{gp.gate_pass_number}</span>
                      <span className="text-[#101828]">{gp.client_name}</span>
                    </div>
                    <div className="text-[11px] text-[#98A2B3] mt-0.5">
                      {gp.items.length} item types · {gp.items.reduce((s, i) => s + i.received_qty, 0)} pcs
                    </div>
                  </button>
                ))}
              {gatePasses.filter((gp) => {
                if (!gpSearch.trim()) return true
                const q = gpSearch.toLowerCase()
                return gp.gate_pass_number.toLowerCase().includes(q) || gp.client_name.toLowerCase().includes(q)
              }).length === 0 && (
                <div className="px-3 py-4 text-center text-[13px] text-[#98A2B3]">No gate passes found</div>
              )}
            </div>
          </>
        )}

        {selectedGP && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] text-[#98A2B3]">Selected: </span>
                <span className="text-[13px] font-semibold text-[#101828]">{selectedGP.gate_pass_number}</span>
                <span className="text-[12px] text-[#98A2B3]"> — {selectedGP.client_name}</span>
              </div>
              <button onClick={() => { setSelectedGP(null); setClientName('') }} className="text-[12px] text-[#DC2626] hover:underline cursor-pointer">Clear</button>
            </div>
          </div>
        )}
      </Card>

      {/* Return Items */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold text-[#101828]">Returned Items</h3>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" /> Custom Item
          </Button>
        </div>

        {/* Gate Pass Items (selectable) */}
        {selectedGP && selectedGP.items.length > 0 && (
          <div className="mb-4">
            <p className="text-[12px] font-semibold text-[#6B7280] mb-2">From Gate Pass — tick items being returned:</p>
            <div className="space-y-2">
              {selectedGP.items.map((gpItem, gi) => {
                const existing = items.find(
                  (i) => i.item_name === gpItem.item_name && (i.specification || '') === (gpItem.specification || '')
                )
                const selected = !!existing

                return (
                  <div
                    key={gi}
                    className={`rounded-lg border p-3 transition ${
                      selected ? 'border-amber-300 bg-amber-50' : 'border-[#E4E7EC] bg-white hover:bg-gray-50'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setItems([
                              ...items,
                              {
                                item_name: gpItem.item_name,
                                specification: gpItem.specification || '',
                                returned_qty: 1,
                                reason: 'WRONG_ITEM',
                                condition: 'GOOD',
                                action: 'RECEIVE_BACK',
                                notes: '',
                              },
                            ])
                          } else {
                            setItems(
                              items.filter(
                                (i) =>
                                  !(
                                    i.item_name === gpItem.item_name &&
                                    (i.specification || '') === (gpItem.specification || '')
                                  )
                              )
                            )
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[#101828]">{gpItem.item_name}</span>
                          {gpItem.specification && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white bg-gray-500">
                              {gpItem.specification}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#98A2B3]">
                          Received: {gpItem.received_qty} · Client: {gpItem.client_qty}
                        </span>
                      </div>
                    </label>

                    {/* Inline editing when selected */}
                    {selected && existing && (
                      <div className="mt-3 pt-3 border-t border-amber-200 grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-[#98A2B3] mb-0.5 block">Qty</label>
                          <input
                            type="number"
                            min={1}
                            max={gpItem.received_qty}
                            value={existing.returned_qty}
                            onChange={(e) => {
                              const copy = [...items]
                              const idx = copy.findIndex(
                                (i) =>
                                  i.item_name === gpItem.item_name &&
                                  (i.specification || '') === (gpItem.specification || '')
                              )
                              if (idx !== -1) {
                                copy[idx].returned_qty = parseInt(e.target.value) || 1
                                setItems(copy)
                              }
                            }}
                            className="h-8 w-full rounded border border-[#E4E7EC] bg-white px-2 text-[12px] outline-none focus:border-[#D97706]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#98A2B3] mb-0.5 block">Reason</label>
                          <select
                            value={existing.reason}
                            onChange={(e) => {
                              const copy = [...items]
                              const idx = copy.findIndex(
                                (i) =>
                                  i.item_name === gpItem.item_name &&
                                  (i.specification || '') === (gpItem.specification || '')
                              )
                              if (idx !== -1) {
                                copy[idx].reason = e.target.value as any
                                setItems(copy)
                              }
                            }}
                            className="h-8 w-full rounded border border-[#E4E7EC] bg-white px-2 text-[12px] outline-none focus:border-[#D97706]"
                          >
                            {REASONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#98A2B3] mb-0.5 block">Condition</label>
                          <select
                            value={existing.condition}
                            onChange={(e) => {
                              const copy = [...items]
                              const idx = copy.findIndex(
                                (i) =>
                                  i.item_name === gpItem.item_name &&
                                  (i.specification || '') === (gpItem.specification || '')
                              )
                              if (idx !== -1) {
                                copy[idx].condition = e.target.value as any
                                setItems(copy)
                              }
                            }}
                            className="h-8 w-full rounded border border-[#E4E7EC] bg-white px-2 text-[12px] outline-none focus:border-[#D97706]"
                          >
                            {CONDITIONS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#98A2B3] mb-0.5 block">Action</label>
                          <select
                            value={existing.action}
                            onChange={(e) => {
                              const copy = [...items]
                              const idx = copy.findIndex(
                                (i) =>
                                  i.item_name === gpItem.item_name &&
                                  (i.specification || '') === (gpItem.specification || '')
                              )
                              if (idx !== -1) {
                                copy[idx].action = e.target.value as any
                                setItems(copy)
                              }
                            }}
                            className="h-8 w-full rounded border border-[#E4E7EC] bg-white px-2 text-[12px] outline-none focus:border-[#D97706]"
                          >
                            {ACTIONS.map((a) => (
                              <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Custom / manually added items */}
        {items.filter(
          (i) =>
            !selectedGP?.items.some(
              (g) => g.item_name === i.item_name && (g.specification || '') === (i.specification || '')
            )
        ).length > 0 && (
          <div>
            <p className="text-[12px] font-semibold text-[#6B7280] mb-2">Custom items:</p>
            <div className="space-y-3">
              {items
                .filter(
                  (i) =>
                    !selectedGP?.items.some(
                      (g) => g.item_name === i.item_name && (g.specification || '') === (i.specification || '')
                    )
                )
                .map((item) => {
                  const idx = items.indexOf(item)
                  return (
                    <div key={idx} className="rounded-lg border border-[#E4E7EC] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-[#6B7280]">Custom Item</span>
                        <button onClick={() => removeItem(idx)} className="text-[#98A2B3] hover:text-[#DC2626] cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-[#98A2B3] mb-1 block">Item Name</label>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                            placeholder="e.g. Towel, Bed Sheet"
                            className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#98A2B3] mb-1 block">Specification</label>
                          <input
                            type="text"
                            value={item.specification || ''}
                            onChange={(e) => updateItem(idx, 'specification', e.target.value || undefined)}
                            placeholder="e.g. White, King"
                            className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#98A2B3] mb-1 block">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={item.returned_qty}
                            onChange={(e) => updateItem(idx, 'returned_qty', parseInt(e.target.value) || 1)}
                            className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#98A2B3] mb-1 block">Reason</label>
                          <select
                            value={item.reason}
                            onChange={(e) => updateItem(idx, 'reason', e.target.value)}
                            className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
                          >
                            {REASONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-[#98A2B3] mb-1 block">Condition</label>
                          <select
                            value={item.condition}
                            onChange={(e) => updateItem(idx, 'condition', e.target.value)}
                            className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
                          >
                            {CONDITIONS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-[#98A2B3] mb-1 block">Action</label>
                          <select
                            value={item.action}
                            onChange={(e) => updateItem(idx, 'action', e.target.value)}
                            className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
                          >
                            {ACTIONS.map((a) => (
                              <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#98A2B3] mb-1 block">Notes</label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateItem(idx, 'notes', e.target.value || undefined)}
                          placeholder="Optional notes"
                          className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <p className="text-[13px] text-[#98A2B3] text-center py-4">
            {selectedGP ? 'Tick items above or add a custom item' : 'Select a gate pass first, or add custom items'}
          </p>
        )}
      </Card>

      {/* Bill Adjustment */}
      <Card className="p-5">
        <h3 className="text-[14px] font-semibold text-[#101828] mb-3">Bill Adjustment (Optional)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-[#98A2B3] mb-1 block">Adjustment Type</label>
            <select
              value={adjustment.adjustment_type}
              onChange={(e) => setAdjustment({ ...adjustment, adjustment_type: e.target.value as any })}
              className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
            >
              {ADJ_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          {adjustment.adjustment_type !== 'NONE' && (
            <div>
              <label className="text-[11px] text-[#98A2B3] mb-1 block">Amount (LKR)</label>
              <input
                type="number"
                min={0}
                value={adjustment.amount}
                onChange={(e) => setAdjustment({ ...adjustment, amount: parseFloat(e.target.value) || 0 })}
                className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
              />
            </div>
          )}
        </div>
        {adjustment.adjustment_type !== 'NONE' && (
          <div className="mt-3">
            <label className="text-[11px] text-[#98A2B3] mb-1 block">Adjustment Notes</label>
            <input
              type="text"
              value={adjustment.notes || ''}
              onChange={(e) => setAdjustment({ ...adjustment, notes: e.target.value })}
              placeholder="Reason for adjustment"
              className="h-9 w-full rounded-lg border border-[#E4E7EC] bg-white px-3 text-[13px] outline-none focus:border-[#D97706]"
            />
          </div>
        )}
      </Card>

      {/* Notes */}
      <Card className="p-5">
        <h3 className="text-[14px] font-semibold text-[#101828] mb-3">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this return…"
          rows={3}
          className="w-full rounded-lg border border-[#E4E7EC] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#D97706] resize-none"
        />
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link to="/returns">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#D97706] hover:bg-[#B45309] text-white"
        >
          {saving ? 'Saving…' : 'Record Return'}
        </Button>
      </div>
    </div>
  )
}
