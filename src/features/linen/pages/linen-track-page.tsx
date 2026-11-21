import { useParams } from 'react-router-dom'
import { Breadcrumb } from '../../../components/ui/breadcrumb'

export default function LinenTrackPage() {
  const { code } = useParams<{ code: string }>()
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Track' }]} />
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Linen Tracking
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Tracking code: <span className="font-mono">{code ?? '—'}</span>
        </p>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        Tracking details for this linen item/code will appear here. (Route restored; connect to API as needed.)
      </div>
    </div>
  )
}
