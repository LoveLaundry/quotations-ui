import { lazy, type ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/app-shell'
import { AccessRoute } from '../components/layout/access-route'
import { LandingRedirect } from '../components/layout/landing-redirect'
import { accessSpecForPath } from '../config/route-meta'
// Eager: must always be available to render if a lazy chunk fails to load.
import ErrorPage from '../features/quotations/pages/error-page'

// Route-level code splitting. Every page is loaded on demand so the initial
// bundle only contains the shell + login.

const LoginPage = lazy(() => import('../features/auth/pages/login-page'))
const GuestQuotationsPage = lazy(() => import('../features/quotations/pages/guest-quotations-page'))
const LinenTrackPage = lazy(() => import('../features/linen/pages/linen-track-page'))

// Daily operations (home)
const TodayPage = lazy(() => import('../features/today/pages/today-page'))
const TodaySheetPage = lazy(() => import('../features/today/pages/today-sheet-page'))

// Operations: receive → deliver → return → bill
const GatePassesPage = lazy(() => import('../features/quotations/pages/gatepasses-page'))
const CreateGatePassPage = lazy(() => import('../features/quotations/pages/create-gatepass-page'))
const GatePassDetailPage = lazy(() => import('../features/quotations/pages/gatepass-detail-page'))
const DeliveriesPage = lazy(() => import('../features/quotations/pages/deliveries-page'))
const CreateDeliveryPage = lazy(() => import('../features/quotations/pages/create-delivery-page'))
const DeliveryDetailPage = lazy(() => import('../features/quotations/pages/delivery-detail-page'))
const HotelLinenFlowPage = lazy(() => import('../features/quotations/pages/hotel-linen-flow-page'))
const StatementsPage = lazy(() => import('../features/quotations/pages/statement-page'))
const ReturnsPage = lazy(() => import('../features/quotations/pages/returns-page'))
const CreateReturnPage = lazy(() => import('../features/quotations/pages/create-return-page'))
const ReturnDetailPage = lazy(() => import('../features/quotations/pages/return-detail-page'))
const BillsListPage = lazy(() => import('../features/quotations/pages/bills-list-page'))
const CreateBillPage = lazy(() => import('../features/quotations/pages/create-bill-page'))
const BillDetailPage = lazy(() => import('../features/quotations/pages/bill-detail-page'))

// Notifications (top bar inbox — gate pass / billing alerts)
const NotificationsPage = lazy(() => import('../features/quotations/pages/notifications-page'))

// Linen tracking & scanning
const LinenDashboard = lazy(() => import('../features/linen/pages/linen-dashboard'))
const LinenInventory = lazy(() => import('../features/linen/pages/linen-inventory'))
const LinenProfile = lazy(() => import('../features/linen/pages/linen-profile'))
const LinenScanner = lazy(() => import('../features/linen/pages/linen-scanner'))
const LinenBulkScan = lazy(() => import('../features/linen/pages/linen-bulk-scan'))
const LinenSession = lazy(() => import('../features/linen/pages/linen-session'))
const LinenTagGenerator = lazy(() => import('../features/linen/pages/linen-tag-generator'))

const SettingsPage = lazy(() => import('../features/quotations/pages/settings-page'))
const ProfilePage = lazy(() => import('../features/quotations/pages/profile-page'))
const NotFoundPage = lazy(() => import('../features/quotations/pages/not-found-page'))

/** Wrap a page in the guard derived from the same route registry that builds
 *  the sidebar and command palette. A link can never offer a page the guard
 *  would bounce, and a forbidden URL can never render its page. */
function guarded(path: string, element: ReactElement) {
  return <AccessRoute spec={accessSpecForPath(path)}>{element}</AccessRoute>
}

export const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    // Public shop price list reached by the "Guest bill pass" button on login.
    path: '/guest/shop',
    element: <GuestQuotationsPage />,
    errorElement: <ErrorPage />,
  },
  {
    // Customer-facing linen lookup; stays public so a hotel can scan a tag.
    path: '/track/linen/:code',
    element: <LinenTrackPage />,
    errorElement: <ErrorPage />,
  },

  // ── Protected routes (require auth) ──────────────────────────────────────────
  {
    // Authentication gate only; each page below adds its own access spec.
    element: <AccessRoute spec={{}} />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <LandingRedirect /> },

          // Today — the hub of the flow
          { path: 'today', element: guarded('/today', <TodayPage />) },
          { path: 'today-sheet', element: guarded('/today-sheet', <TodaySheetPage />) },
          { path: 'notifications', element: guarded('/notifications', <NotificationsPage />) },

          // Receive → deliver → return → bill
          { path: 'gate-passes', element: guarded('/gate-passes', <GatePassesPage />) },
          { path: 'gate-passes/new', element: guarded('/gate-passes/new', <CreateGatePassPage />) },
          { path: 'gate-passes/:id', element: guarded('/gate-passes/:id', <GatePassDetailPage />) },
          { path: 'deliveries', element: guarded('/deliveries', <DeliveriesPage />) },
          { path: 'deliveries/new', element: guarded('/deliveries/new', <CreateDeliveryPage />) },
          { path: 'deliveries/:id', element: guarded('/deliveries/:id', <DeliveryDetailPage />) },
          {
            path: 'hotel-linen-flow',
            element: guarded('/hotel-linen-flow', <HotelLinenFlowPage />),
          },
          { path: 'returns', element: guarded('/returns', <ReturnsPage />) },
          { path: 'returns/new', element: guarded('/returns/new', <CreateReturnPage />) },
          { path: 'returns/:id', element: guarded('/returns/:id', <ReturnDetailPage />) },
          { path: 'statements', element: guarded('/statements', <StatementsPage />) },
          { path: 'bills', element: guarded('/bills', <BillsListPage />) },
          { path: 'bills/new', element: guarded('/bills/new', <CreateBillPage />) },
          { path: 'bills/:id', element: guarded('/bills/:id', <BillDetailPage />) },

          // Linen tracking & scanning
          { path: 'linen', element: guarded('/linen', <LinenDashboard />) },
          { path: 'linen/inventory', element: guarded('/linen/inventory', <LinenInventory />) },
          { path: 'linen/:id', element: guarded('/linen/:id', <LinenProfile />) },
          { path: 'linen/scanner', element: guarded('/linen/scanner', <LinenScanner />) },
          { path: 'linen/bulk-scan', element: guarded('/linen/bulk-scan', <LinenBulkScan />) },
          { path: 'linen/session', element: guarded('/linen/session', <LinenSession />) },
          { path: 'linen/tags', element: guarded('/linen/tags', <LinenTagGenerator />) },

          // Account
          { path: 'settings', element: <SettingsPage /> },
          { path: 'profile', element: <ProfilePage /> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },

  // Catch-all redirect
  { path: '*', element: <Navigate to="/login" replace /> },
])
