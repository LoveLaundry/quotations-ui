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
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const isDashboard = location.pathname === '/'

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      <TopBar title={pageTitle} sidebarCollapsed={sidebarCollapsed} showSearch={false} />

      <main
        className={cn(
          'min-h-screen pt-[72px] transition-[padding-left] duration-250',
          sidebarCollapsed ? 'pl-[80px]' : 'pl-[280px]',
        )}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet context={{ isDashboard }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
