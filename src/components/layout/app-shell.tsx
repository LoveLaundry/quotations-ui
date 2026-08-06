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

  const Toggle=()=>{
    setCollapsed(!collapsed);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => Toggle()}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopBar
        title={getPageTitle(location.pathname)}
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={() => setMobileOpen(v => !v)}
      />

      <main className={cn(
        'min-h-screen pt-16 transition-[padding-left] duration-200',
        'pl-0 lg:pl-[232px]',
        collapsed && 'lg:pl-[60px]',
      )}>
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
