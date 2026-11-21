import { CAPABILITIES, type AccessSpec } from '../lib/access'

/**
 * route-meta.ts — one registry for every navigable page.
 *
 * Only the daily operations flow survives here: receive → deliver → return →
 * bill → close the day, plus linen scanning and account screens. The sidebar,
 * the command palette and the route guards all read from this list, so adding
 * or removing a page is a single entry.
 *
 * `icon` is a *key*, not a component, so this module stays a plain data file
 * with no React import. The sidebar and palette resolve the key to a Lucide
 * icon through their own maps.
 */

export type NavGroupId =
  | 'Overview'
  | 'Operations'
  | 'Linen'
  | 'System'

export interface RouteMeta extends AccessSpec {
  path: string
  /** Title shown by the top bar. */
  title: string
  /** Sidebar entry label; omit for pages that are reachable but not listed
   *  (detail pages, create-from-list flows). */
  navLabel?: string
  group?: NavGroupId
  /** Extra words the command palette matches beyond the title. */
  keywords?: string
  /** Icon key resolved by the consumer. */
  icon?: string
}

const C = CAPABILITIES

/** Pages in the daily operations flow are for laundry operators only; hotel
 *  and shop accounts must use their own portals. */
const TENANT: AccessSpec = { tenantOnly: true }

export const ROUTES: RouteMeta[] = [
  // ── Overview ────────────────────────────────────────────────────────────────
  {
    path: '/today', title: 'Daily Operations', navLabel: 'Today', group: 'Overview',
    icon: 'Lightning', keywords: 'today daily operations home flow',
    ...TENANT, permissions: [C.viewGatePasses, C.viewDeliveries, C.viewBills],
  },
  {
    path: '/today-sheet', title: 'Today Sheet', navLabel: 'Today Sheet', group: 'Overview',
    icon: 'Table', keywords: 'today sheet daily entry grid expenses',
    ...TENANT, permissions: [C.todaySheet],
  },
  { path: '/notifications', title: 'Notifications', keywords: 'alerts inbox', ...TENANT, permissions: [C.viewGatePasses] },

  // ── Operations: the flow ────────────────────────────────────────────────────
  {
    path: '/gate-passes', title: 'Gate Passes', navLabel: 'Gate Passes', group: 'Operations',
    icon: 'ClipboardText', keywords: 'gate passes receive incoming',
    ...TENANT, permissions: [C.viewGatePasses],
  },
  {
    path: '/gate-passes/new', title: 'New Gate Pass', keywords: 'gate pass new receive',
    ...TENANT, permissions: [C.manageGatePasses],
  },
  {
    path: '/gate-passes/:id', title: 'Gate Pass Details', keywords: 'gate pass detail',
    ...TENANT, permissions: [C.viewGatePasses],
  },
  {
    path: '/deliveries', title: 'Deliveries', navLabel: 'Deliveries', group: 'Operations',
    icon: 'Truck', keywords: 'deliveries deliver outbound',
    ...TENANT, permissions: [C.viewDeliveries],
  },
  {
    path: '/deliveries/new', title: 'New Delivery', keywords: 'delivery new deliver',
    ...TENANT, permissions: [C.manageDeliveries],
  },
  {
    path: '/deliveries/:id', title: 'Delivery Details', keywords: 'delivery detail',
    ...TENANT, permissions: [C.viewDeliveries],
  },
  {
    path: '/hotel-linen-flow', title: 'Hotel Linen Flow', navLabel: 'Hotel Linen Flow', group: 'Operations',
    icon: 'FlowArrow', keywords: 'hotel linen flow balance',
    ...TENANT, permissions: [C.viewGatePasses, C.viewDeliveries],
  },
  {
    path: '/returns', title: 'Returns', navLabel: 'Returns', group: 'Operations',
    icon: 'RotateCcw', keywords: 'returns send back',
    ...TENANT, permissions: [C.viewReturns],
  },
  {
    path: '/returns/new', title: 'Record Return', keywords: 'return new record',
    ...TENANT, permissions: [C.manageReturns],
  },
  {
    path: '/returns/:id', title: 'Return Details', keywords: 'return detail',
    ...TENANT, permissions: [C.viewReturns],
  },
  {
    path: '/bills', title: 'Bills', navLabel: 'Bills', group: 'Operations',
    icon: 'CurrencyCircleDollar', keywords: 'bills invoice payment',
    ...TENANT, permissions: [C.viewBills],
  },
  {
    path: '/bills/new', title: 'Create Bill', keywords: 'bill create invoice',
    ...TENANT, permissions: [C.manageBills],
  },
  {
    path: '/bills/:id', title: 'Bill Details', keywords: 'bill detail invoice',
    ...TENANT, permissions: [C.viewBills],
  },
  {
    path: '/statements', title: 'Client Statement', navLabel: 'Client Statement', group: 'Operations',
    icon: 'Wallet', keywords: 'statement client ledger balance',
    ...TENANT, permissions: [C.viewStatements],
  },

  // ── Linen tracking & scanning ───────────────────────────────────────────────
  {
    path: '/linen', title: 'Linen', navLabel: 'Linen', group: 'Linen',
    icon: 'Package', keywords: 'linen tracking dashboard',
    ...TENANT, permissions: [C.viewLinen],
  },
  {
    path: '/linen/inventory', title: 'Linen Inventory', navLabel: 'Inventory', group: 'Linen',
    icon: 'Scan', keywords: 'linen stock inventory',
    ...TENANT, permissions: [C.viewLinen],
  },
  {
    path: '/linen/:id', title: 'Linen Item', keywords: 'linen item detail',
    ...TENANT, permissions: [C.viewLinen],
  },
  {
    path: '/linen/scanner', title: 'Scan Linen', navLabel: 'Scan Linen', group: 'Linen',
    icon: 'Scan', keywords: 'linen scan barcode',
    ...TENANT, permissions: [C.scanLinen],
  },
  {
    path: '/linen/bulk-scan', title: 'Bulk Scan', navLabel: 'Bulk Scan', group: 'Linen',
    icon: 'Scan', keywords: 'linen bulk scan',
    ...TENANT, permissions: [C.scanLinen],
  },
  {
    path: '/linen/session', title: 'Scan Session', navLabel: 'Scan Session', group: 'Linen',
    icon: 'Scan', keywords: 'linen continuous batch scan session',
    ...TENANT, permissions: [C.scanLinen],
  },
  {
    path: '/linen/tags', title: 'Tag Generator', navLabel: 'Tag Generator', group: 'Linen',
    icon: 'FileText', keywords: 'linen tags qr barcode',
    ...TENANT, permissions: [C.manageLinen],
  },

  // ── System ──────────────────────────────────────────────────────────────────
  // Account pages stay open to every authenticated session, including client
  // account roles, so a denied deep link always has a safe place to land.
  { path: '/settings', title: 'Settings', navLabel: 'Settings', group: 'System', icon: 'GearSix', keywords: 'settings preferences' },
  { path: '/profile', title: 'My Profile', navLabel: 'My Profile', group: 'System', icon: 'UserCircle', keywords: 'profile account' },
]

