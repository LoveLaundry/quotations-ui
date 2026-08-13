import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiBellLine, RiMenuLine, RiLogoutBoxLine, RiUserLine, RiUserSettingsLine } from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

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

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.user_name
    ? user.user_name.slice(0, 2).toUpperCase()
    : 'U'

  return (
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
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] hover:border-[#D1D5DB] transition-all duration-200 cursor-pointer shadow-sm"
          aria-label="Notifications"
          title="No new notifications"
        >
          <RiBellLine size={18} />
        </button>

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
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_16px_40px_-4px_rgba(16,24,40,0.15)] py-1.5"
                >
                  {/* User info header */}
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
  )
}
