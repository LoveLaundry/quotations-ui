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
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <TopBar title={pageTitle} sidebarCollapsed={sidebarCollapsed} showSearch={false} />

      <main
        className={cn(
          'min-h-screen pt-16 transition-[padding-left] duration-250',
          sidebarCollapsed ? 'pl-[72px]' : 'pl-[256px]',
        )}
      >
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet context={{ isDashboard }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
