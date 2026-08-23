import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiSendPlaneLine, RiFileTextLine, RiSearchLine, RiAddLine,
  RiArrowRightSLine, RiCloseLine,
} from 'react-icons/ri'
import { Button } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { formatDate } from '../../../lib/utils'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationDetailDialog } from '../components/notification-detail-dialog'
import type { Quotation } from '../../../types/quotation'

type TabFilter = 'all' | 'pending' | 'accepted'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { pendingQuotations, acceptedQuotations, pendingCount, acceptedCount, totalCount, isLoading } = useNotifications()
  const [filter, setFilter] = useState<TabFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ item: Quotation; type: 'quotation_pending' | 'quotation_accepted' } | null>(null)

  const allItems: Array<{ item: Quotation; type: 'quotation_pending' | 'quotation_accepted' }> = [
    ...pendingQuotations.map(q => ({ item: q, type: 'quotation_pending' as const })),
    ...acceptedQuotations.map(q => ({ item: q, type: 'quotation_accepted' as const })),
  ]

  const filtered = allItems.filter(({ item }) => {
    if (filter === 'pending') return item.status === 'draft'
    if (filter === 'accepted') return item.status === 'accepted'
    return true
  }).filter(({ item }) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      item.client_name.toLowerCase().includes(s) ||
      (item.quotation_title ?? '').toLowerCase().includes(s)
    )
  })

  const handleAction = (item: Quotation, type: 'quotation_pending' | 'quotation_accepted') => {
    if (type === 'quotation_pending') {
      navigate(`/quotations/${item.id}/edit`)
    } else {
      navigate(`/bills/new?quotation_id=${item.id}`)
    }
  }

  const tabs: Array<{ key: TabFilter; label: string; count: number }> = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'pending', label: 'Pending to Send', count: pendingCount },
    { key: 'accepted', label: 'Ready for Billing', count: acceptedCount },
  ]

  if (isLoading) {
    return (
      <div className="space-y-5 pb-10">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-dashboard-title">Notifications</h1>
          <p className="text-[13px] text-[#98A2B3] mt-0.5">
            {totalCount > 0
              ? `${totalCount} item${totalCount !== 1 ? 's' : ''} need your attention`
              : 'Everything is up to date'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/quotations')}>
          <RiFileTextLine size={16} /> All Quotations
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-white text-[#101828] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold ${
                tab.count > 0 && tab.key !== 'all'
                  ? 'bg-[#DC2626] text-white'
                  : filter === tab.key
                    ? 'bg-[#F3F4F6] text-[#6B7280]'
                    : 'bg-[#E5E7EB] text-[#6B7280]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search client or title..."
            className="h-10 w-full rounded-lg border border-[#E4E7EC] bg-white pl-9 pr-9 text-[13px] text-[#101828] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#111827]"
              aria-label="Clear search"
            >
              <RiCloseLine size={15} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No results found' : 'No notifications'}
          description={search
            ? `Nothing matches "${search}".`
            : "You're all caught up. No quotations waiting to be sent or billed."}
        />
      ) : (
        <div className="rounded-2xl border border-[#E4E7EC] bg-white overflow-hidden shadow-sm divide-y divide-[#F2F4F7]">
          {filtered.map(({ item, type }, idx) => {
            const isPending = type === 'quotation_pending'
            return (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition-colors"
              >
                <button
                  onClick={() => setSelected({ item, type })}
                  className="flex items-start gap-4 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    isPending
                      ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                      : 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]'
                  }`}>
                    {isPending ? <RiSendPlaneLine size={20} /> : <RiFileTextLine size={20} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#101828] truncate">
                        {item.client_name}
                      </p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                        isPending
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          : 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]'
                      }`}>
                        {isPending ? 'Pending to Send' : 'Ready for Billing'}
                      </span>
                      {item.tag && (
                        <span className="inline-flex items-center rounded-full bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#6B7280]">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">
                      {item.quotation_title || 'General Price List'} · #{String(item.id).slice(0, 8)} · {item.created_at ? formatDate(item.created_at) : '—'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#98A2B3]">
                      <span>{item.line_items?.length ?? 0} items</span>
                      <span>
                        LKR {(item.line_items ?? []).reduce((sum, li) => sum + li.unit_price, 0).toFixed(2)} total rate value
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/quotations/${item.id}`)}
                  >
                    Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(item, type)}
                    className={isPending ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#101828] hover:bg-[#374151]'}
                  >
                    {isPending ? (
                      <><RiSendPlaneLine size={14} /> Send</>
                    ) : (
                      <><RiAddLine size={14} /> Create Bill</>
                    )}
                  </Button>
                  <button
                    onClick={() => setSelected({ item, type })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#98A2B3] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer"
                    aria-label="Open details"
                  >
                    <RiArrowRightSLine size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail dialog */}
      <NotificationDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        quotation={selected?.item ?? null}
        type={selected?.type ?? 'quotation_pending'}
      />
    </div>
  )
}