import { useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Search, X } from 'lucide-react'
import {
  Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import {
  useEscape, useFeatures, useFocusRestore,
} from './hooks'
import { FEATURES, FEATURE_AREAS, searchFeatures, type FeatureArea } from './manifest'
import { FeatureAreaSummary, FeatureToggleRow } from './components'

/**
 * FeaturePanel — the manifest is a working UI, not documentation.
 *
 * Ctrl/Cmd+Shift+F opens a searchable catalogue of every delivered feature,
 * its owning file and its area. The accessibility toggles in the footer use
 * the same provider state as the top bar, so what the panel claims is exactly
 * what the running app does.
 */
export function FeaturePanel() {
  const {
    panelOpen, setPanelOpen, setShortcutsOpen,
    highContrast, largeText, reduceMotion, toggleHighContrast,
    toggleLargeText, toggleReduceMotion,
  } = useFeatures()
  const [query, setQuery] = useState('')
  const [area, setArea] = useState<FeatureArea | 'all'>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  useFocusRestore(panelOpen)
  useEscape(() => setPanelOpen(false), panelOpen)

  useEffect(() => {
    if (!panelOpen) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [panelOpen])

  const counts = useMemo(() => {
    const map = Object.fromEntries(FEATURE_AREAS.map((key) => [key, 0])) as Record<FeatureArea, number>
    for (const feature of FEATURES) map[feature.area]++
    return map
  }, [])

  const results = useMemo(
    () => searchFeatures(query).filter((feature) => area === 'all' || feature.area === area),
    [query, area],
  )

  return (
    <Dialog open={panelOpen} onOpenChange={setPanelOpen}>
      <DialogContent size="xl" className="sm:max-w-[880px]">
        <DialogHeader>
          <div className="min-w-0">
            <DialogTitle>Interface feature manifest</DialogTitle>
            <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
              {FEATURES.length} delivered features · search by name, file or area.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setPanelOpen(false); setShortcutsOpen(true) }}
            className="ml-auto"
          >
            <Keyboard size={14} aria-hidden /> Shortcuts
          </Button>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={15} aria-hidden className="absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--text-faint)]" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search features…"
                aria-label="Search features"
                className="h-9 w-full rounded border border-[var(--border-2)] bg-[var(--surface)] pr-8 pl-8 text-[12.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear feature search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </div>
            <select
              value={area}
              onChange={(event) => setArea(event.target.value as FeatureArea | 'all')}
              aria-label="Filter features by area"
              className="h-9 rounded border border-[var(--border-2)] bg-[var(--surface)] px-2 text-[12.5px] text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <option value="all">All areas</option>
              {FEATURE_AREAS.map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </div>

          <FeatureAreaSummary counts={counts} />

          <p aria-live="polite" className="text-[11.5px] text-[var(--text-faint)]">
            Showing {results.length} of {FEATURES.length}
          </p>

          <ul className="divide-y divide-[var(--border)] rounded border border-[var(--border)]">
            {results.map((feature) => {
              const Icon = feature.icon
              return (
                <li key={feature.id} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                    <Icon size={14} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[11px] font-semibold tabular-nums text-[var(--text-faint)]">
                        {String(feature.id).padStart(3, '0')}
                      </span>
                      <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">{feature.title}</span>
                      <span className="rounded-full border border-[var(--border)] px-1.5 text-[10px] text-[var(--text-faint)] capitalize">
                        {feature.area}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--text-muted)]">{feature.description}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--text-faint)]" title={feature.primaryFile}>
                      {feature.primaryFile}
                    </p>
                  </div>
                  {feature.shortcut && (
                    <kbd className="shrink-0 rounded-xs border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)]">
                      {feature.shortcut}
                    </kbd>
                  )}
                </li>
              )
            })}
            {results.length === 0 && (
              <li className="px-3 py-8 text-center text-[12.5px] text-[var(--text-muted)]">
                No features match “{query}”.
              </li>
            )}
          </ul>

          <section aria-label="Accessibility preferences" className="space-y-2 pt-1">
            <h3 className="text-[12px] font-semibold text-[var(--text-primary)]">Accessibility preferences</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <FeatureToggleRow
                label="High contrast"
                detail="Use the contrast palette for stronger separation."
                checked={highContrast}
                onChange={toggleHighContrast}
              />
              <FeatureToggleRow
                label="Large text"
                detail="Switch to the largest supported type scale."
                checked={largeText}
                onChange={toggleLargeText}
              />
              <FeatureToggleRow
                label="Reduced motion"
                detail="Remove route and overlay transitions in this browser."
                checked={reduceMotion}
                onChange={toggleReduceMotion}
              />
            </div>
          </section>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default FeaturePanel
