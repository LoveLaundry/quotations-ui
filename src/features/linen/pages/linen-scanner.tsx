import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLinenByCode, useLinenTransitions, useScanLinen } from '../hooks/useLinen'
import { useLinenCamera } from '../hooks/useLinenCamera'
import { parseLinenCode } from '../lib/linen-code'
import { CUSTODY_TINT } from '../lib/linen-custody'
import { LINEN_STATUS_CONFIG, type LinenStatus } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Camera, CameraOff, Search, CheckCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

/** HTTP status of a lookup failure, when the backend answered at all. */
function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status
}

export default function LinenScanner() {
  const [code, setCode] = useState('')
  const [scanned, setScanned] = useState<string | null>(null)
  const [unreadableTag, setUnreadableTag] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<{ label: string; color: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: linen, refetch, error, isError, isFetching } = useLinenByCode(scanned ?? undefined)
  const { data: catalogue } = useLinenTransitions()
  const scanMutation = useScanLinen()

  const lookup = useCallback((raw: string, source: 'camera' | 'typed') => {
    const parsed = parseLinenCode(raw)
    if (!parsed) {
      // A camera read of someone else's QR (a Wi-Fi poster, a shipping label)
      // must not be reported as a missing linen — say what it actually is, and
      // leave the linen already on screen alone so a stray code does not wipe
      // the record the operator is about to action.
      setUnreadableTag(source === 'camera' ? raw.trim().slice(0, 60) : raw.trim())
      if (source === 'typed') {
        setScanned(null)
        inputRef.current?.focus()
      }
      return
    }
    setUnreadableTag(null)
    setLastAction(null)
    // Re-scanning the tag already on screen must be a real second lookup:
    // `linens` stays fresh for ten minutes, so the cached answer would be
    // handed back and a failed lookup would never recover.
    if (parsed === scanned) refetch()
    else setScanned(parsed)
    if (source === 'typed') setCode('')
    if (source === 'camera') toast.info(`Scanned: ${parsed}`)
  }, [scanned, refetch])

  // The frame loop is created once when the camera starts but has to call the
  // current handler, so it goes through a ref — a captured closure would keep
  // looking up against state from the moment the camera was opened.
  const lookupRef = useRef(lookup)
  useEffect(() => { lookupRef.current = lookup })

  const camera = useLinenCamera({
    onCode: raw => lookupRef.current(raw, 'camera'),
  })
  const { active: cameraActive, starting: cameraStarting, error: cameraError } = camera

  /** Flat view of the server's catalogue, in group order. Quick actions and the
   * label above them are both built from this, so a state added on the backend
   * appears here without a frontend release. */
  const actions = (catalogue?.groups ?? []).flatMap(group =>
    group.transitions.map(transition => ({ ...transition, groupLabel: group.label }))
  )

  const handleQuickAction = (action: string) => {
    if (!linen?.id) return
    const transition = actions.find(a => a.action === action)
    const label = transition?.label ?? action
    scanMutation.mutate(
      { docId: linen.id, payload: { action } },
      {
        onSuccess: () => {
          setLastAction({ label, color: CUSTODY_TINT[transition?.custody ?? 'exception'] })
          toast.success(`${label} — ${linen.linen_id}`)
          setTimeout(() => refetch(), 300)
        },
      }
    )
  }

  const notFound = isError && statusOf(error) === 404
  const lookupError = isError && !notFound
  const stCfg = linen ? (LINEN_STATUS_CONFIG[linen.status as LinenStatus] ?? { label: linen.status, color: '#6B7280', bg: 'var(--surface-3)' }) : null

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Scanner' }]} />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Scan Linen
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Scan a QR code or enter a linen ID manually</p>
      </div>

      {/* Camera toggle */}
      <div className="flex gap-2">
        {!cameraActive ? (
          <Button variant="outline" size="sm" onClick={() => camera.start()} disabled={cameraStarting} className="gap-2">
            {cameraStarting ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {cameraStarting ? 'Starting...' : 'Start Camera'}
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={camera.stop} className="gap-2">
            <CameraOff size={14} /> Stop Camera
          </Button>
        )}
      </div>

      {/* Camera container — video element is created here via DOM */}
      <div
        ref={camera.containerRef}
        className="relative bg-black rounded-xl overflow-hidden border border-[var(--border)]"
        style={{ display: cameraActive || cameraStarting ? 'block' : 'none', minHeight: 300 }}
      >
        {cameraStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-center text-white">
              <Loader2 size={32} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Starting camera...</p>
              <p className="text-xs mt-1 opacity-70">Accept the permission prompt on your phone</p>
            </div>
          </div>
        )}
        {cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-56 h-56 border-2 border-white/60 rounded-2xl" />
          </div>
        )}
        {cameraActive && (
          <div className="absolute bottom-0 inset-x-0 p-2 text-center text-xs text-white/80 bg-black/40 z-10">
            Point camera at a QR code — scanning is automatic, keep scanning the next tag
          </div>
        )}
      </div>

      {/* Camera error */}
      {cameraError && (
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CameraOff size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{cameraError}</p>
                <Button size="sm" variant="outline" className="mt-2 text-red-700 border-red-300" onClick={() => camera.start()}>
                  <RefreshCw size={12} className="mr-1" /> Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual input — always available, so a damaged tag or a blocked camera
          never stops the operator */}
      <Card className="border border-[var(--border)] shadow-sm">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookup(e.currentTarget.value, 'typed')}
                placeholder="Enter linen ID (e.g. LL-7K4P92)"
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-lg font-mono border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] transition-colors"
              />
            </div>
            <Button onClick={() => lookup(code, 'typed')} disabled={!code.trim() || isFetching} className="px-6">
              {isFetching ? <Loader2 size={16} className="animate-spin" /> : 'Lookup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Decoded, but not a linen tag */}
      {unreadableTag && (
        <Card className="border border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  That tag carries <span className="font-mono font-semibold">{unreadableTag || 'nothing readable'}</span>, which is not a linen ID.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  A LoveLaundry linen tag reads <span className="font-mono">LL-XXXXXX</span>. Type the ID printed under the QR code to look it up.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Looking up */}
      {isFetching && !linen && (
        <Card className="border border-[var(--border)] shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 size={16} className="animate-spin" /> Looking up {scanned}…
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tag is valid but the service could not be asked */}
      {lookupError && (
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-red-800">
              Could not check {scanned} — {statusOf(error) ? `the linen service answered ${statusOf(error)}` : (error as Error)?.message || 'it could not be reached'}
            </p>
            <p className="text-xs text-red-700 mt-1">The tag is not the problem. Try again, or check your connection.</p>
            <div className="mt-3 flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw size={12} className="mr-1" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not registered */}
      {notFound && (
        <Card className="border border-[var(--border)] shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">No linen is registered under <span className="font-mono font-semibold">{scanned}</span> in this laundry.</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Either the tag has not been generated here yet, or it belongs to a different laundry — a tag printed by another system will not resolve.
            </p>
            <div className="mt-3 flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw size={12} className="mr-1" /> Scan Again
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setScanned(null); setUnreadableTag(null); inputRef.current?.focus() }}>
                Clear &amp; Try Again
              </Button>
              <Link to="/linen/tags"><Button variant="outline" size="sm">Generate Tags</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan result */}
      {linen && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)]" style={{ backgroundColor: stCfg?.bg }}>
            <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: stCfg?.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold" style={{ color: stCfg?.color }}>{stCfg?.label}</p>
                {lastAction && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/70 border" style={{ color: lastAction.color, borderColor: lastAction.color + '40' }}>
                    <CheckCircle size={10} /> {lastAction.label} applied
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">{linen.linen_id} · {linen.item_type} · {linen.client_name}</p>
            </div>
            {scanMutation.isPending ? (
              <Loader2 size={18} className="animate-spin text-[var(--text-muted)] flex-shrink-0" />
            ) : lastAction ? (
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            ) : null}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <Card className="flex-1 border border-[var(--border)] shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Item Info</h2>
                  {isFetching && <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />}
                </div>
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
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">{l}</p>
                      <p className="font-semibold text-[var(--text-primary)]">{v}</p>
                    </div>
                  ))}
                </div>
                <Link to={`/linen/${linen.id}`} className="inline-block mt-4 text-xs text-[#DC2626] hover:underline font-semibold">
                  View Full Profile →
                </Link>
              </CardContent>
            </Card>

            <Card className="lg:w-72 border border-[var(--border)] shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Quick Actions</h2>

                {actions.length === 0 && (
                  <div className="text-xs text-[var(--text-muted)]">
                    <AlertTriangle size={14} className="inline mr-1 text-amber-600" />
                    The linen service has not returned the available states.
                    <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={() => window.location.reload()}>
                      <RefreshCw size={12} className="mr-1" /> Reload
                    </Button>
                  </div>
                )}

                {(catalogue?.groups ?? []).map(group => (
                  <div key={group.custody} className="mb-3 last:mb-0">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">{group.label}</p>
                    <div className="space-y-1.5">
                      {group.transitions.map(transition => (
                        <Button
                          key={transition.action}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs h-8 focus:ring-2 focus:ring-[#DC2626]/20"
                          style={{
                            borderColor: CUSTODY_TINT[transition.custody] + '30',
                            color: CUSTODY_TINT[transition.custody],
                          }}
                          onClick={() => handleQuickAction(transition.action)}
                          disabled={scanMutation.isPending}
                        >
                          {scanMutation.isPending ? <Loader2 size={12} className="animate-spin mr-2" /> : null}
                          {transition.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
