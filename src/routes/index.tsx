import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/app-shell'
import { ProtectedRoute } from '../components/layout/protected-route'
import { LandingRedirect } from '../components/layout/landing-redirect'
// Eager: must always be available to render if a lazy chunk fails to load.
import ErrorPage from '../features/quotations/pages/error-page'

// Route-level code splitting. Every page is loaded on demand so the initial
// bundle only contains the shell + login.

const LoginPage = lazy(() => import('../features/auth/pages/login-page'))
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

export const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
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
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <LandingRedirect /> },

          // Today — the hub of the flow
          { path: 'today', element: <TodayPage /> },
          { path: 'today-sheet', element: <TodaySheetPage /> },
          { path: 'notifications', element: <NotificationsPage /> },

          // Receive → deliver → return → bill
          { path: 'gate-passes', element: <GatePassesPage /> },
          { path: 'gate-passes/new', element: <CreateGatePassPage /> },
          { path: 'gate-passes/:id', element: <GatePassDetailPage /> },
          { path: 'deliveries', element: <DeliveriesPage /> },
          { path: 'deliveries/new', element: <CreateDeliveryPage /> },
          { path: 'deliveries/:id', element: <DeliveryDetailPage /> },
          { path: 'hotel-linen-flow', element: <HotelLinenFlowPage /> },
          { path: 'returns', element: <ReturnsPage /> },
          { path: 'returns/new', element: <CreateReturnPage /> },
          { path: 'returns/:id', element: <ReturnDetailPage /> },
          { path: 'statements', element: <StatementsPage /> },
          { path: 'bills', element: <BillsListPage /> },
          { path: 'bills/new', element: <CreateBillPage /> },
          { path: 'bills/:id', element: <BillDetailPage /> },

          // Linen tracking & scanning
          { path: 'linen', element: <LinenDashboard /> },
          { path: 'linen/inventory', element: <LinenInventory /> },
          { path: 'linen/:id', element: <LinenProfile /> },
          { path: 'linen/scanner', element: <LinenScanner /> },
          { path: 'linen/bulk-scan', element: <LinenBulkScan /> },
          { path: 'linen/session', element: <LinenSession /> },
          { path: 'linen/tags', element: <LinenTagGenerator /> },

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
