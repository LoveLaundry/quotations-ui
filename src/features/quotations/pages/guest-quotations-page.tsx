import { useEffect, useState } from 'react'
import { RiCalendarLine, RiFileLine, RiEyeLine, RiStore2Line, RiCloseLine } from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../api/api'
import type { Quotation } from '../../../types/quotation'

export default function GuestQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)

  useEffect(() => {
    loadQuotations()
  }, [])

  const loadQuotations = async () => {
    try {
      setLoading(true)
      // Using the public guest endpoint
      const response = await api.get('/quotations/guest/shop')
      setQuotations(response.data)
    } catch (error) {
      console.error('Failed to load quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.unit_price || 0), 0)
  }

  const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-[#F9FAFB] text-[#6B7280] border-[#E4E7EC]',
    sent: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    accepted: 'bg-[#FFF1F1] text-[#DC2626] border-[#FECACA]',
    archived: 'bg-[#FAFAFA] text-[#9CA3AF] border-[#E4E7EC]',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
                style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}
              >
                <RiStore2Line className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1
                  className="text-[17px] font-bold leading-tight"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Spectral, serif' }}
                >
                  Love Laundry
                </h1>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Shop Quotations · Medagama, Panirendawa
                </p>
              </div>
            </div>
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-semibold"
              style={{ background: '#FFF1F1', borderColor: '#FECACA', color: '#DC2626' }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-[#DC2626] animate-pulse" />
              Public Catalog
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page heading */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Love Laundry · Registration No: 40-3064
            </span>
          </div>
          <h2 className="text-dashboard-title mb-1">Available Services</h2>
          <p className="text-page-subtitle">
            Browse our shop services and pricing. Contact us for more information.
          </p>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-surface p-5 animate-pulse">
                <div className="h-5 bg-[#F3F4F6] rounded w-3/4 mb-3" />
                <div className="h-3.5 bg-[#F3F4F6] rounded w-1/2 mb-5" />
                <div className="space-y-2">
                  <div className="h-3 bg-[#F3F4F6] rounded" />
                  <div className="h-3 bg-[#F3F4F6] rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl border mx-auto mb-4"
              style={{ background: '#FFF1F1', borderColor: '#FECACA' }}
            >
              <RiFileLine className="h-7 w-7 text-[#DC2626]" />
            </div>
            <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              No Services Available
            </h3>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotations.map((quotation, index) => (
              <motion.div
                key={quotation.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="luxury-card p-5 cursor-pointer group"
                onClick={() => setSelectedQuotation(quotation)}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3
                      className="text-[14px] font-bold truncate mb-0.5 group-hover:text-[#DC2626] transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {quotation.quotation_title || 'Service Package'}
                    </h3>
                    <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {quotation.client_name}
                    </p>
                  </div>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all group-hover:bg-[#DC2626] group-hover:border-[#DC2626]"
                    style={{ background: '#FFF1F1', borderColor: '#FECACA' }}
                  >
                    <RiFileLine className="h-4 w-4 text-[#DC2626] transition-colors group-hover:text-white" />
                  </div>
                </div>

                {/* Meta */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    <RiCalendarLine className="h-3.5 w-3.5 shrink-0" />
                    {quotation.created_at ? formatDate(quotation.created_at) : 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap ${
                        STATUS_STYLE[quotation.status ?? 'draft'] ?? STATUS_STYLE.draft
                      }`}
                    >
                      {quotation.status || 'draft'}
                    </span>
                    <span
                      className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: '#FFF7ED', color: '#EA580C', borderColor: '#FED7AA' }}
                    >
                      Shop
                    </span>
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-3.5 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Items</span>
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                      {quotation.line_items?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Estimated Total</span>
                    <span className="text-[15px] font-bold text-[#DC2626]">
                      LKR {calculateTotal(quotation.line_items || []).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* View button */}
                <button
                  type="button"
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-[12px] font-medium transition-all duration-150 hover:bg-[#FFF1F1] hover:border-[#FECACA] hover:text-[#DC2626]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
                >
                  <RiEyeLine className="h-3.5 w-3.5" />
                  View Details
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedQuotation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedQuotation(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="px-6 py-5 border-b flex items-start justify-between" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h2
                    className="text-[18px] font-bold mb-0.5"
                    style={{ color: 'var(--text-primary)', fontFamily: 'Spectral, serif' }}
                  >
                    {selectedQuotation.quotation_title || 'Service Package'}
                  </h2>
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {selectedQuotation.client_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuotation(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:bg-[#FFF1F1] hover:border-[#FECACA] hover:text-[#DC2626]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  <RiCloseLine className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-200px)]">
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Service Items
                </p>
                <div className="space-y-2.5">
                  {selectedQuotation.line_items?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 rounded-lg border"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                          {item.item_name}
                        </p>
                        {item.category && (
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.category}</p>
                        )}
                        {item.notes && (
                          <p className="text-[11px] italic mt-0.5" style={{ color: '#9CA3AF' }}>{item.notes}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-bold text-[#DC2626]">
                          LKR {(item.unit_price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div
                  className="mt-5 pt-4 border-t flex items-center justify-between"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    Total Estimate
                  </span>
                  <span className="text-[18px] font-bold text-[#DC2626]">
                    LKR {calculateTotal(selectedQuotation.line_items || []).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Modal footer */}
              <div
                className="px-6 py-4 border-t text-center"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  For inquiries or bookings, please contact us at{' '}
                  <strong style={{ color: 'var(--text-tertiary)' }}>+94 XX XXX XXXX</strong>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer
        className="mt-16 border-t"
        style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(8px)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 text-center">
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            © 2026 Love Laundry · Reg. No: 40-3064 · All rights reserved.
          </p>
          <p className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>
            Professional laundry services for your business needs
          </p>
        </div>
      </footer>
    </div>
  )
}
