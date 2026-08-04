import { RiBellLine, RiSearchLine, RiUserLine } from 'react-icons/ri'
import { motion } from 'framer-motion'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

interface TopBarProps {
  title?: string
  sidebarCollapsed: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  showSearch?: boolean
}

export function TopBar({
  title,
  sidebarCollapsed,
  searchValue = '',
  onSearchChange,
  showSearch = true,
}: TopBarProps) {
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md transition-[left] duration-250 px-5 select-none',
        sidebarCollapsed ? 'left-[72px]' : 'left-[256px]',
      )}
    >
      {/* Page title */}
      <div className="min-w-0 flex-1 mr-4">
        {title ? (
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            className="truncate text-[17px] font-semibold text-slate-900"
            style={{ fontFamily: 'Spectral, Georgia, serif' }}
          >
            {title}
          </motion.h1>
        ) : null}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 shrink-0">
        {showSearch && onSearchChange ? (
          <div className="relative hidden sm:block w-64">
            <RiSearchLine className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search quotations..."
              className="h-9 pl-9 text-[14px]"
            />
          </div>
        ) : null}

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
          aria-label="Notifications"
        >
          <RiBellLine size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <RiUserLine size={15} />
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold text-slate-900 leading-none">Reception</p>
            <p className="text-[11px] text-slate-500 pt-0.5">Guest Accounts</p>
          </div>
        </div>
      </div>
    </header>
  )
}
