import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Archive, Building2, CheckCircle2, Edit3, Plus, Search, Shield,
  UserMinus, UserPlus, X, Ban, KeyRound, UserCheck
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/page-header'
import { StatCard } from '../../../components/ui/stat-card'
import { FilterBar } from '../../../components/ui/filter-bar'
import { Badge } from '../../../components/ui/badge'
import { DataTable, type Column } from '../../../components/ui/data-table'
import { EmptyState } from '../../../components/ui/empty-state'
import { Pagination } from '../../../components/ui/pagination'
import { ConfirmDialog } from '../../../components/ui/confirm-dialog'
import { Portal } from '../../../components/ui/portal'
import { laundryService } from '../services/laundry.service'
import {
  entityService, type EntityKind, type EntityPayload,
  type EntityStatus, type PlatformEntity
} from '../services/entity.service'
import type { Laundry } from '../../../types/auth'

const PAGE_SIZE = 20
const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'info'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  ARCHIVED: 'neutral',
}

export function EntityRegistryPage({ kind }: { kind: EntityKind }) {
  const isShop = kind === 'shop'
  const noun = isShop ? 'Shop' : 'Hotel'
  const plural = isShop ? 'Shops' : 'Hotels'
  const idKey = isShop ? 'shop_id' : 'hotel_id'
  const codeKey = isShop ? 'shop_code' : 'hotel_code'
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [offset, setOffset] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformEntity | null>(null)
  const [detail, setDetail] = useState<PlatformEntity | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ entity: PlatformEntity; to: EntityStatus } | null>(null)

  useEffect(() => setOffset(0), [search, status, kind])

  const query = useQuery({
    queryKey: ['platform-entities', kind, search, status, offset],
    queryFn: () => entityService.list(kind, { search: search || undefined, status: status || undefined, limit: PAGE_SIZE, offset }),
  })
  const all = useQuery({ queryKey: ['platform-entities-total', kind, 'all'], queryFn: () => entityService.list(kind, { limit: 1, offset: 0 }).then((r) => r.total) })
  const active = useQuery({ queryKey: ['platform-entities-total', kind, 'ACTIVE'], queryFn: () => entityService.list(kind, { status: 'ACTIVE', limit: 1, offset: 0 }).then((r) => r.total) })
  const suspended = useQuery({ queryKey: ['platform-entities-total', kind, 'SUSPENDED'], queryFn: () => entityService.list(kind, { status: 'SUSPENDED', limit: 1, offset: 0 }).then((r) => r.total) })
  const archived = useQuery({ queryKey: ['platform-entities-total', kind, 'ARCHIVED'], queryFn: () => entityService.list(kind, { status: 'ARCHIVED', limit: 1, offset: 0 }).then((r) => r.total) })
  const laundries = useQuery({ queryKey: ['platform-laundries-for-entities'], queryFn: () => laundryService.list({ status: 'ACTIVE', limit: 200 }) })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['platform-entities', kind] })
    void qc.invalidateQueries({ queryKey: ['platform-entities-total', kind] })
    void qc.invalidateQueries({ queryKey: ['users'] })
  }

  const save = useMutation({
    mutationFn: (payload: EntityPayload) => editing ? entityService.update(kind, editing[idKey]!, payload) : entityService.create(kind, payload),
    onSuccess: () => {
      toast.success(`${noun} ${editing ? 'updated' : 'registered with administrator'}`)
      invalidate()
      setEditing(null)
      setFormOpen(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || e.message || `Could not save ${noun.toLowerCase()}`),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, to }: { id: string; to: EntityStatus }) => entityService.setStatus(kind, id, to),
    onSuccess: () => { toast.success(`${noun} status updated`); invalidate(); setStatusTarget(null); setDetail(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Status update failed'),
  })

  const columns: Column<PlatformEntity>[] = [
    {
      key: 'name',
      header: noun,
      render: (e) => (
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded bg-[var(--surface-2)] text-lg">
            {e.icon || (isShop ? '🏪' : '🏨')}
          </span>
          <span>
            <span className="block font-medium">{e.name}</span>
            <span className="block text-[11px] text-[var(--text-faint)]">{e[idKey]}</span>
          </span>
        </span>
      ),
    },
    { key: codeKey, header: 'Code', render: (e) => <span>{e[codeKey] || '—'}</span> },
    { key: 'associated_laundry_id', header: 'Laundry', render: (e) => <span>{e.associated_laundry_id}</span> },
    { key: 'location', header: 'Location', render: (e) => <span>{e.location || '—'}</span> },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (e) => <Badge variant={STATUS_TONE[e.status] || 'neutral'}>{e.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (e) => (
        <span className="flex justify-center gap-1" onClick={(event) => event.stopPropagation()}>
          <button className="rounded p-1.5 hover:bg-[var(--surface-hover)]" title="Open & Manage Admins" onClick={() => setDetail(e)}>
            <Building2 size={15} />
          </button>
          <button className="rounded p-1.5 hover:bg-[var(--surface-hover)]" title="Edit" onClick={() => { setEditing(e); setFormOpen(true) }}>
            <Edit3 size={14} />
          </button>
        </span>
      ),
    },
  ]

  return (
    <div className="route-enter space-y-4">
      <PageHeader
        title={plural}
        subtitle={`${all.data ?? 0} registered · ${active.data ?? 0} active — platform-managed client entities`}
        actions={
          <button
            onClick={() => { setEditing(null); setFormOpen(true) }}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} /> Register {noun}
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Registered" value={all.data ?? 0} icon={<Building2 size={20} />} color="blue" />
        <StatCard label="Active" value={active.data ?? 0} icon={<CheckCircle2 size={20} />} color="green" />
        <StatCard label="Suspended" value={suspended.data ?? 0} icon={<Ban size={20} />} color="amber" />
        <StatCard label="Archived" value={archived.data ?? 0} icon={<Archive size={20} />} color="gray" />
      </div>
      <FilterBar>
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${plural.toLowerCase()}…`}
            aria-label={`Search ${plural}`}
            className="w-full rounded-lg border border-[var(--border-2)] bg-[var(--surface)] py-2 pr-3 pl-9 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </FilterBar>
      {query.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 animate-shimmer rounded bg-[var(--skeleton-from)]" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState title={`Could not load ${plural.toLowerCase()}`} description="Check the platform session and try again." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={query.data?.items ?? []}
            rowKey={(e) => e[idKey]!}
            onRowClick={setDetail}
            emptyState={
              <EmptyState
                icon={<Building2 size={28} />}
                title={`No ${plural.toLowerCase()} found`}
                description={search || status ? 'No records match the current filters.' : `Register the first ${noun.toLowerCase()} to begin.`}
              />
            }
          />
          <Pagination total={query.data?.total ?? 0} limit={PAGE_SIZE} offset={offset} onChange={setOffset} itemLabel={plural.toLowerCase()} />
        </>
      )}
      {formOpen && (
        <EntityForm
          kind={kind}
          initial={editing}
          laundries={laundries.data?.items ?? []}
          saving={save.isPending}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSubmit={(payload) => save.mutate(payload)}
        />
      )}
      {detail && (
        <EntityDetail
          kind={kind}
          entity={detail}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); setFormOpen(true) }}
          onStatus={(to) => setStatusTarget({ entity: detail, to })}
        />
      )}
      <ConfirmDialog
        open={!!statusTarget}
        title={`${statusTarget?.to === 'ACTIVE' ? 'Activate' : statusTarget?.to === 'SUSPENDED' ? 'Suspend' : 'Archive'} ${statusTarget?.entity.name}?`}
        message="This changes access for the entity and its members. History is preserved."
        confirmLabel={statusTarget?.to ?? 'Confirm'}
        loading={statusMut.isPending}
        onConfirm={() => statusTarget && statusMut.mutate({ id: statusTarget.entity[idKey]!, to: statusTarget.to })}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  )
}

function EntityForm({
  kind,
  initial,
  laundries,
  saving,
  onClose,
  onSubmit,
}: {
  kind: EntityKind
  initial: PlatformEntity | null
  laundries: Laundry[]
  saving: boolean
  onClose: () => void
  onSubmit: (payload: EntityPayload) => void
}) {
  const isShop = kind === 'shop'
  const noun = isShop ? 'Shop' : 'Hotel'
  const idName = isShop ? 'shop_id' : 'hotel_id'
  const codeName = isShop ? 'shop_code' : 'hotel_code'

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="menu-pop max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[var(--surface)] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{initial ? `Edit ${noun}` : `Register ${noun}`}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {initial ? `Update ${noun.toLowerCase()} information` : `Create a new ${noun.toLowerCase()} and optionally provision its administrator.`}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const text = (name: string) => String(fd.get(name) ?? '').trim() || undefined
              const payload: EntityPayload = {
                [idName]: String(fd.get(idName) ?? '').trim().toLowerCase(),
                name: String(fd.get('name') ?? '').trim(),
                [codeName]: text(codeName),
                associated_laundry_id: String(fd.get('associated_laundry_id') ?? ''),
                location: text('location'),
                address: text('address'),
                contact_number: text('contact_number'),
                email: text('email'),
                icon: text('icon'),
                description: text('description'),
                subscription_plan: text('subscription_plan'),
                admin_auth_id: text('admin_auth_id'),
                admin_user_name: text('admin_user_name'),
                admin_password: text('admin_password'),
                admin_email: text('admin_email'),
              }
              onSubmit(payload)
            }}
          >
            {!initial && (
              <Field
                name={idName}
                label={`${noun} ID *`}
                required
                placeholder={`e.g. ${isShop ? 'city-mart' : 'ocean-view'}`}
                pattern="[a-z0-9][a-z0-9_-]{0,31}"
              />
            )}
            <Field name="name" label={`${noun} name *`} required defaultValue={initial?.name} />
            <div className="grid grid-cols-2 gap-3">
              <Field name={codeName} label="Business code" defaultValue={initial?.[codeName] ?? ''} />
              <Field name="location" label="Location" defaultValue={initial?.location ?? ''} />
            </div>
            <label className="block text-xs text-[var(--text-muted)]">
              Associated laundry *
              <select
                name="associated_laundry_id"
                required
                defaultValue={initial?.associated_laundry_id ?? ''}
                disabled={!!initial}
                className="mt-1 w-full rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="">Select active laundry</option>
                {laundries.map((l) => (
                  <option key={l.laundry_id} value={l.laundry_id}>
                    {l.name} ({l.laundry_id})
                  </option>
                ))}
              </select>
            </label>
            <Field name="address" label="Address" defaultValue={initial?.address ?? ''} />
            <div className="grid grid-cols-2 gap-3">
              <Field name="contact_number" label="Contact number" defaultValue={initial?.contact_number ?? ''} />
              <Field name="email" label="Email" type="email" defaultValue={initial?.email ?? ''} />
            </div>
            <Field name="icon" label="Icon" defaultValue={initial?.icon ?? (isShop ? '🏪' : '🏨')} />
            <Field name="subscription_plan" label="Subscription plan" defaultValue={initial?.subscription_plan ?? ''} />
            <label className="block text-xs text-[var(--text-muted)]">
              Description
              <textarea
                name="description"
                rows={2}
                defaultValue={initial?.description ?? ''}
                className="mt-1 w-full rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>

            {!initial && (
              <div className="mt-4 rounded-xl border border-[var(--border-2)] bg-[var(--surface-2)] p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                  <Shield size={14} className="text-[var(--brand)]" />
                  <span>Initial Administrator (Optional)</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Instantly provision the {noun.toLowerCase()} administrator login credentials upon registration.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field name="admin_auth_id" label="Admin Login Username" placeholder={`e.g. ${isShop ? 'shop.admin' : 'hotel.admin'}`} />
                  <Field name="admin_user_name" label="Admin Full Name" placeholder="e.g. Primary Administrator" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field name="admin_password" label="Admin Password" type="password" placeholder="Temporary password" />
                  <Field name="admin_email" label="Admin Email" type="email" placeholder="admin@domain.lk" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg bg-[var(--surface-2)] px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : initial ? 'Save changes' : `Register ${noun}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  placeholder,
  pattern,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  pattern?: string
}) {
  return (
    <label className="block text-xs text-[var(--text-muted)]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        pattern={pattern}
        className="mt-1 w-full rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-2 text-sm"
      />
    </label>
  )
}

