import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { CommandSearch } from '../ui/command-search'
import { OfflineSyncBar } from '../ui/offline-sync-bar'
import { SyncFab } from '../../features/sync/components/global-sync-panel'
import { PageLoader } from '../ui/loader'
import { useAuth } from '../../context/AuthContext'
import { setUnauthorizedHandler } from '../../api/interceptors'

const pageTitles: Record<string, string> = {
  '/': 'Daily Operations',
  '/today': 'Daily Operations',
  '/today-sheet': 'Today Sheet',
  '/notifications': 'Notifications',
  '/gate-passes': 'Gate Passes',
  '/gate-passes/new': 'New Gate Pass',
  '/deliveries': 'Deliveries',
  '/deliveries/new': 'New Delivery',
  '/hotel-linen-flow': 'Hotel Linen Flow',
  '/returns': 'Returns',
  '/returns/new': 'Record Return',
  '/bills': 'Bills',
  '/bills/new': 'Create Bill',
  '/statements': 'Client Statement',
  '/linen': 'Linen Dashboard',
  '/linen/inventory': 'Linen Inventory',
  '/linen/scanner': 'Scan Linen',
  '/linen/session': 'Scan Session',
  '/linen/bulk-scan': 'Bulk Scan',
  '/linen/tags': 'Tag Generator',
  '/settings': 'Settings',
  '/profile': 'My Profile',
}

function getPageTitle(pathname: string): string {
  if (pathname.match(/^\/gate-passes\/[^/]+$/)) return 'Gate Pass Details'
  if (pathname.match(/^\/deliveries\/[^/]+$/)) return 'Delivery Details'
  if (pathname.match(/^\/returns\/[^/]+$/)) return 'Return Details'
  if (pathname.match(/^\/bills\/[^/]+$/)) return 'Bill Details'
  if (pathname.match(/^\/linen\/[^/]+$/)) return 'Linen Profile'
  return pageTitles[pathname] ?? 'Love Laundry'
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, support, exitSupport } = useAuth()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [logout, navigate])

  // Ctrl/Cmd+K opens search from anywhere, including inside inputs and textareas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A new route should start at the top. Without this, a scrolled list keeps its
  // scroll offset and the next page appears to open halfway down.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // The collapsed rail is a desktop-only affordance; reset it when the viewport
  // shrinks so the mobile drawer is never hidden behind a stale collapsed state.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (!mq.matches) setCollapsed(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Platform-only sessions used to be confined to the registry; those pages are
  // gone, so every signed-in session uses the same tenant surface.

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[var(--brand)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopBar
        title={getPageTitle(location.pathname)}
        sidebarCollapsed={collapsed}
        mobileMenuOpen={mobileOpen}
        onMobileMenuToggle={() => setMobileOpen((v) => !v)}
        onOpenSearch={() => setCmdOpen(true)}
      />

      <CommandSearch open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <OfflineSyncBar />

      <SyncFab />

      {/* Platform support entry: unmissable, always one tap from exit. */}
      {support && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-center gap-x-3 gap-2 overflow-hidden bg-amber-500 px-4 text-[12.5px] font-semibold whitespace-nowrap text-amber-950 shadow-md"
        >
          <span className="min-w-0 truncate">
            Support session in {support.laundryName} — audited.
          </span>
          <button
            type="button"
            onClick={exitSupport}
            className="shrink-0 cursor-pointer rounded bg-amber-950/90 px-2.5 py-1 text-[12px] font-bold text-amber-50 transition-colors hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Exit support
          </button>
        </div>
      )}

      <main
        id="main-content"
        className={`min-h-dvh transition-[padding-left] duration-150 ease-out ${
          collapsed ? 'lg:pl-[60px]' : 'lg:pl-[236px]'
        } ${support ? 'pt-22' : 'pt-13'}`}
      >
        {/* Wide cap with a tighter margin on small screens: a 320px viewport
            gets 16px of gutter, a desktop gets a comfortable measure. */}
        <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
          <Suspense fallback={<PageLoader />}>
            {/* Keyed by route so each page arrival plays the enter motion once. */}
            <div key={location.pathname} className="route-enter">
              <Outlet />
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
