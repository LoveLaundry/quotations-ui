import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/app-shell'
import DashboardPage from '../features/quotations/pages/dashboard-page'
import QuotationsPage from '../features/quotations/pages/quotations-page'
import QuotationFormPage from '../features/quotations/pages/quotation-form-page'
import QuotationDetailPage from '../features/quotations/pages/quotation-detail-page'
import NotFoundPage from '../features/quotations/pages/not-found-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'quotations', element: <QuotationsPage /> },
      { path: 'quotations/new', element: <QuotationFormPage /> },
      { path: 'quotations/:id/edit', element: <QuotationFormPage /> },
      { path: 'quotations/:id', element: <QuotationDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
