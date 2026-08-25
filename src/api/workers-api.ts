import axios from 'axios'

function normalizeBaseUrl(url: string): string {
  // Vercel redirects http -> https; preflight requests cannot follow
  // redirects, so force https for any non-local host.
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace('http://', 'https://')
  }
  return url
}

const workersApi = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_WORKERS_API_URL ?? 'http://localhost:8003'),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

workersApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ll_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

workersApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ll_token')
      localStorage.removeItem('ll_user')
      window.location.href = '/login'
    }
    return Promise.reject(new Error(err.response?.data?.detail || err.message || 'Request failed'))
  }
)

export default workersApi
