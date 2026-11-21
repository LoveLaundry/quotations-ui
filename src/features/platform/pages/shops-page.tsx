import { PageHeader } from '../../../components/ui/page-header'

export default function ShopsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Shops" subtitle="Manage shop accounts and settings (platform admin)." />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        Shops management UI (route restored). Hook up to your shops API when ready.
      </div>
    </div>
  )
}
