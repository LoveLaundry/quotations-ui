import {
  useEffect, useId, useRef, useState, type ReactNode,
} from 'react'
import {
  AlertCircle, ArrowUp, BookOpen, Check, ChevronDown, CircleHelp, Clock3,
  Columns3, Copy, Database, Eye, FileJson, FileSpreadsheet, Keyboard,
  LockKeyhole, RefreshCw, Rows3, ShieldCheck, WifiOff, X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useOfflineSync } from '../../cache/offline-hooks'
import {
  Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog'
import { DropdownMenu, type MenuGroup } from '../../components/ui/dropdown-menu'
import { Button } from '../../components/ui/button'
import {
  useEscape, useFeatures, useFocusRestore, useOnlineStatus, useReducedMotion,
  useRetryable, useScrolled, type TableDensity,
} from './hooks'
import {
  FEATURE_AREAS, FEATURE_COUNT, type FeatureArea,
} from './manifest'
import {
  formatBytes, formatDateTime, initialsOf, normalizeError, passwordStrength,
  roleLabel, scopeLabel,
} from './utils'

/* ── Global shell primitives ────────────────────────────────────────────── */

export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:rounded focus:bg-[var(--brand)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white"
    >
      Skip to content
    </a>
  )
}

export function LiveAnnouncer() {
  const { announcement } = useFeatures()
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  )
}

export function RouteProgress() {
  const { progress } = useFeatures()
  const reduceMotion = useReducedMotion()
  if (progress <= 0) return null
  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden bg-transparent"
    >
      <div
        className={cn('h-full bg-[var(--brand)]', !reduceMotion && 'transition-[width] duration-150 ease-out')}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function BackToTop() {
  const scrolled = useScrolled(window.innerHeight * 0.8)
  const reduceMotion = useReducedMotion()
  if (!scrolled) return null
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
      aria-label="Back to top"
      title="Back to top"
      className={cn(
        'fixed right-4 bottom-16 z-30 flex size-9 items-center justify-center rounded-full',
        'border border-[var(--border-2)] bg-[var(--surface)] text-[var(--text-secondary)]',
        'shadow-[var(--shadow-md)] transition-colors duration-100 hover:text-[var(--brand-text)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
      )}
    >
      <ArrowUp size={17} aria-hidden />
    </button>
  )
}

export function FeatureLauncherButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open feature manifest (Ctrl Shift F)"
      title="Feature manifest · Ctrl+Shift+F"
      className={cn(
        'inline-flex size-8 items-center justify-center rounded border border-transparent',
        'text-[var(--text-muted)] transition-colors duration-100',
        'hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
      )}
    >
      <BookOpen size={17} aria-hidden />
    </button>
  )
}

const SHORTCUTS = [
  { keys: 'Ctrl / Cmd + K', label: 'Search pages and quotations' },
  { keys: 'Ctrl / Cmd + Shift + F', label: 'Open the feature manifest' },
  { keys: 'Alt + R', label: 'Refresh the current page data' },
  { keys: '/', label: 'Focus the table search (outside inputs)' },
  { keys: '?', label: 'Show this shortcut help' },
  { keys: 'Escape', label: 'Close the open overlay' },
]

export function ShortcutHelpDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useFeatures()
  useFocusRestore(shortcutsOpen)
  useEscape(() => setShortcutsOpen(false), shortcutsOpen)
  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={16} aria-hidden /> Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="py-2">
          <ul className="divide-y divide-[var(--border)]">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.keys} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-[12.5px] text-[var(--text-secondary)]">{shortcut.label}</span>
                <kbd className="shrink-0 rounded-xs border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text-tertiary)]">
                  {shortcut.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

/* ── Accessibility toggles ──────────────────────────────────────────────── */

export function HighContrastToggle() {
  const { highContrast, toggleHighContrast } = useFeatures()
  return (
    <button
      type="button"
      onClick={toggleHighContrast}
      aria-pressed={highContrast}
      aria-label={highContrast ? 'High contrast on — switch to standard' : 'High contrast off — switch to high contrast'}
      title={highContrast ? 'High contrast: on' : 'High contrast: off'}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded border border-transparent',
        'text-[var(--text-muted)] transition-colors duration-100 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        highContrast && 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)]',
      )}
    >
      <Eye size={17} aria-hidden />
    </button>
  )
}

