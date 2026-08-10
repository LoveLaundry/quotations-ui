import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_USER_API_URL ?? 'http://localhost:8002',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ll_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

authApi.interceptors.response.use(
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

export default authApi
