import type { AxiosError, AxiosInstance } from 'axios'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let redirecting = false

/**
 * Register a handler invoked when the API returns 401 on a non-auth request.
 * The handler should perform a clean SPA redirect to the login page.
 * Resetting the handler (passing null) also clears the one-shot redirect guard.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
  if (handler) redirecting = false
}

function extractMessage(err: AxiosError): string {
  const data = err.response?.data as unknown as { detail?: unknown } | undefined
  const detail = data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (detail && typeof detail === 'object') {
    try {
      const serialized = JSON.stringify(detail)
      if (serialized && serialized !== '{}') return serialized
    } catch {
      /* ignore */
    }
  }
  return err.message || 'Request failed'
}

/**
 * Attaches a response interceptor that:
 *  - Never force-reloads the page or hijacks login errors.
 *  - On 401 (outside auth endpoints) triggers a single clean SPA logout redirect.
 *  - Normalizes error messages so they are never "[object Object]".
 */
export function attachResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('ll_token')
        localStorage.removeItem('ll_user')
        const url = (err.config?.url ?? '').toLowerCase()
        const isAuthCall =
          url.includes('/auth/login') ||
          url.includes('/token') ||
          url.includes('/auth/')
        if (!isAuthCall && !redirecting && unauthorizedHandler) {
          redirecting = true
          unauthorizedHandler()
        }
      }
      // Preserve the original error's shape (including .response) so that
      // React Query's retry policy and other handlers can still read status
      // codes — only normalize the human-readable message.
      const normalized = new Error(extractMessage(err)) as Error & {
        response?: AxiosError['response']
        config?: AxiosError['config']
      }
      normalized.response = err.response
      normalized.config = err.config
      return Promise.reject(normalized)
    }
  )
}
