'use client'

import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import DetailChart from './DetailChart'

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
}

export default function CryptoDetail({ crypto, priceHistory, onBack, initialChartPeriod = 'all' }: CryptoDetailProps) {
  const [chartPeriod, setChartPeriod] = useState<'all' | 'last10' | 'last5'>(initialChartPeriod)

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
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 flex flex-col p-4">
      <div className="w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-neon-turquoise text-sm font-semibold">
            {crypto.symbol}
          </div>
          <div className="w-10"></div>
        </div>

        {/* Crypto Info */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            {imagePath && (
              <img
                src={imagePath}
                alt={crypto.name}
                className="w-16 h-16 object-contain"
              />
            )}
            <h1 className="text-3xl font-bold text-white">{crypto.name}</h1>
          </div>
          
          <div className="flex items-baseline space-x-3">
            <div className="text-5xl font-bold text-white">
              €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-md border ${
              isPositive ? 'bg-green-400/10 border-green-400/30 text-green-400' : 'bg-red-400/10 border-red-400/30 text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="text-base font-semibold">
                {isPositive ? '+' : ''}{periodPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="text-gray-400 text-sm mt-2">
            Vertraagd: {new Date().toLocaleString('nl-NL', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        {/* Chart - Compact maar duidelijk */}
        <div className="crypto-card border border-neon-purple/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] bg-gradient-to-br from-dark-bg/95 via-dark-bg/92 to-purple-900/20 rounded-xl p-4 mb-4" style={{ height: '280px' }}>
          <DetailChart
            priceHistory={getFilteredPriceHistory(priceHistory)}
            currentPrice={crypto.price}
            showStartPoint={chartPeriod === 'all'}
          />
        </div>

        {/* Period Selector */}
        <div className="flex justify-center space-x-2 mb-6">
          <button
            onClick={() => setChartPeriod('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              chartPeriod === 'all'
                ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
            }`}
          >
            Sinds start
          </button>
          <button
            onClick={() => setChartPeriod('last10')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              chartPeriod === 'last10'
                ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
            }`}
          >
            10 beurten
          </button>
          <button
            onClick={() => setChartPeriod('last5')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              chartPeriod === 'last5'
                ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
            }`}
          >
            5 beurten
          </button>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="crypto-card border border-neon-purple/30 bg-dark-bg/40 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Volume</div>
            <div className="text-white font-semibold">
              €{crypto.volume.toLocaleString('nl-NL')}
            </div>
          </div>
          <div className="crypto-card border border-neon-purple/30 bg-dark-bg/40 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Marktwaarde</div>
            <div className="text-white font-semibold">
              €{crypto.marketCap.toLocaleString('nl-NL')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