export function LargeTextToggle({
  pressed, onToggle,
}: {
  pressed: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pressed}
      aria-label={pressed ? 'Large text on — tap for normal size' : 'Large text off — tap for largest size'}
      title={pressed ? 'Large text: on' : 'Large text: off'}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded border border-transparent',
        'text-[var(--text-muted)] transition-colors duration-100 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        pressed && 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)]',
      )}
    >
      <span aria-hidden className="text-[14px] font-semibold">Aa</span>
    </button>
  )
}

/* ── Session and scope ──────────────────────────────────────────────────── */

export function ScopeBadge({
  support, compact = false,
}: {
  support?: { kind: string; entityName?: string; laundryName?: string } | null
  compact?: boolean
}) {
  const text = scopeLabel(support)
  return (
    <span
      title={text}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.03em] uppercase',
        support
          ? 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]'
          : 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)]',
      )}
    >
      <ShieldCheck size={12} aria-hidden />
      {!compact && <span className="max-w-[160px] truncate">{text}</span>}
    </span>
  )
}

export function SessionWarningBanner({
  remaining, onSignOut, onDismiss,
}: {
  remaining: number | null
  onSignOut: () => void
  onDismiss: () => void
}) {
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => setDismissed(false), [remaining])
  if (remaining === null || remaining > 180_000 || dismissed) return null
  const minutes = Math.max(1, Math.ceil(remaining / 60_000))
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-2 border-t border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-2 text-[12.5px] text-[var(--warning-text)]"
    >
      <Clock3 size={15} aria-hidden />
      <span>Your session expires in about {minutes} minute{minutes === 1 ? '' : 's'}.</span>
      <button type="button" onClick={onSignOut} className="font-semibold underline underline-offset-2">
        Sign out now
      </button>
      <button
        type="button"
        onClick={() => { setDismissed(true); onDismiss() }}
        aria-label="Dismiss session warning"
        className="rounded p-0.5 hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}

export function OfflineIndicator() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <span
      role="status"
      title="You are offline. Changes will be queued."
      className="inline-flex items-center gap-1 rounded-full border border-[var(--warning-border)] bg-[var(--warning-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--warning-text)]"
    >
      <WifiOff size={12} aria-hidden /> Offline
    </span>
  )
}

export function QueuedActionsBadge() {
  const { online, pending, syncing, failed } = useOfflineSync()
  const count = pending + syncing + failed
  if (count === 0 && online) return null
  return (
    <span
      role="status"
      title={`${pending} queued, ${syncing} syncing, ${failed} failed`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        failed > 0
          ? 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
          : 'border-[var(--border-2)] bg-[var(--surface-2)] text-[var(--text-tertiary)]',
      )}
    >
      <Database size={12} aria-hidden />
      {syncing > 0 ? 'Syncing' : `${count} queued`}
    </span>
  )
}

export function LastSignInInfo({ at }: { at?: string | null }) {
  if (!at) return null
  return (
    <p className="px-3 pb-2 text-[11px] text-[var(--text-faint)]">
      Last sign-in on this device: {formatDateTime(at)}
    </p>
  )
}

export function ClientTypeBadge() {
  return (
    <span
      title="This application is the laundry back office. Client type is fixed."
      className="inline-flex items-center gap-1 rounded-full border border-[var(--border-2)] bg-[var(--surface-2)] px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.04em] text-[var(--text-tertiary)] uppercase"
    >
      <LockKeyhole size={11} aria-hidden /> Laundry workspace
    </span>
  )
}

/* ── Form primitives ────────────────────────────────────────────────────── */

export function RequiredMark() {
  return (
    <span className="text-[var(--danger-text)]" title="Required" aria-label="Required field">
      *
    </span>
  )
}

export function HelpTooltip({ text, label = 'More information' }: { text: string; label?: string }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex size-4 items-center justify-center rounded-full text-[var(--text-faint)] hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <CircleHelp size={13} aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-1 w-max max-w-56 -translate-x-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] leading-snug text-[var(--text-secondary)] shadow-[var(--shadow-md)]"
        >
          {text}
        </span>
      )}
    </span>
  )
}

