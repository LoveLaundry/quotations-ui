import { useEffect, useState } from 'react'
import { RiStarLine, RiCalendarLine, RiFileLine, RiEyeLine, RiStore2Line } from 'react-icons/ri'
import { motion } from 'framer-motion'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDF4] via-white to-[#FFF7ED]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#16A34A] to-[#15803D] shadow-lg">
                <RiStore2Line className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#101828]">Love Laundry</h1>
                <p className="text-[13px] text-[#6B7280]">Shop Quotations</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
              <RiStarLine className="h-4 w-4 text-[#16A34A]" />
              <span className="text-[13px] font-medium text-[#15803D]">Public Catalog</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#101828] mb-2">Available Services</h2>
          <p className="text-[15px] text-[#6B7280]">
            Browse our shop services and pricing. Contact us for more information.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E4E7EC] p-6 animate-pulse">
                <div className="h-6 bg-[#F3F4F6] rounded w-3/4 mb-4" />
                <div className="h-4 bg-[#F3F4F6] rounded w-1/2 mb-6" />
                <div className="space-y-2">
                  <div className="h-3 bg-[#F3F4F6] rounded" />
                  <div className="h-3 bg-[#F3F4F6] rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6] border-2 border-[#E5E7EB] mx-auto mb-4">
              <RiFileLine className="h-8 w-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#374151] mb-1">No Services Available</h3>
            <p className="text-[14px] text-[#6B7280]">Check back later for updates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotations.map((quotation, index) => (
              <motion.div
                key={quotation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group bg-white rounded-2xl border border-[#E4E7EC] p-6 hover:shadow-xl hover:border-[#16A34A] transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedQuotation(quotation)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#101828] mb-1 group-hover:text-[#16A34A] transition-colors">
                      {quotation.quotation_title || 'Service Package'}
                    </h3>
                    <p className="text-[13px] text-[#6B7280]">{quotation.client_name}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] group-hover:bg-[#16A34A] transition-colors">
                    <RiFileLine className="h-5 w-5 text-[#16A34A] group-hover:text-white transition-colors" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-[13px] text-[#667085]">
                    <RiCalendarLine className="h-4 w-4" />
                    {quotation.created_at ? formatDate(quotation.created_at) : 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#15803D] text-[11px] font-semibold uppercase tracking-wide">
                      {quotation.status || 'draft'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF7ED] text-[#EA580C] text-[11px] font-semibold uppercase tracking-wide">
                      Shop
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F2F4F7]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] text-[#667085]">Items</span>
                    <span className="text-[13px] font-semibold text-[#344054]">
                      {quotation.line_items?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#667085]">Estimated Total</span>
                    <span className="text-[16px] font-bold text-[#16A34A]">
                      LKR {calculateTotal(quotation.line_items || []).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full mt-4 px-4 py-2.5 rounded-lg border-2 border-[#E4E7EC] text-[#344054] font-medium text-[13px] hover:border-[#16A34A] hover:bg-[#F0FDF4] hover:text-[#16A34A] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RiEyeLine className="h-4 w-4" />
                  View Details
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedQuotation(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#F2F4F7]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#101828] mb-1">
                    {selectedQuotation.quotation_title || 'Service Package'}
                  </h2>
                  <p className="text-[14px] text-[#6B7280]">{selectedQuotation.client_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuotation(null)}
                  className="text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="mb-6">
                <h3 className="text-[13px] font-semibold text-[#344054] uppercase tracking-wide mb-3">
                  Service Items
                </h3>
                <div className="space-y-3">
                  {selectedQuotation.line_items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-start justify-between p-4 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                      <div className="flex-1">
                        <p className="font-semibold text-[#101828] mb-1">{item.item_name}</p>
                        {item.category && (
                          <p className="text-[12px] text-[#6B7280] mb-1">{item.category}</p>
                        )}
                        {item.notes && (
                          <p className="text-[12px] text-[#9CA3AF] italic">{item.notes}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-[16px] font-bold text-[#16A34A]">
                          LKR {(item.unit_price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2F4F7]">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-[#344054]">Total Estimate</span>
                  <span className="text-[#16A34A]">
                    LKR {calculateTotal(selectedQuotation.line_items || []).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#F2F4F7] bg-[#FAFAFA]">
              <p className="text-[13px] text-[#667085] text-center">
                For inquiries or bookings, please contact us at <strong>+94 XX XXX XXXX</strong>
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-[#E5E7EB] bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-[14px] text-[#6B7280]">
              © 2026 Love Laundry. All rights reserved.
            </p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">
              Professional laundry services for your business needs
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
