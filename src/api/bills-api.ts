import axios from 'axios'
import { attachResponseInterceptor } from './interceptors'

const billsApi = axios.create({
  baseURL: import.meta.env.VITE_BILLS_API_URL ?? 'http://localhost:8001',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

billsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ll_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

attachResponseInterceptor(billsApi)

export default billsApi