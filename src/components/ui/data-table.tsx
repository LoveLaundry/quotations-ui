import { cn } from '../../lib/utils'

interface Column<T> {
  key: string
  header: string
  headerAlign?: 'left' | 'center' | 'right'
  align?: 'left' | 'center' | 'right'
  width?: string
  render?: (row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  rowKey?: (row: T) => string | number
  className?: string
  headerClassName?: string
  rowClassName?: string | ((row: T, index: number) => string)
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyState,
  onRowClick,
  rowKey,
  className,
  headerClassName,
  rowClassName,
}: DataTableProps<T>) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div className={cn(
      'overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]',
      className,
    )}>
      <table className="w-full text-left border-collapse">
        <thead className={cn('bg-[var(--surface-2)] border-b border-[var(--border)]', headerClassName)}>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-4 py-3 text-[11px] font-semibold text-[var(--text-faint)] tracking-wider uppercase whitespace-nowrap',
                  alignClass[col.headerAlign || 'left'],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                {emptyState || (
                  <p className="text-center text-[13px] text-[var(--text-faint)]">No data found</p>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row) : idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'bg-[var(--surface)] transition-colors duration-100 hover:bg-[var(--surface-2)]',
                  idx % 2 === 1 && 'bg-[var(--surface-2)]',
                  onRowClick && 'cursor-pointer',
                  typeof rowClassName === 'function' ? rowClassName(row, idx) : rowClassName,
                )}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-[13px] text-[var(--text-muted)] align-middle',
                      alignClass[col.align || 'left'],
                    )}
                  >
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
