import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

function initTheme() {
  try {
    const stored = localStorage.getItem('theme-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      const theme = parsed.state?.theme || 'system'
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
      if (resolved === 'luxury') {
        document.documentElement.classList.add('luxury', 'dark')
      } else {
        document.documentElement.classList.add(resolved)
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light')
    }
  } catch {
    document.documentElement.classList.add('light')
  }
}

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
