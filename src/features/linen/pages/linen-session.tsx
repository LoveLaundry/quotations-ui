import { Breadcrumb } from '../../../components/ui/breadcrumb'

export default function LinenSession() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Session' }]} />
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Linen Session
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Session-based linen tracking workflow. (Route restored; implement content as needed.)
        </p>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        Linen session UI goes here.
      </div>
    </div>
  )
}
