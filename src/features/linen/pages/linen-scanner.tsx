import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLinenByCode, useScanLinen } from '../hooks/useLinen'
import { LINEN_STATUS_CONFIG, SCAN_ACTIONS, type LinenStatus } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Camera, Search, CheckCircle } from 'lucide-react'

export default function LinenScanner() {
  const [code, setCode] = useState('')
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: linen, refetch, isFetching } = useLinenByCode(lastScanned ?? undefined)
  const scanMutation = useScanLinen()

  const handleLookup = useCallback(() => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLastScanned(trimmed)
    refetch()
    setCode('')
  }, [code, refetch])

  const handleQuickAction = (action: string) => {
    if (!linen?.id) return
    scanMutation.mutate(
      { docId: linen.id, payload: { action } },
      {
        onSuccess: () => {
          // Re-fetch the linen to show updated status
          setTimeout(() => refetch(), 300)
        },
      }
    )
  }

  const stCfg = linen ? (LINEN_STATUS_CONFIG[linen.status as LinenStatus] ?? { label: linen.status, color: '#6B7280', bg: '#F3F4F6' }) : null

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Scanner' }]} />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Scan Linen
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Scan a QR code or enter a linen ID manually</p>
      </div>

      {/* Scanner input */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="Enter linen ID (e.g. LL-7K4P92) or scan QR..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-lg font-mono border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
              />
            </div>
            <Button onClick={handleLookup} disabled={!code.trim() || isFetching} className="px-6">
              {isFetching ? 'Looking up...' : 'Lookup'}
            </Button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            <Camera size={12} className="inline mr-1" />
            Point your phone camera at the QR code, or type the linen ID above
          </p>
        </CardContent>
      </Card>

      {/* Scan result */}
      {linen && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: stCfg?.bg }}>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stCfg?.color }} />
            <div>
              <p className="text-sm font-bold" style={{ color: stCfg?.color }}>{stCfg?.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{linen.linen_id} · {linen.item_type} · {linen.client_name}</p>
            </div>
            {scanMutation.isSuccess && <CheckCircle size={20} className="ml-auto text-green-600" />}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Item info */}
            <Card className="flex-1 border-0 shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-3">Item Info</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Category', linen.category],
                    ['Type', linen.item_type],
                    ['Client', linen.client_name],
                    ['Size', linen.size || '—'],
                    ['Color', linen.color || '—'],
                    ['Condition', linen.condition],
                    ['Washes', String(linen.wash_count)],
                    ['Location', linen.location || '—'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[10px] text-[var(--text-muted)]">{l}</p>
                      <p className="font-semibold text-[var(--text-primary)]">{v}</p>
                    </div>
                  ))}
                </div>
                <Link to={`/linen/${linen.id}`} className="inline-block mt-3 text-xs text-[#DC2626] hover:underline font-semibold">
                  View Full Profile →
                </Link>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="lg:w-72 border-0 shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-3">Quick Actions</h2>
                <div className="space-y-2">
                  {SCAN_ACTIONS.map(sa => (
                    <Button
                      key={sa.value}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      style={{ borderColor: sa.color + '40', color: sa.color }}
                      onClick={() => handleQuickAction(sa.value)}
                      disabled={scanMutation.isPending}
                    >
                      {sa.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!linen && lastScanned && !isFetching && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">No linen found with ID: {lastScanned}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setLastScanned(null); inputRef.current?.focus() }}>
              Clear & Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
