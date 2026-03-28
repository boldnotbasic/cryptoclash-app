'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import nlTranslations from '@/locales/nl.json'
import enTranslations from '@/locales/en.json'
import frTranslations from '@/locales/fr.json'

type Language = 'nl' | 'en' | 'fr'

type TranslationValue = string | Record<string, string>
type TranslationSection = Record<string, TranslationValue>
type Translations = Record<string, TranslationSection>

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  translations: { nl: Translations; en: Translations; fr: Translations }
  reloadTranslations: () => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const STORAGE_KEY = 'cryptoclash_language'

// Load translations statically to prevent blank screen on initial render
const staticTranslations = {
  nl: nlTranslations as unknown as Translations,
  en: enTranslations as unknown as Translations,
  fr: frTranslations as unknown as Translations
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY) as Language | null
        if (stored === 'nl' || stored === 'en' || stored === 'fr') return stored
      }
    } catch {}
    return 'nl'
  })
  const [translations, setTranslations] = useState<{ nl: Translations; en: Translations; fr: Translations }>(staticTranslations)

  const loadTranslations = useCallback(async () => {
    // Translations are loaded statically via import, no API fetch needed
    // This function exists for compatibility with reloadTranslations
    try {
      const [nlRes, enRes, frRes] = await Promise.all([
        fetch('/api/translations?lang=nl', { cache: 'no-store' }),
        fetch('/api/translations?lang=en', { cache: 'no-store' }),
        fetch('/api/translations?lang=fr', { cache: 'no-store' })
      ])
      const nl = await nlRes.json()
      const en = await enRes.json()
      const fr = await frRes.json()
      // Only update if we got actual data
      if (nl && Object.keys(nl).length > 0) {
        setTranslations({ nl, en, fr })
      }
    } catch {
      console.warn('Could not reload translations from API, using static translations')
    }
  }, [])

  useEffect(() => {
    // Optionally reload from API for admin-edited translations
    loadTranslations()
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    if (stored === 'nl' || stored === 'en' || stored === 'fr') {
      setLanguageState(stored)
    }

    // Listen for room-wide language updates from server
    const handleRoomLanguageUpdate = (event: CustomEvent) => {
      const { language } = event.detail
      console.log('🌐 Room language update received in context:', language)
      
      // Check if user has manually set a language preference
      const userPreference = localStorage.getItem(STORAGE_KEY + '_user_override')
      
      // Only apply room language if user hasn't set their own preference
      if (!userPreference && (language === 'nl' || language === 'en' || language === 'fr')) {
        console.log('🌐 Applying room language:', language)
        setLanguageState(language)
        // Store as room default (not user override)
        localStorage.setItem(STORAGE_KEY, language)
      } else {
        console.log('🌐 User has language override, keeping:', userPreference || stored)
      }
    }

    window.addEventListener('roomLanguageUpdate', handleRoomLanguageUpdate as EventListener)
    
    return () => {
      window.removeEventListener('roomLanguageUpdate', handleRoomLanguageUpdate as EventListener)
    }
  }, [loadTranslations])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    localStorage.setItem(STORAGE_KEY + '_user_override', '1')
  }, [])

  const t = useCallback((key: string): string => {
    const parts = key.split('.')
    const current = translations[language] as Record<string, unknown>
    if (!current) return key

    let value: unknown = current
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part]
      } else {
        return key
      }
    }

    if (typeof value === 'string') return value

    // Fallback to NL if translation missing
    if (language !== 'nl') {
      let fallback: unknown = translations['nl'] as Record<string, unknown>
      for (const part of parts) {
        if (fallback && typeof fallback === 'object') {
          fallback = (fallback as Record<string, unknown>)[part]
        } else {
          return key
        }
      }
      if (typeof fallback === 'string') return fallback
    }

    return key
  }, [language, translations])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations, reloadTranslations: loadTranslations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
