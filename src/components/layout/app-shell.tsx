import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { cn } from '../../lib/utils'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/quotations': 'Quotations',
  '/quotations/new': 'New Quotation',
  '/categories': 'Categories',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  if (pathname.match(/^\/quotations\/[^/]+\/edit$/)) return 'Edit Quotation'
  if (pathname.match(/^\/quotations\/[^/]+$/)) return 'Quotation Details'
  return pageTitles[pathname] ?? 'Guest Accounts'
}

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopBar
        title={pageTitle}
        sidebarCollapsed={sidebarCollapsed}
        onMobileMenuToggle={() => setMobileOpen((v) => !v)}
      />

      <main
        className={cn(
          'min-h-screen pt-14 transition-[padding-left] duration-200',
          'pl-0 lg:pl-60',
          sidebarCollapsed && 'lg:pl-16',
        )}
      >
        <div className="mx-auto max-w-[1320px] px-4 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
