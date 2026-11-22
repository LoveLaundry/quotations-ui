import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Pencil, Users, LogIn, Ban, CheckCircle2, Search, X,
  UserPlus, UserMinus, Building2, Archive,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/page-header'
import { StatCard } from '../../../components/ui/stat-card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Field, FormGrid } from '../../../components/ui/field'
import { DataTable, type Column } from '../../../components/ui/data-table'
import { Pagination } from '../../../components/ui/pagination'
import { ConfirmDialog } from '../../../components/ui/confirm-dialog'
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '../../../components/ui/dialog'
import { EmptyState } from '../../../components/ui/empty-state'
import { useAuth } from '../../../context/AuthContext'
import { laundryService } from '../services/laundry.service'
import {
  entityService, entityId, type EntityKind, type RegistryEntity, type RegistryMember,
  type RegistryPayload,
} from '../services/entity-registry.service'

const PAGE_SIZE = 20
const STATUSES = ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] as const

/** Portal roles are entity-specific; generic ADMIN/MANAGER/STAFF are laundry roles. */
const MEMBER_ROLES = {
  hotels: ['HOTEL_ADMIN', 'HOTEL_MANAGER'],
  shops: ['SHOP_ADMIN', 'SHOP_STAFF'],
} as const

const defaultMemberRole = (kind: EntityKind): string =>
  kind === 'hotels' ? 'HOTEL_MANAGER' : 'SHOP_STAFF'

const TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  ARCHIVED: 'neutral',
}

const blankForm: RegistryPayload = {
  code: '',
  name: '',
  associated_laundry_id: '',
  location: '',
  address: '',
  contact_number: '',
  email: '',
  icon: '',
  description: '',
  subscription_plan: '',
}

/**
 * One management surface for both platform registries (Hotels and Shops).
 * The two APIs share a contract, so sharing the page guarantees the same
 * search, status controls, membership handling and support hand-off on both.
 */
