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
    },
  },
})

function App() {

  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(()=>{
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

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
