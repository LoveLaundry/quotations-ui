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
      'overflow-x-auto rounded-xl border border-[#E4E7EC] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
      className,
    )}>
      <table className="w-full text-left border-collapse">
        <thead className={cn('bg-[#F9FAFB] border-b border-[#E4E7EC]', headerClassName)}>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-4 py-3 text-[11px] font-semibold text-[#98A2B3] tracking-wider uppercase whitespace-nowrap',
                  alignClass[col.headerAlign || 'left'],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F2F4F7]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                {emptyState || (
                  <p className="text-center text-[13px] text-[#9CA3AF]">No data found</p>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row) : idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'bg-white transition-colors duration-100 hover:bg-[#FAFAFA]',
                  idx % 2 === 1 && 'bg-[#FAFAFA]',
                  onRowClick && 'cursor-pointer',
                  typeof rowClassName === 'function' ? rowClassName(row, idx) : rowClassName,
                )}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-[13px] text-[#475467] align-middle',
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
