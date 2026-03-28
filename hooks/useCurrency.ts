import { useState, useEffect } from 'react'

interface Currency {
  symbol: string
  name: string
  code: string
}

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>({ symbol: '⚘', name: 'Bloom', code: 'BLOOM' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

    loadCurrency()
  }, [])

  return { currency, loading }
}
