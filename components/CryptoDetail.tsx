'use client'

import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import DetailChart from './DetailChart'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

interface PriceChange {
  percentage: number
  timestamp: number
}

interface CryptoDetailProps {
  crypto: {
    id: string
    name: string
    symbol: string
    price: number
    change24h: number
    volume: number
    marketCap: number
    color: string
    icon: string
  }
  priceHistory: PriceChange[]
  onBack: () => void
  initialChartPeriod?: 'all' | 'last10' | 'last5'
  externalChartPeriod?: 'all' | 'last10' | 'last5'
  onChartPeriodChange?: (period: 'all' | 'last10' | 'last5') => void
  hidePeriodSelector?: boolean
}


export default function CryptoDetail({ 
  crypto, 
  priceHistory, 
  onBack, 
  initialChartPeriod = 'all',
  externalChartPeriod,
  onChartPeriodChange,
  hidePeriodSelector = false
}: CryptoDetailProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [internalChartPeriod, setInternalChartPeriod] = useState<'all' | 'last10' | 'last5'>(initialChartPeriod || 'all')
  
  // Use external period if provided, otherwise use internal
  const chartPeriod = externalChartPeriod !== undefined ? externalChartPeriod : internalChartPeriod
  const setChartPeriod = onChartPeriodChange || setInternalChartPeriod

  // Filter price history based on selected period
  const getFilteredPriceHistory = (history: PriceChange[]) => {
    if (chartPeriod === 'all') return history
    const limit = chartPeriod === 'last10' ? 10 : 5
    return history.slice(-limit)
  }

  // Calculate percentage change for selected period
  const getPercentageForPeriod = () => {
    if (chartPeriod === 'all') return crypto.change24h
    
    const filteredHistory = getFilteredPriceHistory(priceHistory)
    if (filteredHistory.length === 0) return crypto.change24h
    
    return filteredHistory.reduce((sum, item) => sum + item.percentage, 0)
  }

  const getCryptoImagePath = (symbol: string) => {
    switch (symbol) {
      case 'DSHEEP': return '/dsheep.png'
      case 'LNTR': return '/lentra.png'
      case 'OMLT': return '/omlt.png'
      case 'ORLO': return '/orlo.png'
      case 'REX': return '/rex.png'
      case 'NGT': return '/Nugget.png'
      default: return null
    }
  }

  const periodPercentage = getPercentageForPeriod()
  const isPositive = periodPercentage >= 0
  const imagePath = getCryptoImagePath(crypto.symbol)

  // Calculate min and max prices for the selected period
  const filteredHistory = getFilteredPriceHistory(priceHistory)
  let minPrice = crypto.price
  let maxPrice = crypto.price
  
  if (filteredHistory.length > 0) {
    let workingPrice = crypto.price
    const prices = [workingPrice]
    
    for (let i = filteredHistory.length - 1; i >= 0; i--) {
      const event = filteredHistory[i]
      workingPrice = workingPrice / (1 + event.percentage / 100)
      prices.push(workingPrice)
    }
    
    minPrice = Math.min(...prices)
    maxPrice = Math.max(...prices)
  }

  return (
    <div className="crypto-card border border-neon-purple/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] bg-gradient-to-br from-dark-bg/95 via-dark-bg/92 to-purple-900/20 p-4 w-full">
      <div className="w-full flex flex-col">
        {/* Header: alles op één regel */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {imagePath && (
            <img
              src={imagePath}
              alt={crypto.name}
              className="w-12 h-12 object-contain flex-shrink-0"
            />
          )}
          
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold text-white">{crypto.name}</h1>
            <span className="text-neon-turquoise text-sm font-semibold">{crypto.symbol}</span>
          </div>
          
          <div className="flex items-baseline space-x-2 ml-auto">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(crypto.price, currency.symbol)}
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-md border ${
              isPositive ? 'bg-green-400/10 border-green-400/30 text-green-400' : 'bg-red-400/10 border-red-400/30 text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">
                {isPositive ? '+' : ''}{periodPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Chart - grotere hoogte om ruimte te vullen */}
        <div className="crypto-card border border-neon-purple/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] bg-gradient-to-br from-dark-bg/95 via-dark-bg/92 to-purple-900/20 rounded-xl p-3 mb-2" style={{ height: '400px' }}>
          <DetailChart
            priceHistory={getFilteredPriceHistory(priceHistory)}
            currentPrice={crypto.price}
            showStartPoint={chartPeriod === 'all'}
          />
        </div>

        {/* Period Selector - verborgen als controlled van buitenaf */}
        {!hidePeriodSelector && (
          <div className="flex justify-center space-x-2 mb-3">
            <button
              onClick={() => setChartPeriod('all')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                chartPeriod === 'all'
                  ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                  : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
              }`}
            >
              {t('common.sinceStart')}
            </button>
            <button
              onClick={() => setChartPeriod('last10')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                chartPeriod === 'last10'
                  ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                  : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
              }`}
            >
              {t('common.tenTurns')}
            </button>
            <button
              onClick={() => setChartPeriod('last5')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                chartPeriod === 'last5'
                  ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                  : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
              }`}
            >
              {t('common.fiveTurns')}
            </button>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="crypto-card border border-neon-purple/30 bg-dark-bg/40 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-0.5">Volume</div>
            <div className="text-white text-sm font-semibold">
              {formatCurrency(crypto.volume, currency.symbol)}
            </div>
          </div>
          <div className="crypto-card border border-neon-purple/30 bg-dark-bg/40 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-0.5">Marktwaarde</div>
            <div className="text-white text-sm font-semibold">
              {formatCurrency(crypto.marketCap, currency.symbol)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
