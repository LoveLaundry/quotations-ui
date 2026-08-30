import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useLinenByCode, useScanLinen } from '../hooks/useLinen'
import { LINEN_STATUS_CONFIG, SCAN_ACTIONS, type LinenStatus } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Camera, CameraOff, Keyboard, Search, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const SCANNER_ELEMENT_ID = 'linen-qr-scanner'

export default function LinenScanner() {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [cameraActive, setCameraActive] = useState(false)
  const [code, setCode] = useState('')
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const { data: linen, refetch, isFetching } = useLinenByCode(lastScanned ?? undefined)
  const scanMutation = useScanLinen()

  const handleCodeScanned = useCallback((decodedText: string) => {
    const trimmed = decodedText.trim().toUpperCase()
    if (!trimmed || trimmed === lastScanned) return
    setLastScanned(trimmed)
    setCode(trimmed)
    refetch()
    toast.info(`Scanned: ${trimmed}`)
  }, [lastScanned, refetch])

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* ignore */ }
      try { scannerRef.current.clear() } catch { /* ignore */ }
      scannerRef.current = null
    }
    setCameraActive(false)
  }, [])

  // This MUST be called from a user click (not useEffect) for mobile permission
  const startCamera = useCallback(async () => {
    setCameraError(null)
    setIsStarting(true)
    setCameraActive(true)

    // Wait for DOM element to render
    await new Promise(r => setTimeout(r, 200))

    try {
      await stopCamera()

      const el = document.getElementById(SCANNER_ELEMENT_ID)
      if (!el) {
        throw new Error('Scanner element not found')
      }

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => handleCodeScanned(decodedText),
        () => { /* ignore scan errors */ }
      )
      setIsStarting(false)
    } catch (err: any) {
      setIsStarting(false)
      setCameraActive(false)
      const msg = err?.message || String(err)
      if (msg.includes('Permission') || msg.includes('permission') || msg.includes('NotAllowed')) {
        setCameraError('Camera permission denied. Tap the lock icon in the address bar and allow camera access, then try again.')
      } else if (msg.includes('NotFound') || msg.includes('not found') || msg.includes('DevicesNotFound')) {
        setCameraError('No camera found on this device.')
      } else if (msg.includes('NotReadable') || msg.includes('not readable')) {
        setCameraError('Camera is in use by another app. Close other camera apps and try again.')
      } else {
        setCameraError(`Camera error: ${msg}`)
      }
    }
  }, [stopCamera, handleCodeScanned])

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  const handleStartCamera = useCallback(async () => {
    setMode('camera')
    setCameraError(null)
    await startCamera()
  }, [startCamera])

  const switchToManual = useCallback(async () => {
    await stopCamera()
    setMode('manual')
    setCameraError(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [stopCamera])

  const handleLookup = useCallback(() => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLastScanned(trimmed)
    refetch()
    setCode('')
  }, [code, refetch])

  const handleQuickAction = (action: string) => {
    if (!linen?.id) return
    const label = SCAN_ACTIONS.find(a => a.value === action)?.label ?? action
    scanMutation.mutate(
      { docId: linen.id, payload: { action } },
      {
        onSuccess: () => {
          toast.success(`${label} — ${linen.linen_id}`)
          setTimeout(() => refetch(), 300)
        },
      }
    )
  }

  const stCfg = linen ? (LINEN_STATUS_CONFIG[linen.status as LinenStatus] ?? { label: linen.status, color: '#6B7280', bg: '#F3F4F6' }) : null

  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1')

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Scanner' }]} />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Scan Linen
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Scan a QR code or enter a linen ID manually</p>
      </div>

      {/* Insecure context warning */}
      {!isSecure && mode === 'camera' && (
        <Card className="border border-yellow-300 bg-yellow-50 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <CameraOff size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">HTTPS required for camera</p>
              <p className="text-xs text-yellow-700 mt-1">Mobile browsers block camera on HTTP. Access this site via HTTPS to use the scanner.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode toggle — camera button is a user gesture for mobile permission */}
      <div className="flex gap-2">
        {!cameraActive ? (
          <Button variant="outline" size="sm" onClick={handleStartCamera} className="gap-2">
            <Camera size={14} /> Start Camera
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={switchToManual} className="gap-2">
            <CameraOff size={14} /> Stop Camera
          </Button>
        )}
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={switchToManual}
          className="gap-2"
        >
          <Keyboard size={14} /> Manual Entry
        </Button>
      </div>

      {/* Camera scanner */}
      {cameraActive && (
        <Card className="border border-[var(--border)] shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-black">
              <div id={SCANNER_ELEMENT_ID} className="w-full min-h-[300px]" />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <div className="text-center text-white">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                    <p className="text-sm">Starting camera...</p>
                    <p className="text-xs mt-1 opacity-70">Accept the camera permission prompt</p>
                  </div>
                </div>
              )}
            </div>
            {cameraError && (
              <div className="p-4 bg-red-50 border-t border-red-200">
                <div className="flex items-start gap-3">
                  <CameraOff size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{cameraError}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-red-700 border-red-300" onClick={handleStartCamera}>
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {!cameraError && !isStarting && (
              <div className="p-3 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
                Point camera at a QR code — scanning is automatic
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual input */}
      {mode === 'manual' && !cameraActive && (
        <Card className="border border-[var(--border)] shadow-sm">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  ref={inputRef}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  placeholder="Enter linen ID (e.g. LL-7K4P92)"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 text-lg font-mono border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] transition-colors"
                />
              </div>
              <Button onClick={handleLookup} disabled={!code.trim() || isFetching} className="px-6">
                {isFetching ? <Loader2 size={16} className="animate-spin" /> : 'Lookup'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not found */}
      {!linen && lastScanned && !isFetching && (
        <Card className="border border-[var(--border)] shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">No linen found with ID: <span className="font-mono font-semibold">{lastScanned}</span></p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setLastScanned(null); inputRef.current?.focus() }}>
              Clear & Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan result */}
      {linen && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)]" style={{ backgroundColor: stCfg?.bg }}>
            <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: stCfg?.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: stCfg?.color }}>{stCfg?.label}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{linen.linen_id} · {linen.item_type} · {linen.client_name}</p>
            </div>
            {scanMutation.isSuccess && <CheckCircle size={18} className="text-green-600 flex-shrink-0" />}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Item info */}
            <Card className="flex-1 border border-[var(--border)] shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Item Info</h2>
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

            {/* Quick actions */}
            <Card className="lg:w-72 border border-[var(--border)] shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Quick Actions</h2>
                <div className="space-y-1.5">
                  {SCAN_ACTIONS.map(sa => (
                    <Button
                      key={sa.value}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-8 focus:ring-2 focus:ring-[#DC2626]/20"
                      style={{ borderColor: sa.color + '30', color: sa.color }}
                      onClick={() => handleQuickAction(sa.value)}
                      disabled={scanMutation.isPending}
                    >
                      {scanMutation.isPending ? <Loader2 size={12} className="animate-spin mr-2" /> : null}
                      {sa.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
