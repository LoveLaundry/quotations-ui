import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PaginationProps {
  total: number
  limit: number
  offset: number
  onChange: (offset: number) => void
  className?: string
}

export function Pagination({ total, limit, offset, onChange, className }: PaginationProps) {
  if (total <= 0) return null

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)
  const start = offset + 1
  const end = Math.min(offset + limit, total)

  const pageNumbers: (number | '...')[] = []
  const maxVisible = 5

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (currentPage > 3) pageNumbers.push('...')
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)
    if (currentPage < totalPages - 2) pageNumbers.push('...')
    if (totalPages > 1) pageNumbers.push(totalPages)
  }

  return (
    <div className={cn('flex items-center justify-between flex-wrap gap-3', className)}>
      <p className="text-[12px] text-[var(--text-muted)]">
        Showing <span className="font-semibold text-[var(--text-secondary)]">{start}</span>–<span className="font-semibold text-[var(--text-secondary)]">{end}</span> of <span className="font-semibold text-[var(--text-secondary)]">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, offset - limit))}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={14} />
        </button>
        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-[12px] text-[var(--text-faint)]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange((p - 1) * limit)}
              className={cn(
                'flex h-8 min-w-[32px] items-center justify-center rounded-lg text-[12px] font-medium border transition',
                p === currentPage
                  ? 'bg-[blue-600] text-white border-[blue-600]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]',
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min((totalPages - 1) * limit, offset + limit))}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
