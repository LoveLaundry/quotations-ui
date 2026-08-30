import { useState, useRef } from 'react'
import { useBulkScan } from '../hooks/useLinen'
import { SCAN_ACTIONS } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Zap, CheckCircle, AlertTriangle, Trash2, X } from 'lucide-react'

export default function LinenBulkScan() {
  const [codes, setCodes] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [action, setAction] = useState('receive')
  const [location, setLocation] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bulkMutation = useBulkScan()

  const addCode = () => {
    const raw = input.trim().toUpperCase()
    if (!raw) return
    // Support newline-separated or space-separated
    const newCodes = raw.split(/[\n\s]+/).filter(c => c && !codes.includes(c))
    setCodes(prev => [...prev, ...newCodes])
    setInput('')
    inputRef.current?.focus()
  }

  const removeCode = (code: string) => setCodes(prev => prev.filter(c => c !== code))
  const clearAll = () => { setCodes([]); setInput('') }

  const handleBulkScan = () => {
    if (!codes.length) return
    bulkMutation.mutate(
      { codes, action, location: location || undefined },
      {
        onSuccess: () => {
          setCodes([])
          setInput('')
        },
      }
    )
  }

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Bulk Scan' }]} />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Bulk Scan
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Process multiple linens with a single action</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left — input */}
        <div className="flex-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 block">Action</label>
                <select
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
                >
                  {SCAN_ACTIONS.map(sa => <option key={sa.value} value={sa.value}>{sa.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 block">Location (optional)</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Hotel Floor 3, Room 301"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 block">
                  Linen IDs ({codes.length} added)
                </label>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCode() }
                  }}
                  placeholder="Enter linen IDs, one per line or space-separated...&#10;e.g. LL-7K4P92 LL-82M7QF"
                  rows={4}
                  className="w-full px-3 py-2 text-sm font-mono border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={addCode} disabled={!input.trim()}>Add</Button>
                  <Button variant="outline" size="sm" onClick={clearAll} disabled={!codes.length}><Trash2 size={12} className="mr-1" />Clear All</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleBulkScan}
            disabled={codes.length === 0 || bulkMutation.isPending}
            className="w-full"
          >
            <Zap size={16} className="mr-2" />
            {bulkMutation.isPending ? 'Processing...' : `Process ${codes.length} Items`}
          </Button>
        </div>

        {/* Right — preview + results */}
        <div className="lg:w-80 space-y-4">
          {/* Queued codes */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Queued ({codes.length})</p>
              {codes.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No codes queued yet</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {codes.map((code) => (
                    <div key={code} className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded bg-[var(--surface)]">
                      <span className="text-[var(--text-primary)]">{code}</span>
                      <button onClick={() => removeCode(code)} className="text-[var(--text-muted)] hover:text-red-500"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {bulkMutation.data && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="text-sm font-bold text-green-700">{bulkMutation.data.total_processed} processed</p>
                </div>
                {bulkMutation.data.total_errors > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-600" />
                    <p className="text-sm font-bold text-orange-700">{bulkMutation.data.total_errors} errors</p>
                  </div>
                )}
                {bulkMutation.data.errors?.length > 0 && (
                  <div className="space-y-1">
                    {bulkMutation.data.errors.map((e: any) => (
                      <p key={e.linen_id} className="text-xs text-[var(--text-muted)]">{e.linen_id}: {e.error}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
