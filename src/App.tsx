import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './routes'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
}

export default App