/** The navigation groups, in sidebar order, each with the routes it lists. */
export const NAV_GROUPS: { id: NavGroupId; label: string }[] = [
  { id: 'Overview', label: 'Daily' },
  { id: 'Operations', label: 'The Flow' },
  { id: 'Linen', label: 'Linen' },
  { id: 'System', label: 'System' },
]

function matchesPath(pattern: string, pathname: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return false
  return patternParts.every(
    (part, i) => part.startsWith(':') || part === pathParts[i],
  )
}

function specificity(meta: RouteMeta): number {
  return meta.path.split('/').filter(Boolean).filter((part) => !part.startsWith(':')).length
}

/** Look up a route's metadata by exact path. */
export function routeMeta(path: string): RouteMeta | undefined {
  return ROUTES.find((r) => r.path === path)
}

/** Longest/most specific match, so `/gate-passes/123` resolves to
 *  `/gate-passes/:id` rather than `/gate-passes`, and `/linen/scanner` wins
 *  over `/linen/:id`. */
export function routeMetaForPath(pathname: string): RouteMeta | undefined {
  return ROUTES.filter((r) => matchesPath(r.path, pathname)).sort(
    (a, b) => specificity(b) - specificity(a) || b.path.length - a.path.length,
  )[0]
}

/** The guard/nav/quick-action spec for a path, from the same registry entry. */
export function accessSpecForPath(pathname: string): AccessSpec {
  const meta = routeMetaForPath(pathname)
  if (!meta) return {}
  return {
    permissions: meta.permissions,
    roles: meta.roles,
    adminOnly: meta.adminOnly,
    platformOnly: meta.platformOnly,
    tenantOnly: meta.tenantOnly,
  }
}
