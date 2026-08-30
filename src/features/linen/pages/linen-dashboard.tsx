import { useLinenStats } from '../hooks/useLinen'
import { LINEN_STATUS_CONFIG, type LinenStatus } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { ErrorState } from '../../../components/ui/error-state'
import { Breadcrumb } from '../../../components/ui/breadcrumb'

const STATUS_ORDER: LinenStatus[] = [
  'IN_STOCK', 'AT_CLIENT', 'COLLECTED', 'AT_LAUNDRY',
  'WASHING', 'DRYING', 'PRESSING', 'READY',
  'DELIVERED', 'MISSING', 'DAMAGED', 'RETIRED',
]

export default function LinenDashboard() {
  const { data: stats, isLoading, isError } = useLinenStats()

  if (isLoading) return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Dashboard' }]} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    </div>
  )

  if (isError || !stats) return <ErrorState />

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Dashboard' }]} />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Linen Tracking Dashboard
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Overview of all linen assets across clients and statuses</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total Linens</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total Wash Cycles</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.total_wash_cycles.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Recently Scanned</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.recently_scanned.toLocaleString()}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Last 24 hours</p>
          </CardContent>
        </Card>
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
              <Card key={status} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)]">{cfg.label}</p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">{value.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
