import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiBellLine, RiMenuLine, RiLogoutBoxLine, RiUserLine, RiUserSettingsLine, RiSendPlaneLine, RiFileTextLine } from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../features/quotations/hooks/useNotifications'
import { NotificationDetailDialog } from '../../features/quotations/components/notification-detail-dialog'
import type { Quotation } from '../../types/quotation'

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
  const [selectedNotification, setSelectedNotification] = useState<{ item: Quotation; type: 'quotation_pending' | 'quotation_accepted' } | null>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const { totalCount, notificationItems, isLoading } = useNotifications()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleNotificationItemClick = (item: Quotation, type: 'quotation_pending' | 'quotation_accepted') => {
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
        'bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]',
        'transition-[left] duration-200 select-none',
        'shadow-sm',
        sidebarCollapsed ? 'left-0 lg:left-[60px]' : 'left-0 lg:left-[232px]',
      )}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-all duration-200 lg:hidden"
          aria-label="Menu"
        >
          <RiMenuLine size={20} />
        </button>

        {title && (
          <motion.p
            key={title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-[15px] font-semibold text-[#111827] tracking-tight truncate"
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
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] hover:border-[#D1D5DB] transition-all duration-200 cursor-pointer shadow-sm"
            aria-label={isLoading ? 'Loading notifications...' : `Notifications${totalCount > 0 ? ` (${totalCount})` : ''}`}
            title={isLoading ? 'Loading notifications...' : totalCount > 0 ? `${totalCount} notification${totalCount !== 1 ? 's' : ''}` : 'No new notifications'}
          >
            <RiBellLine size={18} />
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
                  className="absolute right-0 top-full mt-2 z-50 w-96 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_16px_40px_-4px_rgba(16,24,40,0.15)] overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[#F2F4F7] flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-[#101828]">
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
                      <div className="px-4 py-8 text-center text-[#98A2B3]">
                        <div className="animate-spin inline-block w-5 h-5 border-2 border-[#16A34A] border-t-transparent rounded-full mb-2" />
                        <p className="text-[13px]">Loading notifications...</p>
                      </div>
                    ) : notificationItems.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[#98A2B3]">
                        <RiBellLine size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-[13px] font-medium text-[#101828]">No notifications</p>
                        <p className="text-[11px] text-[#98A2B3] mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#F2F4F7] p-2">
                        {notificationItems.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-3 py-3 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                            onClick={() => handleNotificationGroupClick('/notifications')}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                                notification.type === 'quotation_pending' 
                                  ? 'bg-[#FEF2F2] text-[#DC2626]' 
                                  : 'bg-[#F0FDF4] text-[#16A34A]'
                              }`}>
                                {notification.type === 'quotation_pending' ? (
                                  <RiSendPlaneLine size={16} />
                                ) : (
                                  <RiFileTextLine size={16} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#101828] truncate">
                                  {notification.title}
                                </p>
                                <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">
                                  {notification.message}
                                </p>
                                {notification.items.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {notification.items.slice(0, 3).map((item, idx) => (
                                      <button
                                        key={idx}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleNotificationItemClick(item as Quotation, notification.type)
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F4F6] text-[10px] font-medium text-[#374151] border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                                      >
                                        {item.client_name}
                                      </button>
                                    ))}
                                    {notification.items.length > 3 && (
                                      <button
                            onClick={() => handleNotificationGroupClick('/notifications')}
                                        className="inline-flex items-center px-2 py-0.5 rounded bg-[#F3F4F6] text-[10px] font-medium text-[#6B7280] border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                                      >
                                        +{notification.items.length - 3} more
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
            className="flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 cursor-pointer hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all duration-200 shadow-sm max-w-[220px]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white shadow-sm text-[11px] font-bold shrink-0">
              {user?.user_dp ? (
                <img src={user.user_dp} alt={user.user_name} className="h-full w-full object-cover" />
              ) : user ? (
                initials
              ) : (
                <RiUserLine size={14} />
              )}
            </div>
            <div className="hidden sm:block leading-none text-left min-w-0">
              <p className="text-[13px] font-semibold text-[#111827] truncate">
                {user?.user_name ?? 'User'}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5 capitalize truncate">
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
                  className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_16px_40px_-4px_rgba(16,24,40,0.15)] py-1.5"
                >
                  <div className="px-4 py-3 border-b border-[#F2F4F7]">
                    <p className="text-[13px] font-semibold text-[#101828] truncate">
                      {user?.user_name ?? 'User'}
                    </p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5 truncate" title={user?.email ?? user?.auth_id ?? ''}>
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
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#344054] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    >
                      <RiUserSettingsLine size={16} />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <RiLogoutBoxLine size={16} />
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
        quotation={selectedNotification?.item ?? null}
        type={selectedNotification?.type ?? 'quotation_pending'}
      />
    </>
  )
}