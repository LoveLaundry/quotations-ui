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

function getPageTitle(p: string): string {
  if (p.match(/^\/quotations\/[^/]+\/edit$/)) return 'Edit Quotation'
  if (p.match(/^\/quotations\/[^/]+$/)) return 'Quotation Details'
  return pageTitles[p] ?? 'Guest Accounts'
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopBar
        title={getPageTitle(location.pathname)}
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={() => setMobileOpen(v => !v)}
      />

      <main className={cn(
        'min-h-screen pt-14 transition-[padding-left] duration-200',
        'pl-0 lg:pl-[232px]',
        collapsed && 'lg:pl-[60px]',
      )}>
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
