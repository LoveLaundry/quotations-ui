import { useState } from 'react'
import { X, Search, ChevronDown, ChevronUp, FileText } from 'lucide-react'
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

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function BalancesPopup({ open, onClose, clients, aging, totalOutstanding }: BalancesPopupProps) {
  const [search, setSearch] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'outstanding' | 'name'>('outstanding')

  const outstandingClients = clients
    .filter(c => c.outstanding > 0)
    .filter(c => !search || c.client_name.toLowerCase().includes(search.toLowerCase()))

  const sorted = [...outstandingClients].sort((a, b) => {
    if (sortBy === 'outstanding') return b.outstanding - a.outstanding
    return a.client_name.localeCompare(b.client_name)
  })

  const agingTotal = aging.current + aging['30_day'] + aging['60_day'] + aging['90_day'] + aging.over_90

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Outstanding Balances</h2>
                  <p className="text-[12px] text-gray-500">Breakdown by client and gate pass</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Big Balance Display */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="text-center mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Total Outstanding</p>
                <p className="text-[42px] font-extrabold text-gray-900 leading-none">
                  LKR {totalOutstanding.toLocaleString()}
                </p>
                <p className="text-[13px] text-gray-500 mt-2">
                  {outstandingClients.length} client{outstandingClients.length !== 1 ? 's' : ''} with pending payments
                </p>
              </div>

              {/* Aging row */}
              <div className="grid grid-cols-5 gap-3 mt-4">
                {[
                  { label: 'Current', value: aging.current },
                  { label: '1-30 Days', value: aging['30_day'] },
                  { label: '31-60 Days', value: aging['60_day'] },
                  { label: '61-90 Days', value: aging['90_day'] },
                  { label: '90+ Days', value: aging.over_90 },
                ].map(bucket => (
                  <div key={bucket.label} className="text-center">
                    <p className="text-[10px] text-gray-400 mb-1">{bucket.label}</p>
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
                  className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {[
                  { key: 'outstanding' as const, label: 'Amount' },
                  { key: 'name' as const, label: 'Name' },
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

            {/* Client List - Gate Pass Breakdown */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {sorted.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-[15px] font-semibold text-gray-900">All clear!</p>
                  <p className="text-[13px] text-gray-500">No outstanding balances found.</p>
                </div>
              ) : (
                sorted.map((client, i) => {
                  const isExpanded = expandedClient === client.client_name

                  return (
                    <motion.div
                      key={client.client_name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Client Header */}
                      <div
                        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => setExpandedClient(isExpanded ? null : client.client_name)}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white bg-gray-700">
                          {client.client_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-gray-900 truncate">{client.client_name}</p>
                          <p className="text-[12px] text-gray-500">{client.gate_pass_count} gate passes</p>
                        </div>
                        <p className="text-[18px] font-bold text-gray-900 shrink-0">
                          LKR {client.outstanding.toLocaleString()}
                        </p>
                        <div className="shrink-0 text-gray-400">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Expanded: Gate Pass Breakdown */}
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
                              {/* Summary */}
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                  <p className="text-[10px] text-gray-400 uppercase">Billed</p>
                                  <p className="text-[15px] font-bold text-gray-900">LKR {client.total_billed.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                  <p className="text-[10px] text-gray-400 uppercase">Paid</p>
                                  <p className="text-[15px] font-bold text-gray-900">LKR {client.paid_amount.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                  <p className="text-[10px] text-gray-400 uppercase">Outstanding</p>
                                  <p className="text-[15px] font-bold text-gray-900">LKR {client.outstanding.toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Gate Pass Breakdown */}
                              {client.gate_passes && client.gate_passes.length > 0 && (
                                <div>
                                  <p className="text-[12px] font-semibold text-gray-600 mb-2">Gate Passes</p>
                                  <div className="space-y-2">
                                    {client.gate_passes.map((gp) => (
                                      <div key={gp.gate_pass_number} className="bg-gray-50 rounded-lg px-3 py-2">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-mono font-semibold text-gray-700">{gp.gate_pass_number}</span>
                                            <span className="text-[11px] text-gray-400">•</span>
                                            <span className="text-[11px] text-gray-500">{formatDate(gp.receiving_date)}</span>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {gp.items.map((item, k) => (
                                            <span key={`${item.item_name}-${item.specification}`} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-0.5 text-[11px]">
                                              <span className="font-medium text-gray-700">{item.item_name}</span>
                                              {item.specification && (
                                                <span
                                                  className="font-bold text-white rounded px-1"
                                                  style={{ backgroundColor: SPEC_COLORS[k % SPEC_COLORS.length], fontSize: '9px' }}
                                                >
                                                  {item.specification}
                                                </span>
                                              )}
                                              <span className="text-gray-400">×{item.received}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Pending Items Summary */}
                              {client.items && client.items.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[12px] font-semibold text-gray-600 mb-2">Pending Items</p>
                                  <div className="space-y-1.5">
                                    {client.items.map((item, j) => (
                                      <div key={`${item.item_name}-${item.specification}`} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-[13px] font-medium text-gray-900 truncate">{item.item_name}</span>
                                          {item.specification && (
                                            <span
                                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0"
                                              style={{ backgroundColor: SPEC_COLORS[j % SPEC_COLORS.length] }}
                                            >
                                              {item.specification}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          <span className="text-[12px] text-gray-500">{item.delivered}/{item.received}</span>
                                          <span className="text-[13px] font-bold text-gray-900">{item.pending}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
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

