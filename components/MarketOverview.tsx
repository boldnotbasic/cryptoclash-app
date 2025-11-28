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
          <h1 className="text-3xl font-bold text-white">Markt</h1>
        </div>
        {/* Coins grid - keep live prices visible, no extra section headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cryptos.map((crypto) => (
            <div key={crypto.id} className={`crypto-card ${getColorClass(crypto.color)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl inline-flex items-center justify-center overflow-hidden">
                    {(() => {
                      const imagePath = getCryptoImagePath(crypto.symbol)
                      if (!imagePath) return <span>{crypto.icon}</span>
                      return (
                        <Image
                          src={imagePath}
                          alt={crypto.name}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      )
                    })()}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{crypto.name}</h3>
                    <p className="text-gray-400">{crypto.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center justify-end space-x-1 ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {crypto.change24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">{crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Volume 24u:</span>
                  <p className="text-white font-semibold">€{crypto.volume.toLocaleString('nl-NL')}</p>
                </div>
                <div>
                  <span className="text-gray-400">Marktwaarde:</span>
                  <p className="text-white font-semibold">€{crypto.marketCap.toLocaleString('nl-NL')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
