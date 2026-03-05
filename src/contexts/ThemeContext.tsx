import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
  dataSaver: boolean
  setDataSaver: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('msce-theme') as Theme) || 'light'
  )
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [dataSaver, setDataSaverState] = useState(
    () => localStorage.getItem('msce-datasaver') === 'true'
  )

  useEffect(() => {
    const apply = (t: 'light' | 'dark') => {
      setResolvedTheme(t)
      document.documentElement.classList.toggle('dark', t === 'dark')
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      apply(theme)
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('data-saver', dataSaver)
  }, [dataSaver])

  const setTheme = (t: Theme) => {
    localStorage.setItem('msce-theme', t)
    setThemeState(t)
  }

  const setDataSaver = (v: boolean) => {
    localStorage.setItem('msce-datasaver', String(v))
    setDataSaverState(v)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, dataSaver, setDataSaver }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
