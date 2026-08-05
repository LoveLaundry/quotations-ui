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

  useEffect(() => { onMobileClose() }, [location.pathname]) // eslint-disable-line

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 232 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col sidebar-dark select-none overflow-hidden"
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mob"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col sidebar-dark shadow-2xl select-none lg:hidden"
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex h-14 shrink-0 items-center border-b border-[#1F2937] px-4',
        collapsed && 'justify-center px-0',
      )}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <LogoDark />
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
        {/* Section label */}
        {!collapsed && (
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#4B5563]">
            Navigation
          </p>
        )}
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
                  ? 'bg-[#DC2626] text-white'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={cn('shrink-0', isActive ? 'text-white' : 'text-[#6B7280]')} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#1F2937] p-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-[#4B5563] hover:bg-[#1F2937] hover:text-[#9CA3AF] transition cursor-pointer"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed
            ? <RiArrowRightSLine size={16} />
            : <><RiArrowLeftSLine size={16} /><span>Collapse</span></>
          }
        </button>
      </div>
    </div>
  )
}

/* Logo adapted for dark sidebar */
function LogoDark() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <Logo size="sm" showText={false} />
      <div className="min-w-0 leading-none">
        <p className="text-[14px] font-semibold text-white tracking-tight">Love Laundry</p>
        <p className="text-[10px] text-[#6B7280] mt-0.5">Guest Accounts</p>
      </div>
    </div>
  )
}
