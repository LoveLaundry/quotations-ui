import type { LucideIcon } from 'lucide-react'
import {
  ArrowUp, BadgeCheck, Bell, BookOpen, CalendarRange, CheckSquare, ChevronDown, CircleAlert,
  ClipboardList, Clock3, Copy, Database, Eye, FileJson, FileSpreadsheet,
  Gauge, Keyboard, Layers3, ListFilter, ListTree, LockKeyhole, Menu, MonitorSmartphone,
  MoonStar, PanelLeftClose, RefreshCw, Rows3, Search, ShieldCheck, Sparkles, Table2,
  Trash2, Type, WifiOff, FileText as FileTextIcon, LogOut as LogOutIcon,
} from 'lucide-react'

export type FeatureArea = 'shell' | 'table' | 'form' | 'auth' | 'data' | 'accessibility' | 'system'

export interface FeatureDefinition {
  id: number
  title: string
  description: string
  primaryFile: string
  area: FeatureArea
  icon: LucideIcon
  shortcut?: string
}

const f = (
  id: number,
  area: FeatureArea,
  title: string,
  description: string,
  primaryFile: string,
  icon: LucideIcon,
  shortcut?: string,
): FeatureDefinition => ({ id, area, title, description, primaryFile, icon, shortcut })

const FEATURE_SOURCE: FeatureDefinition[] = [
  f(1, 'shell', 'Document title sync', 'The active route title is written to document.title with the LoveLaundry suffix.', 'src/features/feature-pack/hooks.ts', FileTextIcon),
  f(2, 'accessibility', 'Skip-to-content link', 'A focus-only link jumps past the shell straight to the main landmark.', 'src/features/feature-pack/components.tsx', ArrowUp),
  f(3, 'shell', 'Sticky header shadow', 'The top bar gains a hairline shadow only after the page is scrolled.', 'src/components/layout/top-bar.tsx', Layers3),
  f(4, 'accessibility', 'Mobile drawer focus trap', 'The navigation drawer traps Tab focus and restores it on close.', 'src/components/layout/sidebar.tsx', Menu),
  f(5, 'shell', 'Drawer closes on route change', 'Any navigation dismisses the mobile drawer without an extra state flag.', 'src/components/layout/sidebar.tsx', Menu),
  f(6, 'accessibility', 'Navigation aria-current', 'NavLink exposes the current page to assistive technology with aria-current.', 'src/components/layout/sidebar.tsx', BadgeCheck),
  f(7, 'shell', 'Persisted sidebar collapse', 'Desktop rail collapse state survives reloads in local storage.', 'src/components/layout/app-shell.tsx', PanelLeftClose),
  f(8, 'shell', 'Back-to-top button', 'A restrained floating control appears after one viewport of scrolling.', 'src/features/feature-pack/components.tsx', ArrowUp),
  f(9, 'shell', 'Route progress bar', 'A two-phase progress line indicates lazy route chunk loading.', 'src/components/layout/app-shell.tsx', Gauge),
  f(10, 'shell', 'Command palette', 'Ctrl/Cmd+K opens the guarded page and quotation search from anywhere.', 'src/features/feature-pack/FeatureProvider.tsx', Search, 'Ctrl K'),
  f(11, 'accessibility', 'Keyboard shortcut help', 'A dialog lists every global shortcut; press ? from anywhere.', 'src/features/feature-pack/components.tsx', Keyboard, '?'),
  f(12, 'accessibility', 'Reduced-motion aware', 'OS reduced-motion and the in-app toggle both disable route and overlay motion.', 'src/features/feature-pack/hooks.ts', MoonStar),
  f(13, 'table', 'Debounced table search', 'Queries update the table after a short debounce instead of on each keystroke.', 'src/features/feature-pack/hooks.ts', Search),
  f(14, 'table', 'Status filter', 'Quotations filter by order status with live counts on every chip.', 'src/features/quotations/pages/quotations-page.tsx', ListFilter),
  f(15, 'table', 'Date-range filter', 'From/to date inputs narrow the table by updated date, inclusive of the end day.', 'src/features/feature-pack/components.tsx', CalendarRange),
  f(16, 'table', 'Sortable columns', 'Column headers cycle ascending/descending with an aria-sort announcement.', 'src/features/feature-pack/components.tsx', Rows3),
  f(17, 'table', 'Column visibility', 'A menu hides and restores non-essential columns per table.', 'src/features/feature-pack/components.tsx', Eye),
  f(18, 'table', 'Table density toggle', 'Comfortable and compact row density is shared with the app shell.', 'src/features/feature-pack/components.tsx', Rows3),
  f(19, 'table', 'Row selection', 'Individual rows can be selected for batch operations.', 'src/features/feature-pack/components.tsx', CheckSquare),
  f(20, 'table', 'Select-all indeterminate', 'The header checkbox reflects all, some or none of the visible rows.', 'src/features/feature-pack/components.tsx', CheckSquare),
  f(21, 'table', 'Bulk action bar', 'A contextual bar offers export and clear for the selected rows.', 'src/features/feature-pack/components.tsx', CheckSquare),
  f(22, 'table', 'CSV export', 'Selected or filtered rows download as a formula-safe CSV file.', 'src/components/ui/export-button.tsx', FileSpreadsheet),
  f(23, 'table', 'JSON export', 'The same row set downloads as labelled JSON.', 'src/components/ui/export-button.tsx', FileJson),
  f(24, 'table', 'Copy row ID', 'Each row exposes a labelled button that copies its record ID.', 'src/features/feature-pack/components.tsx', Copy),
  f(25, 'table', 'Page-size selector', 'Operators choose 10, 25, 50 or 100 rows per page.', 'src/features/feature-pack/components.tsx', Rows3),
  f(26, 'table', 'Pagination range clamp', 'Out-of-range offsets are clamped to the last real page after filtering.', 'src/features/feature-pack/utils.ts', ListFilter),
  f(27, 'table', 'Sticky table header', 'The ledger header stays visible while long lists scroll.', 'src/components/ui/data-table.tsx', Table2),
  f(28, 'table', 'Responsive card fallback', 'Below md the ledger becomes a tappable record-card list.', 'src/components/ui/data-table.tsx', MonitorSmartphone),
  f(29, 'table', 'Empty state with action', 'Filtered and unfiltered empties each offer the next useful action.', 'src/features/quotations/pages/quotations-page.tsx', ClipboardList),
  f(30, 'table', 'Skeleton loading rows', 'A shape-matched skeleton replaces the table while data loads.', 'src/components/ui/skeleton.tsx', Rows3),
  f(31, 'table', 'Inline error and retry', 'Load failures show a normalised message with a backoff-aware retry.', 'src/features/feature-pack/components.tsx', RefreshCw),
  f(32, 'table', 'Row detail drawer', 'A side drawer summarises the selected record without leaving the list.', 'src/features/feature-pack/components.tsx', Eye),
  f(33, 'form', 'Required-field markers', 'Required fields show an asterisk and an accessible required state.', 'src/features/feature-pack/components.tsx', CircleAlert),
  f(34, 'form', 'Blur validation', 'Fields validate when they lose focus, not while the user is typing.', 'src/features/quotations/pages/quotation-form-page.tsx', CircleAlert),
  f(35, 'form', 'Submit disabled until valid', 'The primary action unlocks only when the form passes validation.', 'src/features/quotations/pages/quotation-form-page.tsx', LockKeyhole),
  f(36, 'form', 'Submit-once guard', 'A ref guard and pending state prevent double submits.', 'src/features/feature-pack/hooks.ts', LockKeyhole),
  f(37, 'form', 'Draft autosave', 'In-progress forms are persisted under a session-scoped key.', 'src/features/feature-pack/hooks.ts', Database),
  f(38, 'form', 'Draft restore banner', 'A restored draft is announced with a one-click discard action.', 'src/features/feature-pack/components.tsx', Database),
  f(39, 'form', 'Reset form', 'A labelled reset action restores pristine defaults.', 'src/features/feature-pack/components.tsx', RefreshCw),
  f(40, 'form', 'Character counter', 'Long text fields show a live character count.', 'src/features/feature-pack/components.tsx', Type),
  f(41, 'form', 'Currency formatting', 'Money uses the Sri Lankan LKR formatter everywhere it is shown.', 'src/features/feature-pack/utils.ts', BadgeCheck),
  f(42, 'form', 'Number formatting', 'Counts and quantities use the en-LK locale formatter.', 'src/features/feature-pack/utils.ts', BadgeCheck),
  f(43, 'form', 'Date formatting', 'Dates render in Asia/Colombo with one shared formatter.', 'src/features/feature-pack/utils.ts', CalendarRange),
  f(44, 'form', 'Duplicate-row detection', 'Repeated item names are flagged before a quotation is saved.', 'src/features/quotations/pages/quotation-form-page.tsx', Layers3),
  f(45, 'form', 'Field help tooltips', 'Hover- and focus-safe tooltips explain non-obvious fields.', 'src/features/feature-pack/components.tsx', CircleAlert),
  f(46, 'form', 'Optimistic create/update', 'Writes update the visible list immediately and reconcile on response.', 'src/features/feature-pack/hooks.ts', Sparkles),
  f(47, 'form', 'Confirm destructive action', 'Deletes require an explicit confirmation naming the record.', 'src/components/ui/confirm-dialog.tsx', Trash2),
  f(48, 'form', 'Success toasts', 'One normalised toast helper confirms every completed write.', 'src/features/feature-pack/hooks.ts', BadgeCheck),
  f(49, 'form', 'Normalised error messages', 'API errors are reduced to one calm, actionable sentence.', 'src/features/feature-pack/utils.ts', CircleAlert),
  f(50, 'form', 'Multi-step progress', 'Client, items and review steps are shown as a compact progress rail.', 'src/features/feature-pack/components.tsx', ListTree),
  f(51, 'form', 'Collapsible form sections', 'Optional specification blocks collapse to keep long forms scannable.', 'src/features/feature-pack/components.tsx', ChevronDown),
  f(52, 'form', 'Autosave indicator', 'A quiet saved/saving indicator reports draft persistence.', 'src/features/feature-pack/components.tsx', Database),
  f(53, 'auth', 'Multi-laundry choice', 'Multi-laundry users see a scoped choice menu with active state.', 'src/components/layout/laundry-switcher.tsx', Layers3),
  f(54, 'auth', 'Suspended association disabled', 'Suspended or archived entities cannot be entered from the registry.', 'src/features/platform/components/entity-registry-page.tsx', LockKeyhole),
  f(55, 'auth', 'Role-specific labels', 'Generic role IDs are rendered as human labels in the shell and registry.', 'src/features/feature-pack/utils.ts', BadgeCheck),
  f(56, 'auth', 'Switch laundry without reload', 'A scope swap updates the token, cache and landing route in place.', 'src/components/layout/laundry-switcher.tsx', RefreshCw),
  f(57, 'auth', 'Remember last laundry', 'The last chosen laundry is remembered per signed-in user.', 'src/components/layout/laundry-switcher.tsx', Database),
  f(58, 'auth', 'Clear stale session on 401', 'Only a provably expired or absent token clears the stored session.', 'src/lib/auth-token.ts', ShieldCheck),
  f(59, 'auth', 'Session expiry warning', 'A banner warns shortly before expiry and offers a clean sign-out.', 'src/features/feature-pack/components.tsx', Clock3),
  f(60, 'auth', 'Show/hide password', 'A labelled toggle reveals and masks the password field.', 'src/features/auth/pages/login-page.tsx', Eye),
  f(61, 'auth', 'Password strength meter', 'Setup mode shows a four-step strength meter and plain-language label.', 'src/features/feature-pack/components.tsx', Gauge),
  f(62, 'auth', 'Registration validation', 'Setup fields validate username, display name and matching passwords.', 'src/features/feature-pack/utils.ts', CheckSquare),
  f(63, 'auth', 'Fixed client type', 'Quotations UI declares a fixed LAUNDRY client type and never shows a switcher.', 'src/features/feature-pack/utils.ts', ShieldCheck),
  f(64, 'auth', 'Support exit action', 'Support sessions expose an always-available, audited exit control.', 'src/components/layout/top-bar.tsx', LockKeyhole),
  f(65, 'auth', 'Scope badge', 'The active laundry or entity scope is shown as a restrained badge.', 'src/features/feature-pack/components.tsx', ShieldCheck),
  f(66, 'auth', 'Safe sign-out', 'Sign-out asks for confirmation unless it is ending a support session.', 'src/components/layout/top-bar.tsx', LogOutIcon),
  f(67, 'auth', 'Last sign-in info', 'The account menu shows when this device last signed in.', 'src/components/layout/top-bar.tsx', Clock3),
  f(68, 'accessibility', 'Aria-live announcements', 'Route, save and error events are announced in a polite live region.', 'src/features/feature-pack/components.tsx', BookOpen),
  f(69, 'accessibility', 'Focus-visible rings', 'A single tokenised focus ring covers every interactive element.', 'src/index.css', Eye),
  f(70, 'accessibility', 'Labelled icon buttons', 'Every icon-only control carries an explicit accessible name.', 'src/features/feature-pack/components.tsx', BadgeCheck),
  f(71, 'accessibility', 'Keyboard row activation', 'Table rows activate with Enter or Space from the keyboard.', 'src/components/ui/data-table.tsx', Keyboard),
  f(72, 'accessibility', 'Escape closes overlays', 'Escape dismisses the panel, help dialog and transient banners.', 'src/features/feature-pack/FeatureProvider.tsx', Keyboard),
  f(73, 'accessibility', 'Modal focus restore', 'Opening an overlay remembers and restores the previously focused element.', 'src/features/feature-pack/hooks.ts', Keyboard),
  f(74, 'accessibility', 'Screen-reader-only text', 'A shared visually-hidden primitive labels captions and icon controls.', 'src/features/feature-pack/components.tsx', BookOpen),
  f(75, 'accessibility', 'High-contrast mode', 'A toggle switches between the standard and contrast palettes.', 'src/features/feature-pack/FeatureProvider.tsx', Sparkles),
  f(76, 'accessibility', 'Large-text toggle', 'The Aa control switches to the largest accessible type scale.', 'src/components/layout/top-bar.tsx', Type),
  f(77, 'accessibility', 'Truncated text tooltip', 'Clamped values reveal their full text on hover and focus.', 'src/features/feature-pack/components.tsx', Eye),
  f(78, 'accessibility', 'Semantic landmarks', 'Header, main and navigation landmarks wrap every shell screen.', 'src/components/layout/app-shell.tsx', Layers3),
  f(79, 'accessibility', 'Table captions', 'Every ledger carries a visually hidden, count-aware caption.', 'src/components/ui/data-table.tsx', Table2),
  f(80, 'accessibility', 'Form error summary', 'Validation failures are listed once above the submit row.', 'src/features/feature-pack/components.tsx', CircleAlert),
  f(81, 'accessibility', 'Skip pagination link', 'A link after the table jumps keyboard users to the pager.', 'src/features/quotations/pages/quotations-page.tsx', ArrowUp),
  f(82, 'system', 'Keyboard refresh/search', 'Alt+R refreshes page data and / focuses the table search.', 'src/features/feature-pack/FeatureProvider.tsx', Keyboard, 'Alt R'),
  f(83, 'data', 'Normalise null arrays', 'Null list payloads become empty arrays before they reach a render.', 'src/features/feature-pack/utils.ts', Database),
  f(84, 'data', 'Aggregate nested items', 'Nested line-item collections are repaired and aggregated safely.', 'src/features/feature-pack/utils.ts', Layers3),
  f(85, 'data', 'Stale-while-revalidate', 'Cached rows paint immediately while a quiet background refresh runs.', 'src/features/feature-pack/hooks.ts', RefreshCw),
  f(86, 'data', 'Retry with backoff', 'Inline retries use exponential, jittered delays instead of tight loops.', 'src/features/feature-pack/hooks.ts', RefreshCw),
  f(87, 'data', 'Timeout messaging', 'Dead requests produce a specific timeout message, never a blank screen.', 'src/features/feature-pack/utils.ts', Clock3),
  f(88, 'system', 'Offline indicator', 'A top-bar state shows when the browser has lost connectivity.', 'src/features/feature-pack/components.tsx', WifiOff),
  f(89, 'system', 'Queued action indicator', 'Pending, syncing and failed offline writes are counted in the shell.', 'src/features/feature-pack/components.tsx', Database),
  f(90, 'data', 'Session-scoped cache keys', 'Every draft and snapshot key includes the active user scope.', 'src/features/feature-pack/utils.ts', ShieldCheck),
  f(91, 'data', 'Cache cleared on sign-out', 'Signing out deletes that user\'s local cache database.', 'src/context/AuthContext.tsx', Trash2),
  f(92, 'system', 'Last-updated timestamp', 'The top bar and table footer report when page data was refreshed.', 'src/components/layout/top-bar.tsx', Clock3),
  f(93, 'system', 'Refresh page data', 'A labelled control refetches all active queries for the current page.', 'src/components/layout/top-bar.tsx', RefreshCw),
  f(94, 'system', 'Error boundary with reset', 'A route-level boundary offers reload and home recovery actions.', 'src/components/ui/error-boundary.tsx', CircleAlert),
  f(95, 'data', 'Response size guard', 'Implausibly large list responses are rejected before rendering.', 'src/features/quotations/services/quotation.service.ts', Database),
  f(96, 'data', 'Idempotency keys', 'Create requests carry a stable payload-derived idempotency header.', 'src/features/quotations/services/quotation.service.ts', ShieldCheck),
  f(97, 'data', 'Rapid-submit dedupe', 'A ref-level lock drops repeated submits before a mutation starts.', 'src/features/feature-pack/hooks.ts', LockKeyhole),
  f(98, 'system', 'Notification count badge', 'The bell shows a capped count with an exact accessible label.', 'src/components/layout/top-bar.tsx', Bell),
  f(99, 'system', 'Notification detail dialog', 'A notification entry opens its record in a focused detail dialog.', 'src/features/quotations/components/notification-detail-dialog.tsx', Bell),
  f(100, 'system', 'Feature manifest panel', 'Ctrl/Cmd+Shift+F opens a searchable catalogue of all 100 delivered features.', 'src/features/feature-pack/FeaturePanel.tsx', BookOpen, 'Ctrl ⇧ F'),
]

export const FEATURES: readonly FeatureDefinition[] = FEATURE_SOURCE

export const FEATURE_COUNT = FEATURES.length

export const FEATURE_AREAS: readonly FeatureArea[] = [
  'shell', 'table', 'form', 'auth', 'accessibility', 'data', 'system',
]

export function featureById(id: number): FeatureDefinition | undefined {
  return FEATURES.find((feature) => feature.id === id)
}

export function featuresByArea(area: FeatureArea): FeatureDefinition[] {
  return FEATURES.filter((feature) => feature.area === area)
}

export function searchFeatures(query: string): FeatureDefinition[] {
  const term = query.trim().toLowerCase()
  if (!term) return [...FEATURES]
  return FEATURES.filter((feature) =>
    `${feature.id} ${feature.title} ${feature.description} ${feature.area} ${feature.primaryFile}`
      .toLowerCase()
      .includes(term),
  )
}
