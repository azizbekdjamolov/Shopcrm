import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'luxury' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolved: 'light' | 'luxury' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'luxury' | 'dark') {
  const root = document.documentElement
  root.classList.remove('light', 'luxury', 'dark')
  if (resolved === 'luxury') {
    root.classList.add('luxury', 'dark')
  } else {
    root.classList.add(resolved)
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolved: getSystemTheme(),

      setTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        applyTheme(resolved)
        set({ theme, resolved })
      },

      toggleTheme: () => {
        const { resolved } = get()
        const newResolved = resolved === 'light' ? 'luxury' : resolved === 'luxury' ? 'dark' : 'light'
        applyTheme(newResolved)
        set({ theme: newResolved, resolved: newResolved })
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            const resolved = state.theme === 'system' ? getSystemTheme() : state.theme
            applyTheme(resolved)
            state.resolved = resolved
          }
        }
      },
    }
  )
)
