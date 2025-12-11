'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'nl' | 'en' | 'fr' | 'de'
type Theme = 'dark' | 'light'

interface AppContextType {
  language: Language
  theme: Theme
  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('nl')
  const [theme, setTheme] = useState<Theme>('dark')

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('cryptoclash-language') as Language
    const savedTheme = localStorage.getItem('cryptoclash-theme') as Theme | null
    
    if (savedLanguage) {
      console.log('Loading saved language:', savedLanguage)
      setLanguage(savedLanguage)
    }
    // Only accept the dark theme from storage; ignore/override any saved light theme
    if (savedTheme === 'dark') {
      console.log('Loading saved theme: dark')
      setTheme('dark')
    } else if (savedTheme === 'light') {
      console.log('Ignoring saved light theme, forcing dark theme')
      localStorage.setItem('cryptoclash-theme', 'dark')
      setTheme('dark')
    }
  }, [])

  // Apply theme to document when theme changes
  useEffect(() => {
    console.log('Applying theme:', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme')
      document.body.style.backgroundColor = '#f8fafc'
    } else {
      document.documentElement.classList.remove('light-theme')
      document.body.style.backgroundColor = '#0F0F23'
    }
  }, [theme])

  // Save settings to localStorage when they change
  const handleSetLanguage = (lang: Language) => {
    console.log('Setting language to:', lang)
    setLanguage(lang)
    localStorage.setItem('cryptoclash-language', lang)
  }

  const handleSetTheme = (newTheme: Theme) => {
    console.log('Setting theme to:', newTheme)
    setTheme(newTheme)
    localStorage.setItem('cryptoclash-theme', newTheme)
  }

  return (
    <AppContext.Provider value={{
      language,
      theme,
      setLanguage: handleSetLanguage,
      setTheme: handleSetTheme
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
