import { Breadcrumb } from '../../../components/ui/breadcrumb'

export default function TodaySheetPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb items={[{ label: 'Today' }, { label: 'Sheet' }]} />
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
          Today Sheet
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Daily operations sheet view. (Route restored; implement content as needed.)
        </p>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        Today sheet content goes here.
      </div>
    </div>
  )
}
