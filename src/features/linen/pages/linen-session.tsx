import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/AuthContext'
import { useLinenTransitions, useScanLinen, linenKeys } from '../hooks/useLinen'
import { useLinenLiveStatus } from '../realtime/useLinenRealtime'
import { LinenLiveBadge } from '../components/linen-live-badge'
import { useLinenCamera } from '../hooks/useLinenCamera'
import { linenService } from '../services/linen.service'
import { parseLinenCode } from '../lib/linen-code'
import {
  OUTCOME_LABEL,
  OUTCOME_TONE,
  alreadyRecorded,
  createSession,
  endSession,
  failedTotal,
  filterRecords,
  inFlight,
  isSessionOpen,
  recordAttempt,
  resolveAttempt,
  summarise,
  type ScanSession,
} from '../lib/scan-session'
import type { LinenTransition } from '../../../types/linen'
import { LINEN_STATUS_CONFIG, type LinenStatus } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ScanLine,
  Search,
  Square,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

/** A code is shown as it was read; long junk is capped so one stray QR (a
 * Wi-Fi poster is 300+ characters) cannot push the history off the screen. */
const MAX_DISPLAY_CODE = 32

const TONE_BADGE = {
  green: 'success',
  amber: 'warning',
  red: 'danger',
  blue: 'info',
  neutral: 'neutral',
} as const

function statusLabel(status?: string): string {
  if (!status) return '—'
  return LINEN_STATUS_CONFIG[status as LinenStatus]?.label ?? status
}

function timeOfDay(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** HTTP status from an axios failure, when there was an HTTP response at all. */
function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status
}