function EntityDetail({
  kind,
  entity,
  onClose,
  onEdit,
  onStatus,
}: {
  kind: EntityKind
  entity: PlatformEntity
  onClose: () => void
  onEdit: () => void
  onStatus: (to: EntityStatus) => void
}) {
  const isShop = kind === 'shop'
  const id = (isShop ? entity.shop_id : entity.hotel_id)!
  const noun = isShop ? 'Shop' : 'Hotel'
  const defaultAdminRole = isShop ? 'SHOP_ADMIN' : 'HOTEL_ADMIN'
  const defaultStaffRole = isShop ? 'SHOP_STAFF' : 'HOTEL_MANAGER'
  const qc = useQueryClient()

  const [mode, setMode] = useState<'create_admin' | 'add_existing'>('create_admin')
  const [authId, setAuthId] = useState('')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(defaultAdminRole)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  const members = useQuery({
    queryKey: ['platform-entity-members', kind, id],
    queryFn: () => entityService.members(kind, id),
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['platform-entity-members', kind, id] })
    void qc.invalidateQueries({ queryKey: ['users'] })
  }

  const addExistingMut = useMutation({
    mutationFn: () => entityService.addMember(kind, id, { auth_id: authId.trim(), role }),
    onSuccess: () => {
      toast.success('Member assigned')
      setAuthId('')
      refresh()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Could not add member'),
  })

  const createAdminMut = useMutation({
    mutationFn: () =>
      entityService.createAdmin(kind, id, {
        auth_id: authId.trim(),
        user_name: userName.trim() || authId.trim(),
        password: password.trim(),
        email: email.trim() || undefined,
        role,
      }),
    onSuccess: () => {
      toast.success(`${noun} administrator created successfully`)
      setAuthId('')
      setUserName('')
      setPassword('')
      setEmail('')
      refresh()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || e.message || `Could not create ${noun.toLowerCase()} admin`),
  })

  const removeMut = useMutation({
    mutationFn: (value: string) => entityService.removeMember(kind, id, value),
    onSuccess: () => {
      toast.success('Member removed')
      setRemoveTarget(null)
      refresh()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || e.message || 'Could not remove member'),
  })

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="menu-pop max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[var(--surface)] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{entity.name}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {noun} · {id} · Laundry: {entity.associated_laundry_id}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={STATUS_TONE[entity.status] || 'neutral'}>{entity.status}</Badge>
            <button onClick={onEdit} className="rounded-lg border border-[var(--border-2)] px-3 py-1.5 text-xs">
              Edit
            </button>
            {entity.status === 'ACTIVE' ? (
              <button onClick={() => onStatus('SUSPENDED')} className="rounded-lg border border-[var(--border-2)] px-3 py-1.5 text-xs">
                Suspend
              </button>
            ) : (
              <button onClick={() => onStatus('ACTIVE')} className="rounded-lg border border-[var(--border-2)] px-3 py-1.5 text-xs">
                Activate
              </button>
            )}
            {entity.status !== 'ARCHIVED' && (
              <button onClick={() => onStatus('ARCHIVED')} className="rounded-lg border border-[var(--border-2)] px-3 py-1.5 text-xs">
                Archive
              </button>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ['Code', isShop ? entity.shop_code : entity.hotel_code],
              ['Location', entity.location],
              ['Address', entity.address],
              ['Contact', entity.contact_number],
              ['Email', entity.email],
              ['Plan', entity.subscription_plan],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] text-[var(--text-muted)]">{label}</dt>
                <dd className="truncate font-medium">{value || '—'}</dd>
              </div>
            ))}
          </dl>

          {entity.description && <p className="mt-3 text-sm text-[var(--text-secondary)]">{entity.description}</p>}

          {/* Members / Administrators Section */}
          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <Shield size={16} className="text-[var(--brand)]" />
                <span>{noun} Administrators & Members ({members.data?.length ?? 0})</span>
              </h3>
              <div className="flex gap-1 rounded-lg bg-[var(--surface-2)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('create_admin')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                    mode === 'create_admin' ? 'bg-[var(--surface)] font-medium shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <KeyRound size={12} /> Create Admin
                </button>
                <button
                  type="button"
                  onClick={() => setMode('add_existing')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                    mode === 'add_existing' ? 'bg-[var(--surface)] font-medium shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <UserCheck size={12} /> Add Existing User
                </button>
              </div>
            </div>

            {mode === 'create_admin' ? (
              <form
                className="mb-4 rounded-xl border border-[var(--border-2)] bg-[var(--surface-2)] p-3 space-y-2.5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (authId.trim() && password.trim()) createAdminMut.mutate()
                }}
              >
                <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Provision new {noun.toLowerCase()} admin credentials directly:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={authId}
                    onChange={(e) => setAuthId(e.target.value)}
                    placeholder="Username (e.g. admin.login) *"
                    required
                    className="rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-1.5 text-sm"
                  />
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Full name (e.g. John Admin)"
                    className="rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password *"
                    required
                    className="rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-1.5 text-sm"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-1.5 text-sm"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                  >
                    <option value={defaultAdminRole}>{defaultAdminRole}</option>
                    <option value={defaultStaffRole}>{defaultStaffRole}</option>
                  </select>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!authId.trim() || !password.trim() || createAdminMut.isPending}
                    className="flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <KeyRound size={13} /> {createAdminMut.isPending ? 'Creating…' : `Create ${noun} Administrator`}
                  </button>
                </div>
              </form>
            ) : (
              <form
                className="mb-4 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (authId.trim()) addExistingMut.mutate()
                }}
              >
                <input
                  value={authId}
                  onChange={(e) => setAuthId(e.target.value)}
                  placeholder="Existing user auth_id"
                  className="min-w-[180px] flex-1 rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-3 py-1.5 text-sm"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-lg border border-[var(--border-2)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                >
                  <option value={defaultAdminRole}>{defaultAdminRole}</option>
                  <option value={defaultStaffRole}>{defaultStaffRole}</option>
                </select>
                <button
                  type="submit"
                  disabled={!authId.trim() || addExistingMut.isPending}
                  className="flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  <UserPlus size={13} /> {addExistingMut.isPending ? 'Adding…' : 'Add Member'}
                </button>
              </form>
            )}

            {members.isLoading ? (
              <p className="py-3 text-center text-xs text-[var(--text-muted)]">Loading members…</p>
            ) : (members.data?.length ?? 0) === 0 ? (
              <p className="py-3 text-center text-xs text-[var(--text-muted)]">No administrators or staff assigned yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-2)]">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">User</th>
                      <th className="px-3 py-2 text-left font-medium">Role</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-center font-medium">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.data?.map((m) => (
                      <tr key={m.auth_id} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2 font-medium">
                          <span>{m.user_name || m.auth_id}</span>
                          <span className="block text-[11px] text-[var(--text-muted)]">{m.auth_id}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold bg-[var(--surface-2)] border-[var(--border-2)]">
                            {m.role || defaultAdminRole}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="success">{m.status || 'ACTIVE'}</Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => setRemoveTarget(m.auth_id)}
                            className="rounded p-1 text-[var(--danger-text)] hover:bg-[var(--surface-hover)]"
                            title={`Remove ${m.auth_id}`}
                          >
                            <UserMinus size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ConfirmDialog
            open={!!removeTarget}
            title="Remove member?"
            message={`${removeTarget} loses access to ${entity.name}.`}
            confirmLabel="Remove"
            loading={removeMut.isPending}
            onConfirm={() => removeTarget && removeMut.mutate(removeTarget)}
            onCancel={() => setRemoveTarget(null)}
          />
        </div>
      </div>
    </Portal>
  )
}

export function ShopsPage() {
  return <EntityRegistryPage kind="shop" />
}
export function HotelsPage() {
  return <EntityRegistryPage kind="hotel" />
}