export function CharacterCounter({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length
  return (
    <span
      aria-live="polite"
      className={cn(
        'text-[11px] tabular-nums',
        remaining < 0 ? 'text-[var(--danger-text)]' : 'text-[var(--text-faint)]',
      )}
    >
      {value.length}/{max}
    </span>
  )
}

export function FormErrorSummary({ errors }: { errors: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (errors.length > 0) ref.current?.focus()
  }, [errors.length])
  if (errors.length === 0) return null
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-2.5 text-[12.5px] text-[var(--danger-text)] outline-none"
    >
      <p className="font-semibold">Fix {errors.length} field{errors.length === 1 ? '' : 's'} before saving:</p>
      <ul className="mt-1 list-disc pl-4">
        {errors.map((error) => <li key={error}>{error}</li>)}
      </ul>
    </div>
  )
}

export function MultiStepProgress({
  steps, current,
}: {
  steps: readonly string[]
  current: number
}) {
  return (
    <ol aria-label="Form progress" className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={step} className="flex items-center gap-1.5">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                active
                  ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-text)]'
                  : done
                    ? 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]'
                    : 'border-[var(--border-2)] text-[var(--text-faint)]',
              )}
            >
              <span className="tabular-nums">{index + 1}</span>
              {step}
              {done && <Check size={11} aria-hidden />}
            </span>
            {index < steps.length - 1 && <span aria-hidden className="text-[var(--border-strong)]">—</span>}
          </li>
        )
      })}
    </ol>
  )
}

export function CollapsibleSection({
  title, children, defaultOpen = false, count,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section className="rounded border border-[var(--border)] bg-[var(--surface-2)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <span className="flex items-center gap-1.5">
          {title}
          {count ? <span className="tabular-nums text-[var(--text-faint)]">({count})</span> : null}
        </span>
        <ChevronDown size={14} aria-hidden className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div id={id} className="border-t border-[var(--border)] px-3 py-2.5">{children}</div>}
    </section>
  )
}

export function AutosaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  const text = status === 'saving' ? 'Saving draft…' : status === 'saved' ? 'Draft saved' : 'Draft ready'
  return (
    <span role="status" className="inline-flex items-center gap-1 text-[11px] text-[var(--text-faint)]">
      <Database size={12} aria-hidden /> {text}
    </span>
  )
}

export function DraftRestoreBanner({
  onRestore, onDiscard,
}: {
  onRestore: () => void
  onDiscard: () => void
}) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--info-border)] bg-[var(--info-soft)] px-3 py-2 text-[12.5px] text-[var(--info-text)]"
    >
      <span className="flex items-center gap-2">
        <Database size={14} aria-hidden /> An unsaved draft was found on this device.
      </span>
      <span className="flex items-center gap-2">
        <button type="button" onClick={onRestore} className="font-semibold underline underline-offset-2">Restore</button>
        <button type="button" onClick={onDiscard} className="font-semibold underline underline-offset-2">Discard</button>
      </span>
    </div>
  )
}

export function ResetButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} disabled={disabled}>
      <RefreshCw size={14} aria-hidden /> Reset
    </Button>
  )
}

export function DuplicateWarning({ names }: { names: string[] }) {
  if (names.length === 0) return null
  return (
    <p role="status" className="flex items-center gap-1.5 text-[11.5px] text-[var(--warning-text)]">
      <AlertCircle size={13} aria-hidden />
      Duplicate item names: {names.slice(0, 3).join(', ')}{names.length > 3 ? '…' : ''}
    </p>
  )
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password)
  return (
    <div aria-live="polite" className="mt-1.5">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1 flex-1 rounded-full',
              step <= score
                ? score <= 1 ? 'bg-[var(--danger-text)]' : score === 2 ? 'bg-[var(--warning-text)]' : 'bg-[var(--success-text)]'
                : 'bg-[var(--border)]',
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-[var(--text-faint)]">Password strength: {label}</p>
    </div>
  )
}

/* ── Table primitives ───────────────────────────────────────────────────── */

export function InlineRetry({
  error, onRetry, pending, label = 'quotations',
}: {
  error: unknown
  onRetry: () => void | Promise<unknown>
  pending?: boolean
  label?: string
}) {
  const retry = useRetryable(async () => onRetry(), 2)
  const message = normalizeError(error)
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center">
      <AlertCircle size={20} aria-hidden className="text-[var(--danger-text)]" />
      <p className="text-[13px] font-medium text-[var(--text-primary)]">Could not load {label}</p>
      <p className="max-w-sm text-[12px] text-[var(--text-muted)]">{message}</p>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending || retry.pending}
        onClick={() => void retry.run()}
      >
        <RefreshCw size={14} aria-hidden className={retry.pending ? 'animate-spin' : undefined} />
        Retry
      </Button>
    </div>
  )
}

