import { RiBellLine, RiMenuLine, RiUserLine } from 'react-icons/ri'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface TopBarProps {
  title?: string
  sidebarCollapsed: boolean
  showSearch?: boolean
  onMobileMenuToggle: () => void
}

export function TopBar({ title, sidebarCollapsed, onMobileMenuToggle }: TopBarProps) {
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
        >
          <RiBellLine size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
        </button>

        <div className="flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 cursor-pointer hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all duration-200 shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] text-white shadow-sm">
            <RiUserLine size={14} />
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[13px] font-semibold text-[#111827]">Reception</p>
            <p className="text-[11px] text-[#6B7280] mt-1">Guest Accounts</p>
          </div>
        </div>
      </div>
    </header>
  )
}
