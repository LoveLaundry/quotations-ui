import type { AxiosError, AxiosInstance } from 'axios'
import { withNestedItems } from '../lib/api-normalise'
import { getActiveToken } from '../lib/auth-token'

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

/** The bearer token this request was actually sent with, if any. */
function tokenOfRequest(config?: AxiosError['config']): string | null {
  const headers = config?.headers as
    | { Authorization?: string; authorization?: string }
    | undefined
  const raw = headers?.Authorization ?? headers?.authorization
  if (typeof raw !== 'string') return null
  return raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : raw
}

/**
 * Whether a 401 belongs to the session that is currently active.
 *
 * A response is only allowed to end the session if it was rejected by the very
 * token the app is using right now. Anything else — a pre-login fetch that was
 * still in flight when the user signed in, a request fired with no token at
 * all, a queued write replayed after the token changed — is an artefact of an
 * older session, and tearing down the new one over it produced the "signed in,
 * then bounced back to the login page a second later" bug.
 */
function isCurrentSessionFailure(err: AxiosError): boolean {
  return tokenOfRequest(err.config) === getActiveToken()
}

/**
 * Attaches a response interceptor that:
 *  - Repairs omitted collections before any consumer sees the payload.
 *  - Never force-reloads the page or hijacks login errors.
 *  - On 401 (outside auth endpoints) triggers a single clean SPA logout redirect,
 *    but only when the rejected token is still the session's current one.
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
        if (!isAuthCall && isCurrentSessionFailure(err)) {
          localStorage.removeItem('ll_token')
          localStorage.removeItem('ll_user')
          if (!redirecting && unauthorizedHandler) {
            redirecting = true
            unauthorizedHandler()
          }
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
