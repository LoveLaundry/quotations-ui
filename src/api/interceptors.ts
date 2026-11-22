import type { AxiosError, AxiosInstance } from 'axios'
import { withNestedItems } from '../lib/api-normalise'
import { getActiveToken, isTokenExpired, notifySessionExpired } from '../lib/auth-token'

/**
 * Reduce any thrown value to a human-readable message.
 *
 * FastAPI reports validation problems as a `detail` that is sometimes a string
 * and sometimes an array of objects. Rendering the latter directly produces
 * "[object Object]" in the UI, so it is serialised here instead.
 *
 * Exported for clients that must normalize messages without running the
 * session-expiry path.
 */
export function extractResponseMessage(err: unknown): string {
  const detail = (err as AxiosError | undefined)?.response?.data as
    | { detail?: unknown }
    | undefined
  const value = detail?.detail
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value)
      if (serialized && serialized !== '{}') return serialized
    } catch {
      /* ignore */
    }
  }
  if (err instanceof Error && err.message) return err.message
  return 'Request failed'
}

function extractMessage(err: AxiosError): string {
  return extractResponseMessage(err)
}

/**
 * Attaches a response interceptor that:
 *  - Repairs omitted collections before any consumer sees the payload.
 *  - Never force-reloads the page or hijacks login errors.
 *  - On 401, ends the session ONLY when the token that was sent is expired or
 *    missing. A 401 from a healthy token is a service/permission error, not a
 *    logout — destroying the session there caused users to be signed out at
 *    random after login or on the next click.
 *  - Normalizes error messages so they are never "[object Object]".
 */
export function attachResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => {
      // The API is free to answer `null` instead of `[]`, and a row can come
      // back without its `items` array even though the types say otherwise.
      // Repaired once here, centrally, because a per-page `?? []` at every
      // access is exactly the guard that gets forgotten — and one missed
      // `null.items` throws into the route error boundary and replaces the
      // whole page with "Error 500".
      if (response.data != null && typeof response.data === 'object') {
        response.data = withNestedItems(response.data)
      }
      return response
    },
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        // Classify the endpoint *before* touching storage. A rejected login is
        // itself a 401; tearing down the session there would log the user out
        // for typing the wrong password while signed in on another tab.
        const url = (err.config?.url ?? '').toLowerCase()
        const isAuthCall =
          url.includes('/auth/login') ||
          url.includes('/token') ||
          url.includes('/auth/')

        if (!isAuthCall) {
          // Use the token actually attached to this request (a support token
          // can override the stored one) and require it to be genuinely
          // expired before ending the session. This single gate is the fix
          // for intermittent logouts caused by transient 401s from the many
          // backend services this app talks to.
          const authHeader = err.config?.headers?.Authorization
          const sentToken =
            typeof authHeader === 'string'
              ? authHeader.replace(/^Bearer\s+/i, '')
              : getActiveToken()

          if (isTokenExpired(sentToken)) {
            notifySessionExpired(sentToken)
          }
          // Otherwise: keep the session and let the page show the error.
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
