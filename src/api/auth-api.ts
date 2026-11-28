import axios from 'axios'
import { getActiveToken } from '../lib/auth-token'
import { attachResponseInterceptor } from './interceptors'

const authApi = axios.create({
  // Set VITE_USER_API_URL in the deployment environment. The relative value is
  // only a same-origin path for local proxies — no service host is hardcoded.
  baseURL: import.meta.env.VITE_USER_API_URL ?? '/api/user',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

authApi.interceptors.request.use((config) => {
  const token = getActiveToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

attachResponseInterceptor(authApi)

export default authApi