export default function EntityRegistryPage({ kind }: { kind: EntityKind }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { enterSupport } = useAuth()
  const svc = useMemo(() => entityService(kind), [kind])
  const upper = kind === 'hotels' ? 'Hotels' : 'Shops'
  const singular = svc.label

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [laundryId, setLaundryId] = useState('')
  const [offset, setOffset] = useState(0)
  const [form, setForm] = useState<RegistryPayload>(blankForm)
  const [editing, setEditing] = useState<RegistryEntity | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [membersFor, setMembersFor] = useState<RegistryEntity | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ row: RegistryEntity; to: string } | null>(null)
  const [memberAuthId, setMemberAuthId] = useState('')
  const [memberName, setMemberName] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberRole, setMemberRole] = useState(() => defaultMemberRole(kind))
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const enteringRef = useRef<string | null>(null)

  useEffect(() => setOffset(0), [search, status, laundryId])
  useEffect(() => setMemberRole(defaultMemberRole(kind)), [kind])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['registry', kind] })
    void qc.invalidateQueries({ queryKey: ['platform-laundries'] })
  }

  const { data: page = { items: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['registry', kind, 'list', search, status, laundryId, offset],
    queryFn: () => svc.list({ search, status, laundryId, limit: PAGE_SIZE, offset }),
  })

  const stats = useQuery({
    queryKey: ['registry', kind, 'stats'],
    queryFn: async () => {
      const results = await Promise.all(
        STATUSES.map((s) => svc.list({ status: s, limit: 1 })),
      )
      return {
        ACTIVE: results[0].total,
        SUSPENDED: results[1].total,
        ARCHIVED: results[2].total,
      }
    },
  })

  const { data: laundries = [] } = useQuery({
    queryKey: ['platform-laundries-options'],
    queryFn: () => laundryService.list({ status: 'ACTIVE', limit: 200 }).then((r) => r.items),
  })

  const { data: members = [], isLoading: membersLoading } = useQuery<RegistryMember[]>({
    queryKey: ['registry', kind, 'members', membersFor ? entityId(membersFor) : ''],
    queryFn: () => svc.members(entityId(membersFor!)),
    enabled: Boolean(membersFor),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return svc.update(entityId(editing), form)
      return svc.create(form)
    },
    onSuccess: (row) => {
      toast.success(`${singular} ${editing ? 'updated' : 'created'}: ${row.name}`)
      invalidate()
      setShowForm(false)
      setEditing(null)
      setForm(blankForm)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const statusMutation = useMutation({
    mutationFn: ({ row, to }: { row: RegistryEntity; to: string }) => svc.setStatus(entityId(row), to),
    onSuccess: (row) => {
      toast.success(`${singular} ${row.name} is now ${String(row.status).toLowerCase()}`)
      invalidate()
      setStatusTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const addMemberMutation = useMutation({
    mutationFn: () => svc.addMember(entityId(membersFor!), {
      auth_id: memberAuthId.trim(),
      role: memberRole,
      user_name: memberName.trim() || undefined,
      password: memberPassword || undefined,
    }),
    onSuccess: () => {
      toast.success('Portal access assigned')
      setMemberAuthId('')
      setMemberName('')
      setMemberPassword('')
      setMemberRole(defaultMemberRole(kind))
      void qc.invalidateQueries({ queryKey: ['registry', kind, 'members'] })
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (authId: string) => svc.removeMember(entityId(membersFor!), authId),
    onSuccess: () => {
      toast.success('Member removed')
      void qc.invalidateQueries({ queryKey: ['registry', kind, 'members'] })
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    // Never pick an owner on the operator's behalf: a mistaken tenant here
    // gives the wrong laundry access to the new entity.
    setForm({ ...blankForm })
    setShowForm(true)
  }

  const openEdit = (row: RegistryEntity) => {
    setEditing(row)
    setForm({
      code: row.hotel_id ?? row.shop_id ?? '',
      name: row.name ?? '',
      associated_laundry_id: row.associated_laundry_id ?? '',
      location: row.location ?? '',
      address: row.address ?? '',
      contact_number: row.contact_number ?? '',
      email: row.email ?? '',
      icon: row.icon ?? '',
      description: row.description ?? '',
      subscription_plan: row.subscription_plan ?? '',
    })
    setShowForm(true)
  }

  const enter = async (row: RegistryEntity) => {
    const id = entityId(row)
    // A double click must not create two audited sessions or two short-lived
    // tokens for the same operator action.
    if (enteringRef.current) return
    enteringRef.current = id
    setEnteringId(id)
    try {
      const res = await svc.enter(id)
      // The backend issues an entity-scoped token with no laundry claim. Keep
      // that scope intact: never reinterpret this as laundry support and never
      // send the operator to the laundry operations screen.
      enterSupport({
        kind: kind === 'hotels' ? 'hotel' : 'shop',
        token: res.access_token,
        user: res.user,
        entityId: id,
        entityName: row.name,
      })
      toast.success(`Support session for ${row.name} — audited, 1 hour`)
      navigate(`/support/${kind}/${encodeURIComponent(id)}`, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not enter ${row.name}`)
    } finally {
      enteringRef.current = null
      setEnteringId(null)
    }
  }

  const columns: Column<RegistryEntity>[] = [
    {
      key: 'name',
      header: singular,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
            <Building2 size={15} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{row.name}</p>
            <p className="truncate text-[11px] text-[var(--text-faint)]">{entityId(row)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'laundry',
      header: 'Laundry',
      render: (row) => (
        <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
          {laundries.find((l) => l.laundry_id === row.associated_laundry_id)?.name ??
            row.associated_laundry_id}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <span className="truncate text-[12.5px] text-[var(--text-muted)]">{row.location || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={TONE[String(row.status).toUpperCase()] ?? 'neutral'} dot size="xs">
          {String(row.status).toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Registered',
      render: (row) => (
        <span className="text-[12px] text-[var(--text-faint)] tabular-nums">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      headerAlign: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-0.5">
          <button type="button" className="registry-icon-btn" title="Edit" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
            <Pencil size={14} />
          </button>
          <button type="button" className="registry-icon-btn" title="Members" aria-label={`Members of ${row.name}`} onClick={() => setMembersFor(row)}>
            <Users size={14} />
          </button>
          {String(row.status).toUpperCase() === 'ACTIVE' ? (
            <button type="button" className="registry-icon-btn" title="Suspend" aria-label={`Suspend ${row.name}`} onClick={() => setStatusTarget({ row, to: 'SUSPENDED' })}>
              <Ban size={14} />
            </button>
          ) : (
            <button type="button" className="registry-icon-btn" title="Activate" aria-label={`Activate ${row.name}`} onClick={() => setStatusTarget({ row, to: 'ACTIVE' })}>
              <CheckCircle2 size={14} />
            </button>
          )}
          {String(row.status).toUpperCase() === 'ACTIVE' && (
            <button
              type="button"
              className="registry-icon-btn"
              title={enteringId === entityId(row) ? `Entering ${row.name}…` : `Enter ${singular.toLowerCase()}`}
              aria-label={enteringId === entityId(row) ? `Entering ${row.name}` : `Enter ${row.name}`}
              disabled={enteringId === entityId(row)}
              onClick={() => void enter(row)}
            >
              <LogIn size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]

  const s = stats.data

  return (
    <div className="platform-page registry-page">
      <PageHeader
        eyebrow="Platform registry"
        title={upper}
        subtitle={`Register and govern every ${singular.toLowerCase()} across the LoveLaundry network.`}
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} /> Add {singular.toLowerCase()}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`Total ${upper.toLowerCase()}`} value={page.total} icon={<Building2 />} tone="neutral" />
        <StatCard label="Active" value={s?.ACTIVE ?? '—'} icon={<CheckCircle2 />} tone="success" />
        <StatCard label="Suspended" value={s?.SUSPENDED ?? '—'} icon={<Ban />} tone="warning" />
        <StatCard label="Archived" value={s?.ARCHIVED ?? '—'} icon={<Archive />} tone="neutral" />
      </div>

      <section className="registry-panel" aria-label={`${upper} registry`}>
        <div className="registry-toolbar">
          <div className="registry-search">
            <Search size={15} aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${upper.toLowerCase()}…`}
              aria-label={`Search ${upper.toLowerCase()}`}
              className="border-0 bg-transparent focus:ring-0"
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className="registry-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select
            className="registry-select"
            value={laundryId}
            onChange={(e) => setLaundryId(e.target.value)}
            aria-label="Filter by laundry"
          >
            <option value="">All laundries</option>
            {laundries.map((l) => (
              <option key={l.laundry_id} value={l.laundry_id}>{l.name}</option>
            ))}
          </select>
        </div>

        {isLoading && (
          <p className="px-4 py-2 text-[12px] text-[var(--text-faint)]" role="status">
            Loading {upper.toLowerCase()}…
          </p>
        )}

        <DataTable
          columns={columns}
          data={page.items}
          rowKey={(row) => String(entityId(row))}
          emptyState={
            <EmptyState
              title={`No ${upper.toLowerCase()} found`}
              description={search || status || laundryId ? 'Try clearing a filter.' : `Add your first ${singular.toLowerCase()} to get started.`}
            />
          }
        />
        <div className="registry-pagination">
          <Pagination total={page.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} itemLabel={upper.toLowerCase()} />
        </div>
      </section>

      {/* Create / edit */}
      <Dialog open={showForm} onOpenChange={(o) => !o && !saveMutation.isPending && setShowForm(false)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FormGrid cols={2}>
              <Field id="entity-code" label={`${singular} ID`} required hint="Unique identifier used across the platform.">
                <Input
                  id="entity-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder={kind === 'hotels' ? 'hotel-colombo-01' : 'shop-galle-01'}
                  disabled={Boolean(editing)}
                />
              </Field>
              <Field id="entity-name" label="Display name" required>
                <Input id="entity-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
              </Field>
              <Field id="entity-laundry" label="Owning laundry" required className="sm:col-span-2">
                <select
                  id="entity-laundry"
                  className="registry-select w-full"
                  value={form.associated_laundry_id}
                  onChange={(e) => setForm({ ...form, associated_laundry_id: e.target.value })}
                >
                  <option value="">Select a laundry…</option>
                  {laundries.map((l) => <option key={l.laundry_id} value={l.laundry_id}>{l.name}</option>)}
                </select>
              </Field>
              <Field id="entity-location" label="Location">
                <Input id="entity-location" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City / area" />
              </Field>
              <Field id="entity-contact" label="Contact number">
                <Input id="entity-contact" value={form.contact_number ?? ''} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} placeholder="07…" />
              </Field>
              <Field id="entity-email" label="Email">
                <Input id="entity-email" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
              </Field>
              <Field id="entity-plan" label="Subscription plan">
                <Input id="entity-plan" value={form.subscription_plan ?? ''} onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })} placeholder="Optional" />
              </Field>
              <Field id="entity-address" label="Address" className="sm:col-span-2">
                <Input id="entity-address" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
              </Field>
              <Field id="entity-notes" label="Notes" className="sm:col-span-2">
                <Input id="entity-notes" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </Field>
            </FormGrid>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button
              variant="primary"
              disabled={saveMutation.isPending || !form.code.trim() || !form.name.trim() || !form.associated_laundry_id}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : `Create ${singular.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members */}
      <Dialog open={Boolean(membersFor)} onOpenChange={(o) => !o && setMembersFor(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{membersFor?.name} — members</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="member-auth-id" label="Auth ID" required>
                <Input
                  id="member-auth-id"
                  value={memberAuthId}
                  onChange={(e) => setMemberAuthId(e.target.value)}
                  placeholder="Portal login"
                />
              </Field>
              <Field id="member-role" label="Role" required>
                <select id="member-role" className="registry-select w-full" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  {MEMBER_ROLES[kind].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </Field>
              <Field id="member-name" label="Display name">
                <Input
                  id="member-name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Optional for an existing login"
                />
              </Field>
              <Field id="member-password" label="Password" hint="Required only when creating a new portal login">
                <Input
                  id="member-password"
                  type="password"
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="secondary"
                disabled={!memberAuthId.trim() || addMemberMutation.isPending}
                onClick={() => addMemberMutation.mutate()}
              >
                <UserPlus size={14} /> {addMemberMutation.isPending ? 'Assigning…' : 'Assign portal access'}
              </Button>
            </div>

            {membersLoading ? (
              <p className="py-6 text-center text-[12.5px] text-[var(--text-muted)]">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="py-6 text-center text-[12.5px] text-[var(--text-muted)]">No members yet.</p>
            ) : (
              <ul className="registry-member-list">
                {members.map((m) => (
                  <li key={`${m.auth_id}-${m.role ?? ''}`}>
                    <span className="flex size-7 items-center justify-center rounded-sm bg-[var(--surface-3)] text-[10.5px] font-semibold text-[var(--text-secondary)]">
                      {m.auth_id.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-[var(--text-primary)]">
                        {m.user_name || m.auth_id}
                      </p>
                      <p className="text-[11px] text-[var(--text-faint)]">
                        {m.auth_id} · {m.role ?? 'member'}{m.source ? ` · ${m.source}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="registry-icon-btn"
                      title="Remove member"
                      aria-label={`Remove ${m.auth_id}`}
                      disabled={removeMemberMutation.isPending}
                      onClick={() => removeMemberMutation.mutate(m.auth_id)}
                    >
                      <UserMinus size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={`${statusTarget?.to === 'ACTIVE' ? 'Activate' : 'Suspend'} ${statusTarget?.row.name ?? ''}?`}
        message={
          statusTarget?.to === 'ACTIVE'
            ? 'Members will be able to sign in to this registry again.'
            : 'Members will lose access until this registry is activated again.'
        }
        confirmLabel={statusTarget?.to === 'ACTIVE' ? 'Activate' : 'Suspend'}
        variant={statusTarget?.to === 'ACTIVE' ? 'primary' : 'warning'}
        loading={statusMutation.isPending}
        onConfirm={() => statusTarget && statusMutation.mutate(statusTarget)}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  )
}
