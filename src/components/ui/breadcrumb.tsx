import { RiArrowRightSLine } from 'react-icons/ri'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1">
            {index > 0 && <RiArrowRightSLine className="h-3.5 w-3.5 text-slate-300" />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[12px] font-medium text-slate-700' : 'text-[12px] text-slate-400'}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
