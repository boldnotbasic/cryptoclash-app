'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TrendingUp, TrendingDown, BarChart3, Activity, QrCode, Users, Bell, Zap, RefreshCw } from 'lucide-react'
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
  volume: number
  marketCap: number
}

interface ScanAction {
  id: string
  timestamp: number
  player: string
  action: string
  effect: string
  avatar?: string
}

interface Player {
  id: string
  name: string
  avatar: string
  totalValue: number
  portfolio: { [key: string]: number }
  cashBalance?: number
  rank: number
}

interface MarketDashboardProps {
  playerName?: string
  playerAvatar?: string
  cryptos: CryptoCurrency[]
  players: Player[]
  playerScanActions: ScanAction[]
  autoScanActions: ScanAction[]
  onNavigate: (screen: 'qr-scanner' | 'main-menu' | 'market' | 'portfolio' | 'cash' | 'rankings' | 'settings' | 'scan-transcript') => void
  isConnected?: boolean
  connectedPlayers?: number
  roomId?: string
  dashboardToasts?: { id: string; message: string; sender: string }[]
  socket?: any
}

export default function MarketDashboard({ 
  playerName = 'Market Dashboard', 
  playerAvatar = '📊', 
  cryptos, 
  players, 
  playerScanActions, 
  autoScanActions, 
  onNavigate,
  isConnected = false,
  connectedPlayers = 0,
  roomId = '',
  dashboardToasts = [],
  socket = null
}: MarketDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getCryptoImagePath = (symbol: string) => {
    switch (symbol) {
      case 'DSHEEP': return '/dsheep.png'
      case 'LNTR': return '/lentra.png'
      case 'OMLT': return '/omlt.png'
      case 'ORLO': return '/orlo.png'
      case 'REX': return '/rex.png'
      case 'NUGGET': return '/Nugget.png'
      default: return null
    }
  }

  // Simple test scan function triggered from dashboard Scans widget
  const handleDashboardTestScan = () => {
    console.log('\n🧪 === DASHBOARD TEST SCAN BUTTON CLICKED ===')
    console.log('📺 Dashboard playerName:', playerName)
    console.log('😀 Dashboard avatar:', playerAvatar)
    console.log('🏠 Room ID:', roomId)
    console.log('🔌 Socket connected:', !!socket && socket.connected)

    if (!socket || !roomId || roomId === 'solo-mode') {
      console.warn('⚠️ Cannot send dashboard test scan - missing socket or not in multiplayer room')
      return
    }

    // Same style as MainMenu test scan: random coin + random percentage
    const possibleCoins = ['DSHEEP', 'NUGGET', 'LNTR', 'OMLT', 'REX', 'ORLO']
    const randomCoin = possibleCoins[Math.floor(Math.random() * possibleCoins.length)]
    const randomPercentageStr = (Math.random() * 20 - 10).toFixed(1) // -10.0 to +10.0
    const randomPercentage = parseFloat(randomPercentageStr)
    const sign = randomPercentage >= 0 ? '+' : ''

    const testScanAction = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      player: playerName || 'Market Screen',
      action: 'Test Scan',
      effect: `${randomCoin} ${sign}${randomPercentageStr}%`,
      avatar: playerAvatar,
      cryptoSymbol: randomCoin,
      percentageValue: randomPercentage
    }

    console.log('📊 Generated dashboard test scan:', testScanAction)

    // Optimistic local update so het direct zichtbaar is
    // Server stuurt later de authoritative scanData:update
    try {
      // Emit to server so all clients (incl. dashboard) krijgen deze scan
      socket.emit('player:scanAction', {
        roomCode: roomId,
        scanAction: testScanAction
      })
      console.log('📤 Dashboard test scan emitted to server')
    } catch (e) {
      console.warn('⚠️ Failed to emit dashboard test scan', e)
    }

    console.log('🧪 === DASHBOARD TEST SCAN COMPLETE ===\n')
  }

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto request a refresh on mount so we immediately get fresh totals from all players
  useEffect(() => {
    try {
      if (socket && roomId && playerName === 'Market Dashboard') {
        console.log('📡 Auto-refreshing rankings on mount')
        socket.emit('dashboard:requestRefresh', { roomCode: roomId })
      }
    } catch (e) {
      console.warn('Failed to auto request refresh on mount', e)
    }
  }, [socket, roomId, playerName])

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const handleRefreshRankings = () => {
    setIsRefreshing(true)
    console.log('\n🔄 === REFRESH RANKINGS TRIGGERED ===')
    console.log('📊 Current player data (before refresh):')
    players.forEach(player => {
      console.log(`  ${player.name}: Total €${player.totalValue?.toFixed(2) || 'N/A'}, Cash €${player.cashBalance?.toFixed(2) || 'N/A'}`)
    })
    
    // Request all players to send their latest data
    if (socket && roomId) {
      console.log('📡 Broadcasting refresh request to all players...')
      socket.emit('dashboard:requestRefresh', { roomCode: roomId })
    }
    
    console.log('🔄 === REFRESH REQUEST SENT ===\n')
    
    // Visual feedback - show refreshing for 1.5 seconds
    setTimeout(() => {
      setIsRefreshing(false)
      console.log('✅ Rankings refresh complete')
    }, 1500)
  }

  const totalMarketCap = cryptos.reduce((sum, crypto) => sum + crypto.marketCap, 0)
  const totalVolume = cryptos.reduce((sum, crypto) => sum + crypto.volume, 0)
  const gainers = cryptos.filter(c => c.change24h > 0).length
  const losers = cryptos.filter(c => c.change24h < 0).length


  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-3">
      <div className="max-w-6xl mx-auto">
        {playerName !== 'Market Dashboard' && (
          <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={() => onNavigate('main-menu')} />
        )}

        {/* Market Header met Rangschikking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* CryptoClash Market Dashboard Titel */}
          <div className="crypto-card">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col space-y-2">
                <div className="w-40 md:w-56 relative">
                  <Image
                    src="/cryptoclash-logo-horizontal.png"
                    alt="CryptoClash"
                    width={224}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {playerName === 'Market Dashboard' ? (
                    <span className="block">Market Dashboard</span>
                  ) : (
                    'Live Markt Dashboard'
                  )}
                </h1>
              </div>
              <div className="text-right space-y-2">
                {/* Connection Status Indicator */}
                {playerName === 'Market Dashboard' && (
                  <div className="flex items-center justify-end space-x-2">
                    {/* LIVE dot */}
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} title={isConnected ? 'LIVE' : 'OFFLINE'}></div>
                    {/* Players badge */}
                    <div className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      <span className="text-xs text-gray-300 font-bold">{connectedPlayers} spelers</span>
                    </div>
                  </div>
                )}
                {roomId && playerName === 'Market Dashboard' && (
                  <div className="bg-neon-purple/20 px-3 py-1 rounded-full border border-neon-purple/50">
                    <span className="text-neon-purple text-xs font-bold">Room: {roomId}</span>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-xs">Laatste update</p>
                  <p className="text-neon-gold font-semibold text-sm">
                    {currentTime.toLocaleTimeString('nl-NL')}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                <p className="text-gray-400 text-xs">Marktwaarde</p>
                <p className="text-sm sm:text-lg font-bold text-neon-gold">
                  €{(totalMarketCap / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                <p className="text-gray-400 text-xs">Volume</p>
                <p className="text-sm sm:text-lg font-bold text-neon-blue">
                  €{(totalVolume / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                <p className="text-gray-400 text-xs">Stijgers</p>
                <p className="text-sm sm:text-lg font-bold text-green-400">{gainers}</p>
              </div>
              <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                <p className="text-gray-400 text-xs">Dalers</p>
                <p className="text-sm sm:text-lg font-bold text-red-400">{losers}</p>
              </div>
            </div>
          </div>

          {/* Rangschikking Widget - Naast Market Dashboard Titel */}
          {playerName === 'Market Dashboard' && (
            <div className="crypto-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-neon-gold" />
                  <span>Rangschikking</span>
                </h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-semibold">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {players
                  .slice()
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .slice(0, 3)
                  .map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-dark-bg/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`text-xl ${
                          index === 0 ? 'filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' :
                          index === 1 ? 'filter drop-shadow-[0_0_8px_rgba(209,213,219,0.6)]' :
                          'filter drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]'
                        }`}>
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                        </div>
                        <div className="text-2xl">{player.avatar}</div>
                        <div>
                          <p className="text-white text-sm font-semibold">{player.name}</p>
                          <p className="text-gray-400 text-xs">#{player.rank}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-neon-gold font-bold text-sm">
                          €{player.totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>

        {/* Markt overzicht - Compacter grid voor mobile */}
        <div className="crypto-card mb-3">
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-neon-turquoise" />
            <span>Markt</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></div>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cryptos.map((crypto) => {
              const imagePath = getCryptoImagePath(crypto.symbol)
              return (
                <div key={crypto.id} className="bg-dark-bg/30 rounded-lg p-2 hover:bg-dark-bg/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full bg-${crypto.color}/20 flex items-center justify-center text-sm overflow-hidden`}>
                        {imagePath ? (
                          <Image
                            src={imagePath}
                            alt={crypto.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        ) : (
                          <span>{crypto.icon}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-xs">{crypto.name}</h3>
                        <p className="text-gray-400 text-xs">{crypto.symbol}</p>
                      </div>
                    </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className={`flex items-center justify-end space-x-1 ${
                      crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {crypto.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="font-semibold text-xs">
                        {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Compacte Activities Section - Side by side op mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

          {/* Live Activities - Uniform met MainMenu */}
          <div className="crypto-card bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span className="animate-pulse">🔔</span>
                <span>Beurs</span>
              </h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex space-x-3 mb-4">
              <button 
                onClick={() => onNavigate('scan-transcript')}
                className="text-neon-blue hover:text-neon-purple text-sm font-semibold transition-colors"
              >
                Toon volledig transcript →
              </button>
            </div>
            
            <div className="space-y-2">
              {autoScanActions.slice(0, playerName === 'Market Dashboard' ? 5 : 2).map((action) => {
                const timeAgo = Math.floor((Date.now() - action.timestamp) / 1000)
                const minutes = Math.floor(timeAgo / 60)
                const seconds = timeAgo % 60
                
                return (
                  <div key={action.id} className="flex items-center justify-between p-2 bg-dark-bg/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {action.player === 'Bot' ? '🤖' : 
                         action.player === 'CryptoMaster' ? '🚀' : 
                         action.player === 'BlockchainBoss' ? '💎' : '⚡'}
                      </span>
                      <span className="text-sm text-white font-medium">{action.player}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{action.action}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${
                        action.effect.includes('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {action.effect}
                      </span>
                      <span className="text-xs text-gray-500">
                        {minutes > 0 ? `${minutes}m` : `${seconds}s`}
                      </span>
                    </div>
                  </div>
                )
              })}
              
              {autoScanActions.length === 0 && (
                <div className="text-center py-3">
                  <p className="text-gray-400 text-sm">Wachten op scan activiteit...</p>
                </div>
              )}
            </div>
          </div>

          {/* Scan Activities - Uniform met MainMenu */}
          <div className="crypto-card bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-neon-purple" />
                <span>Scans</span>
              </h3>
              <div className="bg-neon-purple/20 px-2 py-1 rounded-full border border-neon-purple/50">
                <span className="text-neon-purple text-xs font-bold">{playerScanActions.length} scans</span>
              </div>
            </div>
            <div className="flex items-center justify-end mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex space-x-3 mb-4">
              <button 
                onClick={() => onNavigate('scan-transcript')}
                className="text-neon-blue hover:text-neon-purple text-sm font-semibold transition-colors"
              >
                Toon volledig transcript →
              </button>
              <button
                onClick={handleDashboardTestScan}
                className="text-green-400 hover:text-green-300 text-sm font-semibold transition-colors flex items-center space-x-1"
              >
                <span>🧪</span>
                <span>Test Scan</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {(() => {
                // Sorteer op tijd (nieuwste eerst) en verwijder dubbele IDs
                const uniqueScans = [...playerScanActions]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .filter((scan, index, arr) =>
                    arr.findIndex(s => s.id === scan.id) === index
                  )
                  .slice(0, 3)

                if (uniqueScans.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <p className="text-gray-400">Nog geen scan acties...</p>
                    </div>
                  )
                }

                return uniqueScans.map((action, index) => {
                  const timeAgo = Math.floor((Date.now() - action.timestamp) / 1000)
                  const minutes = Math.floor(timeAgo / 60)
                  const seconds = timeAgo % 60

                  return (
                    <div key={action.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-neon-purple/10 border border-neon-purple/30' : 'bg-dark-bg/30'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {action.avatar || (action.player === playerName ? playerAvatar : '⚡')}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">{action.player}</p>
                            <p className="text-xs text-gray-400">{action.action}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          action.effect.includes('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {action.effect}
                        </p>
                        <p className="text-xs text-gray-500">
                          {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`} geleden
                        </p>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

        </div>

        {/* Quick Actions - Only show for regular players, not market screen */}
        {playerName !== 'Market Dashboard' && (
          <div className="crypto-card mt-4">
            <h3 className="text-lg font-bold text-white mb-4">Snelle Acties</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate('qr-scanner')}
                className="bg-gradient-to-r from-neon-purple to-neon-blue text-white font-semibold py-3 px-4 rounded-lg hover:scale-105 transition-transform text-sm flex items-center justify-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan</span>
              </button>
              <button
                onClick={() => onNavigate('portfolio')}
                className="bg-gradient-to-r from-neon-turquoise to-neon-gold text-white font-semibold py-3 px-4 rounded-lg hover:scale-105 transition-transform text-sm flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Portfolio</span>
              </button>
              <button
                onClick={() => onNavigate('rankings')}
                className="bg-gradient-to-r from-neon-gold to-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:scale-105 transition-transform text-sm flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Rankings</span>
              </button>
              <button
                onClick={() => onNavigate('main-menu')}
                className="bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:scale-105 transition-transform text-sm"
              >
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Dashboard Toasts for Test Messages - stacked vertically */}
      {dashboardToasts && dashboardToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
          {dashboardToasts.map(toast => (
            <div
              key={toast.id}
              className="animate-fadeIn bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-blue-400"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                    💬
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-blue-100 mb-1">Bericht van {toast.sender}</p>
                  <p className="text-white text-lg font-semibold break-words">{toast.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="max-w-6xl mx-auto mt-3">
        <div className="crypto-card">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-neon-turquoise" />
            <span>Markt Impact Analyse</span>
          </h3>

          {(() => {
            const all = [...autoScanActions, ...playerScanActions]
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 10)
            const parse = (e: string) => {
              const m = e.match(/^([A-Z]+)\s+([+\-]?[0-9]+(?:\.[0-9]+)?)%/)
              if (!m) return null
              return { symbol: m[1], pct: parseFloat(m[2]) }
            }

            // Aggregate total impact per symbol (last 10 events)
            const impactMap = new Map<string, { pct: number; count: number }>()
            all.forEach(a => {
              const p = parse(a.effect)
              if (!p) return
              const cur = impactMap.get(p.symbol) || { pct: 0, count: 0 }
              impactMap.set(p.symbol, { pct: Math.round((cur.pct + p.pct) * 10) / 10, count: cur.count + 1 })
            })

            const entries = Array.from(impactMap.entries())
              .sort((a, b) => Math.abs(b[1].pct) - Math.abs(a[1].pct))
            const totalImpact = entries.reduce((s, [, v]) => s + v.pct, 0)

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-dark-bg/30 rounded-lg p-3">
                  <p className="text-gray-400 text-sm mb-1">Totale impact (laatste 10 events)</p>
                  <p className={`${totalImpact >= 0 ? 'text-green-400' : 'text-red-400'} text-2xl font-bold`}>
                    {totalImpact >= 0 ? '+' : ''}{totalImpact.toFixed(1)}%
                  </p>
                </div>

                <div className="lg:col-span-2 bg-dark-bg/30 rounded-lg p-3">
                  <p className="text-gray-400 text-sm mb-2">Top beïnvloede munten</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {entries.slice(0, 3).map(([symbol, v]) => (
                      <div key={symbol} className="rounded-lg p-3 border border-white/10 bg-dark-bg/40">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold text-sm">{symbol}</p>
                            <p className="text-gray-400 text-xs">{v.count} events</p>
                          </div>
                          <div className={`${v.pct >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                            {v.pct >= 0 ? '+' : ''}{v.pct.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                    {entries.length === 0 && (
                      <div className="text-center text-gray-400 text-sm">Nog geen impact data</div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-3 bg-dark-bg/30 rounded-lg p-3">
                  <p className="text-gray-400 text-sm mb-2">Recente gebeurtenissen</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {all.map(a => {
                      const p = parse(a.effect)
                      const isPositive = p ? p.pct >= 0 : a.effect.includes('+')
                      const calc = (() => {
                        if (!p) return null
                        const coin = cryptos.find(c => c.symbol === p.symbol)
                        if (!coin) return null
                        // Use CURRENT value from market overview (change24h) - this is the ACTUAL current state
                        const currentFromMarket = typeof coin.change24h === 'number' ? coin.change24h : 0
                        // Calculate what the baseline was BEFORE this event (simple estimation)
                        const baselineBeforeEvent = Math.round((currentFromMarket - p.pct) * 10) / 10
                        // Show: baseline (before) + event = current (from market overview)
                        return { 
                          current: currentFromMarket,    // Actual current value from Markt overzicht
                          baseline: baselineBeforeEvent, // Estimated baseline before this event
                          event: p.pct, 
                          symbol: p.symbol 
                        }
                      })()
                      return (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded bg-dark-bg/40">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{a.player === 'Bot' ? '🤖' : '📱'}</span>
                            <span className="text-xs text-gray-400">{a.player === 'Bot' ? 'Beurs' : 'Scan'}</span>
                            <span className="text-xs text-gray-500">•</span>
                            {calc ? (
                              <span className="text-sm font-semibold text-white">
                                {calc.symbol}{' '}
                                <span className={`${calc.baseline >= 0 ? 'text-green-400' : 'text-red-400'}`}>{calc.baseline >= 0 ? '+' : ''}{calc.baseline.toFixed(1)}%</span>{' '}
                                <span className="text-gray-400">(markt)</span>{' '}
                                <span className="text-gray-400">{calc.event >= 0 ? '+' : ''}{calc.event.toFixed(1)}%</span>{' '}
                                <span className="text-gray-400">=</span>{' '}
                                <span className={`${calc.current >= 0 ? 'text-green-400' : 'text-red-400'}`}>{calc.current >= 0 ? '+' : ''}{calc.current.toFixed(1)}%</span>
                              </span>
                            ) : (
                              <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{a.effect}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{getTimeAgo(a.timestamp)}</span>
                        </div>
                      )
                    })}
                    {all.length === 0 && (
                      <div className="text-center text-gray-400 text-sm">Nog geen gebeurtenissen</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
