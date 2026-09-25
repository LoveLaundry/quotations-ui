import { RiArrowRightSLine } from 'react-icons/ri'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface BreadcrumbItem { label: string; href?: string }
interface BreadcrumbProps { items: BreadcrumbItem[]; className?: string }

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-0.5', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-0.5">
            {i > 0 && <RiArrowRightSLine className="h-3.5 w-3.5 text-[var(--text-faint)]" />}
            {item.href && !isLast ? (
              <Link to={item.href} className="text-[12px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast
                ? 'text-[12px] font-medium text-[var(--text-secondary)]'
                : 'text-[12px] text-[var(--text-faint)]'
              }>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
