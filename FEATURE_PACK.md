# Feature Pack — 100 delivered features

This document mirrors `src/features/feature-pack/manifest.ts`. Every entry is a live code path in the app; the in-app catalogue is available with `Ctrl/Cmd+Shift+F`.

1. **Document title sync** — The active route title is written to document.title with the LoveLaundry suffix. · `src/features/feature-pack/hooks.ts`
2. **Skip-to-content link** — A focus-only link jumps past the shell straight to the main landmark. · `src/features/feature-pack/components.tsx`
3. **Sticky header shadow** — The top bar gains a hairline shadow only after the page is scrolled. · `src/components/layout/top-bar.tsx`
4. **Mobile drawer focus trap** — The navigation drawer traps Tab focus and restores it on close. · `src/components/layout/sidebar.tsx`
5. **Drawer closes on route change** — Any navigation dismisses the mobile drawer without an extra state flag. · `src/components/layout/sidebar.tsx`
6. **Navigation aria-current** — NavLink exposes the current page to assistive technology with aria-current. · `src/components/layout/sidebar.tsx`
7. **Persisted sidebar collapse** — Desktop rail collapse state survives reloads in local storage. · `src/components/layout/app-shell.tsx`
8. **Back-to-top button** — A restrained floating control appears after one viewport of scrolling. · `src/features/feature-pack/components.tsx`
9. **Route progress bar** — A two-phase progress line indicates lazy route chunk loading. · `src/components/layout/app-shell.tsx`
10. **Command palette** — Ctrl/Cmd+K opens the guarded page and quotation search from anywhere. · `src/features/feature-pack/FeatureProvider.tsx`
11. **Keyboard shortcut help** — A dialog lists every global shortcut; press ? from anywhere. · `src/features/feature-pack/components.tsx`
12. **Reduced-motion aware** — OS reduced-motion and the in-app toggle both disable route and overlay motion. · `src/features/feature-pack/hooks.ts`
13. **Debounced table search** — Queries update the table after a short debounce instead of on each keystroke. · `src/features/feature-pack/hooks.ts`
14. **Status filter** — Quotations filter by order status with live counts on every chip. · `src/features/quotations/pages/quotations-page.tsx`
15. **Date-range filter** — From/to date inputs narrow the table by updated date, inclusive of the end day. · `src/features/feature-pack/components.tsx`
16. **Sortable columns** — Column headers cycle ascending/descending with an aria-sort announcement. · `src/features/feature-pack/components.tsx`
17. **Column visibility** — A menu hides and restores non-essential columns per table. · `src/features/feature-pack/components.tsx`
18. **Table density toggle** — Comfortable and compact row density is shared with the app shell. · `src/features/feature-pack/components.tsx`
19. **Row selection** — Individual rows can be selected for batch operations. · `src/features/feature-pack/components.tsx`
20. **Select-all indeterminate** — The header checkbox reflects all, some or none of the visible rows. · `src/features/feature-pack/components.tsx`
21. **Bulk action bar** — A contextual bar offers export and clear for the selected rows. · `src/features/feature-pack/components.tsx`
22. **CSV export** — Selected or filtered rows download as a formula-safe CSV file. · `src/components/ui/export-button.tsx`
23. **JSON export** — The same row set downloads as labelled JSON. · `src/components/ui/export-button.tsx`
24. **Copy row ID** — Each row exposes a labelled button that copies its record ID. · `src/features/feature-pack/components.tsx`
25. **Page-size selector** — Operators choose 10, 25, 50 or 100 rows per page. · `src/features/feature-pack/components.tsx`
26. **Pagination range clamp** — Out-of-range offsets are clamped to the last real page after filtering. · `src/features/feature-pack/utils.ts`
27. **Sticky table header** — The ledger header stays visible while long lists scroll. · `src/components/ui/data-table.tsx`
28. **Responsive card fallback** — Below md the ledger becomes a tappable record-card list. · `src/components/ui/data-table.tsx`
29. **Empty state with action** — Filtered and unfiltered empties each offer the next useful action. · `src/features/quotations/pages/quotations-page.tsx`
30. **Skeleton loading rows** — A shape-matched skeleton replaces the table while data loads. · `src/components/ui/skeleton.tsx`
31. **Inline error and retry** — Load failures show a normalised message with a backoff-aware retry. · `src/features/feature-pack/components.tsx`
32. **Row detail drawer** — A side drawer summarises the selected record without leaving the list. · `src/features/feature-pack/components.tsx`
33. **Required-field markers** — Required fields show an asterisk and an accessible required state. · `src/features/feature-pack/components.tsx`
34. **Blur validation** — Fields validate when they lose focus, not while the user is typing. · `src/features/quotations/pages/quotation-form-page.tsx`
35. **Submit disabled until valid** — The primary action unlocks only when the form passes validation. · `src/features/quotations/pages/quotation-form-page.tsx`
36. **Submit-once guard** — A ref guard and pending state prevent double submits. · `src/features/feature-pack/hooks.ts`
37. **Draft autosave** — In-progress forms are persisted under a session-scoped key. · `src/features/feature-pack/hooks.ts`
38. **Draft restore banner** — A restored draft is announced with a one-click discard action. · `src/features/feature-pack/components.tsx`
39. **Reset form** — A labelled reset action restores pristine defaults. · `src/features/feature-pack/components.tsx`
40. **Character counter** — Long text fields show a live character count. · `src/features/feature-pack/components.tsx`
41. **Currency formatting** — Money uses the Sri Lankan LKR formatter everywhere it is shown. · `src/features/feature-pack/utils.ts`
42. **Number formatting** — Counts and quantities use the en-LK locale formatter. · `src/features/feature-pack/utils.ts`
43. **Date formatting** — Dates render in Asia/Colombo with one shared formatter. · `src/features/feature-pack/utils.ts`
44. **Duplicate-row detection** — Repeated item names are flagged before a quotation is saved. · `src/features/quotations/pages/quotation-form-page.tsx`
45. **Field help tooltips** — Hover- and focus-safe tooltips explain non-obvious fields. · `src/features/feature-pack/components.tsx`
46. **Optimistic create/update** — Writes update the visible list immediately and reconcile on response. · `src/features/feature-pack/hooks.ts`
47. **Confirm destructive action** — Deletes require an explicit confirmation naming the record. · `src/components/ui/confirm-dialog.tsx`
48. **Success toasts** — One normalised toast helper confirms every completed write. · `src/features/feature-pack/hooks.ts`
49. **Normalised error messages** — API errors are reduced to one calm, actionable sentence. · `src/features/feature-pack/utils.ts`
50. **Multi-step progress** — Client, items and review steps are shown as a compact progress rail. · `src/features/feature-pack/components.tsx`
51. **Collapsible form sections** — Optional specification blocks collapse to keep long forms scannable. · `src/features/feature-pack/components.tsx`
52. **Autosave indicator** — A quiet saved/saving indicator reports draft persistence. · `src/features/feature-pack/components.tsx`
53. **Multi-laundry choice** — Multi-laundry users see a scoped choice menu with active state. · `src/components/layout/laundry-switcher.tsx`
54. **Suspended association disabled** — Suspended or archived entities cannot be entered from the registry. · `src/features/platform/components/entity-registry-page.tsx`
55. **Role-specific labels** — Generic role IDs are rendered as human labels in the shell and registry. · `src/features/feature-pack/utils.ts`
56. **Switch laundry without reload** — A scope swap updates the token, cache and landing route in place. · `src/components/layout/laundry-switcher.tsx`
57. **Remember last laundry** — The last chosen laundry is remembered per signed-in user. · `src/components/layout/laundry-switcher.tsx`
58. **Clear stale session on 401** — Only a provably expired or absent token clears the stored session. · `src/lib/auth-token.ts`
59. **Session expiry warning** — A banner warns shortly before expiry and offers a clean sign-out. · `src/features/feature-pack/components.tsx`
60. **Show/hide password** — A labelled toggle reveals and masks the password field. · `src/features/auth/pages/login-page.tsx`
61. **Password strength meter** — Setup mode shows a four-step strength meter and plain-language label. · `src/features/feature-pack/components.tsx`
62. **Registration validation** — Setup fields validate username, display name and matching passwords. · `src/features/feature-pack/utils.ts`
63. **Fixed client type** — Quotations UI declares a fixed LAUNDRY client type and never shows a switcher. · `src/features/feature-pack/utils.ts`
64. **Support exit action** — Support sessions expose an always-available, audited exit control. · `src/components/layout/top-bar.tsx`
65. **Scope badge** — The active laundry or entity scope is shown as a restrained badge. · `src/features/feature-pack/components.tsx`
66. **Safe sign-out** — Sign-out asks for confirmation unless it is ending a support session. · `src/components/layout/top-bar.tsx`
67. **Last sign-in info** — The account menu shows when this device last signed in. · `src/components/layout/top-bar.tsx`
68. **Aria-live announcements** — Route, save and error events are announced in a polite live region. · `src/features/feature-pack/components.tsx`
69. **Focus-visible rings** — A single tokenised focus ring covers every interactive element. · `src/index.css`
70. **Labelled icon buttons** — Every icon-only control carries an explicit accessible name. · `src/features/feature-pack/components.tsx`
71. **Keyboard row activation** — Table rows activate with Enter or Space from the keyboard. · `src/components/ui/data-table.tsx`
72. **Escape closes overlays** — Escape dismisses the panel, help dialog and transient banners. · `src/features/feature-pack/FeatureProvider.tsx`
73. **Modal focus restore** — Opening an overlay remembers and restores the previously focused element. · `src/features/feature-pack/hooks.ts`
74. **Screen-reader-only text** — A shared visually-hidden primitive labels captions and icon controls. · `src/features/feature-pack/components.tsx`
75. **High-contrast mode** — A toggle switches between the standard and contrast palettes. · `src/features/feature-pack/FeatureProvider.tsx`
76. **Large-text toggle** — The Aa control switches to the largest accessible type scale. · `src/components/layout/top-bar.tsx`
77. **Truncated text tooltip** — Clamped values reveal their full text on hover and focus. · `src/features/feature-pack/components.tsx`
78. **Semantic landmarks** — Header, main and navigation landmarks wrap every shell screen. · `src/components/layout/app-shell.tsx`
79. **Table captions** — Every ledger carries a visually hidden, count-aware caption. · `src/components/ui/data-table.tsx`
80. **Form error summary** — Validation failures are listed once above the submit row. · `src/features/feature-pack/components.tsx`
81. **Skip pagination link** — A link after the table jumps keyboard users to the pager. · `src/features/quotations/pages/quotations-page.tsx`
82. **Keyboard refresh/search** — Alt+R refreshes page data and / focuses the table search. · `src/features/feature-pack/FeatureProvider.tsx`
83. **Normalise null arrays** — Null list payloads become empty arrays before they reach a render. · `src/features/feature-pack/utils.ts`
84. **Aggregate nested items** — Nested line-item collections are repaired and aggregated safely. · `src/features/feature-pack/utils.ts`
85. **Stale-while-revalidate** — Cached rows paint immediately while a quiet background refresh runs. · `src/features/feature-pack/hooks.ts`
86. **Retry with backoff** — Inline retries use exponential, jittered delays instead of tight loops. · `src/features/feature-pack/hooks.ts`
87. **Timeout messaging** — Dead requests produce a specific timeout message, never a blank screen. · `src/features/feature-pack/utils.ts`
88. **Offline indicator** — A top-bar state shows when the browser has lost connectivity. · `src/features/feature-pack/components.tsx`
89. **Queued action indicator** — Pending, syncing and failed offline writes are counted in the shell. · `src/features/feature-pack/components.tsx`
90. **Session-scoped cache keys** — Every draft and snapshot key includes the active user scope. · `src/features/feature-pack/utils.ts`
91. **Cache cleared on sign-out** — Signing out deletes that user's local cache database. · `src/context/AuthContext.tsx`
92. **Last-updated timestamp** — The top bar and table footer report when page data was refreshed. · `src/components/layout/top-bar.tsx`
93. **Refresh page data** — A labelled control refetches all active queries for the current page. · `src/components/layout/top-bar.tsx`
94. **Error boundary with reset** — A route-level boundary offers reload and home recovery actions. · `src/components/ui/error-boundary.tsx`
95. **Response size guard** — Implausibly large list responses are rejected before rendering. · `src/features/quotations/services/quotation.service.ts`
96. **Idempotency keys** — Create requests carry a stable payload-derived idempotency header. · `src/features/quotations/services/quotation.service.ts`
97. **Rapid-submit dedupe** — A ref-level lock drops repeated submits before a mutation starts. · `src/features/feature-pack/hooks.ts`
98. **Notification count badge** — The bell shows a capped count with an exact accessible label. · `src/components/layout/top-bar.tsx`
99. **Notification detail dialog** — A notification entry opens its record in a focused detail dialog. · `src/features/quotations/components/notification-detail-dialog.tsx`
100. **Feature manifest panel** — Ctrl/Cmd+Shift+F opens a searchable catalogue of all 100 delivered features. · `src/features/feature-pack/FeaturePanel.tsx`

