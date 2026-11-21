import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight, Building2 as Buildings, Users, Hotel, Store, ShieldCheck,
  Route as RouteIcon, CircleCheck, CircleAlert, Sparkles,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/page-header'
import { StatCard } from '../../../components/ui/stat-card'
import { Badge } from '../../../components/ui/badge'
import { useAuth } from '../../../context/AuthContext'
import authApi from '../../../api/auth-api'
import { laundryService } from '../services/laundry.service'
import { hotelRegistry, shopRegistry } from '../services/entity-registry.service'

interface QuickLink {
  to: string
  label: string
  description: string
  icon: typeof Buildings
  tone: string
}

const LINKS: QuickLink[] = [
  { to: '/laundries', label: 'Laundries', description: 'Tenant businesses, status and membership.', icon: Buildings, tone: 'brand' },
  { to: '/users', label: 'Users', description: 'Platform identities and role assignments.', icon: Users, tone: 'info' },
  { to: '/hotels', label: 'Hotels', description: 'Hotel accounts owned by your tenants.', icon: Hotel, tone: 'success' },
  { to: '/shops', label: 'Shops', description: 'Shop accounts owned by your tenants.', icon: Store, tone: 'warning' },
  { to: '/route-access', label: 'Route Access', description: 'Per-role navigation permissions.', icon: RouteIcon, tone: 'accent' },
]

/** The platform operator's home: one screen for the health of the whole network. */
export default function PlatformOverviewPage() {
  const { user } = useAuth()

  const summary = useQuery({
    queryKey: ['platform-overview'],
    queryFn: async () => {
      const [laundries, users, hotels, shops] = await Promise.all([
        laundryService.list({ limit: 5 }),
        authApi.get<unknown[]>('/users').then((r) => r.data),
        hotelRegistry.list({ limit: 1 }),
        shopRegistry.list({ limit: 1 }),
      ])
      return {
        laundryTotal: laundries.total,
        recentLaundries: laundries.items,
        userTotal: Array.isArray(users) ? users.length : 0,
        hotelTotal: hotels.total,
        shopTotal: shops.total,
      }
    },
  })

  const data = summary.data
  const active = data?.recentLaundries.filter((l) => l.status === 'ACTIVE').length ?? 0

  return (
    <div className="platform-page overview-page">
      <PageHeader
        eyebrow="Control centre"
        title="Platform Overview"
        subtitle={`Welcome back, ${user?.user_name ?? 'administrator'}. Here is the state of the LoveLaundry network.`}
        actions={
          <Badge tone="success" dot>
            <CircleCheck size={12} aria-hidden /> Platform services online
          </Badge>
        }
      />

      <section className="platform-hero" aria-label="Platform summary">
        <div className="platform-hero-copy">
          <p className="platform-hero-kicker"><Sparkles size={13} aria-hidden /> LoveLaundry ecosystem</p>
          <h2>Every business. One control room.</h2>
          <p>
            Register tenants, manage identities and govern access across the entire network —
            without stepping into any one laundry's day-to-day operations.
          </p>
          <div className="platform-hero-actions">
            <Link className="platform-hero-primary" to="/laundries">
              Manage laundries <ArrowUpRight size={14} aria-hidden />
            </Link>
            <Link className="platform-hero-secondary" to="/users">View users</Link>
          </div>
        </div>
        <div className="platform-hero-mark" aria-hidden>
          <ShieldCheck size={92} strokeWidth={1} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Laundries" value={data?.laundryTotal ?? '—'} icon={<Buildings />} tone="brand" description="Registered tenants" />
        <StatCard label="Users" value={data?.userTotal ?? '—'} icon={<Users />} tone="info" description="Platform identities" />
        <StatCard label="Hotels" value={data?.hotelTotal ?? '—'} icon={<Hotel />} tone="success" description="Hotel accounts" />
        <StatCard label="Shops" value={data?.shopTotal ?? '—'} icon={<Store />} tone="warning" description="Shop accounts" />
      </div>

      <section className="platform-section" aria-labelledby="platform-sections-title">
        <div className="platform-section-head">
          <h2 id="platform-sections-title">Platform sections</h2>
          <p>Everything you can administer, in one place.</p>
        </div>
        <div className="platform-link-grid">
          {LINKS.map(({ to, label, description, icon: Icon, tone }) => (
            <Link key={to} to={to} className="platform-link-card" data-tone={tone}>
              <span className="platform-link-icon"><Icon size={18} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">{label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-[var(--text-muted)]">{description}</span>
              </span>
              <ArrowUpRight size={15} className="platform-link-arrow" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section className="platform-section" aria-labelledby="recent-tenants-title">
        <div className="platform-section-head">
          <h2 id="recent-tenants-title">Recently registered laundries</h2>
          <Link to="/laundries" className="platform-text-link">View all <ArrowUpRight size={13} aria-hidden /></Link>
        </div>
        <div className="registry-panel">
          {summary.isLoading ? (
            <p className="p-5 text-[12.5px] text-[var(--text-muted)]">Loading network summary…</p>
          ) : summary.isError ? (
            <div className="p-5 text-[12.5px] text-[var(--danger-text)]">
              <CircleAlert size={14} className="mr-1 inline" aria-hidden />
              Could not load the network summary. Check your connection and refresh.
            </div>
          ) : !data?.recentLaundries.length ? (
            <p className="p-5 text-[12.5px] text-[var(--text-muted)]">No laundries registered yet.</p>
          ) : (
            <ul className="platform-recent-list">
              {data.recentLaundries.map((l) => (
                <li key={String(l.id)}>
                  <span className="text-lg" aria-hidden>{l.icon ?? '🏭'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-[var(--text-primary)]">{l.name}</p>
                    <p className="truncate text-[11px] text-[var(--text-faint)]">{l.laundry_id} · {l.location || 'No location'}</p>
                  </div>
                  <Badge tone={l.status === 'ACTIVE' ? 'success' : l.status === 'SUSPENDED' ? 'warning' : 'neutral'} dot size="xs">
                    {l.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="platform-footnote">
          {active} of the {data?.recentLaundries.length ?? 0} most recent tenants are active.
        </p>
      </section>
    </div>
  )
}
