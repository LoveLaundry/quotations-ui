import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, List, SignOut, User, UserCircle, PaperPlaneTilt, FileText } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../features/quotations/hooks/useNotifications'
import { NotificationDetailDialog } from '../../features/quotations/components/notification-detail-dialog'
import type { Quotation } from '../../types/quotation'
import type { GatePassPendingEntry, NotificationType } from '../../types/notification'

interface TopBarProps {
  title?: string
  sidebarCollapsed: boolean
  showSearch?: boolean
  onMobileMenuToggle: () => void
}

export function TopBar({ title, sidebarCollapsed, onMobileMenuToggle }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<{ item: Quotation | GatePassPendingEntry; type: NotificationType } | null>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const { totalCount, notificationItems, isLoading } = useNotifications()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleNotificationItemClick = (item: Quotation | GatePassPendingEntry, type: NotificationType) => {
    setSelectedNotification({ item, type })
  }

  const handleNotificationGroupClick = (route: string) => {
    setShowNotifications(false)
    navigate(route)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user?.user_name
    ? user.user_name.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <>
      <header
        className={cn(
        'fixed top-0 right-0 z-30 h-16',
        'flex items-center justify-between px-6',
        'bg-white/80 backdrop-blur-md border-b border-[var(--border)]',
        'transition-[left] duration-200 select-none',
        'shadow-sm',
        sidebarCollapsed ? 'left-0 lg:left-[60px]' : 'left-0 lg:left-[232px]',
      )}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-all duration-200 lg:hidden"
          aria-label="Menu"
        >
          <List size={20} />
        </button>

        {title && (
          <motion.p
            key={title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight truncate"
          >
            {title}
          </motion.p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(v => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-2)] transition-all duration-200 cursor-pointer shadow-sm"
            aria-label={isLoading ? 'Loading notifications...' : `Notifications${totalCount > 0 ? ` (${totalCount})` : ''}`}
            title={isLoading ? 'Loading notifications...' : totalCount > 0 ? `${totalCount} notification${totalCount !== 1 ? 's' : ''}` : 'No new notifications'}
          >
            <Bell size={18} />
            {totalCount > 0 && !isLoading && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] text-white text-[10px] font-bold border-2 border-white">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
            {isLoading && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-white text-[10px] font-bold border-2 border-white animate-pulse">
                …
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-96 rounded-xl border bg-[var(--surface)] shadow-[0_16px_40px_-4px_rgba(16,24,40,0.15)] overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                      Notifications {totalCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold">
                          {totalCount}
                        </span>
                      )}
                    </h3>
                    {totalCount > 0 && (
                      <button
                        onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                        className="text-[11px] font-medium text-[#DC2626] hover:text-[#B91C1C] hover:underline"
                      >
                        View all
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-8 text-center text-[var(--text-faint)]">
                        <div className="animate-spin inline-block w-5 h-5 border-2 border-[#16A34A] border-t-transparent rounded-full mb-2" />
                        <p className="text-[13px]">Loading notifications...</p>
                      </div>
                    ) : notificationItems.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[var(--text-faint)]">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-[13px] font-medium text-[var(--text-primary)]">No notifications</p>
                        <p className="text-[11px] text-[var(--text-faint)] mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--border)] p-2">
                        {notificationItems.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-3 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                            onClick={() => handleNotificationGroupClick('/notifications')}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                                 notification.type === 'gatepass_pending'
                                  ? 'bg-[#FEF2F2] text-[#DC2626]' 
                                  : 'bg-[#F0FDF4] text-[#16A34A]'
                              }`}>
                                 {notification.type === 'gatepass_pending' ? (
                                   <PaperPlaneTilt size={16} />
                                 ) : (
                                   <FileText size={16} />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                                  {notification.title}
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                                  {notification.message}
                                </p>
                                 {((notification.type === 'gatepass_pending' ? notification.gatePassItems : notification.quotations) ?? []).length > 0 && (
                                   <div className="mt-2 flex flex-wrap gap-1">
                                     {((notification.type === 'gatepass_pending' ? notification.gatePassItems : notification.quotations) ?? []).slice(0, 3).map((item: Quotation | GatePassPendingEntry, idx: number) => (
                                       <button
                                         key={idx}
                                         onClick={(e) => {
                                           e.stopPropagation()
                                           handleNotificationItemClick(item, notification.type)
                                         }}
                                         className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface-2)] text-[10px] font-medium text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                                        >
                                          {item.client_name}
                                        </button>
                                      ))}
                                      {((notification.type === 'gatepass_pending' ? notification.gatePassItems : notification.quotations) ?? []).length > 3 && (
                                        <button
                             onClick={() => handleNotificationGroupClick('/notifications')}
                                         className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--surface-2)] text-[10px] font-medium text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                                       >
                                         +{((notification.type === 'gatepass_pending' ? notification.gatePassItems : notification.quotations) ?? []).length - 3} more
                                       </button>
                                     )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 cursor-pointer hover:bg-[var(--surface-hover)] hover:border-[var(--border-2)] transition-all duration-200 shadow-sm max-w-[220px]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white shadow-sm text-[11px] font-bold shrink-0">
              {user?.user_dp ? (
                <img src={user.user_dp} alt={user.user_name} className="h-full w-full object-cover" />
              ) : user ? (
                initials
              ) : (
                <User size={14} />
              )}
            </div>
            <div className="hidden sm:block leading-none text-left min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                {user?.user_name ?? 'User'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 capitalize truncate">
                {user?.role_id?.toLowerCase() ?? 'staff'}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border bg-[var(--surface)] shadow-[0_16px_40px_-4px_rgba(16,24,40,0.15)] py-1.5"
                >
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                      {user?.user_name ?? 'User'}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate" title={user?.email ?? user?.auth_id ?? ''}>
                      {user?.email ?? user?.auth_id ?? ''}
                    </p>
                  </div>

                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false)
                        navigate('/profile')
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                    >
                      <UserCircle size={16} />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <SignOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
      <NotificationDetailDialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
        data={selectedNotification?.item ?? null}
        type={selectedNotification?.type ?? 'gatepass_pending'}
      />
    </>
  )
}