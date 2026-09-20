import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ui/error-boundary'

// ---------------------------------------------------------------------------
// Stale-chunk recovery: when the app is open in a tab while a new deploy lands,
// the old index.html references chunk files that no longer exist, so the lazy
// import() 404s ("Failed to fetch dynamically imported module"). Vite's runtime
// fires a cancelable 'vite:preloadError' in that case — we swallow it and do one
// clean hard reload so the browser picks up the fresh index.html and new hashes.
// ---------------------------------------------------------------------------
const RECOVERY_KEY = 'll_stale_reload'
const staleReload = (): void => {
  // Guard against reload loops if the new deploy is also broken.
  try {
    if (sessionStorage.getItem(RECOVERY_KEY) === '1') return
    sessionStorage.setItem(RECOVERY_KEY, '1')
  } catch {
    /* sessionStorage unavailable — proceed anyway (single reload still helps) */
  }
  window.location.replace(window.location.pathname + window.location.search + window.location.hash)
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  staleReload()
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason
  const detail = reason instanceof Error ? reason.message : String(reason ?? '')
  if (detail.includes('Failed to fetch dynamically imported module')) {
    event.preventDefault()
    staleReload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)