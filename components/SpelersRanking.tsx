'use client'

import { ArrowLeft, Crown, Medal, Trophy, Users } from 'lucide-react'
import Header from './Header'

interface CryptoCurrency {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  amount: number
  color: string
  icon: string
}

interface Player {
  id: string
  name: string
  avatar: string
  totalValue: number
  rank: number
  portfolio: { [key: string]: number }
}

interface SpelersRankingProps {
  onBack: () => void
  playerName: string
  playerAvatar: string
  players: Player[]
  cryptos: CryptoCurrency[]
}

export default function SpelersRanking({ onBack, playerName, playerAvatar, players, cryptos }: SpelersRankingProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-neon-gold" />
      case 2: return <Medal className="w-5 h-5 text-gray-300" />
      case 3: return <Trophy className="w-5 h-5 text-yellow-600" />
      default: return <span className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold">#{rank}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onBack} />
        
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-2">
            <Users className="w-8 h-8 text-neon-blue" />
            <div>
              <h1 className="text-3xl font-bold text-white">Spelers Ranking</h1>
              <p className="text-gray-400">Live leaderboard en portfolio's</p>
            </div>
          </div>
        </div>

        {/* Quick Ranking Indicator - Row Layout */}
        <div className="crypto-card mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">🏆 Live Rankings</h3>
          <div className="space-y-4">
            {players
              .sort((a, b) => b.totalValue - a.totalValue)
              .map((player, index) => (
                <div key={player.id} className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                  player.name === playerName ? 'bg-neon-gold/10 border border-neon-gold/30' : 'bg-dark-bg/30'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-3 ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 text-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/30' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300/20 to-gray-500/20 text-gray-300 border-gray-300 shadow-lg shadow-gray-400/30' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600/20 to-amber-800/20 text-amber-600 border-amber-600 shadow-lg shadow-amber-600/30' :
                      'bg-gradient-to-br from-gray-600/20 to-gray-800/20 text-gray-400 border-gray-400 shadow-lg shadow-gray-600/30'
                    }`}>
                      <span className="text-lg">{player.avatar}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3">
                        <p className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-600' :
                          'text-gray-400'
                        }`}>#{index + 1}</p>
                        <div>
                          <p className={`text-xl font-bold ${player.name === playerName ? 'text-neon-gold' : 'text-white'}`}>
                            {player.name}
                            {player.name === playerName && (
                              <span className="ml-2 text-xs bg-neon-gold text-dark-bg px-2 py-1 rounded-full font-bold">
                                JIJ
                              </span>
                            )}
                          </p>
                          <p className="text-neon-purple text-sm font-bold">
                            €{player.totalValue.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              ))}
          </div>
        </div>

        {/* Detailed Rankings */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            📊 Gedetailleerde Rankings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <div key={player.id} className={`crypto-card ${
                player.name === playerName ? 'border-neon-gold shadow-neon-gold' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(player.rank)}
                      <span className="text-2xl">{player.avatar}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span>{player.name}</span>
                        {player.name === playerName && (
                          <span className="text-xs bg-neon-gold text-dark-bg px-2 py-1 rounded-full font-bold">
                            JIJ
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-400">Rang #{player.rank}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-neon-gold">
                      €{player.totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-sm">Totale Waarde</p>
                  </div>
                </div>
                
                {/* Portfolio Breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(player.portfolio).map(([symbol, amount]) => {
                    const crypto = cryptos.find(c => c.symbol === symbol)
                    if (!crypto) return null
                    
                    return (
                      <div key={symbol} className="text-center p-2 bg-dark-bg/50 rounded">
                        <p className="text-xs text-gray-400">{symbol}</p>
                        <p className="text-sm font-bold text-white">{amount}</p>
                        <p className="text-xs text-gray-500">
                          €{(crypto.price * amount).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
