import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/app-shell'
import { ProtectedRoute } from '../components/layout/protected-route'
import { AdminRoute } from '../components/layout/admin-route'
import LoginPage from '../features/auth/pages/login-page'

import DashboardPage from '../features/quotations/pages/dashboard-page'
import BusinessDashboardPage from '../features/quotations/pages/business-dashboard-page'
import QuotationsPage from '../features/quotations/pages/quotations-page'
import QuotationDetailPage from '../features/quotations/pages/quotation-detail-page'
import QuotationFormPage from '../features/quotations/pages/quotation-form-page'
import CategoriesPage from '../features/quotations/pages/categories-page'
import SettingsPage from '../features/quotations/pages/settings-page'
import ProfilePage from '../features/quotations/pages/profile-page'
import NotFoundPage from '../features/quotations/pages/not-found-page'
import BillsListPage from '../features/quotations/pages/bills-list-page'
import CreateBillPage from '../features/quotations/pages/create-bill-page'
import BillDetailPage from '../features/quotations/pages/bill-detail-page'

// Operations pages
import GatePassesPage from '../features/quotations/pages/gatepasses-page'
import CreateGatePassPage from '../features/quotations/pages/create-gatepass-page'
import GatePassDetailPage from '../features/quotations/pages/gatepass-detail-page'
import DeliveriesPage from '../features/quotations/pages/deliveries-page'
import CreateDeliveryPage from '../features/quotations/pages/create-delivery-page'
import DeliveryDetailPage from '../features/quotations/pages/delivery-detail-page'
import ReportsPage from '../features/quotations/pages/reports-page'
import ErrorPage from '../features/quotations/pages/error-page'
import UsersPage from '../features/quotations/pages/users-page'
import GuestQuotationsPage from '../features/quotations/pages/guest-quotations-page'
import DatabaseSyncPage from '../features/quotations/pages/database-sync-page'

export const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/guest/shop',
    element: <GuestQuotationsPage />,
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
          { index: true, element: <DashboardPage /> },
          { path: 'business-dashboard', element: <BusinessDashboardPage /> },

          // Contracts
          { path: 'quotations', element: <QuotationsPage /> },
          { path: 'quotations/new', element: <QuotationFormPage /> },
          { path: 'quotations/:id', element: <QuotationDetailPage /> },
          { path: 'quotations/:id/edit', element: <QuotationFormPage /> },

          // Billing
          { path: 'bills', element: <BillsListPage /> },
          { path: 'bills/new', element: <CreateBillPage /> },
          { path: 'bills/:id', element: <BillDetailPage /> },

          // Gate Passes (Receiving)
          { path: 'gate-passes', element: <GatePassesPage /> },
          { path: 'gate-passes/new', element: <CreateGatePassPage /> },
          { path: 'gate-passes/:id', element: <GatePassDetailPage /> },

          // Deliveries
          { path: 'deliveries', element: <DeliveriesPage /> },
          { path: 'deliveries/new', element: <CreateDeliveryPage /> },
          { path: 'deliveries/:id', element: <DeliveryDetailPage /> },

          // Analytics
          { path: 'reports', element: <ReportsPage /> },

          // System
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },

          // Admin-only routes
          {
            element: <AdminRoute />,
            children: [
              { path: 'users', element: <UsersPage /> },
              { path: 'database-sync', element: <DatabaseSyncPage /> },
            ],
          },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },

  // Catch-all redirect
  { path: '*', element: <Navigate to="/login" replace /> },
])