import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/app-shell'
import DashboardPage from '../features/quotations/pages/dashboard-page'
import QuotationsPage from '../features/quotations/pages/quotations-page'
import QuotationDetailPage from '../features/quotations/pages/quotation-detail-page'
import QuotationFormPage from '../features/quotations/pages/quotation-form-page'
import CategoriesPage from '../features/quotations/pages/categories-page'
import SettingsPage from '../features/quotations/pages/settings-page'
import NotFoundPage from '../features/quotations/pages/not-found-page'
import BillsListPage from '../features/quotations/pages/bills-list-page'
import CreateBillPage from '../features/quotations/pages/create-bill-page'
import BillDetailPage from '../features/quotations/pages/bill-detail-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'quotations', element: <QuotationsPage /> },
      { path: 'quotations/new', element: <QuotationFormPage /> },
      { path: 'quotations/:id', element: <QuotationDetailPage /> },
      { path: 'quotations/:id/edit', element: <QuotationFormPage /> },
      { path: 'bills', element: <BillsListPage /> },
      { path: 'bills/new', element: <CreateBillPage /> },
      { path: 'bills/:id', element: <BillDetailPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])