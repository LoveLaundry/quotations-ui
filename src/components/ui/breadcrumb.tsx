import { ChevronRight } from 'lucide-react'
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
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 text-body', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={item.label} className="flex items-center gap-2">
            {index > 0 ? <ChevronRight className="h-5 w-5 text-slate-300" /> : null}
            {item.href && !isLast ? (
              <Link to={item.href} className="text-slate-500 transition hover:text-brand-600">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-slate-900' : 'text-slate-500'}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
