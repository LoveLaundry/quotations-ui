import { useState } from 'react'
import { X, Search, ChevronDown, ChevronUp, DollarSign, Clock, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ClientWiseEntry } from '../hooks/useBusinessDashboard'
import type { OutstandingAging } from '../services/dashboard.service'

interface BalancesPopupProps {
  open: boolean
  onClose: () => void
  clients: ClientWiseEntry[]
  aging: OutstandingAging
  totalOutstanding: number
  totalRevenue: number
  totalCollected: number
}

const SPEC_COLORS = ['#7C3AED', '#0891B2', '#059669', '#D946EF', '#EA580C', '#4F46E5', '#DC2626', '#0D9488']

export function BalancesPopup({ open, onClose, clients, aging, totalOutstanding, totalRevenue, totalCollected }: BalancesPopupProps) {
  const [search, setSearch] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'outstanding' | 'name' | 'items'>('outstanding')

  const outstandingClients = clients
    .filter(c => c.outstanding > 0)
    .filter(c => !search || c.client_name.toLowerCase().includes(search.toLowerCase()))

  const sorted = [...outstandingClients].sort((a, b) => {
    if (sortBy === 'outstanding') return b.outstanding - a.outstanding
    if (sortBy === 'name') return a.client_name.localeCompare(b.client_name)
    return (b.items?.length || 0) - (a.items?.length || 0)
  })

  const collectedPct = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0
  const outstandingPct = totalRevenue > 0 ? (totalOutstanding / totalRevenue) * 100 : 0

  const agingTotal = aging.current + aging['30_day'] + aging['60_day'] + aging['90_day'] + aging.over_90

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Outstanding Balances</h2>
                  <p className="text-[12px] text-gray-500">Detailed breakdown of all pending payments</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Hero Summary */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-b border-amber-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Total Outstanding</p>
                  <p className="text-[24px] font-extrabold text-amber-900">LKR {totalOutstanding.toLocaleString()}</p>
                  <p className="text-[11px] text-amber-600">{outstandingPct.toFixed(0)}% of revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">Collected</p>
                  <p className="text-[24px] font-extrabold text-green-900">LKR {totalCollected.toLocaleString()}</p>
                  <p className="text-[11px] text-green-600">{collectedPct.toFixed(0)}% collected</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Clients with Dues</p>
                  <p className="text-[24px] font-extrabold text-gray-900">{outstandingClients.length}</p>
                  <p className="text-[11px] text-gray-500">of {clients.length} total</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">Over 90 Days</p>
                  <p className="text-[24px] font-extrabold text-red-900">LKR {aging.over_90.toLocaleString()}</p>
                  <p className="text-[11px] text-red-600">Critical aging</p>
                </div>
              </div>

              {/* Visual bar */}
              <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-white/60 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${collectedPct}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-green-500 rounded-l-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${outstandingPct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-amber-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] font-medium">
                <span className="text-green-600">Collected {collectedPct.toFixed(0)}%</span>
                <span className="text-amber-600">Outstanding {outstandingPct.toFixed(0)}%</span>
              </div>
            </div>

            {/* Aging Breakdown */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-[13px] font-semibold text-gray-700">Aging Analysis</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'Current', value: aging.current, color: 'bg-green-500' },
                  { label: '1-30 Days', value: aging['30_day'], color: 'bg-blue-500' },
                  { label: '31-60 Days', value: aging['60_day'], color: 'bg-amber-500' },
                  { label: '61-90 Days', value: aging['90_day'], color: 'bg-orange-500' },
                  { label: '90+ Days', value: aging.over_90, color: 'bg-red-500' },
                ].map(bucket => (
                  <div key={bucket.label} className="text-center">
                    <div className="flex justify-center mb-1">
                      <div className={`h-2 w-full rounded-full ${bucket.color}`} style={{ opacity: 0.8 }} />
                    </div>
                    <p className="text-[10px] font-medium text-gray-500">{bucket.label}</p>
                    <p className="text-[13px] font-bold text-gray-900">LKR {bucket.value.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">{agingTotal > 0 ? ((bucket.value / agingTotal) * 100).toFixed(0) : 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Search & Sort */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {[
                  { key: 'outstanding' as const, label: 'Amount' },
                  { key: 'name' as const, label: 'Name' },
                  { key: 'items' as const, label: 'Items' },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition cursor-pointer ${
                      sortBy === s.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Client List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {sorted.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-[15px] font-semibold text-gray-900">All clear!</p>
                  <p className="text-[13px] text-gray-500">No outstanding balances found.</p>
                </div>
              ) : (
                sorted.map((client, i) => {
                  const isExpanded = expandedClient === client.client_name
                  const maxOutstanding = Math.max(...sorted.map(c => c.outstanding), 1)
                  const barPct = (client.outstanding / maxOutstanding) * 100
                  const severity = client.outstanding > maxOutstanding * 0.7 ? 'high' : client.outstanding > maxOutstanding * 0.3 ? 'medium' : 'low'
                  const severityColor = severity === 'high' ? '#DC2626' : severity === 'medium' ? '#D97706' : '#2563EB'
                  const bgColor = severity === 'high' ? '#FEE2E2' : severity === 'medium' ? '#FEF3C7' : '#DBEAFE'

                  return (
                    <motion.div
                      key={client.client_name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Client Header */}
                      <div
                        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => setExpandedClient(isExpanded ? null : client.client_name)}
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
                          style={{ backgroundColor: severityColor }}
                        >
                          {client.client_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-gray-900 truncate">{client.client_name}</p>
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: bgColor, color: severityColor }}
                            >
                              {severity.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[12px] text-gray-500">{client.gate_pass_count} gate passes</span>
                            {client.items && client.items.length > 0 && (
                              <span className="text-[12px] text-gray-500">· {client.items.length} pending items</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[16px] font-bold" style={{ color: severityColor }}>
                            LKR {client.outstanding.toLocaleString()}
                          </p>
                          {client.total_billed > 0 && (
                            <p className="text-[11px] text-gray-500">
                              {((client.outstanding / client.total_billed) * 100).toFixed(0)}% of {client.total_billed.toLocaleString()} billed
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-gray-400">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="px-4 pb-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: severityColor }}
                          />
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                              {/* Summary stats */}
                              <div className="grid grid-cols-4 gap-3 mb-3">
                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                  <p className="text-[10px] text-gray-500">Total Billed</p>
                                  <p className="text-[13px] font-bold text-gray-900">LKR {client.total_billed.toLocaleString()}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2 text-center">
                                  <p className="text-[10px] text-gray-500">Paid</p>
                                  <p className="text-[13px] font-bold text-green-700">LKR {client.paid_amount.toLocaleString()}</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-2 text-center">
                                  <p className="text-[10px] text-gray-500">Outstanding</p>
                                  <p className="text-[13px] font-bold text-amber-700">LKR {client.outstanding.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-2 text-center">
                                  <p className="text-[10px] text-gray-500">Pending Items</p>
                                  <p className="text-[13px] font-bold text-blue-700">{client.total_pending}</p>
                                </div>
                              </div>

                              {/* Items with specifications */}
                              {client.items && client.items.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Package className="h-3.5 w-3.5 text-gray-500" />
                                    <p className="text-[12px] font-semibold text-gray-700">Pending Items by Specification</p>
                                  </div>
                                  <div className="space-y-2">
                                    {client.items.map((item, j) => {
                                      const itemPct = item.received > 0 ? (item.delivered / item.received) * 100 : 0
                                      return (
                                        <div key={`${item.item_name}-${item.specification}`} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[13px] font-medium text-gray-900">{item.item_name}</span>
                                              {item.specification && (
                                                <span
                                                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                                                  style={{ backgroundColor: SPEC_COLORS[j % SPEC_COLORS.length] }}
                                                >
                                                  {item.specification}
                                                </span>
                                              )}
                                              {item.category && (
                                                <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                                                  {item.category}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                  className="h-full bg-green-500 rounded-full"
                                                  style={{ width: `${itemPct}%` }}
                                                />
                                              </div>
                                              <span className="text-[11px] text-gray-500 shrink-0">
                                                {item.delivered}/{item.received} delivered
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <p className="text-[13px] font-bold text-red-600">{item.pending}</p>
                                            <p className="text-[10px] text-gray-400">pending</p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {(!client.items || client.items.length === 0) && (
                                <p className="text-[12px] text-gray-400 text-center py-2">No pending items with specifications</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-[12px] text-gray-500">
                {sorted.length} client{sorted.length !== 1 ? 's' : ''} with outstanding balances
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
