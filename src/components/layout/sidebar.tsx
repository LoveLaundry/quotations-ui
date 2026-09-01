import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  House,
  ChartBar,
  ClipboardText,
  Truck,
  UsersThree,
  CurrencyCircleDollar,
  FileText,
  FolderOpen,
  GearSix,
  Users,
  Database,
  CaretLeft,
  CaretRight,
  ChatCircleDots,
  Scan,
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '../brand/logo'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: House, end: true },
      { to: '/business-dashboard', label: 'Business Intelligence', icon: ChartBar, end: false },
      { to: '/live-chat', label: 'Live Chat', icon: ChatCircleDots, end: false, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/gate-passes', label: 'Gate Passes', icon: ClipboardText, end: false, permission: 'view_gate_passes' },
      { to: '/deliveries', label: 'Deliveries', icon: Truck, end: false, permission: 'view_deliveries' },
      { to: '/returns', label: 'Returns', icon: Truck, end: false, permission: 'view_gate_passes' },
      { to: '/dispatch', label: 'Dispatch', icon: Truck, end: false, indent: true },
      { to: '/workers', label: 'Staff Management', icon: Users, end: true },
      { to: '/workers/daily-tasks', label: 'Staff Daily Tasks', icon: UsersThree, end: false, indent: true },
      { to: '/bills', label: 'Bills', icon: CurrencyCircleDollar, end: false, permission: 'view_bills' },
      { to: '/invoices/new', label: 'Invoices', icon: FileText, end: false, permission: 'view_bills' },
    ],
  },
  {
    label: 'Linen Tracking',
    items: [
      { to: '/linen', label: 'Dashboard', icon: House, end: false },
      { to: '/linen/inventory', label: 'Inventory', icon: ClipboardText, end: false },
      { to: '/linen/scanner', label: 'Scan Linen', icon: Scan, end: false },
      { to: '/linen/bulk-scan', label: 'Bulk Scan', icon: Scan, end: false },
      { to: '/linen/tags', label: 'Tag Generator', icon: FileText, end: false },
    ],
  },
  {
    label: 'Contracts',
    items: [
      { to: '/quotations', label: 'Quotations', icon: FileText, end: false, permission: 'view_quotations' },
      { to: '/categories', label: 'By Client', icon: FolderOpen, end: false, permission: 'view_clients' },
      { to: '/customers', label: 'Customers 360', icon: Users, end: false },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/reports', label: 'Reports', icon: ChartBar, end: false, permission: 'view_reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: GearSix, end: false },
    ],
  },
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

  useEffect(() => {
    if (mobileOpen) {
      onMobileClose()
    }
  }, [location.pathname])

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 60 : 240 }}
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

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col sidebar-dark shadow-2xl lg:hidden"
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
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const isAdmin = user?.role_id?.toUpperCase() === 'ADMIN'

  const systemItems = [
    { to: '/settings', label: 'Settings', icon: GearSix, end: false },
    ...(isAdmin ? [
      { to: '/users', label: 'Users', icon: Users, end: false },
      { to: '/database-sync', label: 'Database Sync', icon: Database, end: false },
    ] : []),
  ]

  const navGroupsWithRole = navGroups.map(g =>
    g.label === 'System' ? { ...g, items: systemItems } : g
  ).map(g => ({
    ...g,
    items: g.items.filter(
      (item: any) =>
        (!item.permission || hasPermission(item.permission)) &&
        (!item.roles || (user?.role_id && item.roles.includes(String(user.role_id).toUpperCase()))),
    )
  })).filter(g => g.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)]">
      <div
        className={cn(
          'flex h-[52px] shrink-0 items-center border-b px-4',
          'border-[var(--sidebar-border)]',
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

      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5">
        {navGroupsWithRole.map(({ label: groupLabel, items }) => (
          <div key={groupLabel}>
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--sidebar-label)]">
                {groupLabel}
              </p>
            )}
            <div className="space-y-px">
              {items.map(({ to, label, icon: Icon, end, indent }: { to: string; label: string; icon: any; end?: boolean; indent?: boolean }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => {
                    if (isMobile) onMobileClose()
                  }}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                      collapsed && 'justify-center px-2',
                      indent && !collapsed && 'pl-9',
                      isActive
                        ? 'bg-[#DC2626] text-white'
                        : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        weight={isActive ? 'fill' : 'regular'}
                        className={cn(
                          'shrink-0 transition-colors duration-150',
                          isActive
                            ? 'text-white'
                            : 'text-[var(--sidebar-label)] group-hover:text-[var(--sidebar-hover-text)]'
                        )}
                      />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {!isMobile && (
        <div className="border-t p-2 border-[var(--sidebar-border)]">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-[var(--sidebar-label)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)] transition cursor-pointer"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <CaretRight size={14} />
            ) : (
              <>
                <CaretLeft size={14} />
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
        <p className="text-[14px] font-pacifico text-white tracking-tight">
          Love Laundry
        </p>
        <p className="text-[10px] text-[var(--sidebar-label)]">
          Manager
        </p>
      </div>
    </div>
  )
}
