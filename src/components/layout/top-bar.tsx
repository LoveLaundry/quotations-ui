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
        'fixed top-0 right-0 z-30 h-14',
        'flex items-center justify-between px-5',
        'bg-white border-b border-[#E4E7EC]',
        'transition-[left] duration-200 select-none',
        sidebarCollapsed ? 'left-0 lg:left-[60px]' : 'left-0 lg:left-[232px]',
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition lg:hidden"
          aria-label="Menu"
        >
          <RiMenuLine size={17} />
        </button>

        {title && (
          <motion.p
            key={title}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[14px] font-semibold text-[#101828] tracking-tight truncate"
          >
            {title}
          </motion.p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification bell */}
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7EC] bg-white text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151] transition cursor-pointer"
          aria-label="Notifications"
        >
          <RiBellLine size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-[1.5px] ring-white" />
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2 rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-1.5 cursor-pointer hover:bg-[#F9FAFB] transition">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600 text-white">
            <RiUserLine size={12} />
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[12px] font-semibold text-[#101828]">Reception</p>
            <p className="text-[10px] text-[#98A2B3] mt-0.5">Guest Accounts</p>
          </div>
        </div>
      </div>
    </header>
  )
}
