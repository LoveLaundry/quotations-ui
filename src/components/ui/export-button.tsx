import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

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

function toCSV(data: Record<string, any>[], columns: ExportColumn[]): string {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

function toJSON(data: Record<string, any>[], columns: ExportColumn[]): string {
  const filtered = data.map(row => {
    const obj: Record<string, any> = {}
    for (const c of columns) obj[c.label] = row[c.key]
    return obj
  })
  return JSON.stringify(filtered, null, 2)
}

export function ExportButton({ data, filename, columns, label = 'Export', className }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const cols = useMemo(() => columns || (data.length > 0
    ? Object.keys(data[0]).map(k => ({ key: k, label: k }))
    : []), [columns, data])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleCSV = useCallback(() => {
    if (!cols.length) return
    downloadBlob(toCSV(data, cols), `${filename}.csv`, 'text/csv;charset=utf-8;')
    setOpen(false)
  }, [data, cols, filename])

  const handleJSON = useCallback(() => {
    if (!cols.length) return
    downloadBlob(toJSON(data, cols), `${filename}.json`, 'application/json')
    setOpen(false)
  }, [data, cols, filename])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-[var(--border)] bg-[var(--surface)] rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition"
      >
        <Download size={14} /> {label} <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-overlay)] py-1 min-w-[160px]">
          <button onClick={handleCSV} className="w-full text-left px-4 py-2 text-[13px] hover:bg-[var(--surface-2)] transition font-medium text-[var(--text-secondary)]">
            Export CSV
          </button>
          <button onClick={handleJSON} className="w-full text-left px-4 py-2 text-[13px] hover:bg-[var(--surface-2)] transition font-medium text-[var(--text-secondary)]">
            Export JSON
          </button>
        </div>
      )}
    </div>
  )
}