export default function LinenSessionPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const operator = user?.user_name ?? 'unknown'

  const { data: catalogue, isLoading: catalogueLoading, error: catalogueError } = useLinenTransitions()
  // The laundry-wide channel is what the app-level sync already follows; this
  // only reports whether the push is live, so the operator can trust that the
  // counts and the history are being updated as the shift scans.
  const liveStatus = useLinenLiveStatus()

  const [target, setTarget] = useState<LinenTransition | null>(null)
  const [location, setLocation] = useState('')
  const [filter, setFilter] = useState('')
  const [session, setSession] = useState<ScanSession | null>(null)
  const [code, setCode] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * A keyboard-wedge scanner can deliver the next tag before React has
   * re-rendered, so the duplicate and in-flight checks must read the session as
   * it is *now*, not as it was at the last render. State and ref move together.
   */
  const sessionRef = useRef<ScanSession | null>(null)
  const update = useCallback((fn: (s: ScanSession) => ScanSession) => {
    const current = sessionRef.current
    if (!current) return
    const next = fn(current)
    sessionRef.current = next
    setSession(next)
  }, [])

  const scanMutation = useScanLinen()

  const focusScanner = useCallback(() => {
    // Restoring focus is the whole point: without it the next physical scan
    // goes nowhere and the operator has to tap the screen between every item.
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const beginSession = useCallback((transition: LinenTransition) => {
    const started = createSession({
      action: transition.action,
      actionLabel: transition.label,
      toStatus: transition.to_status,
      custody: transition.custody,
      operator,
    })
    sessionRef.current = started
    setSession(started)
    setFilter('')
    setCode('')
    toast.success(`${transition.label} — scanning. Keep passing tags; end the session when you are done.`)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [operator])

  const process = useCallback(async (raw: string) => {
    const current = sessionRef.current
    if (!current || !target || !isSessionOpen(current)) return

    const code = parseLinenCode(raw)

    if (!code) {
      const shown = (raw || '').trim().slice(0, MAX_DISPLAY_CODE) || 'empty read'
      update(s => resolveAttempt(recordAttempt(s, shown), shown, {
        outcome: 'unreadable',
        message: 'Not a linen tag',
      }))
      toast.warning(`Not a linen tag: ${shown}`)
      setCode('')
      focusScanner()
      return
    }

    if (inFlight(current, code)) return

    if (alreadyRecorded(current, code)) {
      update(s => resolveAttempt(recordAttempt(s, code), code, {
        outcome: 'duplicate',
        toStatus: target.to_status,
        message: 'Already recorded in this session',
      }))
      toast.warning(`${code} is already recorded in this session`)
      setCode('')
      focusScanner()
      return
    }

    update(s => recordAttempt(s, code))
    setCode('')

    try {
      // A scan must be answered by the live record, never by the ten-minute
      // linen cache: the status the operator sees has to be the status the
      // transition is applied to.
      const linen = await queryClient.fetchQuery({
        queryKey: linenKeys.byCode(code),
        queryFn: () => linenService.getLinenByCode(code),
        staleTime: 0,
      })

      try {
        await scanMutation.mutateAsync({
          docId: linen.id,
          payload: { action: target.action, location: location || undefined },
        })
        update(s => resolveAttempt(s, code, {
          outcome: 'success',
          linenType: linen.item_type,
          fromStatus: linen.status,
          toStatus: target.to_status,
        }))
      } catch (scanError) {
        const status = statusOf(scanError)
        const refused = status !== undefined && [400, 403, 404, 409, 422].includes(status)
        update(s => resolveAttempt(s, code, {
          outcome: refused ? 'rejected' : 'failed',
          linenType: linen.item_type,
          fromStatus: linen.status,
          message: refused ? `The linen service refused this transition (${status})` : 'Could not reach the linen service',
        }))
        if (!refused) toast.error(`${code}: could not be recorded`)
      }
    } catch (lookupError) {
      if (statusOf(lookupError) === 404) {
        update(s => resolveAttempt(s, code, { outcome: 'not_found', message: 'No linen registered under this tag' }))
        toast.warning(`${code} is not registered in this laundry`)
      } else {
        update(s => resolveAttempt(s, code, { outcome: 'failed', message: 'Lookup failed' }))
        toast.error(`${code}: the linen service could not be reached`)
      }
    } finally {
      focusScanner()
    }
  }, [target, location, update, focusScanner, queryClient, scanMutation])

  const camera = useLinenCamera({ onCode: raw => void process(raw) })

  // Leaving the page mid-session would lose the operator's record of what they
  // scanned, and every scan is already committed — warn, do not silently drop.
  useEffect(() => {
    if (!session || !isSessionOpen(session)) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [session])

  const summary = useMemo(() => (session ? summarise(session) : null), [session])
  const visible = useMemo(
    () => (session ? filterRecords(session.records, filter) : []),
    [session, filter]
  )

  const endCurrentSession = useCallback(() => {
    update(s => endSession(s))
    camera.stop()
    if (summary && summary.pending > 0) {
      toast.info(`${summary.pending} operation(s) still finishing — the summary will update as they land.`)
    }
  }, [update, camera, summary])

  const resumeCurrentSession = useCallback(() => {
    update(s => ({ ...s, endedAt: undefined }))
    focusScanner()
  }, [update, focusScanner])

  const discardAndPickAnother = useCallback(() => {
    sessionRef.current = null
    setSession(null)
    setTarget(null)
    camera.stop()
  }, [camera])

  // ── 1. Choose the target state ──────────────────────────────────────────
  if (!session) {
    return (
      <div className="space-y-5">
        <Breadcrumb items={[{ label: 'Linen' }, { label: 'Scan Session' }]} />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
            Scan Session
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Choose the state to move linens into, then scan continuously. One selection applies to the whole session.
          </p>
        </div>

        {catalogueLoading && (
          <Card className="border border-[var(--border)] shadow-sm">
            <CardContent className="p-8 text-center text-sm text-[var(--text-muted)]">
              <Loader2 size={16} className="animate-spin mr-2 inline" /> Loading the state machine from the linen service…
            </CardContent>
          </Card>
        )}

        {catalogueError && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-sm font-medium text-red-800">
                The linen service did not answer, so no states can be listed. Nothing here is hardcoded — that is deliberate.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                <RefreshCw size={12} className="mr-1" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {catalogue?.groups.map(group => (
          <div key={group.custody} className="space-y-2">
            <div>
              <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{group.label}</h2>
              <p className="text-xs text-[var(--text-muted)]">{group.description}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.transitions.map(transition => (
                <button
                  key={transition.action}
                  type="button"
                  onClick={() => beginSession(transition)}
                  className="aspect-square rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition-all hover:border-[var(--brand)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 flex flex-col justify-between"
                >
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {transition.custody === 'exception' ? <AlertTriangle size={11} /> : <ScanLine size={11} />}
                    {transition.to_status_label}
                  </span>
                  <span className="text-base font-bold text-[var(--text-primary)] leading-tight">{transition.label}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{transition.to_status}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── 2. Session summary, once ended ──────────────────────────────────────
  if (!isSessionOpen(session) && summary) {
    const unresolved = summary.attempts - summary.successful - summary.pending
    return (
      <div className="space-y-5">
        <Breadcrumb items={[{ label: 'Linen' }, { label: 'Scan Session' }, { label: 'Summary' }]} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
              Session Summary
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              <span className="font-mono">{session.id}</span> · {session.actionLabel} → {statusLabel(session.toStatus)} · {timeOfDay(session.startedAt)}–{timeOfDay(session.endedAt ?? Date.now())}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resumeCurrentSession}>
              <RefreshCw size={12} className="mr-1" /> Resume / Correct
            </Button>
            <Button size="sm" onClick={discardAndPickAnother}>
              New Session
            </Button>
          </div>
        </div>

        {unresolved > 0 && (
          <Card className="border border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {unresolved} of {summary.attempts} scans did not record a state change.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Each scan was committed the moment it succeeded, so this list is complete: {summary.duplicates} duplicate
                    attempt(s), {summary.unreadable} unreadable, {summary.notFound} not registered, {summary.rejected} refused,
                    {' '}{summary.failed} unreachable. Resolve them individually — resuming adds new scans, it does not rewrite
                    this history.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ['Scan attempts', summary.attempts],
            ['Unique linens', summary.uniqueLinens],
            ['Successfully updated', summary.successful],
            ['Duplicate attempts', summary.duplicates],
            ['Failed scans', failedTotal(summary)],
            ['Still working', summary.pending],
          ].map(([label, value]) => (
            <Card key={String(label)} className="border border-[var(--border)] shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">{label}</p>
                <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <DetailList records={visible} filter={filter} setFilter={setFilter} total={session.records.length} />
      </div>
    )
  }

  // ── 3. Continuous scanning ──────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Scan Session' }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
            {target?.label} <span className="text-[var(--text-muted)]">→</span> {statusLabel(session.toStatus)}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {target?.custody === 'exception' ? 'Exception' : 'Handover'} session · continuous scanning is active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!camera.active ? (
            <Button variant="outline" size="sm" onClick={() => camera.start()} disabled={camera.starting} className="gap-2">
              {camera.starting ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {camera.starting ? 'Starting…' : 'Camera'}
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={camera.stop} className="gap-2">
              <CameraOff size={14} /> Stop Camera
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={endCurrentSession} className="gap-2">
            <Square size={12} /> End Session
          </Button>
        </div>
      </div>

      {/* Header facts the operator has to be able to quote afterwards. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1"><ScanLine size={11} /> <span className="font-mono">{session.id}</span></span>
        <span className="inline-flex items-center gap-1"><UserIcon size={11} /> {session.operator}</span>
        <span className="inline-flex items-center gap-1"><Clock size={11} /> started {timeOfDay(session.startedAt)}</span>
        <Badge tone="info" size="xs" dot>Scanning</Badge>
        <LinenLiveBadge status={liveStatus} />
      </div>

      {camera.error && (
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CameraOff size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{camera.error}</p>
                <p className="text-xs text-red-700 mt-1">The scanner box below works regardless — a blocked camera never stops a session.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div
        ref={camera.containerRef}
        className="relative bg-black rounded-xl overflow-hidden border border-[var(--border)]"
        style={{ display: camera.active || camera.starting ? 'block' : 'none', minHeight: 260 }}
      >
        {camera.active && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-52 h-52 border-2 border-white/60 rounded-2xl" />
          </div>
        )}
        {camera.active && (
          <div className="absolute bottom-0 inset-x-0 p-2 text-center text-xs text-white/80 bg-black/40 z-10">
            Keep passing tags — every read is recorded immediately
          </div>
        )}
      </div>

      {/* The scanner box. A keyboard-wedge or Bluetooth HID scanner "types" the
          code and an Enter, which is exactly what this input handles. */}
      <Card className="border border-[var(--brand-border)] bg-[var(--brand-soft)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') void process(e.currentTarget.value)
                }}
                placeholder="Scan or type a linen ID (LL-XXXXXX)"
                autoComplete="off"
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-lg font-mono border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] transition-colors"
              />
            </div>
            <Button type="button" onClick={() => void process(code)} disabled={!code.trim()} className="px-5">
              Record
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location / station (optional)"
              className="flex-1 px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
            />
            <p className="text-[11px] text-[var(--text-muted)] max-w-[16rem]">
              Focus returns here after every scan, so the next tag can be read immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            ['Attempts', summary.attempts, 'neutral'],
            ['Updated', summary.successful, 'green'],
            ['Unique', summary.uniqueLinens, 'green'],
            ['Duplicates', summary.duplicates, 'amber'],
            ['Failed', failedTotal(summary), 'red'],
            ['Working', summary.pending, 'blue'],
          ].map(([label, value, tone]) => (
            <div
              key={String(label)}
              className="rounded-lg border px-2 py-2 text-center"
              style={{
                borderColor: tone === 'green' ? '#BBF7D0' : tone === 'amber' ? '#FDE68A' : tone === 'red' ? '#FECACA' : tone === 'blue' ? '#BFDBFE' : 'var(--border)',
                backgroundColor: tone === 'green' ? '#F0FDF4' : tone === 'amber' ? '#FFFBEB' : tone === 'red' ? '#FEF2F2' : tone === 'blue' ? '#EFF6FF' : 'var(--surface)',
              }}
            >
              <p className="text-[10px] uppercase text-[var(--text-muted)]">{label}</p>
              <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      <DetailList records={visible} filter={filter} setFilter={setFilter} total={session.records.length} compact />
    </div>
  )
}

interface DetailListProps {
  records: ScanSession['records']
  total: number
  filter: string
  setFilter: (value: string) => void
  compact?: boolean
}

/**
 * The recent-history strip: what was scanned, what it was, the state it moved
 * from and to, and the result. Searchable, and never a dialog — an operator
 * mid-session must be able to see and check the last scans without losing
 * focus from the scanner.
 */
function DetailList({ records, total, filter, setFilter, compact }: DetailListProps) {
  return (
    <Card className="border border-[var(--border)] shadow-sm">
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Scans {filter ? `${records.length} of ${total}` : total}
          </h2>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter…"
            className="w-40 px-2 py-1 text-xs border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#DC2626]/30"
          />
        </div>

        {records.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">
            {total ? 'No scan matches that filter yet.' : 'Nothing scanned yet — pass the first tag.'}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] max-h-[22rem] overflow-y-auto">
            {records.map((record, index) => {
              const tone = OUTCOME_TONE[record.outcome]
              return (
                <li key={`${record.code}-${record.attemptedAt}-${index}`} className="flex items-center gap-3 py-2 text-sm">
                  <span className="font-mono text-xs font-semibold text-[var(--text-primary)] truncate min-w-[7.5rem]">
                    {record.code}
                  </span>
                  <span className="hidden sm:block text-xs text-[var(--text-muted)] truncate flex-1">
                    {record.linenType ?? '—'}
                  </span>
                  <span className="hidden md:flex items-center gap-1 text-[11px] text-[var(--text-muted)] tabular-nums">
                    {statusLabel(record.fromStatus)} → {statusLabel(record.toStatus)}
                  </span>
                  <Badge tone={TONE_BADGE[tone]} size="xs">
                    {record.outcome === 'success' && <CheckCircle2 size={10} className="mr-1 inline" />}
                    {OUTCOME_LABEL[record.outcome]}
                  </Badge>
                  <span className="text-[11px] text-[var(--text-muted)] tabular-nums w-[5.5rem] text-right">
                    {timeOfDay(record.attemptedAt)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
