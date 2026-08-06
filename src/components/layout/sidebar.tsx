import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  RiDashboardLine,
  RiFileListLine,
  RiFolderOpenLine,
  RiSettings3Line,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '../brand/logo'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: RiDashboardLine, end: true },
  { to: '/quotations', label: 'Quotations', icon: RiFileListLine, end: false },
  { to: '/categories', label: 'By Client', icon: RiFolderOpenLine, end: false },
  { to: '/settings', label: 'Settings', icon: RiSettings3Line, end: false },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation()

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    if (mobileOpen) {
      onMobileClose()
    }
  }, [location.pathname])

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 232 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col sidebar-dark select-none overflow-hidden"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={onToggle}
          onMobileClose={onMobileClose}
          isMobile={false}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={onMobileClose}
            />

            {/* Sidebar */}
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col sidebar-dark shadow-2xl lg:hidden"
            >
              <SidebarContent
                collapsed={false}
                onToggle={onToggle}
                onMobileClose={onMobileClose}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

interface SidebarContentProps {
  collapsed: boolean
  onToggle: () => void
  onMobileClose: () => void
  isMobile: boolean
}

function SidebarContent({
  collapsed,
  onToggle,
  onMobileClose,
  isMobile,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-[#1F2937] px-4',
          collapsed && 'justify-center px-0'
        )}
      >
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <LogoDark />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Logo size="sm" showText={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Menu
          </p>
        )}

        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => {
              if (isMobile) {
                onMobileClose()
              }
            }}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-lg shadow-red-600/30'
                  : 'text-[#9CA3AF] hover:bg-[#374151] hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={cn(
                    'shrink-0 transition-transform duration-200',
                    isActive
                      ? 'text-white scale-110'
                      : 'text-[#6B7280] group-hover:text-white group-hover:scale-105'
                  )}
                />

                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button (Desktop only) */}
      {!isMobile && (
        <div className="border-t border-[#1F2937] p-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-[#4B5563] hover:bg-[#1F2937] hover:text-[#9CA3AF] transition cursor-pointer"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <RiArrowRightSLine size={16} />
            ) : (
              <>
                <RiArrowLeftSLine size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function LogoDark() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <Logo size="sm" showText={false} />

      <div className="min-w-0 leading-none">
        <p className="text-[14px] font-pacifico text-black tracking-tight">
          Love Laundry
        </p>
        <p className="text-[10px] text-black">
          Manager
        </p>
      </div>
    </div>
  )
}