## Current state (2026-11-23)

- **Checkout:** `system-manegment/quotations-ui` is the authoritative web app, on `main`
  (`2de54db`) and pinned at that commit by the root repository. The typo'd
  `system-managment/quotations-ui` twin is legacy and is intentionally not synced.
- **Theme system:** `src/ll-theme.tsx` + `src/ll-design-tokens.css` provide 20
  contrast-checked light/dark presets. The inline script in `index.html` applies the
  saved `lovelaundry-theme` before first paint; legacy `theme-preset` values migrate on
  read. The palette stays inside the approved black / white / red / green system with
  no blue, and the latest token layer includes the sidebar-text contrast fix and
  print-specific overrides.
- **Beyond the 100-item catalogue:** consolidated invoice list and create/detail flows,
  full daily operations sheet, linen live feed / guided scan sessions / QR verification /
  category rules / missing-cycle view, platform laundry registry with support sessions,
  and Dexie-backed offline queues. These are live routes in `src/routes/index.tsx`, not
  planned work.
- **Session hardening:** only provably expired or absent tokens clear the stored session
  (`src/lib/auth-token.ts`); cross-tab events, guarded data fetches on login/guest screens,
  and scoped cache clearing on sign-out are active.
- **Verification:** `npm run build` and `npm test` were run on this checkout — build OK
  (pre-existing CSS-selector and large-chunk warnings) and **60/60 tests passed**. Local
  Node 20.16 is below Vite 8's recommended 20.19+, which produces an engine warning only.
- **Shared theme source:** the hotel and shop portals now import the same `ll-theme.tsx`
  and `ll-design-tokens.css` files from this app, so all three frontends stay visually aligned.
