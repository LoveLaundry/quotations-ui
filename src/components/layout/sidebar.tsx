import { NavLink } from 'react-router-dom'
import { RiDashboardLine, RiFileListLine, RiFolderOpenLine, RiSettings3Line, RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri'
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
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white shadow-sm select-none overflow-hidden"
    >
      {/* Logo */}
      <div className={cn('flex h-16 shrink-0 items-center border-b border-slate-100 px-4', collapsed && 'justify-center px-2')}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Logo size="sm" />
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Logo size="sm" showText={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-150',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <RiArrowRightSLine size={20} /> : <><RiArrowLeftSLine size={20} /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  )
}
