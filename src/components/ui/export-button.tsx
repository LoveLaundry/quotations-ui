import { useMemo, useCallback } from 'react'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { DropdownMenu, type MenuGroup } from './dropdown-menu'
import { toCSV, toJSON } from '../../features/feature-pack/utils'

interface ExportColumn {
  key: string
  label: string
}

interface ExportButtonProps {
  data: Record<string, any>[]
  filename: string
  columns?: ExportColumn[]
  label?: string
  className?: string
  disabled?: boolean
  /** Extra formats offered alongside CSV/JSON. */
  extra?: MenuGroup[]
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * ExportButton — one control, every format the page supports.
 * Disabled (with a reason in the tooltip) when there is nothing to export,
 * rather than letting the user click into an empty menu.
 */
export function ExportButton({
  data,
  filename,
  columns,
  label = 'Export',
  className,
  disabled,
  extra,
}: ExportButtonProps) {
  const cols = useMemo(
    () => columns || (data.length > 0 ? Object.keys(data[0]).map((k) => ({ key: k, label: k })) : []),
    [columns, data],
  )

  const exportCSV = useCallback(() => {
    if (!cols.length) return
    downloadBlob(toCSV(data, cols), `${filename}.csv`, 'text/csv;charset=utf-8;')
  }, [data, cols, filename])

  const exportJSON = useCallback(() => {
    if (!cols.length) return
    downloadBlob(toJSON(data, cols), `${filename}.json`, 'application/json')
  }, [data, cols, filename])

  const isEmpty = !disabled && data.length === 0
  const blocked = disabled || isEmpty

  const groups: MenuGroup[] = [
    {
      label: `${data.length} row${data.length === 1 ? '' : 's'}`,
      items: [
        { id: 'csv', label: 'CSV (Excel)', icon: <FileSpreadsheet />, onSelect: exportCSV, disabled: !cols.length },
        { id: 'json', label: 'JSON', icon: <FileJson />, onSelect: exportJSON, disabled: !cols.length },
      ],
    },
    ...(extra ?? []),
  ]

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu
        label="Export options"
        groups={groups}
        trigger={(p) => (
          <Button
            {...(p as any)}
            variant="secondary"
            size="sm"
            disabled={blocked}
            title={isEmpty ? 'Nothing to export' : undefined}
          >
            <Download aria-hidden />
            {label}
          </Button>
        )}
      />
    </div>
  )
}
