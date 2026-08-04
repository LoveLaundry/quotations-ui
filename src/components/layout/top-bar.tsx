import { Bell, Search, User } from 'lucide-react'
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
        'fixed top-0 right-0 z-30 flex h-[72px] items-center justify-between border-b border-surface-border bg-white/80 px-6 backdrop-blur-md transition-[left] duration-250',
        sidebarCollapsed ? 'left-[80px]' : 'left-[280px]',
      )}
    >
      <div className="min-w-0 flex-1">
        {title ? (
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="truncate text-section text-slate-900"
          >
            {title}
          </motion.h1>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && onSearchChange ? (
          <div className="relative hidden w-80 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-7 w-7 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search quotations..."
              className="h-12 pl-12"
            />
          </div>
        ) : null}

        <button
          type="button"
          className="relative flex h-12 w-12 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-8 w-8" strokeWidth={1.5} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-600" />
        </button>

        <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-slate-50/80 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <User className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="hidden sm:block">
            <p className="text-body font-semibold text-slate-900">Reception</p>
            <p className="text-sm text-slate-500">Front Desk</p>
          </div>
        </div>
      </div>
    </header>
  )
}
