import { QueryClient, type QueryClientConfig } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider } from 'react-router-dom'
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { router } from './routes'
import './App.css'
import LoveLoader from './components/ui/LoveLoader'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { DefaultsProvider } from './components/ops/defaults-provider'
import { sanitizeScope } from './cache/db'
import { createIndexedDbPersister } from './cache/persister'
import {
  CACHE_MAX_AGE_MS,
  CACHE_VERSION,
  configureQueryDefaults,
  shouldPersistQuery,
} from './cache/cache-config'

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        // Never retry client errors — they won't succeed on retry and a 401
        // would otherwise re-trigger the unauthorized handler repeatedly.
        if (status === 401 || status === 404 || status === 400 || status === 403) {
          return false
        }
        return failureCount < 2
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    },
    mutations: {
      retry: false,
    },
  },
}

const queryClient = new QueryClient(queryClientConfig)

// Per-resource staleness (dashboards short, reference data long) — applied at
// query creation on top of the global default above.
configureQueryDefaults(queryClient)

/**
 * Cache-first data layer backed by the per-user local_cache_db (IndexedDB):
 *
 *  1. On (re)load the persisted React Query snapshot is restored before the
 *     UI needs it, so lists/dashboards paint instantly from local data.
 *  2. Stale queries then refresh from the remote APIs in the background.
 *  3. Cache events re-persist the fresh snapshot (debounced) so local data
 *     always reflects the latest successful API response.
 *
 * The hosted service databases stay the source of truth — this layer is a
 * pure read/perf optimization and never mutates remote state.
 */
function CacheHostProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const scope = sanitizeScope(user?.id ?? '')
  const persister = useMemo(() => createIndexedDbPersister(scope), [scope])
  const prevScope = useRef(scope)

  // On login/logout (scope change) drop whatever another user's session left
  // in the shared in-memory client before the new user's snapshot hydrates.
  useEffect(() => {
    if (prevScope.current !== scope) {
      prevScope.current = scope
      queryClient.clear()
    }
  }, [scope])

  return (
    <PersistQueryClientProvider
      key={scope}
      client={queryClient}
      persistOptions={{
        persister,
        buster: CACHE_VERSION,
        maxAge: CACHE_MAX_AGE_MS,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}

function App() {
  return (
    <CacheHostProvider>
      <ThemeProvider>
        <DefaultsProvider>
          {/* Suspense covers route-level lazy chunks: the loader only shows while
              a page bundle is actually being fetched, removing the old 600ms wait. */}
          <Suspense fallback={<LoveLoader />}>
            <RouterProvider router={router} />
          </Suspense>
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'toast-custom',
              style: {
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
        </DefaultsProvider>
      </ThemeProvider>
    </CacheHostProvider>
  )
}

export default App