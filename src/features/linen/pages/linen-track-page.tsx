import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import billsApi from '../../../api/bills-api'

interface TrackInfo {
  linen_id: string
  category?: string
  item_type?: string
  status?: string
  condition?: string
  wash_count?: number
  last_scanned_date?: string | null
  updated_at?: string | null
}

const STATUS_LABEL: Record<string, string> = {
  IN_STOCK: 'In stock',
  AT_CLIENT: 'With client',
  COLLECTED: 'Collected',
  AT_LAUNDRY: 'At laundry',
  WASHING: 'Washing',
  DRYING: 'Drying',
  PRESSING: 'Pressing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  MISSING: 'Missing',
  DAMAGED: 'Damaged',
  RETIRED: 'Retired',
}

export default function LinenTrackPage() {
  const { code } = useParams<{ code: string }>()
  const [info, setInfo] = useState<TrackInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    billsApi
      .get<TrackInfo>(`/linens/track/${encodeURIComponent((code ?? '').toUpperCase())}`)
      .then(r => { if (!cancelled) setInfo(r.data) })
      .catch((e: any) => {
        if (cancelled) return
        const status = e?.response?.status
        setError(status === 404 ? 'That tag was not found. Check the code and try again.' : 'Could not load tag status. Please try again.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [code])

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#98A2B3]">Love Laundry</p>
        <h1 className="mt-1 text-[18px] font-bold text-[#101828]">Garment tag</h1>

        {loading && <p className="mt-6 text-[13px] text-[#98A2B3]">Looking up {code}…</p>}
        {error && <p className="mt-6 text-[13px] text-[#DC2626]">{error}</p>}

        {info && !loading && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[15px] font-bold text-[#101828]">{info.linen_id}</span>
              <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
                {STATUS_LABEL[info.status ?? ''] ?? info.status ?? 'Unknown'}
              </span>
            </div>
            <dl className="space-y-2 text-[13px]">
              {info.item_type && <div className="flex justify-between"><dt className="text-[#98A2B3]">Item</dt><dd className="font-medium">{info.item_type}</dd></div>}
              {info.category && <div className="flex justify-between"><dt className="text-[#98A2B3]">Category</dt><dd className="font-medium">{info.category}</dd></div>}
              {info.condition && <div className="flex justify-between"><dt className="text-[#98A2B3]">Condition</dt><dd className="font-medium">{info.condition}</dd></div>}
              {typeof info.wash_count === 'number' && <div className="flex justify-between"><dt className="text-[#98A2B3]">Wash cycles</dt><dd className="font-medium tabular-nums">{info.wash_count}</dd></div>}
              {info.last_scanned_date && <div className="flex justify-between"><dt className="text-[#98A2B3]">Last scan</dt><dd className="font-medium">{new Date(info.last_scanned_date).toLocaleString()}</dd></div>}
            </dl>
          </div>
        )}

        <p className="mt-6 text-[11px] text-[#98A2B3]">Questions about this item? Contact your laundry provider.</p>
      </div>
    </div>
  )
}
