
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { ThemeProvider } from 'next-themes'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      forcedTheme="light" 
      enableSystem={false}
    >
      <SupabaseAuthProvider>
        <App />
      </SupabaseAuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
