import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLinenStats } from '../hooks/useLinen'
import { linenService, type ScanActivity } from '../services/linen.service'
import { useLinenLiveStatus } from '../realtime/useLinenRealtime'
import { LinenLiveBadge } from '../components/linen-live-badge'
import { LINEN_STATUS_CONFIG, type LinenStatus } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { StatCard } from '../../../components/ui/stat-card'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/ui/error-state'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Package, Droplets, Clock } from 'lucide-react'

const STATUS_ORDER: LinenStatus[] = [
  'IN_STOCK', 'AT_CLIENT', 'COLLECTED', 'AT_LAUNDRY',
  'WASHING', 'DRYING', 'PRESSING', 'READY',
  'DELIVERED', 'MISSING', 'DAMAGED', 'RETIRED',
]

export default function LinenDashboard() {
  const { data: stats, isLoading, isError } = useLinenStats()
  const liveStatus = useLinenLiveStatus()

  if (isLoading) return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Dashboard' }]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  )

  if (isError || !stats) return <ErrorState />

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Dashboard' }]} />

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
            Linen Tracking
          </h1>
          <LinenLiveBadge status={liveStatus} />
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1">Overview of all linen assets across clients and statuses</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Linens" value={stats.total.toLocaleString()} icon={<Package size={22} />} description="All tracked items" />
        <StatCard label="Total Wash Cycles" value={stats.total_wash_cycles.toLocaleString()} icon={<Droplets size={22} />} description="Across all items" />
        <StatCard label="Recently Scanned" value={stats.recently_scanned.toLocaleString()} icon={<Clock size={22} />} description="Last 24 hours" />
      </div>

      {/* Status breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {STATUS_ORDER.map(status => {
            const cfg = LINEN_STATUS_CONFIG[status]
            const key = status.toLowerCase()
            const value = (stats as unknown as Record<string, number>)[key] ?? 0
            return (
              <Card key={status} className="group border border-[var(--border)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover:border-[var(--border-2)]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[var(--text-muted)] truncate group-hover:text-[var(--text-secondary)] transition-colors">{cfg.label}</p>
                    <p className="text-lg font-bold transition-colors" style={{ color: cfg.color }}>{value.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <ScanActivityCard />
    </div>
  )
}

function ScanActivityCard() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data, isLoading } = useQuery<ScanActivity>({
    queryKey: ['linen-scan-activity', from, to],
    queryFn: () => linenService.getScanActivity({
      date_from: from || undefined,
      date_to: to || undefined,
    }),
  })

  const inputCls = 'h-8 rounded-lg border border-[var(--border)] bg-white px-2 text-[12px] outline-none focus:border-[#2563EB]'

  return (
    <Card className="border border-[var(--border)]">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">QR Scan Activity</h2>
            <p className="text-[11px] text-[var(--text-muted)]">Every physical tag scan, rolled up by action and day</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} />
            <span className="text-[11px] text-[var(--text-muted)]">to</span>
            <input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>

        {isLoading || !data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">TOTAL SCANS</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data.total_scans.toLocaleString()}</p>
              <div className="mt-2 space-y-0.5">
                {Object.entries(data.by_action).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-secondary)]">{k}</span>
                    <span className="font-semibold tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">BY DESTINATION STATUS</p>
              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {Object.entries(data.by_status).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-secondary)]">{k}</span>
                    <span className="font-semibold tabular-nums">{v}</span>
                  </div>
                ))}
                {Object.keys(data.by_status).length === 0 && <p className="text-[12px] text-[var(--text-muted)]">No scans in range</p>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">RECENT SCANS</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {data.recent.slice(0, 12).map((evt, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="font-mono text-[var(--text-primary)] truncate">{evt.linen_id}</span>
                    <span className="text-[var(--text-muted)] truncate">{evt.action}{evt.to_status ? ` → ${evt.to_status}` : ''}</span>
                    <span className="text-[var(--text-muted)] shrink-0">{evt.timestamp ? String(evt.timestamp).slice(0, 10) : ''}</span>
                  </div>
                ))}
                {data.recent.length === 0 && <p className="text-[12px] text-[var(--text-muted)]">No scans in range</p>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
