import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, Sparkles, FilePlus2, Receipt, ClipboardList, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuotations } from '../../features/quotations/hooks/useQuotations'

interface CommandSearchProps {
  open: boolean
  onClose: () => void
}

const NAV_ITEMS: { label: string; keywords: string; path: string }[] = [
  { label: 'New Quotation', keywords: 'quote new quotation create', path: '/quotations/new' },
  { label: 'Quotations', keywords: 'quotations quotes list price', path: '/quotations' },
  { label: 'Bills', keywords: 'bills invoices list', path: '/bills' },
  { label: 'New Bill', keywords: 'bill create bill invoice', path: '/bills/new' },
  { label: 'Gate Passes', keywords: 'gate passes receiving received', path: '/gate-passes' },
  { label: 'New Gate Pass', keywords: 'gate pass new receive', path: '/gate-passes/new' },
  { label: 'Deliveries', keywords: 'deliveries sent delivery', path: '/deliveries' },
  { label: 'New Delivery', keywords: 'delivery new deliver', path: '/deliveries/new' },
  { label: 'Returns', keywords: 'returns refunds', path: '/returns' },
  { label: 'Record Return', keywords: 'return new record', path: '/returns/new' },
  { label: 'Dashboard', keywords: 'home dashboard overview', path: '/' },
  { label: 'Business Intelligence', keywords: 'business dashboard analytics insights', path: '/business-dashboard' },
  { label: 'Customers', keywords: 'customers clients', path: '/customers' },
  { label: 'Reports', keywords: 'reports export sales', path: '/reports' },
  { label: 'Users', keywords: 'users staff accounts', path: '/users' },
  { label: 'Shop Bills', keywords: 'shop bills cash', path: '/shop-bills' },
  { label: 'Create Shop Bill', keywords: 'shop bill create new', path: '/shop-bills/new' },
  { label: 'Staff Management', keywords: 'workers staff employees', path: '/workers' },
  { label: 'Daily Tasks', keywords: 'daily tasks work', path: '/workers/daily-tasks' },
  { label: 'Management Dashboard', keywords: 'management overview', path: '/management' },
  { label: 'All Transactions', keywords: 'transactions all management', path: '/management/transactions' },
  { label: 'Manage Customers', keywords: 'management customers', path: '/management/customers' },
  { label: 'Items & Categories', keywords: 'items categories management', path: '/management/items' },
  { label: 'Expense Management', keywords: 'expenses management', path: '/management/expenses' },
  { label: 'Employees & Salaries', keywords: 'employees salaries management', path: '/management/employees' },
  { label: 'Salary Advances', keywords: 'advances salary loans', path: '/management/advances' },
  { label: 'Holiday Calendar', keywords: 'holidays calendar', path: '/management/holidays' },
  { label: 'Extra Work', keywords: 'extra work overtime', path: '/management/extra-work' },
  { label: 'Attendance', keywords: 'attendance present', path: '/management/attendance' },
  { label: 'Payments', keywords: 'payments management', path: '/management/payments' },
  { label: 'Linen Dashboard', keywords: 'linen tracking dashboard', path: '/linen' },
]

