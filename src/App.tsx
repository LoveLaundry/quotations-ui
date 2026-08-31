import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './routes'
import './App.css'
import { useEffect, useState } from 'react'
import LoveLoader from './components/ui/LoveLoader'
import { ThemeProvider } from './context/ThemeContext'

const queryClient = new QueryClient({
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
})

function App() {

  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(()=>{
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        { isLoading && <LoveLoader/> }
        <RouterProvider router={router} />
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
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
