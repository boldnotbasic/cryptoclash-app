'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { TrendingUp, TrendingDown, BarChart3, Activity, QrCode, Users, Bell, Zap, RefreshCw, ListChecks, Power, SkipForward, Clock } from 'lucide-react'
import Header from './Header'
import ScanResult, { ScanEffect } from './ScanResult'

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
  onEndGame?: () => void
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
  socket = null,
  onEndGame
}: MarketDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [showKansEvent, setShowKansEvent] = useState(false)
  const [currentKansEvent, setCurrentKansEvent] = useState<ScanEffect | null>(null)
  const lastShownEventId = useRef<string | null>(null)

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

  // Check if event is positive (for color coding in action logs)
  const isPositiveEvent = (effect: string) => {
    // Bull Run and Whale Alert are always positive
    if (effect.includes('Bull Run') || effect.includes('Whale Alert')) return true
    // Market Crash is always negative
    if (effect.includes('Market Crash')) return false
    // Otherwise check for + or -
    return effect.includes('+') || effect.includes('stijgt') || effect.includes('rally') || effect.includes('move')
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

    const generateTestScan = () => {
      console.log('\n🧪 === GENERATING DASHBOARD TEST SCAN ===')
      
      // 15% chance for market events, 85% chance for regular coin scan
      const eventRoll = Math.random()
      
      let testScanAction
      
      if (eventRoll < 0.05) {
        console.log('📉 Generating Market Crash event!')
        testScanAction = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          player: playerName || 'Market Screen',
          action: 'Test Scan',
          effect: 'Market Crash! Alle munten -10%!',
          avatar: playerAvatar,
          cryptoSymbol: undefined, // No specific crypto for market events
          percentageValue: undefined // No specific percentage for market events
        }
      } else if (eventRoll < 0.10) {
        console.log('🚀 Generating Bull Run event!')
        testScanAction = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          player: playerName || 'Market Screen',
          action: 'Test Scan',
          effect: 'Bull Run! Alle munten +5%!',
          avatar: playerAvatar,
          cryptoSymbol: undefined,
          percentageValue: undefined
        }
      } else if (eventRoll < 0.15) {
        console.log('🐋 Generating Whale Alert event!')
        testScanAction = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          player: playerName || 'Market Screen',
          action: 'Test Scan',
          effect: 'Whale Alert! Random munt +50%!',
          avatar: playerAvatar,
          cryptoSymbol: undefined,
          percentageValue: undefined
        }
      } else {
        const cryptoSymbols = ['DSHEEP', 'NGT', 'LNTR', 'OMLT', 'REX', 'ORLO']
        const randomCoin = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)]
        
        const bound = 2
        const randomPercentageStr = (Math.random() * (2 * bound) - bound).toFixed(1)
        const randomPercentage = parseFloat(randomPercentageStr)
        const sign = randomPercentage >= 0 ? '+' : ''

        console.log(`🎯 Generating regular coin scan: ${randomCoin} ${sign}${randomPercentageStr}%`)
        testScanAction = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          player: playerName || 'Market Screen',
          action: 'Test Scan',
          effect: `${randomCoin} ${sign}${randomPercentageStr}%`,
          avatar: playerAvatar,
          cryptoSymbol: randomCoin,
          percentageValue: randomPercentage
        }
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

    generateTestScan()
  }

  // Force next turn function for debugging/fixing turn bugs
  const handleForceNextTurn = () => {
    console.log('\n⏭️ === FORCE NEXT TURN FROM DASHBOARD ===')
    console.log('📺 Dashboard playerName:', playerName)
    console.log('🏠 Room ID:', roomId)
    console.log('🔌 Socket connected:', !!socket && socket.connected)

    if (!socket || !roomId || roomId === 'solo-mode') {
      console.warn('⚠️ Cannot force next turn - missing socket or not in multiplayer room')
      return
    }

    console.log('📡 Emitting turn:end to force next player turn')
    socket.emit('turn:end', { roomCode: roomId })
    console.log('✅ Force next turn request sent')
  }

  // Manual sync function to refresh all player data
  const handleManualSync = () => {
    console.log('\n🔄 === MANUAL SYNC TRIGGERED ===')
    console.log('📺 Dashboard playerName:', playerName)
    console.log('🏠 Room ID:', roomId)
    console.log('🔌 Socket connected:', !!socket && socket.connected)

    if (!socket || !roomId || roomId === 'solo-mode') {
      console.warn('⚠️ Cannot sync - missing socket or not in multiplayer room')
      return
    }

    setIsSyncing(true)
    console.log('📡 Requesting full data refresh from all players')
    
    // Request fresh data from server
    socket.emit('dashboard:requestRefresh', { roomCode: roomId })
    
    // Visual feedback - stop syncing animation after 2 seconds
    setTimeout(() => {
      setIsSyncing(false)
      console.log('✅ Sync complete')
    }, 2000)
  }

  // Handle timer toggle
  const handleTimerToggle = () => {
    const newTimerState = !timerEnabled
    
    console.log(`\n⏱️ === TIMER TOGGLE CLICKED ===`)
    console.log(`  Current state: ${timerEnabled ? 'ENABLED' : 'DISABLED'}`)
    console.log(`  New state: ${newTimerState ? 'ENABLED' : 'DISABLED'}`)
    console.log(`  Room ID: ${roomId}`)
    console.log(`  Socket exists: ${!!socket}`)
    console.log(`  Socket connected: ${socket?.connected}`)
    
    if (!socket) {
      console.error(`❌ No socket available!`)
      return
    }
    
    if (!roomId) {
      console.error(`❌ No roomId available!`)
      return
    }
    
    // Update local state first
    setTimerEnabled(newTimerState)
    console.log(`✅ Local state updated to: ${newTimerState ? 'ENABLED' : 'DISABLED'}`)
    
    // Emit to server
    console.log(`📡 Emitting room:toggleTimer to server...`)
    socket.emit('room:toggleTimer', { 
      roomCode: roomId, 
      enabled: newTimerState 
    })
    console.log(`✅ Timer toggle sent to server`)
    console.log(`⏱️ === TIMER TOGGLE COMPLETE ===\n`)
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

  // Listen for timer state changes from server
  useEffect(() => {
    if (!socket) return

    const handleTimerStateChanged = ({ enabled }: { enabled: boolean }) => {
      console.log(`⏱️ Timer state changed from server: ${enabled ? 'ENABLED' : 'DISABLED'}`)
      setTimerEnabled(enabled)
    }

    socket.on('room:timerStateChanged', handleTimerStateChanged)

    return () => {
      socket.off('room:timerStateChanged', handleTimerStateChanged)
    }
  }, [socket])

  // Helper function to sanitize effects
  const sanitizeEffect = (effect: string) => {
    try {
      if (typeof effect !== 'string') return effect
      return effect
        .replace(/\bRIZZ\b/g, 'NGT')
        .replace(/\bWHALE\b/g, 'REX')
    } catch {
      return effect
    }
  }

  // Watch for new events and show event cards (both player AND auto events)
  useEffect(() => {
    // Combine both player and auto scan actions, excluding win actions
    const allEvents = [...(playerScanActions || []), ...(autoScanActions || [])]
      .filter((action: any) => !action.isWinAction) // Filter out win actions
      .sort((a, b) => b.timestamp - a.timestamp)

    console.log('🎯 DASHBOARD EVENT DETECTION (PLAYER + AUTO EVENTS):')
    console.log('📊 Auto scan actions (INCLUDED):', autoScanActions?.length || 0)
    console.log('👤 Player scan actions (INCLUDED):', playerScanActions?.length || 0)
    console.log('🏆 Win actions (EXCLUDED):', (playerScanActions || []).filter((a: any) => a.isWinAction).length)
    console.log('🎲 All events to check:', allEvents.length)

    if (allEvents.length === 0) return

    const latestEvent = allEvents[0] // Most recent event is first
    if (!latestEvent) return

    const effect = sanitizeEffect(latestEvent.effect)
    console.log('🎲 Latest event effect:', effect)
    console.log('🆔 Latest event ID:', latestEvent.id)
    console.log('⏰ Latest event timestamp:', new Date(latestEvent.timestamp).toLocaleTimeString())
    
    // Check if this is a market-wide event or individual crypto event
    const isMarketEvent = effect.includes('Bull Run') || effect.includes('Market Crash') || effect.includes('Whale Alert')
    
    // Expanded detection for individual crypto events - check for various formats
    const isIndividualEvent = 
      effect.includes('stijgt') || effect.includes('daalt') ||  // Dutch: "stijgt/daalt"
      effect.includes('beweegt') ||                            // Dutch: "beweegt" 
      effect.includes('move') ||                               // English: "move"
      effect.includes('dip') ||                                // English: "dip"
      /\b(DSHEEP|NGT|LNTR|OMLT|REX|ORLO)\b/.test(effect)      // Any crypto symbol in effect
    
    console.log('🔍 Event detection:')
    console.log('  📈 Is market event:', isMarketEvent)
    console.log('  💰 Is individual event:', isIndividualEvent)
    console.log('  🎯 Should show event:', isMarketEvent || isIndividualEvent)
    
    if (isMarketEvent || isIndividualEvent) {
      // Check if we already showed this event (prevent duplicate cards)
      if (lastShownEventId.current === latestEvent.id) return
      
      // Mark this event as shown
      lastShownEventId.current = latestEvent.id

      let eventType: 'boost' | 'crash' | 'event' = 'event'
      let cryptoSymbol: string | undefined = undefined
      let percentage: number | undefined = undefined
      let message = ''
      let icon = ''
      let color = ''

      if (effect.includes('Bull Run')) {
        message = 'Bull Run! Alle munten!'
        icon = '🚀'
        color = 'green-500'  // Positive event = GREEN
        eventType = 'event'
        percentage = 5
      } else if (effect.includes('Market Crash')) {
        message = 'Market Crash! Alle munten!'
        icon = '📉'
        color = 'red-500'  // Negative event = RED
        eventType = 'event'
        percentage = -10
      } else if (effect.includes('Whale Alert')) {
        message = 'Whale Alert!'
        icon = '🐋'
        color = 'green-500'  // Positive event = GREEN (+50%)
        eventType = 'event'
        percentage = 50
        // Extract crypto symbol from effect if available
        const symbolMatch = effect.match(/\b(DSHEEP|NGT|LNTR|OMLT|REX|ORLO)\b/)
        if (symbolMatch) {
          cryptoSymbol = symbolMatch[0]
          message = `Whale Alert! ${cryptoSymbol}!`
        }
      } else if (isIndividualEvent) {
        // Parse individual crypto events - support multiple formats
        const parts = effect.split(' ')
        const cryptoName = parts[0] || 'Crypto'
        
        // Extract percentage from effect (CRITICAL: must match ScanResult logic exactly)
        // Look for percentage with + or - sign, including decimals
        const percentageMatch = effect.match(/([+-]?\d+(?:\.\d+)?)%?/)
        const percentageValue = percentageMatch ? parseFloat(percentageMatch[1]) : 0
        
        // SIMPLIFIED: Use same logic as ScanResult - only percentage determines direction
        const isPositive = percentageValue > 0
        
        console.log('🔍 PERCENTAGE PARSING DEBUG:')
        console.log('  📊 Original effect:', effect)
        console.log('  🔢 Percentage match:', percentageMatch)
        console.log('  📈 Percentage value:', percentageValue)
        console.log('  ✅ Is positive:', isPositive)
        
        // Map crypto names to symbols
        const nameToSymbol: { [key: string]: string } = {
          'DigiSheep': 'DSHEEP',
          'Nugget': 'NGT', 
          'Lentra': 'LNTR',
          'Omlet': 'OMLT',
          'Rex': 'REX',
          'Orlo': 'ORLO'
        }
        
        // Try to extract symbol directly from effect first
        const symbolMatch = effect.match(/\b(DSHEEP|NGT|LNTR|OMLT|REX|ORLO)\b/)
        cryptoSymbol = symbolMatch ? symbolMatch[0] : (nameToSymbol[cryptoName] || cryptoName)
        
        // Create appropriate message based on the original effect
        if (effect.includes('beweegt')) {
          message = `${cryptoName} beweegt!`
        } else if (effect.includes('move')) {
          message = `${cryptoName} move!`
        } else if (effect.includes('dip')) {
          message = `${cryptoName} dip!`
        } else {
          message = `${cryptoName} ${isPositive ? 'stijgt' : 'daalt'}!`
        }
        
        // Use percentage-based colors: GREEN for positive, RED for negative (consistent with ScanResult)
        const cryptoIcons: { [key: string]: string } = {
          'DSHEEP': '🐑',
          'NGT': '🐔',
          'LNTR': '🌟',
          'OMLT': '🥚',
          'REX': '💫',
          'ORLO': '🎵'
        }
        
        icon = cryptoIcons[cryptoSymbol] || (isPositive ? '📈' : '📉')
        // Color based on percentage sign: green for +, red for -
        color = isPositive ? 'green-500' : 'red-500'
        eventType = isPositive ? 'boost' : 'crash'
        percentage = percentageValue // Keep original percentage value with correct sign
        
        console.log('🎨 STYLING DEBUG:')
        console.log('  🎯 Final percentage:', percentage)
        console.log('  🎨 Color:', color)
        console.log('  📊 Event type:', eventType)
        console.log('  🔄 Is positive check:', isPositive)
      }

      // Show kans event with ScanResult component
      setCurrentKansEvent({
        type: eventType,
        cryptoSymbol,
        percentage,
        message,
        icon,
        color
      })
      
      setShowKansEvent(true)
      
      console.log('✅ SHOWING PLAYER KANS EVENT ON DASHBOARD:')
      console.log('  📊 Message:', message)
      console.log('  💰 Symbol:', cryptoSymbol)
      console.log('  📈 Percentage:', percentage)
      console.log('  🎨 Color:', color)
      console.log('  🎯 Icon:', icon)
      console.log('  🎲 Source: PLAYER KANS EVENT (not auto beurs event)')

      // Auto-hide after 3.1 seconds (same as ScanResult)
      setTimeout(() => {
        setShowKansEvent(false)
        setTimeout(() => {
          setCurrentKansEvent(null)
        }, 300) // Wait for fade out animation (same as ScanResult)
      }, 3100)
    } else {
      console.log('❌ Event NOT shown on dashboard:', effect)
      console.log('   Reason: Not recognized as market or individual event')
    }
  }, [playerScanActions]) // Only watch player kans events, not auto beurs events

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

  // Special tiles: beste stijger & meest waard
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

  // Graph helper: grootste absolute procentuele beweging
  const maxAbsChange = cryptos.reduce((max, c) => {
    const v = typeof c.change24h === 'number' ? Math.abs(c.change24h) : 0
    return v > max ? v : max
  }, 0) || 1


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
                  <div className="flex items-center gap-2">
                    {/* Timer Toggle - NOW ON THE LEFT */}
                    <button
                      onClick={handleTimerToggle}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all active:scale-95 ${
                        timerEnabled 
                          ? 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30' 
                          : 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
                      }`}
                      title={timerEnabled ? 'Timer ingeschakeld (60s auto turn)' : 'Timer uitgeschakeld (manueel einde beurt)'}
                    >
                      <Clock className={`w-3 h-3 ${timerEnabled ? 'text-green-400' : 'text-red-400'}`} />
                      <span className={`text-xs font-bold ${timerEnabled ? 'text-green-400' : 'text-red-400'}`}>
                        {timerEnabled ? 'AAN' : 'UIT'}
                      </span>
                    </button>
                    <div className="bg-neon-purple/20 px-3 py-1 rounded-full border border-neon-purple/50">
                      <span className="text-neon-purple text-xs font-bold">Room: {roomId}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-gray-400 text-xs">Laatste update</p>
                    <p className="text-neon-gold font-semibold text-sm">
                      {currentTime.toLocaleTimeString('nl-NL')}
                    </p>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className={`p-2 rounded-lg transition-all ${
                      isSyncing 
                        ? 'bg-neon-blue/20 cursor-not-allowed' 
                        : 'bg-neon-blue/10 hover:bg-neon-blue/20 active:scale-95'
                    }`}
                    title="Sync alle speler data"
                  >
                    <RefreshCw 
                      className={`w-4 h-4 text-neon-blue ${isSyncing ? 'animate-spin' : ''}`}
                    />
                  </button>
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
                  <span>🏆</span>
                  <span>Live Rankings</span>
                </h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-semibold">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {players
                  .slice()
                  // Dashboard toont enkel de totalValue die van de server komt
                  .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
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
                          €{(player.totalValue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>

        {/* Markt overzicht + highlight-tiles in één widget */}
        <div className="crypto-card mb-3">
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-neon-turquoise" />
            <span>Markt</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></div>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Links: coin-tiles in 2x3 grid, iets smaller */}
            <div className="lg:col-span-2">
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
                          <img
                            src={imagePath}
                            alt={crypto.name}
                            width={140}
                            height={140}
                            className={`object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)] ${
                              isLentra ? 'scale-175' : 'scale-105'
                            }`}
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-4xl">{crypto.icon}</span>
                        )}
                      </div>

                      {/* Donkere achtergrond alleen achter info-blok onderaan, nog compacter */}
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
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rechts: gecombineerde highlight-widget met paarse glow en 2 secties */}
            <div className="flex flex-col h-full">
              {(topGainer || topValueCoin) && (
                <div className="crypto-card border border-neon-purple/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] bg-gradient-to-br from-dark-bg/95 via-dark-bg/92 to-purple-900/20 p-3 flex flex-col h-full">
                  {/* Sectie: Beste stijger */}
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

                  {/* Sectie: Meest waard */}
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
                        isPositiveEvent(action.effect) ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {sanitizeEffect(action.effect)}
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

          {/* Acties - Uniform met MainMenu */}
          <div className="crypto-card bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ListChecks className="w-5 h-5 text-neon-purple" />
                <span>Acties</span>
              </h3>
              <div className="bg-neon-purple/20 px-2 py-1 rounded-full border border-neon-purple/50">
                <span className="text-neon-purple text-xs font-bold">{playerScanActions.length} acties</span>
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
                          isPositiveEvent(action.effect) ? 'text-green-400' : 'text-red-400'
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
      
      {showEndGameModal && playerName === 'Market Dashboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="crypto-card max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Spel definitief afsluiten?</h3>
            <p className="text-gray-300 text-sm mb-5">
              Hiermee wordt het huidige spel volledig beëindigd en wordt alle spelgeschiedenis gewist. Weet je het zeker?
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex-1 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm font-semibold"
                onClick={() => setShowEndGameModal(false)}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
                onClick={() => {
                  setShowEndGameModal(false)
                  if (onEndGame) {
                    onEndGame()
                  }
                }}
              >
                Ja, afsluiten
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                    {toast.sender === 'Systeem' ? '👤' : '💬'}
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
              const eff = sanitizeEffect(a.effect)
              const p = parse(eff)
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
                      const eff = sanitizeEffect(a.effect)
                      const p = parse(eff)

                      const isMarketEvent = eff.includes('Bull Run') || eff.includes('Market Crash') || eff.includes('Whale Alert')

                      const calc = (() => {
                        // Marktbrede events: toon één samengestelde 'Markt' regel
                        if (isMarketEvent) {
                          const avgCurrent = cryptos.length
                            ? cryptos.reduce((sum, c) => sum + (typeof c.change24h === 'number' ? c.change24h : 0), 0) / cryptos.length
                            : 0
                          let eventPct = 0
                          if (eff.includes('Bull Run')) eventPct = 5
                          else if (eff.includes('Market Crash')) eventPct = -10
                          else if (eff.includes('Whale Alert')) eventPct = 50

                          const baselineBeforeEvent = Math.round((avgCurrent - eventPct) * 10) / 10

                          return {
                            current: avgCurrent,
                            baseline: baselineBeforeEvent,
                            event: eventPct,
                            symbol: 'Markt'
                          }
                        }

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

                      const isPositive = calc
                        ? calc.current >= 0
                        : p
                          ? p.pct >= 0
                          : eff.includes('+')
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
                              <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{eff}</span>
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

      {/* Dashboard controls - alleen zichtbaar op host Market Dashboard, onder Markt Impact Analyse */}
      {playerName === 'Market Dashboard' && (
        <div className="max-w-6xl mx-auto mt-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleForceNextTurn}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-semibold text-sm shadow-lg shadow-blue-900/40 border border-blue-400/60 transition-transform duration-200 hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              <span>Volgende Beurt</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEndGameModal(true)}
              className="py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white font-semibold text-sm shadow-lg shadow-red-900/40 border border-red-400/60 transition-transform duration-200 hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <Power className="w-4 h-4" />
              <span>Spel afsluiten</span>
            </button>
          </div>
        </div>
      )}

      {/* Event Overlay - uses ScanResult component for consistency */}
      {showKansEvent && currentKansEvent && (
        <ScanResult
          externalScenario={currentKansEvent}
          onClose={() => {
            setShowKansEvent(false)
            setCurrentKansEvent(null)
          }}
          onApplyEffect={(effect) => {
            console.log('Event applied on dashboard:', effect)
            setShowKansEvent(false)
            setCurrentKansEvent(null)
          }}
        />
      )}
    </div>
  )
}
