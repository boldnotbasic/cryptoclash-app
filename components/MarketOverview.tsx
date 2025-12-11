'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import Header from './Header'

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

interface MarketOverviewProps {
  cryptos: CryptoCurrency[]
  currentPlayer: string
  playerAvatar: string
  onBack: () => void
}

export default function MarketOverview({ cryptos, currentPlayer, playerAvatar, onBack }: MarketOverviewProps) {
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

  const maxAbsChange = cryptos.length
    ? Math.max(1, ...cryptos.map(c => Math.abs(typeof c.change24h === 'number' ? c.change24h : 0)))
    : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-7xl mx-auto">
        <Header playerName={currentPlayer} playerAvatar={playerAvatar} onLogoClick={onBack} />
        
        {/* Page Header */}
        <div className="flex items-center mb-8 space-x-4">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-neon-turquoise" />
            <span>Markt</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1"></div>
          </h1>
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
                className={`crypto-card rounded-xl p-3 flex flex-col items-center h-38 md:h-42 transition-all ${
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
                        €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-0">
                      <div className="text-gray-400 text-[10px] sm:text-xs">{crypto.symbol}</div>
                      {typeof crypto.change24h === 'number' && (
                        <div
                          className={`text-[10px] px-1.5 py-0.5 rounded-sm border flex items-center space-x-1 ${
                            crypto.change24h >= 0
                              ? 'text-green-400 border-green-400/30'
                              : 'text-red-400 border-red-400/30'
                          }`}
                        >
                          {crypto.change24h >= 0 ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" />
                          )}
                          <span>
                            {crypto.change24h >= 0 ? '+' : ''}
                            {crypto.change24h.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Marktwaarde regel */}
                    <div className="mt-1 text-[11px] text-gray-300">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">Marktwaarde</div>
                        <div className="text-white font-semibold">
                          €{crypto.marketCap.toLocaleString('nl-NL')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {(topGainer || topValueCoin) && (
          <div className="crypto-card mt-4 border border-neon-purple/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] bg-gradient-to-br from-dark-bg/95 via-dark-bg/92 to-purple-900/20 p-3 flex flex-col">
            {/* Beste stijger */}
            {topGainer && (
              <div className="flex flex-col pb-1.5 mb-1">
                <p className="text-[11px] uppercase tracking-wide text-neon-gold font-semibold mb-0">Beste stijger</p>
                <div className="flex items-center justify-between mb-0.5">
                  <div>
                    <p className="text-white font-bold text-xs sm:text-sm">{topGainer.name}</p>
                    <p className="text-gray-400 text-[10px]">{topGainer.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neon-gold font-bold text-xs sm:text-sm">
                      €{topGainer.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {typeof topGainer.change24h === 'number' && (
                      <p className="text-[11px] text-green-400 flex items-center justify-end space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{topGainer.change24h.toFixed(1)}%</span>
                      </p>
                    )}
                  </div>
                </div>
                {cryptos.length > 0 && (
                  <div className="mt-0 pt-0 mb-0.5">
                    <div className="flex items-end space-x-1 h-20">
                      {cryptos.map(c => {
                        const v = typeof c.change24h === 'number' ? c.change24h : 0
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
                  </div>
                )}
              </div>
            )}

            {/* Meest waard */}
            {topValueCoin && (
              <div className="flex flex-col mt-1">
                <p className="text-[11px] uppercase tracking-wide text-neon-purple font-semibold mb-1">Meest waard</p>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-white font-bold text-xs sm:text-sm">{topValueCoin.name}</p>
                    <p className="text-gray-400 text-[10px]">{topValueCoin.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neon-purple font-bold text-xs sm:text-sm">
                      €{topValueCoin.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {typeof topValueCoin.change24h === 'number' && (
                      <p className={`text-[11px] flex items-center justify-end space-x-1 ${
                        topValueCoin.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {topValueCoin.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {topValueCoin.change24h >= 0 ? '+' : ''}
                          {topValueCoin.change24h.toFixed(1)}%
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                {cryptos.length > 0 && (
                  <div className="mt-0.5 pt-0">
                    <div className="space-y-1 pr-1">
                      {cryptos.map(c => {
                        const v = typeof c.change24h === 'number' ? c.change24h : 0
                        const width = Math.max(6, Math.round((Math.abs(v) / maxAbsChange) * 100))
                        const isPositive = v >= 0
                        return (
                          <div key={c.id} className="flex items-center space-x-1">
                            <span className="text-[10px] text-gray-400 w-8">{c.symbol}</span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isPositive ? 'bg-green-400/80' : 'bg-red-400/80'
                                }`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className={`text-[10px] ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {v >= 0 ? '+' : ''}{v.toFixed(1)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
