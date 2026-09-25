import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  backTo?: string
  className?: string
}

export function PageHeader({ title, subtitle, actions, backTo, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#374151] transition"
          >
            <ChevronLeft size={16} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold text-[#111827] leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-[#6B7280] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}
