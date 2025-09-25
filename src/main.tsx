
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { ThemeProvider } from 'next-themes'
import { StoryGenerationManager } from './services/stories/StoryGenerationManager.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem={true}
    >
      <SupabaseAuthProvider>
        <StoryGenerationManager>
          <App />
        </StoryGenerationManager>
      </SupabaseAuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
