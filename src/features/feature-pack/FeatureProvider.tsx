import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import {
  FeatureContext, type FeatureContextValue, type TableDensity,
  useDocumentTitle, useFeatures, usePersistentState,
} from './hooks'
import {
  BackToTop, LiveAnnouncer, RouteProgress, ShortcutHelpDialog, SkipLink,
} from './components'
import { FeaturePanel } from './FeaturePanel'

const isTypingTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/** Global UI state for the feature pack. Mounted once, above the router. */
export function FeatureProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, fontSize, setFontSize } = useTheme()
  const [panelOpen, setPanelOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [routeTitle, setRouteTitle] = useState('')
  const [progress, setProgress] = useState(0)
  const [reduceMotion, setReduceMotion] = usePersistentState('feature-reduce-motion', false)
  const [density, setDensity] = usePersistentState<TableDensity>('feature-table-density', 'comfortable')
  const timers = useRef<number[]>([])

  const highContrast = theme === 'contrast' || theme === 'contrast-dark'
  const largeText = fontSize === 'xxxl'

  const toggleHighContrast = useCallback(() => {
    const dark = theme === 'dark' || theme === 'nightblue' || theme === 'contrast-dark'
    setTheme(highContrast ? (dark ? 'dark' : 'light') : dark ? 'contrast-dark' : 'contrast')
  }, [theme, highContrast, setTheme])

  const toggleLargeText = useCallback(() => {
    setFontSize(largeText ? 'md' : 'xxxl')
  }, [largeText, setFontSize])

  const toggleReduceMotion = useCallback(() => setReduceMotion((value) => !value), [setReduceMotion])

  const announce = useCallback((message: string) => setAnnouncement(message), [])

  const startRoute = useCallback(() => {
    setProgress(28)
    const a = window.setTimeout(() => setProgress(68), 90)
    timers.current.push(a)
  }, [])

  const finishRoute = useCallback(() => {
    setProgress(100)
    const timer = window.setTimeout(() => setProgress(0), 180)
    timers.current.push(timer)
  }, [])

  useEffect(() => () => {
    for (const timer of timers.current) window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-motion', reduceMotion ? 'true' : 'false')
  }, [reduceMotion])

  useEffect(() => {
    if (!announcement) return
    const timer = window.setTimeout(() => setAnnouncement(''), 5000)
    return () => window.clearTimeout(timer)
  }, [announcement])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault()
        setCommandOpen(true)
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'f') {
        event.preventDefault()
        setPanelOpen((open) => !open)
        return
      }
      if (event.altKey && key === 'r') {
        event.preventDefault()
        window.dispatchEvent(new Event('feature:refresh-page'))
        return
      }
      if (event.key === 'Escape') {
        if (panelOpen) setPanelOpen(false)
        else if (shortcutsOpen) setShortcutsOpen(false)
        else if (commandOpen) setCommandOpen(false)
        return
      }
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault()
        setShortcutsOpen(true)
      } else if (event.key === '/') {
        const input = document.querySelector<HTMLInputElement>('[data-feature-search="true"]')
        if (input) {
          event.preventDefault()
          input.focus()
          input.select()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen, shortcutsOpen, commandOpen])

  const value = useMemo<FeatureContextValue>(() => ({
    highContrast,
    largeText,
    reduceMotion,
    density,
    panelOpen,
    shortcutsOpen,
    commandOpen,
    announcement,
    routeTitle,
    progress,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    setDensity,
    setPanelOpen,
    setShortcutsOpen,
    setCommandOpen,
    announce,
    setRouteTitle,
    startRoute,
    finishRoute,
  }), [
    highContrast, largeText, reduceMotion, density, panelOpen, shortcutsOpen,
    commandOpen, announcement, routeTitle, progress, toggleHighContrast,
    toggleLargeText, toggleReduceMotion, setDensity, announce, startRoute, finishRoute,
  ])

  return (
    <FeatureContext.Provider value={value}>
      {children}
      <SkipLink />
      <RouteProgress />
      <LiveAnnouncer />
      <BackToTop />
      <ShortcutHelpDialog />
      <FeaturePanel />
    </FeatureContext.Provider>
  )
}

/**
 * Sits inside the router so route changes can drive the title, progress bar
 * and live announcement without the provider needing router context.
 */
export function FeatureRouteBridge({ title }: { title: string }) {
  const location = useLocation()
  const { startRoute, finishRoute, announce } = useFeatures()
  useDocumentTitle(title)

  useEffect(() => {
    startRoute()
    const timer = window.setTimeout(finishRoute, 220)
    announce(`Opened ${title || 'page'}`)
    return () => window.clearTimeout(timer)
  }, [location.pathname, title, startRoute, finishRoute, announce])

  return null
}
