'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeft, TrendingUp, TrendingDown, Trophy } from 'lucide-react'
import Header from './Header'
import CandlestickChart from './CandlestickChart'
import CryptoDetail from './CryptoDetail'
import { useLanguage } from '@/contexts/LanguageContext'

interface CryptoCurrency {
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

interface Player {
  id: string
  name: string
  avatar: string
  totalValue: number
  portfolio: { [key: string]: number }
  rank: number
}

interface PriceChange {
  percentage: number
  timestamp: number
}

interface MarketOverviewProps {
  cryptos: CryptoCurrency[]
  currentPlayer: string
  playerAvatar: string
  onBack: () => void
  priceHistory?: Record<string, PriceChange[]>
  momentumIndicator?: Record<string, number>
  candlestickChart?: Record<string, any>
  onEndTurnConfirm?: () => void
  actionsDisabled?: boolean
}

export default function MarketOverview({ cryptos, currentPlayer, playerAvatar, onBack, priceHistory = {}, momentumIndicator = {}, candlestickChart = {}, onEndTurnConfirm, actionsDisabled = false }: MarketOverviewProps) {
  const { t } = useLanguage()
  const [chartPeriod, setChartPeriod] = useState<'all' | 'last10' | 'last5'>('all')
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null)
  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      name: currentPlayer,
      avatar: playerAvatar,
      totalValue: 8750.25,
      portfolio: { VTC: 2.5, CRP: 1.8, LDX: 4.2, BCH: 0.9, ETX: 1.5, BTC: 0.3 },
      rank: 1
    },
    {
      id: '2',
      name: 'CryptoMaster',
      avatar: '🚀',
      totalValue: 7890.50,
      portfolio: { VTC: 3.1, CRP: 2.2, LDX: 2.8, BCH: 1.5, ETX: 0.8, BTC: 0.5 },
      rank: 2
    },
    {
      id: '3',
      name: 'BlockchainBoss',
      avatar: '💎',
      totalValue: 6543.75,
      portfolio: { VTC: 1.8, CRP: 3.5, LDX: 1.9, BCH: 2.1, ETX: 2.2, BTC: 0.2 },
      rank: 3
    },
    {
      id: '4',
      name: 'CoinCollector',
      avatar: '⚡',
      totalValue: 5234.80,
      portfolio: { VTC: 2.0, CRP: 1.5, LDX: 3.2, BCH: 0.7, ETX: 1.1, BTC: 0.4 },
      rank: 4
    }
  ])

  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    gainersCount: 0,
    losersCount: 0
  })

  useEffect(() => {
    // Bereken markt statistieken
    const totalCap = cryptos.reduce((sum, crypto) => sum + crypto.marketCap, 0)
    const totalVol = cryptos.reduce((sum, crypto) => sum + crypto.volume, 0)
    const gainers = cryptos.filter(c => c.change24h > 0).length
    const losers = cryptos.filter(c => c.change24h < 0).length

    setMarketStats({
      totalMarketCap: totalCap,
      totalVolume: totalVol,
      gainersCount: gainers,
      losersCount: losers
    })
  }, [cryptos])

  // (Removed rank icon rendering; view simplified per request)

  const getColorClass = (color: string) => {
    const colorMap = {
      'neon-purple': 'border-neon-purple shadow-neon text-neon-purple',
      'neon-blue': 'border-neon-blue shadow-neon-blue text-neon-blue',
      'neon-turquoise': 'border-neon-turquoise shadow-neon-turquoise text-neon-turquoise',
      'neon-gold': 'border-neon-gold shadow-neon-gold text-neon-gold'
    }
    return colorMap[color as keyof typeof colorMap] || 'border-neon-purple shadow-neon text-neon-purple'
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

  const topGainer = cryptos.reduce<CryptoCurrency | null>((best, c) => {
    if (!best) return c
    if (typeof c.change24h !== 'number') return best
    if (typeof best.change24h !== 'number') return c
    return c.change24h > best.change24h ? c : best
  }, null)

  const topValueCoin = cryptos.reduce<CryptoCurrency | null>((best, c) => {
    if (!best) return c
    return c.price > best.price ? c : best
  }, null)

  // Filter price history based on selected period
  const getFilteredPriceHistory = (history: Array<{percentage: number, timestamp: number}>) => {
    if (chartPeriod === 'all') return history
    const limit = chartPeriod === 'last10' ? 10 : 5
    return history.slice(-limit)
  }

  // Calculate percentage change for selected period
  const getPercentageForPeriod = (cryptoSymbol: string, totalChange: number) => {
    if (chartPeriod === 'all') return totalChange
    
    const history = priceHistory[cryptoSymbol] || []
    const filteredHistory = getFilteredPriceHistory(history)
    
    if (filteredHistory.length === 0) return totalChange
    
    const periodChange = filteredHistory.reduce((sum, item) => sum + item.percentage, 0)
    return periodChange
  }

  const maxAbsChange = cryptos.length
    ? Math.max(1, ...cryptos.map(c => Math.abs(getPercentageForPeriod(c.symbol, typeof c.change24h === 'number' ? c.change24h : 0))))
    : 1

  // Show detail view if crypto is selected
  if (selectedCrypto) {
    return (
      <CryptoDetail
        crypto={selectedCrypto}
        priceHistory={priceHistory[selectedCrypto.symbol] || []}
        onBack={() => setSelectedCrypto(null)}
        initialChartPeriod={chartPeriod}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-7xl mx-auto">
        <Header 
          playerName={currentPlayer} 
          playerAvatar={playerAvatar} 
          onLogoClick={onBack} 
          onEndTurnConfirm={onEndTurnConfirm}
          actionsDisabled={actionsDisabled}
        />
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center space-x-2 mb-4">
            <TrendingUp className="w-6 h-6 text-neon-turquoise" />
            <span>{t('mainMenu.market')}</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1"></div>
          </h1>
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            {/* Periode Selector */}
            <div className="grid grid-cols-3 gap-2 flex-1 ml-auto">
              <button
                onClick={() => setChartPeriod('all')}
                className={`w-full px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  chartPeriod === 'all'
                    ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                    : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
                }`}
              >
                {t('common.sinceStart')}
              </button>
              <button
                onClick={() => setChartPeriod('last10')}
                className={`w-full px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  chartPeriod === 'last10'
                    ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                    : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
                }`}
              >
                {t('common.tenTurns')}
              </button>
              <button
                onClick={() => setChartPeriod('last5')}
                className={`w-full px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  chartPeriod === 'last5'
                    ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                    : 'bg-dark-bg/40 border border-white/10 text-gray-400 hover:bg-dark-bg/60 hover:text-white'
                }`}
              >
                {t('common.fiveTurns')}
              </button>
            </div>
          </div>
        </div>

        {/* Coins grid - zelfde stijl als dashboard Markt-tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cryptos.map((crypto) => {
            const imagePath = getCryptoImagePath(crypto.symbol)
            const isTopGainerTile = topGainer && crypto.id === topGainer.id
            const isTopValueTile = topValueCoin && crypto.id === topValueCoin.id
            const isBothHighlight = isTopGainerTile && isTopValueTile

            const isNugget = crypto.symbol === 'NGT'
            const isLentra = crypto.symbol === 'LNTR'
            const isRex = crypto.symbol === 'REX'
            const isOrlo = crypto.symbol === 'ORLO'

            return (
              <div
                key={crypto.id}
                onClick={() => setSelectedCrypto(crypto)}
                className={`crypto-card rounded-xl p-3 flex flex-col items-center h-38 md:h-42 transition-all cursor-pointer ${
                  isBothHighlight
                    ? 'border-2 border-neon-gold/80 animate-gold-purple-glow-breathe'
                    : isTopGainerTile
                      ? 'border-2 border-neon-gold/80 animate-gold-glow-breathe'
                      : isTopValueTile
                        ? 'border-2 border-neon-purple/80 animate-purple-glow-breathe'
                        : 'border border-white/10 hover:border-neon-blue/50 hover:shadow-neon-blue/20'
                }`}
              >
                {/* Coin image boven, nog groter en extra uit de kaart laten steken */}
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-transparent flex items-center justify-center overflow-visible -mt-7 mb-1">
                  {imagePath ? (
                    <Image
                      src={imagePath}
                      alt={crypto.name}
                      width={140}
                      height={140}
                      className={`object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)] ${
                        isLentra ? 'scale-175' : 'scale-105'
                      }`}
                    />
                  ) : (
                    <span className="text-4xl">{crypto.icon}</span>
                  )}
                </div>

                {/* Donkere achtergrond alleen achter info-blok onderaan, zoals dashboard */}
                <div className="w-full mt-auto">
                  <div className="rounded-lg bg-dark-bg/80 px-2 py-0.5">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold truncate mr-2 text-xs sm:text-sm">
                        {crypto.name}
                      </div>
                      <div className="text-neon-turquoise font-bold whitespace-nowrap text-[11px] sm:text-xs">
                        ⚘{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between mt-0">
                        <div className="text-gray-400 text-xs">{crypto.symbol}</div>
                        {typeof crypto.change24h === 'number' && (() => {
                          const periodPercentage = getPercentageForPeriod(crypto.symbol, crypto.change24h)
                          return (
                            <div
                              className={`text-xs px-1.5 py-0.5 rounded-sm border flex items-center space-x-1 ${
                                periodPercentage >= 0
                                  ? 'text-green-400 border-green-400/30'
                                  : 'text-red-400 border-red-400/30'
                              }`}
                            >
                              {periodPercentage >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>
                                {periodPercentage >= 0 ? '+' : ''}
                                {periodPercentage.toFixed(1)}%
                              </span>
                            </div>
                          )
                        })()}
                      </div>

                      {typeof crypto.change24h === 'number' && (() => {
                        const periodPercentage = getPercentageForPeriod(crypto.symbol, crypto.change24h)
                        return Math.abs(periodPercentage) > 0 && (
                          <div className={`text-[9px] font-semibold mb-0.5 flex items-center space-x-1 ${
                            Math.abs(periodPercentage) > 15 
                              ? periodPercentage > 0 ? 'text-green-400' : 'text-red-400'
                              : periodPercentage > 0 ? 'text-green-500/60' : 'text-red-500/60'
                          }`}>
                            {periodPercentage === 0 ? (
                              <span className="text-gray-500">-</span>
                            ) : Math.abs(periodPercentage) > 15 ? (
                              periodPercentage > 0 ? (
                                <>↗️ Sterk stijgend</>
                              ) : (
                                <>↘️ Sterk dalend</>
                              )
                            ) : (
                              periodPercentage > 0 ? (
                                <>→ Licht stijgend</>
                              ) : (
                                <>→ Licht dalend</>
                              )
                            )}
                          </div>
                        )
                      })()}

                      <CandlestickChart
                        priceHistory={getFilteredPriceHistory(priceHistory[crypto.symbol] || [])}
                        maxBars={6}
                        currentPercentage={getPercentageForPeriod(crypto.symbol, crypto.change24h || 0)}
                        currentPrice={crypto.price}
                        showStartPoint={chartPeriod === 'all'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Top Picks sectie */}
        {(topGainer || topValueCoin) && (
          <div className="crypto-card mt-4 border border-neon-purple/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] bg-gradient-to-br from-dark-bg/95 via-dark-bg/92 to-purple-900/20 p-3">
            <p className="text-[13px] uppercase tracking-wide text-gray-300 font-bold mb-3">Top picks</p>
            {/* Check if same crypto is both top gainer AND top value */}
            {topGainer && topValueCoin && topGainer.id === topValueCoin.id ? (
              <div className="flex flex-col p-2 bg-dark-bg/40 rounded-lg border-2 border-neon-gold/50">
                <div className="flex items-center space-x-2">
                  <img
                    src={getCryptoImagePath(topGainer.symbol)}
                    alt={topGainer.name}
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[11px] truncate">{topGainer.symbol}</p>
                    <p className="text-neon-gold text-[10px] font-bold flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      <span>Top Performer</span>
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-green-400 text-[8px]">
                        +{getPercentageForPeriod(topGainer.symbol, topGainer.change24h || 0).toFixed(1)}%
                      </p>
                      <p className="text-neon-purple text-[8px]">
                        ⚘{topGainer.price.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {/* Beste stijger */}
                {topGainer && (
                  <div className="flex flex-col p-2 bg-dark-bg/40 rounded-lg border border-neon-gold/30">
                    <div className="flex items-center space-x-2">
                      <img
                        src={getCryptoImagePath(topGainer.symbol)}
                        alt={topGainer.name}
                        className="w-6 h-6 object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-[10px] truncate">{topGainer.symbol}</p>
                        <p className="text-neon-gold text-[9px] font-bold">
                          Beste stijger
                        </p>
                        <p className="text-neon-gold text-[8px]">
                          +{getPercentageForPeriod(topGainer.symbol, topGainer.change24h || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Meest waard */}
                {topValueCoin && (
                  <div className="flex flex-col p-2 bg-dark-bg/40 rounded-lg border border-neon-purple/30">
                    <div className="flex items-center space-x-2">
                      <img
                        src={getCryptoImagePath(topValueCoin.symbol)}
                        alt={topValueCoin.name}
                        className="w-6 h-6 object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-[10px] truncate">{topValueCoin.symbol}</p>
                        <p className="text-neon-purple text-[9px] font-bold">
                          Meest waard
                        </p>
                        <p className="text-neon-purple text-[8px]">
                          ⚘{topValueCoin.price.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statistieken sectie */}
        {topGainer && cryptos.length > 0 && (
          <div className="crypto-card mt-4 border border-neon-purple/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] bg-gradient-to-br from-dark-bg/95 via-dark-bg/92 to-purple-900/20 p-3">
            <p className="text-[13px] uppercase tracking-wide text-gray-300 font-bold mb-3">Statistieken</p>
            
            {/* Verticale bars */}
            <div className="flex items-end space-x-1 h-20 mb-2">
              {cryptos.map(c => {
                const v = getPercentageForPeriod(c.symbol, c.change24h || 0)
                const height = Math.max(4, Math.round((Math.abs(v) / maxAbsChange) * 24))
                const isPositive = v >= 0
                const coinImage = getCryptoImagePath(c.symbol)
                return (
                  <div
                    key={c.id}
                    className="flex-1 flex flex-col items-center justify-end"
                    title={`${c.symbol} ${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                  >
                    {coinImage && (
                      <div className="mb-1 w-6 h-6 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
                        <img
                          src={coinImage}
                          alt={c.name}
                          className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.7)]"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div
                      className={`w-full rounded-sm ${
                        isPositive ? 'bg-green-400/80' : 'bg-red-400/80'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  </div>
                )
              })}
            </div>
            
            {/* Percentages onder bars */}
            <div className="flex items-center space-x-1 mb-4">
              {cryptos.map(c => {
                const v = getPercentageForPeriod(c.symbol, c.change24h || 0)
                const isPositive = v >= 0
                return (
                  <div key={c.id} className="flex-1 flex flex-col items-center">
                    <p className="text-[8px] text-gray-400 mb-0.5">{c.symbol}</p>
                    <p className={`text-[9px] font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{v.toFixed(1)}%
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Horizontale bars */}
            <div className="space-y-1 pr-1">
              {cryptos.map(c => {
                const v = getPercentageForPeriod(c.symbol, c.change24h || 0)
                const width = Math.max(6, Math.round((Math.abs(v) / maxAbsChange) * 100))
                const isPositive = v >= 0
                return (
                  <div key={c.id} className="flex items-center space-x-1">
                    <span className="text-[10px] text-gray-400 w-12">{c.symbol}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isPositive ? 'bg-green-400/80' : 'bg-red-400/80'
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className={`text-[10px] w-10 text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {v >= 0 ? '+' : ''}{v.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
