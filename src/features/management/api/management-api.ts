import axios from 'axios'

const mgmtApi = axios.create({
  baseURL: import.meta.env.VITE_MGMT_API_URL ?? 'http://localhost:8001',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

mgmtApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ll_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Customers ─────────────────────────────────────────────────────────────
export const customersApi = {
  list: (search = '') => mgmtApi.get(`/api/customers?search=${search}`),
  summary: () => mgmtApi.get('/api/customers/summary'),
  get: (id: string) => mgmtApi.get(`/api/customers/${id}`),
  create: (data: any) => mgmtApi.post('/api/customers', data),
  update: (id: string, data: any) => mgmtApi.put(`/api/customers/${id}`, data),
  remove: (id: string) => mgmtApi.delete(`/api/customers/${id}`),
  rates: (id: string) => mgmtApi.get(`/api/customers/${id}/rates`),
  addRate: (id: string, data: any) => mgmtApi.post(`/api/customers/${id}/rates`, data),
  removeRate: (id: string, rid: string) => mgmtApi.delete(`/api/customers/${id}/rates/${rid}`),
}

// ── Items & Categories ────────────────────────────────────────────────────
export const itemsApi = {
  list: (params?: { category_id?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.category_id) q.set('category_id', params.category_id)
    if (params?.search) q.set('search', params.search)
    return mgmtApi.get(`/api/items?${q}`)
  },
  get: (id: string) => mgmtApi.get(`/api/items/${id}`),
  create: (data: any) => mgmtApi.post('/api/items', data),
  update: (id: string, data: any) => mgmtApi.put(`/api/items/${id}`, data),
  remove: (id: string) => mgmtApi.delete(`/api/items/${id}`),
  categories: () => mgmtApi.get('/api/items/categories'),
  createCategory: (data: any) => mgmtApi.post('/api/items/categories', data),
  updateCategory: (id: string, data: any) => mgmtApi.put(`/api/items/categories/${id}`, data),
  removeCategory: (id: string) => mgmtApi.delete(`/api/items/categories/${id}`),
}

// ── Transactions ──────────────────────────────────────────────────────────
export const transactionsApi = {
  list: (params?: any) => {
    const q = new URLSearchParams()
    if (params?.start_date) q.set('start_date', params.start_date)
    if (params?.end_date) q.set('end_date', params.end_date)
    if (params?.customer_id) q.set('customer_id', params.customer_id)
    if (params?.search) q.set('search', params.search)
    if (params?.source) q.set('source', params.source)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return mgmtApi.get(`/api/transactions?${q}`)
  },
  get: (id: string) => mgmtApi.get(`/api/transactions/${id}`),
  create: (data: any) => mgmtApi.post('/api/transactions', data),
  bulkCreate: (data: any) => mgmtApi.post('/api/transactions/bulk', data),
  update: (id: string, data: any) => mgmtApi.put(`/api/transactions/${id}`, data),
  remove: (id: string) => mgmtApi.delete(`/api/transactions/${id}`),
}

// ── Expenses ──────────────────────────────────────────────────────────────
export const expensesApi = {
  list: (params?: any) => {
    const q = new URLSearchParams()
    if (params?.start_date) q.set('start_date', params.start_date)
    if (params?.end_date) q.set('end_date', params.end_date)
    if (params?.category_id) q.set('category_id', params.category_id)
    return mgmtApi.get(`/api/expenses?${q}`)
  },
  summary: (params?: any) => {
    const q = new URLSearchParams()
    if (params?.start_date) q.set('start_date', params.start_date)
    if (params?.end_date) q.set('end_date', params.end_date)
    return mgmtApi.get(`/api/expenses/summary?${q}`)
  },
  create: (data: any) => mgmtApi.post('/api/expenses', data),
  update: (id: string, data: any) => mgmtApi.put(`/api/expenses/${id}`, data),
  remove: (id: string) => mgmtApi.delete(`/api/expenses/${id}`),
  categories: () => mgmtApi.get('/api/expenses/categories'),
  createCategory: (data: any) => mgmtApi.post('/api/expenses/categories', data),
  removeCategory: (id: string) => mgmtApi.delete(`/api/expenses/categories/${id}`),
}

// ── Employees ─────────────────────────────────────────────────────────────
export const employeesApi = {
  list: (search = '') => mgmtApi.get(`/api/employees?search=${search}`),
  get: (id: string) => mgmtApi.get(`/api/employees/${id}`),
  create: (data: any) => mgmtApi.post('/api/employees', data),
  update: (id: string, data: any) => mgmtApi.put(`/api/employees/${id}`, data),
  remove: (id: string) => mgmtApi.delete(`/api/employees/${id}`),
  salaries: (empId: string, year?: number) =>
    mgmtApi.get(`/api/employees/${empId}/salaries${year ? `?year=${year}` : ''}`),
  createSalary: (empId: string, data: any) => mgmtApi.post(`/api/employees/${empId}/salaries`, data),
  updateSalary: (empId: string, salId: string, data: any) =>
    mgmtApi.put(`/api/employees/${empId}/salaries/${salId}`, data),
  attendance: (empId: string, params?: any) => {
    const q = new URLSearchParams()
    if (params?.start_date) q.set('start_date', params.start_date)
    if (params?.end_date) q.set('end_date', params.end_date)
    return mgmtApi.get(`/api/employees/${empId}/attendance?${q}`)
  },
  createAttendance: (empId: string, data: any) => mgmtApi.post(`/api/employees/${empId}/attendance`, data),
}

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: (params?: any) => {
    const q = new URLSearchParams()
    if (params?.customer_id) q.set('customer_id', params.customer_id)
    return mgmtApi.get(`/api/payments?${q}`)
  },
  create: (data: any) => mgmtApi.post('/api/payments', data),
  remove: (id: string) => mgmtApi.delete(`/api/payments/${id}`),
}

// ── Reports ───────────────────────────────────────────────────────────────
export const reportsApi = {
  profitLoss: (params?: any) => {
    const q = new URLSearchParams()
    if (params?.start_date) q.set('start_date', params.start_date)
    if (params?.end_date) q.set('end_date', params.end_date)
    if (params?.customer_id) q.set('customer_id', params.customer_id)
    return mgmtApi.get(`/api/reports/profit-loss?${q}`)
  },
  daily: (date?: string) => mgmtApi.get(`/api/reports/daily${date ? `?report_date=${date}` : ''}`),
  monthly: (year?: number, month?: number) => {
    const q = new URLSearchParams()
    if (year) q.set('year', String(year))
    if (month) q.set('month', String(month))
    return mgmtApi.get(`/api/reports/monthly?${q}`)
  },
  outstanding: () => mgmtApi.get('/api/reports/outstanding'),
}

// ── Import ────────────────────────────────────────────────────────────────
export const importApi = {
  downloadTemplate: () => mgmtApi.get('/api/import/template', { responseType: 'blob' }),
  preview: (formData: FormData) =>
    mgmtApi.post('/api/import/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  execute: (formData: FormData) =>
    mgmtApi.post('/api/import/execute', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  history: () => mgmtApi.get('/api/import/history'),
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => mgmtApi.get('/api/dashboard'),
}

export default mgmtApi
