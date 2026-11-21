import { useQuery } from '@tanstack/react-query'
import { Building2, ShieldCheck, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Notice } from '../../../components/ui/notice'
import { PageHeader } from '../../../components/ui/page-header'
import { entityService, type EntityKind } from '../services/entity-registry.service'

const TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  ARCHIVED: 'neutral',
}

/**
 * The destination for hotel and shop "Enter".
 *
 * It is deliberately not the laundry Today page: the support token issued for
 * an entity has no laundry scope, so every laundry screen would fail on its
 * first request. This page shows the entity and its access roster using the
 * entity-scoped token, with a clear exit back to the platform surface.
 */
export default function EntitySupportPage({ kind }: { kind: EntityKind }) {
  const { entityId = '' } = useParams()
  const { support, exitSupport } = useAuth()
  const svc = entityService(kind)

  const entity = useQuery({
    queryKey: ['registry', kind, 'support', entityId],
    queryFn: () => svc.get(entityId),
    enabled: Boolean(entityId),
  })

  const members = useQuery({
    queryKey: ['registry', kind, 'support', entityId, 'members'],
    queryFn: () => svc.members(entityId),
    enabled: Boolean(entityId),
  })

  if (!support || support.kind === 'laundry') return null

  const title = entity.data?.name ?? support.entityName
  const label = kind === 'hotels' ? 'Hotel' : 'Shop'

  return (
    <div className="platform-page">
      <PageHeader
        eyebrow="Platform support"
        title={title}
        subtitle={`Entity-scoped support session for this ${label.toLowerCase()}. Laundry operations are not available here.`}
        actions={
          <Button variant="secondary" onClick={exitSupport}>
            Exit support
          </Button>
        }
      />

      <Notice tone="warning" className="mb-4" title="Entity-only session">
        This session is scoped to {label.toLowerCase()} <strong>{support.entityId}</strong>. It carries
        no active laundry, so support must not open Daily Operations or any other laundry screen.
      </Notice>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={15} aria-hidden /> Entity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="grid gap-3 text-[12.5px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Entity ID</dt>
                <dd className="font-medium text-[var(--text-primary)]">{entity.data?.hotel_id ?? entity.data?.shop_id ?? support.entityId}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Status</dt>
                <dd>
                  <Badge tone={TONE[String(entity.data?.status ?? 'ACTIVE').toUpperCase()] ?? 'neutral'} dot size="xs">
                    {String(entity.data?.status ?? 'ACTIVE').toUpperCase()}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Location</dt>
                <dd className="text-right font-medium text-[var(--text-primary)]">{entity.data?.location || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Session issued for</dt>
                <dd className="font-medium text-[var(--text-primary)]">1 hour</dd>
              </div>
            </dl>
            {entity.isError && (
              <p className="text-[12px] text-[var(--danger-text)]">This entity could not be loaded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={15} aria-hidden /> Portal access roster
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {members.isLoading ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-[var(--text-muted)]">Loading roster…</p>
            ) : members.data?.length ? (
              <ul className="divide-y divide-[var(--border)]">
                {members.data.map((member) => (
                  <li key={`${member.auth_id}-${member.role ?? ''}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-3)] text-[10.5px] font-semibold text-[var(--text-secondary)]">
                      {member.auth_id.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-[var(--text-primary)]">{member.user_name || member.auth_id}</p>
                      <p className="truncate text-[11px] text-[var(--text-faint)]">{member.auth_id} · {member.role ?? 'member'}</p>
                    </div>
                    <Badge tone={String(member.status).toUpperCase() === 'ACTIVE' ? 'success' : 'warning'} size="xs">
                      {String(member.status ?? 'ACTIVE').toUpperCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-[12.5px] text-[var(--text-muted)]">No portal users are assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[var(--text-faint)]">
        <ShieldCheck size={13} aria-hidden /> Support entry is audited and memory-only. A reload returns to your platform session.
      </p>
    </div>
  )
}
