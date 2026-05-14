import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { ThemeProvider } from '@/components/theme/theme-provider.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
