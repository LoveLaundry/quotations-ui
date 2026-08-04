import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Receipt, ArrowRight, Tag, Sparkles } from 'lucide-react'
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
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const filtered = query.trim()
    ? quotations.filter((q) => {
        const qText = `${q.item_name} ${q.category} ${q.size} ${Object.keys(q.unit_price_with_options).join(' ')}`.toLowerCase()
        return qText.includes(query.toLowerCase())
      })
    : quotations.slice(0, 6)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header Input */}
          <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
            <Search className="h-8 w-8 text-red-600 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type laundry item, category, or service..."
              className="w-full text-[24px] font-semibold text-slate-900 outline-none placeholder:text-slate-400 bg-transparent"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[480px] overflow-y-auto p-4 space-y-2">
            <p className="px-4 py-2 text-[17px] font-bold text-slate-400 tracking-wider uppercase">
              {query ? `Search Results (${filtered.length})` : 'Popular Laundry Quotations'}
            </p>

            {filtered.length ? (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(`/quotations/${item.id}`)
                    onClose()
                  }}
                  className="w-full flex items-center justify-between rounded-2xl p-4 hover:bg-red-50/40 border border-transparent hover:border-red-100 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
                      <Receipt className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-slate-900">{item.item_name}</p>
                      <div className="flex items-center gap-3 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 text-[17px] font-semibold text-slate-500">
                          <Tag className="h-4 w-4" /> {item.category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[17px] font-medium text-slate-500">{item.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[18px] font-bold text-red-600 block">
                        {Object.keys(item.unit_price_with_options).length} Service Options
                      </span>
                    </div>
                    <ArrowRight className="h-7 w-7 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition" />
                  </div>
                </button>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <p className="text-[22px] font-semibold">No laundry items found for "{query}"</p>
                <p className="text-[18px]">Try searching for "Suit", "Dry Clean", or "Curtains"</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4 text-[17px] text-slate-500">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="h-5 w-5 text-red-600" /> Use arrow keys or click item to view full pricing details
            </span>
            <kbd className="rounded-lg bg-white px-3 py-1 border border-slate-200 text-[14px] font-bold text-slate-600 shadow-xs">
              ESC to exit
            </kbd>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
