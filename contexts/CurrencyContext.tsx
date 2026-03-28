'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Currency {
  symbol: string
  name: string
  code: string
}

interface CurrencyContextType {
  currency: Currency
  loading: boolean
  reloadCurrency: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>({ symbol: '⚘', name: 'Bloom', code: 'BLOOM' })
  const [loading, setLoading] = useState(true)

  const loadCurrency = async () => {
    try {
      const res = await fetch('/api/currency', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data?.currency) {
          setCurrency(data.currency)
        }
      }
    } catch (error) {
      console.error('Failed to load currency:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCurrency()
    
    // Listen for currency changes from admin panel
    const handleCurrencyChange = () => {
      loadCurrency()
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange)
    }
  }, [])

  const reloadCurrency = async () => {
    await loadCurrency()
  }

  return (
    <CurrencyContext.Provider value={{ currency, loading, reloadCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