const QUICK_ACTIONS: { label: string; path: string; icon: typeof FilePlus2 }[] = [
  { label: 'New Quotation', path: '/quotations/new', icon: FilePlus2 },
  { label: 'New Bill', path: '/bills/new', icon: Receipt },
  { label: 'New Gate Pass', path: '/gate-passes/new', icon: ClipboardList },
  { label: 'New Shop Bill', path: '/shop-bills/new', icon: ShoppingCart },
]

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { data: quotations = [] } = useQuotations()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else setQuery('')
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const q = query.trim().toLowerCase()
  const filtered = q
    ? quotations.filter(quo => {
        const searchText = [
          quo.client_name,
          quo.quotation_title ?? '',
          ...(quo.line_items ?? []).map(li => li.item_name),
        ].join(' ').toLowerCase()
        return searchText.includes(q)
      })
    : quotations.slice(0, 6)

  const matchedPages = q
    ? NAV_ITEMS.filter(item =>
        `${item.label} ${item.keywords}`.toLowerCase().includes(q),
      )
    : []

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#101828]/60 backdrop-blur-[4px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_24px_64px_-8px_rgba(16,24,40,0.20)]"
        >
          <div className="flex items-center gap-3 border-b border-[#E4E7EC] px-5 py-4">
            <Search className="h-5 w-5 text-[#DC2626] shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search hotel, quotation, item, or page…"
              className="w-full text-[15px] font-medium text-[#101828] outline-none placeholder:text-[#9CA3AF] bg-transparent"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] cursor-pointer transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-3 space-y-1">
            {!q && (
              <>
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#98A2B3]">
                  Quick actions
                </p>
                <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                  {QUICK_ACTIONS.map(a => (
                    <button
                      key={a.path}
                      type="button"
                      onClick={() => { navigate(a.path); onClose() }}
                      className="flex items-center gap-2.5 rounded-xl border border-[#FECACA] bg-[#FFF8F8] px-3 py-2.5 hover:bg-[#FFF1F1] hover:border-[#FCA5A5] transition text-left cursor-pointer group"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F1] text-[#DC2626] border border-[#FECACA] transition group-hover:border-[#FCA5A5]">
                        <a.icon size={15} />
                      </span>
                      <span className="text-[13px] font-semibold text-[#101828]">{a.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {q && matchedPages.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#98A2B3]">
                  Pages ({matchedPages.length})
                </p>
                {matchedPages.map(page => (
                  <button
                    key={page.path}
                    type="button"
                    onClick={() => { navigate(page.path); onClose() }}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 hover:bg-[#F3F4F6] border border-transparent hover:border-[#E4E7EC] transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#374151] group-hover:bg-[#FFF1F1] group-hover:text-[#DC2626] border border-[#E4E7EC] group-hover:border-[#FECACA] transition text-[12px] font-bold">
                        {page.label.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-[13px] font-semibold text-[#101828]">{page.label}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#D1D5DB] group-hover:text-[#DC2626] transition-colors" />
                  </button>
                ))}
              </>
            )}

            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#98A2B3]">
              {q ? `Quotations (${filtered.length})` : 'Recent Quotations'}
            </p>

            {filtered.length ? filtered.map(quo => (
              <button
                key={quo.id}
                type="button"
                onClick={() => { navigate(`/quotations/${quo.id}`); onClose() }}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#FFF8F8] border border-transparent hover:border-[#FECACA] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#6B7280] group-hover:bg-[#FFF1F1] group-hover:text-[#DC2626] border border-[#E4E7EC] group-hover:border-[#FECACA] transition text-[13px] font-bold">
                    {quo.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101828]">{quo.client_name}</p>
                    <p className="text-[12px] text-[#98A2B3]">
                      {quo.quotation_title || 'Price List'} · {quo.line_items?.length ?? 0} items
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#D1D5DB] group-hover:text-[#DC2626] transition-colors" />
              </button>
            )) : q && matchedPages.length === 0 ? (
              <div className="py-8 text-center text-[#98A2B3]">
                <p className="text-[14px] font-medium">No results for "{query}"</p>
                <p className="text-[12px] mt-1">Try searching by hotel name, item, or page</p>
              </div>
            ) : !q && quotations.length === 0 ? (
              <div className="py-8 text-center text-[#98A2B3]">
                <p className="text-[14px] font-medium">No quotations yet</p>
                <p className="text-[12px] mt-1">Create a quotation to see it here</p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-[#F2F4F7] bg-[#FAFAFA] px-5 py-3">
            <span className="flex items-center gap-1.5 text-[12px] text-[#98A2B3]">
              <Sparkles className="h-3.5 w-3.5 text-[#DC2626]" /> Click to open a quotation or jump to a page
            </span>
            <kbd className="rounded-md bg-white border border-[#E4E7EC] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280] shadow-sm">
              ESC
            </kbd>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
