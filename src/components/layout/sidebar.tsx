import { NavLink } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  Receipt,
  Settings,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '../brand/logo'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/quotations', label: 'Quotations', icon: Receipt, end: false },
  { to: '/categories', label: 'Categories', icon: FolderOpen, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-surface-border bg-white shadow-nav"
    >
      <div className={cn('flex h-[72px] items-center border-b border-surface-border px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="logo-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Logo size="sm" />
            </motion.div>
          ) : (
            <motion.div key="logo-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Logo size="sm" showText={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-3 text-nav transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-brand-50 font-semibold text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-9 w-9 shrink-0" strokeWidth={1.5} />
            {!collapsed ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-border p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-nav text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-7 w-7" /> : <ChevronLeft className="h-7 w-7" />}
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </motion.aside>
  )
}
