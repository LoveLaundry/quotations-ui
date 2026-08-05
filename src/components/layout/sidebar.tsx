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
  { to: '/categories', label: 'Categories', icon: RiFolderOpenLine, end: false },
  { to: '/settings', label: 'Settings', icon: RiSettings3Line, end: false },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()

  useEffect(() => {
    onMobileClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col bg-white border-r border-slate-200 select-none overflow-hidden"
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-white border-r border-slate-200 shadow-xl select-none lg:hidden"
          >
            <SidebarContent collapsed={false} onToggle={onToggle} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <>
      {/* Logo row */}
      <div className={cn('flex h-14 shrink-0 items-center border-b border-slate-100 px-4', collapsed && 'justify-center px-2')}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <Logo size="sm" />
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <Logo size="sm" showText={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-100',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse */}
      <div className="border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <RiArrowRightSLine size={16} /> : <><RiArrowLeftSLine size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </>
  )
}