export function DateRangeFilter({
  value, onChange,
}: {
  value: { from: string; to: string }
  onChange: (next: { from: string; to: string }) => void
}) {
  const labelId = useId()
  return (
    <div className="flex items-center gap-1.5" role="group" aria-labelledby={labelId}>
      <SrOnly><span id={labelId}>Updated date range</span></SrOnly>
      <input
        type="date"
        aria-label="Updated from"
        value={value.from}
        max={value.to || undefined}
        onChange={(event) => onChange({ ...value, from: event.target.value })}
        className="h-8 rounded border border-[var(--border-2)] bg-[var(--surface)] px-2 text-[11.5px] text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      <span aria-hidden className="text-[11px] text-[var(--text-faint)]">to</span>
      <input
        type="date"
        aria-label="Updated to"
        value={value.to}
        min={value.from || undefined}
        onChange={(event) => onChange({ ...value, to: event.target.value })}
        className="h-8 rounded border border-[var(--border-2)] bg-[var(--surface)] px-2 text-[11.5px] text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
    </div>
  )
}

export function SortableHeader({
  label, active, direction, onClick,
}: {
  label: string
  active: boolean
  direction?: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sort by ${label}${active ? `, currently ${direction === 'asc' ? 'ascending' : 'descending'}` : ''}`}
      className="inline-flex cursor-pointer items-center gap-1 rounded text-inherit hover:text-[var(--brand-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      {label}
      <ChevronDown
        size={12}
        aria-hidden
        className={cn('transition-transform', active && direction === 'asc' && 'rotate-180', !active && 'opacity-30')}
      />
    </button>
  )
}

export function ColumnVisibilityMenu({
  columns, hidden, onToggle,
}: {
  columns: readonly string[]
  hidden: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  const groups: MenuGroup[] = [{
    label: 'Visible columns',
    items: columns.map((key) => ({
      id: key,
      label: key.replace(/_/g, ' '),
      selected: !hidden.has(key),
      onSelect: () => onToggle(key),
    })),
  }]
  return (
    <DropdownMenu
      label="Column visibility"
      groups={groups}
      trigger={(props) => (
        <button
          {...(props as Record<string, unknown>)}
          type="button"
          aria-label="Choose visible columns"
          title="Visible columns"
          className="inline-flex size-8 items-center justify-center rounded border border-[var(--border-2)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <Columns3 size={15} aria-hidden />
        </button>
      )}
    />
  )
}

export function DensityToggle({
  value, onChange,
}: {
  value: TableDensity
  onChange: (value: TableDensity) => void
}) {
  const next = value === 'compact' ? 'Comfortable rows' : 'Compact rows'
  return (
    <button
      type="button"
      onClick={() => onChange(value === 'compact' ? 'comfortable' : 'compact')}
      aria-label={`Use ${next.toLowerCase()}`}
      title={next}
      className="inline-flex size-8 items-center justify-center rounded border border-[var(--border-2)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <Rows3 size={15} aria-hidden />
    </button>
  )
}

export function SelectionCheckbox({
  checked, indeterminate = false, onChange, label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="size-3.5 cursor-pointer accent-[var(--brand)]"
    />
  )
}

export function BulkActionBar({
  count, onClear, onExportCsv, onExportJson,
}: {
  count: number
  onClear: () => void
  onExportCsv: () => void
  onExportJson: () => void
}) {
  if (count === 0) return null
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-2"
    >
      <p className="text-[12.5px] font-medium text-[var(--brand-text)]">
        {count} row{count === 1 ? '' : 's'} selected
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={onExportCsv} className="inline-flex items-center gap-1 rounded border border-[var(--border-2)] bg-[var(--surface)] px-2 py-1 text-[11.5px] font-medium hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
          <FileSpreadsheet size={13} aria-hidden /> CSV
        </button>
        <button type="button" onClick={onExportJson} className="inline-flex items-center gap-1 rounded border border-[var(--border-2)] bg-[var(--surface)] px-2 py-1 text-[11.5px] font-medium hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
          <FileJson size={13} aria-hidden /> JSON
        </button>
        <button type="button" onClick={onClear} aria-label="Clear selection" className="inline-flex size-7 items-center justify-center rounded hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function CopyIdButton({ id, label }: { id: string; label: string }) {
  const { announce } = useFeatures()
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      title={`Copy ${label} ID`}
      aria-label={`Copy ${label} ID`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id)
          setCopied(true)
          announce(`${label} ID copied`)
          window.setTimeout(() => setCopied(false), 1200)
        } catch {
          announce('Could not copy the ID')
        }
      }}
      className="inline-flex size-7 items-center justify-center rounded text-[var(--text-faint)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
    </button>
  )
}

export function TruncatedText({ text, max = 80 }: { text?: string | null; max?: number }) {
  const value = text ?? ''
  const truncated = value.length > max
  return (
    <span title={truncated ? value : undefined} tabIndex={truncated ? 0 : undefined} className="truncate">
      {truncated ? `${value.slice(0, max)}…` : value}
    </span>
  )
}

export function PageSizeSelect({
  value, onChange,
}: {
  value: number
  onChange: (size: number) => void
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
      Rows
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Rows per page"
        className="h-8 rounded border border-[var(--border-2)] bg-[var(--surface)] px-1.5 text-[11.5px] text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
    </label>
  )
}

export function SkipPaginationLink() {
  return (
    <a
      href="#table-pagination"
      className="sr-only focus:not-sr-only focus:mr-2 focus:rounded focus:border focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:px-2 focus:py-1 focus:text-[12px] focus:text-[var(--brand-text)]"
    >
      Skip to pagination
    </a>
  )
}

/* ── Row detail drawer ──────────────────────────────────────────────────── */

export interface DetailField {
  label: string
  value: ReactNode
}

export function RowDetailDrawer({
  open, onOpenChange, title, subtitle, fields,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  fields: DetailField[]
}) {
  useFocusRestore(open)
  useEscape(() => onOpenChange(false), open)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="min-w-0">
            <DialogTitle className="truncate">{title}</DialogTitle>
            {subtitle && <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{subtitle}</p>}
          </div>
        </DialogHeader>
        <DialogBody className="py-3">
          <dl className="divide-y divide-[var(--border)]">
            {fields.map((field) => (
              <div key={field.label} className="flex items-start justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-[12px] text-[var(--text-muted)]">{field.label}</dt>
                <dd className="min-w-0 text-right text-[12.5px] text-[var(--text-secondary)]">{field.value}</dd>
              </div>
            ))}
          </dl>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

/* ── Feature panel supporting widgets ───────────────────────────────────── */

export function FeatureAreaSummary({ counts }: { counts: Record<FeatureArea, number> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FEATURE_AREAS.map((area) => (
        <span
          key={area}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--text-tertiary)] capitalize"
        >
          {area} <span className="tabular-nums">{counts[area]}</span>
        </span>
      ))}
      <span className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--brand-text)]">
        {FEATURE_COUNT} total
      </span>
    </div>
  )
}

export function FeatureToggleRow({
  label, detail, checked, onChange,
}: {
  label: string
  detail: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-[12.5px] font-medium text-[var(--text-primary)]">{label}</span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-[var(--text-muted)]">{detail}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
      />
    </label>
  )
}

/* ── Small status helpers used by the shell ─────────────────────────────── */

export function StatusChip({
  tone, children,
}: {
  tone: 'neutral' | 'brand' | 'warning' | 'danger'
  children: ReactNode
}) {
  const classes = {
    neutral: 'border-[var(--border-2)] bg-[var(--surface-2)] text-[var(--text-tertiary)]',
    brand: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)]',
    warning: 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]',
    danger: 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold', classes[tone])}>
      {children}
    </span>
  )
}

export function RecordAvatar({ name }: { name?: string | null }) {
  return (
    <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-3)] text-[11px] font-semibold text-[var(--text-secondary)]">
      {initialsOf(name)}
    </span>
  )
}

export function RoleLabel({ role }: { role?: string | null }) {
  return <span className="capitalize">{roleLabel(role)}</span>
}

export function CacheSizeNote({ bytes }: { bytes: number }) {
  return (
    <span className="text-[10.5px] text-[var(--text-faint)]" title="Approximate cached payload size">
      {formatBytes(bytes)}
    </span>
  )
}

export function ScopeLockNote({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-faint)]">
      <LockKeyhole size={12} aria-hidden /> {label}
    </p>
  )
}

