import type { AccessSpec } from '../lib/access'

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
  /** Whether the route guard should enforce `spec`. Detail/create routes that
   *  inherit their parent's access leave this false. */
  guarded?: boolean
}

export const ROUTES: RouteMeta[] = [
  // ── Overview ────────────────────────────────────────────────────────────────
  { path: '/today', title: 'Daily Operations', navLabel: 'Today', group: 'Overview', icon: 'Lightning', keywords: 'today daily operations home flow' },
  { path: '/today-sheet', title: 'Today Sheet', navLabel: 'Today Sheet', group: 'Overview', icon: 'Table', keywords: 'today sheet daily entry grid expenses' },
  { path: '/notifications', title: 'Notifications', keywords: 'alerts inbox' },

  // ── Operations: the flow ────────────────────────────────────────────────────
  { path: '/gate-passes', title: 'Gate Passes', navLabel: 'Gate Passes', group: 'Operations', icon: 'ClipboardText', keywords: 'gate passes receive incoming', permissions: ['view_gate_passes'] },
  { path: '/gate-passes/new', title: 'New Gate Pass', keywords: 'gate pass new receive', permissions: ['view_gate_passes'] },
  { path: '/deliveries', title: 'Deliveries', navLabel: 'Deliveries', group: 'Operations', icon: 'Truck', keywords: 'deliveries deliver outbound', permissions: ['view_deliveries'] },
  { path: '/deliveries/new', title: 'New Delivery', keywords: 'delivery new deliver', permissions: ['view_deliveries'] },
  { path: '/hotel-linen-flow', title: 'Hotel Linen Flow', navLabel: 'Hotel Linen Flow', group: 'Operations', icon: 'FlowArrow', keywords: 'hotel linen flow balance' },
  { path: '/returns', title: 'Returns', navLabel: 'Returns', group: 'Operations', icon: 'RotateCcw', keywords: 'returns send back', permissions: ['view_gate_passes'] },
  { path: '/returns/new', title: 'Record Return', keywords: 'return new record', permissions: ['view_gate_passes'] },
  { path: '/bills', title: 'Bills', navLabel: 'Bills', group: 'Operations', icon: 'CurrencyCircleDollar', keywords: 'bills invoice payment', permissions: ['view_bills'] },
  { path: '/bills/new', title: 'Create Bill', keywords: 'bill create invoice', permissions: ['view_bills'] },
  { path: '/statements', title: 'Client Statement', navLabel: 'Client Statement', group: 'Operations', icon: 'Wallet', keywords: 'statement client ledger balance', permissions: ['view_bills'] },

  // ── Linen tracking & scanning ───────────────────────────────────────────────
  { path: '/linen', title: 'Linen', navLabel: 'Linen', group: 'Linen', icon: 'Package', keywords: 'linen tracking dashboard' },
  { path: '/linen/inventory', title: 'Linen Inventory', navLabel: 'Inventory', group: 'Linen', icon: 'Scan', keywords: 'linen stock inventory' },
  { path: '/linen/scanner', title: 'Scan Linen', navLabel: 'Scan Linen', group: 'Linen', icon: 'Scan', keywords: 'linen scan barcode' },
  { path: '/linen/bulk-scan', title: 'Bulk Scan', navLabel: 'Bulk Scan', group: 'Linen', icon: 'Scan', keywords: 'linen bulk scan' },
  { path: '/linen/session', title: 'Scan Session', navLabel: 'Scan Session', group: 'Linen', icon: 'Scan', keywords: 'linen continuous batch scan session' },
  { path: '/linen/tags', title: 'Tag Generator', navLabel: 'Tag Generator', group: 'Linen', icon: 'FileText', keywords: 'linen tags qr barcode' },

  // ── System ──────────────────────────────────────────────────────────────────
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

/** Look up a route's metadata by exact path. */
export function routeMeta(path: string): RouteMeta | undefined {
  return ROUTES.find((r) => r.path === path)
}

/** Longest-prefix match, so `/gate-passes/123` resolves to `/gate-passes`. */
export function routeMetaForPath(pathname: string): RouteMeta | undefined {
  const exact = ROUTES.find((r) => r.path === pathname)
  if (exact) return exact
  return ROUTES.filter((r) => r.path !== '/' && pathname.startsWith(r.path + '/')).sort(
    (a, b) => b.path.length - a.path.length,
  )[0]
}
