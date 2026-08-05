import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuotations } from '../../features/quotations/hooks/useQuotations'

interface CommandSearchProps {
  open: boolean
  onClose: () => void
}

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

  const filtered = query.trim()
    ? quotations.filter(q => {
        const searchText = [
          q.client_name,
          q.quotation_title ?? '',
          ...(q.line_items ?? []).map(li => li.item_name),
        ].join(' ').toLowerCase()
        return searchText.includes(query.toLowerCase())
      })
    : quotations.slice(0, 6)

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
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[#E4E7EC] px-5 py-4">
            <Search className="h-5 w-5 text-[#DC2626] shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search hotel, quotation, or item…"
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

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-3 space-y-1">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#98A2B3]">
              {query ? `Results (${filtered.length})` : 'Recent Quotations'}
            </p>

            {filtered.length ? filtered.map(q => (
              <button
                key={q.id}
                type="button"
                onClick={() => { navigate(`/quotations/${q.id}`); onClose() }}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#FFF8F8] border border-transparent hover:border-[#FECACA] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#6B7280] group-hover:bg-[#FFF1F1] group-hover:text-[#DC2626] border border-[#E4E7EC] group-hover:border-[#FECACA] transition text-[13px] font-bold">
                    {q.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101828]">{q.client_name}</p>
                    <p className="text-[12px] text-[#98A2B3]">
                      {q.quotation_title || 'Price List'} · {q.line_items?.length ?? 0} items
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#D1D5DB] group-hover:text-[#DC2626] transition-colors" />
              </button>
            )) : (
              <div className="py-8 text-center text-[#98A2B3]">
                <p className="text-[14px] font-medium">No results for "{query}"</p>
                <p className="text-[12px] mt-1">Try searching by hotel name or item</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#F2F4F7] bg-[#FAFAFA] px-5 py-3">
            <span className="flex items-center gap-1.5 text-[12px] text-[#98A2B3]">
              <Sparkles className="h-3.5 w-3.5 text-[#DC2626]" /> Click to open full quotation
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
