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
        'fixed top-0 right-0 z-30 flex h-14 items-center justify-between px-4',
        'border-b border-slate-200 bg-white/95 backdrop-blur-sm',
        'transition-[left] duration-200 select-none',
        sidebarCollapsed ? 'left-0 lg:left-16' : 'left-0 lg:left-60',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition lg:hidden"
          aria-label="Menu"
        >
          <RiMenuLine size={17} />
        </button>

        {title && (
          <motion.p
            key={title}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="truncate text-[14px] font-semibold text-slate-800 tracking-tight"
          >
            {title}
          </motion.p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
          aria-label="Notifications"
        >
          <RiBellLine size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-red-600">
            <RiUserLine size={13} />
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[12px] font-semibold text-slate-800">Reception</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Guest Accounts</p>
          </div>
        </div>
      </div>
    </header>
  )
}
