'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import StartScreen from '@/components/StartScreen'
import LoginScreen from '@/components/LoginScreen'
import { playPositiveSound, playNegativeSound, playEventSound, playForecastSound } from '@/utils/soundEffects'
import { useAuth } from '@/hooks/useAuth'
import AuthModal from '@/components/AuthModal'
import SubscriptionModal from '@/components/SubscriptionModal'
import GameSetup from '@/components/GameSetup'
import HostSetup from '@/components/HostSetup'
import RoleSelection from '@/components/RoleSelection'
import RoomCreate from '@/components/RoomCreate'
import RoomJoin from '@/components/RoomJoin'
import WaitingRoom from '@/components/WaitingRoom'
import MainMenu from '@/components/MainMenu'
import InsiderForecast from '@/components/InsiderForecast'
import GameDashboard from '@/components/GameDashboard'
import QRScanner from '@/components/QRScanner'
import MarketOverview from '@/components/MarketOverview'
import MarketDashboard from '@/components/MarketDashboard'
import Settings from '@/components/SettingsNew'
import Cash from '@/components/Cash'
import SpelersRanking from '../components/SpelersRanking'
import ScanTranscript from '../components/ScanTranscript'
import ActionsMenu from '@/components/ActionsMenu'
import BuyCrypto from '@/components/BuyCrypto'
import Win from '../components/Win'
import SwapScreen from '@/components/SwapScreen'
import WhaleChoice from '@/components/WhaleChoice'
import EventPopup, { ScanEffect } from '@/components/EventPopup'
import { useSocket } from '@/hooks/useSocket'
import TurnTimer from '@/components/TurnTimer'
import WelcomeScreen from '@/components/WelcomeScreen'

type Screen = 'start-screen' | 'welcome' | 'host-setup' | 'player-login' | 'role-selection' | 'room-create' | 'room-join' | 'waiting-room' | 'login' | 'game-setup' | 'starting-game' | 'main-menu' | 'market-dashboard' | 'dashboard' | 'market' | 'qr-scanner' | 'portfolio' | 'cash' | 'rankings' | 'settings' | 'scan-transcript' | 'actions-menu' | 'buy' | 'sell' | 'win' | 'swap' | 'whale-choice' | 'game-over' | 'resume-game'

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
  purchasePrice?: number  // Laatste prijs die speler heeft betaald bij aankoop
}

interface GameState {
  startYear: number
  gameDuration: number
  gameStartTime: number
  lastSaveTime: number
}

export default function Home() {
  // Auth state for subscription system
  const { user, isSubscribed, isLoading: authLoading, refreshSubscription, lobbyCode, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [intendedRole, setIntendedRole] = useState<'host' | 'player'>('player')
  
  const [playerName, setPlayerName] = useState<string>('')
  const [playerAvatar, setPlayerAvatar] = useState<string>('👑')
  const [currentScreen, setCurrentScreen] = useState<Screen>('start-screen')
  const [previousScreen, setPreviousScreen] = useState<Screen>('main-menu')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [hasExistingSession, setHasExistingSession] = useState(false)
  const [roomId, setRoomId] = useState<string>('')
  const [isHost, setIsHost] = useState<boolean>(false)
  const [lastScanEffect, setLastScanEffect] = useState<string>('')
  const [cashBalance, setCashBalance] = useState<number>(1000.00)
  const [selectedVolatility, setSelectedVolatility] = useState<'low'|'medium'|'high'>('medium')
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [connectedPlayers, setConnectedPlayers] = useState<number>(0)
  const [dashboardToasts, setDashboardToasts] = useState<{ id: string, message: string, sender: string }[]>([])
  const [joinNotification, setJoinNotification] = useState<{ id: string, message: string, playerName: string, playerAvatar: string, isRejoining: boolean } | null>(null)
  const [turnNotification, setTurnNotification] = useState<{ id: string, message: string, playerName: string, playerAvatar: string } | null>(null)
  const [swapNotification, setSwapNotification] = useState<{ id: string, message: string, fromPlayerName: string, fromPlayerAvatar: string, receivedCrypto: string, lostCrypto: string } | null>(null)
  const [showOtherPlayerEvent, setShowOtherPlayerEvent] = useState<boolean>(false)
  const [otherPlayerEventData, setOtherPlayerEventData] = useState<ScanEffect | null>(null)
  const [currentEventId, setCurrentEventId] = useState<string>('') // Stable key for EventPopup
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null) // Track auto-close timer
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [isGameFinishedForPlayer, setIsGameFinishedForPlayer] = useState<boolean>(false)
  const [playerFinishRank, setPlayerFinishRank] = useState<number | null>(null)
  const [showFinishNotification, setShowFinishNotification] = useState<boolean>(false)
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(120)
  const [isFirstTurn, setIsFirstTurn] = useState<boolean>(true) // Track if this is the first turn
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false)
  const [insiderUsed, setInsiderUsed] = useState<boolean>(false)
  const [showInsiderForecast, setShowInsiderForecast] = useState<boolean>(false)
  const [insiderForecastData, setInsiderForecastData] = useState<{ topGainer: { symbol: string; percentage: number }; topLoser: { symbol: string; percentage: number } } | null>(null)
  
  // Debug: Log pause state changes
  useEffect(() => {
    console.log(`🎮 isGamePaused state changed to: ${isGamePaused}`)
  }, [isGamePaused])

  // Handle subscription success from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscriptionStatus = urlParams.get('subscription')
    
    if (subscriptionStatus === 'success') {
      // Refresh subscription status after successful payment
      refreshSubscription()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
      console.log('✅ Subscription successful - refreshing status')
    } else if (subscriptionStatus === 'cancelled') {
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
      console.log('❌ Subscription cancelled')
    }
  }, [refreshSubscription])
  const hasNotifiedFinishRef = useRef<boolean>(false) // Prevent duplicate finish notifications
  
  // Track shown events to prevent duplicates
  const shownEventIdsRef = useRef<Set<string>>(new Set())
  
  // Get socket connection for game events (room state only; we don't rely on socket.id for turn logic)
  const { socket, room } = useSocket()

  // 🚨 HELPER: Safe emit player data - blocks zero/invalid values
  const safeEmitPlayerData = useCallback((playerData: any, context: string = 'unknown') => {
    if (!socket || !roomId || roomId === 'solo-mode') {
      return false
    }

    const totalValue = playerData.totalValue
    
    // Block zero or invalid values
    if (typeof totalValue !== 'number' || isNaN(totalValue) || totalValue <= 0) {
      console.warn(`⚠️ BLOCKED ${context} - Invalid totalValue: €${totalValue}`)
      return false
    }

    console.log(`📡 ${context}: Emitting player data with totalValue €${totalValue.toFixed(2)}`)
    socket.emit('player:updateData', {
      roomCode: roomId,
      playerData
    })
    return true
  }, [socket, roomId])

  // Find my socket ID in the room players
  const mySocketId = useMemo(() => {
    if (!room || !room.players || !socket) return null
    
    // First: try to use current socket.id if it exists in room.players
    if (socket.id && room.players[socket.id]) {
      const player = room.players[socket.id]
      if (!player.isHost) {
        console.log('✅ Using current socket.id:', socket.id)
        return socket.id
      }
    }
    
    // Fallback: Find the socket ID that matches my name and avatar
    // (This is needed for initial join before socket.id is in room)
    for (const [socketId, player] of Object.entries(room.players)) {
      if (!player.isHost && player.name === playerName && player.avatar === playerAvatar) {
        console.log('🔍 Found socket ID by name/avatar:', socketId)
        return socketId
      }
    }

    console.warn('⚠️ Could not find mySocketId')
    return null
  }, [room, socket, playerName, playerAvatar])

  // Session recovery events will be added after state declarations

  const handleEndGame = () => {
    console.log('\n🛑 === END GAME REQUEST FROM DASHBOARD ===')

    // Clear any persisted session data
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cryptoClashSession')
        localStorage.removeItem('cryptoclash-session')
        localStorage.removeItem('cryptoclash-last-join')
        localStorage.removeItem('cryptoclash-room-state')
        localStorage.removeItem('cryptoclash-player-state')
        console.log('✅ All session data cleared')
      } catch (e) {
        console.warn('⚠️ Failed to clear local storage session on end game', e)
      }
    }

    // Notify server so all spelers worden afgesloten
    if (socket && roomId) {
      console.log('📡 Emitting game:end to server for room', roomId)
      socket.emit('game:end', { roomCode: roomId, requestedBy: playerName })
    } else {
      console.log('⚠️ No active socket/room, performing local fallback clear')
      setRoomId('')
      setConnectedPlayers(0)
      setPlayers([])
      setPlayerScanActions([])
      setAutoScanActions([])
      navigateToScreen('qr-scanner')
    }
  }

  const isMyTurn = useMemo(() => {
    // In solo-mode, always allow actions
    if (!roomId || roomId === 'solo-mode') return true

    // If no room data yet, disable actions in multiplayer
    if (!room) return false

    // If we can't find our socket ID, disable actions
    if (!mySocketId) {
      console.log('🎯 Cannot find my socket ID in room players', { playerName, playerAvatar })
      return false
    }

    // Determine who should have the turn
    let activeTurnSocketId: string | null = null

    if (room.currentTurnPlayerId) {
      // Server has explicitly set who's turn it is
      activeTurnSocketId = room.currentTurnPlayerId
    } else if (room.playerOrder && room.playerOrder.length > 0) {
      // Fallback: first player in the order
      activeTurnSocketId = room.playerOrder[0]
    }

    const myTurn = activeTurnSocketId === mySocketId
    
    console.log('🎯 === TURN CHECK ===')
    console.log('  My socket ID:', mySocketId)
    console.log('  My name:', playerName)
    console.log('  Active turn socket ID:', activeTurnSocketId)
    console.log('  Room currentTurnPlayerId:', room.currentTurnPlayerId)
    console.log('  Room playerOrder:', room.playerOrder)
    console.log('  ✅ IS MY TURN:', myTurn)
    console.log('🎯 === END TURN CHECK ===')
    
    return myTurn
  }, [roomId, room, mySocketId, playerName, playerAvatar])

  const actionsDisabled = !isMyTurn || isGameFinishedForPlayer
  const lastEmittedScanId = useRef<string | null>(null)
  const appliedEventIdsRef = useRef<Set<string>>(new Set())
  const hasSyncedMarketStateRef = useRef<boolean>(false)
  
  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([])
  
  // Scan actions state
  const [playerScanActions, setPlayerScanActions] = useState<any[]>([])
  const [autoScanActions, setAutoScanActions] = useState<any[]>([])
  
  // Price history for candlestick charts
  const [priceHistory, setPriceHistory] = useState<Record<string, Array<{percentage: number, timestamp: number}>>>({})
  
  // Dynamic players data based on room players
  const [players, setPlayers] = useState<any[]>([])
  const [roomPlayers, setRoomPlayers] = useState<any>({}) // Store room player data from server
  
  // Utility function to filter valid players (no host, no disconnected)
  const isValidPlayer = (playerData: any) => {
    if (!playerData) return false
    if (playerData.isHost === true) return false
    if (playerData.disconnected === true) return false
    // Also filter by name patterns as fallback
    if (playerData.name && (playerData.name.includes('Host') || playerData.name.includes('host') || playerData.name === 'Market Dashboard')) return false
    return true
  }
  
  // Track last sent totalValue to prevent unnecessary updates
  const lastSentTotalValue = useRef<number | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Function to calculate portfolio value from portfolio object
  const calculatePortfolioValue = (portfolio: any, playerName?: string) => {
    if (!portfolio || typeof portfolio !== 'object') {
      return 0
    }
    
    const value = Object.entries(portfolio).reduce((total, [symbol, amount]) => {
      const crypto = cryptos.find(c => c.symbol === symbol)
      const itemValue = crypto ? crypto.price * (amount as number) : 0
      return total + itemValue
    }, 0)
    
    return Math.round(value * 100) / 100 // Round to 2 decimal places for consistency
  }

  // Function to update players list from room data
  const updatePlayersFromRoom = (roomPlayersData: any) => {
    if (!roomPlayersData || Object.keys(roomPlayersData).length === 0) {
      // Handle solo mode or empty room
      if (roomId === 'solo-mode' || !roomId) {
        const portfolioValue = Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
        const totalValue = Math.round((portfolioValue + cashBalance) * 100) / 100
        setPlayers([{
          id: 'solo-player',
          name: playerName || 'Solo Player',
          avatar: playerAvatar || '👤',
          totalValue: totalValue,
          portfolio: cryptos.reduce((acc, crypto) => {
            acc[crypto.symbol] = crypto.amount
            return acc
          }, {} as any),
          cashBalance: cashBalance,
          rank: 1
        }])
      } else {
        setPlayers([])
      }
      return
    }

    console.log('\n📊 === UPDATING DASHBOARD RANKINGS ===')
    console.log('🔄 Processing roomPlayers data...')
    console.log('👥 Total players in room data:', Object.keys(roomPlayersData).length)

    const updatedPlayers = Object.entries(roomPlayersData)
      .filter(([playerId, playerData]: [string, any]) => {
        const valid = isValidPlayer(playerData)
        if (!valid) {
          console.log(`⏭️ Skipping invalid player: ${playerData.name} (isHost: ${playerData.isHost}, disconnected: ${playerData.disconnected})`)
        }
        return valid
      })
      .map(([playerId, playerData]: [string, any]) => {
        
        // Rankings moeten ALTIJD werken met de totalValue die voor de speler is opgeslagen.
        // Er wordt geen nieuw totaal meer berekend uit portfolio/cash om schommelingen te voorkomen.
        let totalValue = playerData.totalValue
        
        console.log(`\n🔍 Processing player: ${playerData.name} (${playerId.substring(0, 8)}...)`)
        console.log(`   Server data:`, {
          totalValue: playerData.totalValue,
          portfolioValue: playerData.portfolioValue,
          cashBalance: playerData.cashBalance
        })
        
        // Als er (tijdelijk) geen totalValue bekend is, toon 0 en wacht op eerste updateData van de speler.
        if (totalValue === undefined || totalValue === null || Number.isNaN(totalValue)) {
          console.log(`   ⚠️ Geen geldige totalValue voor ${playerData.name} – stel voorlopig in op €0, wacht op live update`)
          totalValue = 0
        } else {
          console.log(`   ✅ Using stored totalValue: €${totalValue.toFixed(2)}`)
        }
        
        return {
          id: playerId,
          name: playerData.name || 'Unknown Player',
          avatar: playerData.avatar || '👤',
          totalValue: totalValue,
          portfolioValue: playerData.portfolioValue || 0,
          portfolio: playerData.portfolio || {},
          cashBalance: playerData.cashBalance || 1000,
          rank: 0 // Will be calculated after sorting
        }
      })

    // Sort by total value and assign ranks
    const sortedPlayers = updatedPlayers
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((player, index) => ({ ...player, rank: index + 1 }))

    console.log('📊 Final dashboard rankings:')
    sortedPlayers.forEach(p => {
      console.log(`  ${p.rank}. ${p.name}: €${p.totalValue.toFixed(2)}`)
    })
    console.log('📊 === DASHBOARD RANKINGS UPDATED ===\n')
    
    setPlayers(sortedPlayers)
    
    // FORCE IMMEDIATE SYNC: If we're the dashboard and detect stale data, request fresh updates
    if (playerName === 'Market Dashboard' && socket && roomId) {
      const now = Date.now()
      const lastRefresh = localStorage.getItem(`dashboard-refresh-${roomId}`)
      const timeSinceRefresh = lastRefresh ? now - parseInt(lastRefresh) : Infinity
      
      // If it's been more than 2 seconds since last refresh, or we have no timestamp, refresh
      if (timeSinceRefresh > 2000) {
        console.log('🔧 FORCING DASHBOARD SYNC: Requesting fresh data from all players')
        localStorage.setItem(`dashboard-refresh-${roomId}`, now.toString())
        setTimeout(() => {
          socket.emit('dashboard:requestRefresh', { roomCode: roomId })
        }, 50)
      }
    }
  }

  const [cryptos, setCryptos] = useState<CryptoCurrency[]>([
    {
      id: '1',
      name: 'DigiSheep',
      symbol: 'DSHEEP',
      price: 1420.75,
      change24h: 0,
      amount: 1.0,
      color: 'neon-purple',
      icon: '🐑',
      volume: 2800000,
      marketCap: 18500000
    },
    {
      id: '2',
      name: 'Nugget',
      symbol: 'NGT',
      price: 3250.90,
      change24h: 0,
      amount: 0,
      color: 'neon-blue',
      icon: '🐔',
      volume: 5400000,
      marketCap: 42000000
    },
    {
      id: '3',
      name: 'Lentra',
      symbol: 'LNTR',
      price: 685.40,
      change24h: 0,
      amount: 0,
      color: 'neon-turquoise',
      icon: '🌟',
      volume: 3600000,
      marketCap: 14200000
    },
    {
      id: '4',
      name: 'Omlet',
      symbol: 'OMLT',
      price: 890.25,
      change24h: 0,
      amount: 1,
      color: 'neon-gold',
      icon: '🥚',
      volume: 2100000,
      marketCap: 11800000
    },
    {
      id: '5',
      name: 'Rex',
      symbol: 'REX',
      price: 1750.60,
      change24h: 0,
      amount: 1,
      color: 'neon-purple',
      icon: '💫',
      volume: 4200000,
      marketCap: 28900000
    },
    {
      id: '6',
      name: 'Orlo',
      symbol: 'ORLO',
      price: 2340.80,
      change24h: 0,
      amount: 0,
      color: 'neon-blue',
      icon: '🔮',
      volume: 3900000,
      marketCap: 32500000
    }
  ])

  // Optimized memoized calculations for performance
  const totalPortfolioValue = useMemo(() => {
    return Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
  }, [cryptos])

  const totalValue = useMemo(() => {
    return Math.round((totalPortfolioValue + cashBalance) * 100) / 100
  }, [totalPortfolioValue, cashBalance])

  // Memoized crypto portfolio for data sync
  const cryptoPortfolio = useMemo(() => {
    return cryptos.reduce((acc, crypto) => {
      acc[crypto.symbol] = crypto.amount
      return acc
    }, {} as Record<string, number>)
  }, [cryptos])

  // Optimized portfolio calculation with crypto price lookup cache
  const cryptoPriceMap = useMemo(() => {
    return cryptos.reduce((map, crypto) => {
      map[crypto.symbol] = crypto.price
      return map
    }, {} as Record<string, number>)
  }, [cryptos])

  const calculatePortfolioValueOptimized = useCallback((portfolio: any, playerName?: string) => {
    if (!portfolio || typeof portfolio !== 'object') {
      return 0
    }
    
    const value = Object.entries(portfolio).reduce((total, [symbol, amount]) => {
      const price = cryptoPriceMap[symbol] || 0
      return total + (price * (amount as number))
    }, 0)
    
    return Math.round(value * 100) / 100
  }, [cryptoPriceMap])

  // ⚡ INSTANT Dashboard Updates - WATERDICHTE FIX - Alleen values updaten, geen re-sort tenzij nodig
  const handleLivePlayerUpdate = useCallback(({ playerId, playerName, playerAvatar, totalValue, portfolioValue, cashBalance, timestamp }: any) => {
    console.log(`\n⚡ === LIVE UPDATE RECEIVED ===`)
    console.log(`👤 Player: ${playerName} | 💯 €${totalValue?.toFixed(2) || 'N/A'}`)
    
    // Host en dashboard zijn GEEN spelers – nooit in rankings opnemen
    if (playerName === 'Market Dashboard' || (playerName && playerName.includes('Host'))) {
      console.log('⏭️ Skipping live update for host/dashboard – geen speler')
      return
    }
    
    // 🚨 CRITICAL: Validate totalValue before processing
    if (typeof totalValue !== 'number' || isNaN(totalValue) || totalValue < 0) {
      console.warn(`⚠️ INVALID totalValue - IGNORING`)
      return
    }
    
    // 🚨 EXTRA PROTECTION: Reject zero values completely for dashboard
    if (totalValue === 0) {
      console.warn(`⚠️ ZERO totalValue received for ${playerName} - IGNORING (prevents flicker)`)
      return
    }

    setPlayers(prev => {
      const existingIndex = prev.findIndex(p => p.id === playerId)
      
      // 🚨 Nieuwe speler - alleen toevoegen met geldige waarde
      if (existingIndex === -1) {
        if (totalValue <= 0) {
          console.warn(`⚠️ Not adding ${playerName} with zero value`)
          return prev
        }
        console.log(`➕ Adding new player: ${playerName}`)
        
        const newPlayer = {
          id: playerId,
          name: playerName,
          avatar: playerAvatar || '👤',
          totalValue: totalValue,
          portfolioValue: portfolioValue,
          cashBalance: cashBalance,
          portfolio: {},
          rank: 0,
          lastUpdate: timestamp
        }
        
        // Voeg toe en sorteer meteen
        const withNew = [...prev, newPlayer]
        const sorted = withNew
          .filter(p => typeof p.totalValue === 'number' && !isNaN(p.totalValue) && p.totalValue > 0)
          .sort((a, b) => b.totalValue - a.totalValue)
          .map((player, index) => ({ ...player, rank: index + 1 }))
        
        return sorted
      }
      
      // 🚨 Bestaande speler - ALLEEN VALUE UPDATEN
      const existingPlayer = prev[existingIndex]
      const oldValue = existingPlayer.totalValue || 0
      const newValue = totalValue
      
      // Negeer 0-updates als we al een positieve waarde hebben
      if (newValue <= 0 && oldValue > 0) {
        console.warn(`⚠️ Ignoring zero update for ${playerName}`)
        return prev
      }
      
      // Skip als waarde niet significant veranderd is (< €0.01)
      if (Math.abs(oldValue - newValue) < 0.01) {
        return prev
      }
      
      console.log(`🔄 ${playerName}: €${oldValue.toFixed(2)} → €${newValue.toFixed(2)}`)
      
      // Maak een kopie van de array met de geüpdatete speler
      const updated = [...prev]
      updated[existingIndex] = {
        ...existingPlayer,
        totalValue: newValue,
        portfolioValue: portfolioValue,
        cashBalance: cashBalance,
        lastUpdate: timestamp
      }
      
      // 🚨 WATERDICHT: Check of de RANKING VOLGORDE verandert
      // Alleen re-sorteren als de nieuwe waarde de positie zou veranderen
      const needsResort = (() => {
        const currentRank = existingPlayer.rank || existingIndex + 1
        
        // Check of deze speler nu hoger zou moeten staan
        for (let i = 0; i < existingIndex; i++) {
          if (updated[i].totalValue < newValue) {
            return true // Moet hoger
          }
        }
        
        // Check of deze speler nu lager zou moeten staan
        for (let i = existingIndex + 1; i < updated.length; i++) {
          if (updated[i].totalValue > newValue) {
            return true // Moet lager
          }
        }
        
        return false // Volgorde blijft hetzelfde
      })()
      
      if (!needsResort) {
        console.log(`✅ Rank stays same - NO RESORT`)
        return updated
      }
      
      // Alleen sorteren als de volgorde echt verandert
      console.log(`🔄 Resorting rankings...`)
      const sorted = updated
        .filter(p => typeof p.totalValue === 'number' && !isNaN(p.totalValue) && p.totalValue > 0)
        .sort((a, b) => b.totalValue - a.totalValue)
        .map((player, index) => ({ ...player, rank: index + 1 }))
      
      return sorted
    })
  }, [])

  // Handle test message received -> show dashboard toast when on market-dashboard
  const handleTestMessageReceived = useCallback((payload: any) => {
    console.log('\n🧪 === TEST MESSAGE RECEIVED ===')
    console.log('📥 Payload:', payload)
    console.log('📺 Current screen:', currentScreen)
    const { message, sender, timestamp } = payload || {}
    if (!message) {
      console.warn('⚠️ No message in payload!')
      return
    }
    console.log('💬 Message content:', message)
    console.log('👤 Sender:', sender)
    if (currentScreen === 'market-dashboard') {
      console.log('✅ Queuing toast on Market Dashboard')
      const id = `test-${timestamp || Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setDashboardToasts(prev => {
        const next = [...prev, {
          id,
          message,
          sender: sender || 'Test'
        }]
        // Limit to last 5 messages to avoid unbounded growth
        return next.slice(-5)
      })
    } else {
      console.log('⚠️ Not on market-dashboard, toast will not show. Current screen:', currentScreen)
    }
    console.log('🧪 === TEST MESSAGE PROCESSED ===\n')
  }, [currentScreen])

  // 🎯 UNIFIED DATA SYNC HANDLER - Receives validated data from server
  const handlePlayerDataSync = useCallback(({ playerId, playerName, totalValue, portfolioValue, cashBalance, portfolio, timestamp, version }: any) => {
    console.log(`🎯 UNIFIED SYNC RECEIVED: ${playerName} → €${totalValue} (v${version})`)
    
    // 🚨 CRITICAL: Market Dashboard should ONLY use dashboard:livePlayerUpdate
    // This event can contain stale/zero values and cause flickering
    if (playerName === 'Market Dashboard' || (playerName && playerName.includes('Host'))) {
      console.log('📊 Dashboard/host ignoring player:dataSync - deze zijn geen spelers')
      return
    }
    
    // Update players state with server-validated data
    setPlayers(prev => {
      const updated = prev.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            name: playerName,
            totalValue: totalValue,
            portfolioValue: portfolioValue,
            cashBalance: cashBalance,
            portfolio: portfolio,
            lastUpdate: timestamp,
            version: version
          }
        }
        return player
      })
      
      // Sort by totalValue and reassign ranks
      const sorted = updated
        .sort((a, b) => b.totalValue - a.totalValue)
        .map((player, index) => ({ ...player, rank: index + 1 }))
      
      console.log(`📊 UNIFIED RANKINGS:`)
      sorted.forEach(p => {
        console.log(`  ${p.rank}. ${p.name}: €${p.totalValue.toFixed(2)} (v${p.version || 'N/A'})`)
      })
      
      return sorted
    })

    // 🔄 SELF-CORRECTION - If this is our own data, validate consistency
    if (socket && socket.id === playerId) {
      const currentLocalTotal = Math.round((totalPortfolioValue + cashBalance) * 100) / 100
      const serverTotal = Math.round(totalValue * 100) / 100
      
      if (Math.abs(currentLocalTotal - serverTotal) > 0.01) {
        console.log(`⚠️ SELF-CORRECTION NEEDED:`)
        console.log(`📱 Local calculated: €${currentLocalTotal}`)
        console.log(`📊 Server validated: €${serverTotal}`)
        console.log(`🔧 Accepting server value as authoritative`)
      }
    }
  }, [socket, totalPortfolioValue, cashBalance])

  // Update players when room data or player info changes
  useEffect(() => {
    // 🚨 CRITICAL: Dashboard should ONLY use dashboard:livePlayerUpdate
    // updatePlayersFromRoom can contain stale data and override live updates
    if (playerName === 'Market Dashboard') {
      console.log('📊 Dashboard detected - COMPLETELY BLOCKING updatePlayersFromRoom')
      return
    }
    
    // Only proceed if we have crypto data
    if (cryptos.length === 0) {
      return
    }
    
    console.log('\n🔄 === UPDATE PLAYERS FROM ROOM TRIGGERED ===')
    console.log('🏠 Room ID:', roomId)
    console.log('👥 Room Players Count:', Object.keys(roomPlayers).length)
    console.log('📊 Current Players Array Length:', players.length)
    
    if (Object.keys(roomPlayers).length > 0) {
      console.log('✅ Updating players from room data')
      updatePlayersFromRoom(roomPlayers)
    } else if (roomId === 'solo-mode' || !roomId) {
      console.log('🎮 Solo mode - using local player data')
      updatePlayersFromRoom(null) // Triggers solo mode fallback
    } else {
      console.log('⚠️ No room players data available yet')
    }
    console.log('🔄 === UPDATE COMPLETE ===\n')
  }, [cashBalance, playerName, playerAvatar, roomId, roomPlayers, cryptos, players.length])

  // 🎯 UNIFIED DATA SYNC - Single Source of Truth
  useEffect(() => {
    if (!socket || !roomId || roomId === 'solo-mode' || !playerName) {
      return
    }

    const updatedPortfolio = cryptoPortfolio

    // 🚨 CRITICAL: Use FRESH calculations for sync - NO MEMOIZATION
    const localPortfolioValue = Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
    const localTotalValue = Math.round((localPortfolioValue + cashBalance) * 100) / 100

    const sendUnifiedUpdate = (force = false) => {
      // 🚨 CRITICAL: Never send zero or invalid values
      if (localTotalValue <= 0 || isNaN(localTotalValue)) {
        console.warn(`⚠️ BLOCKING SYNC - Invalid totalValue: €${localTotalValue}`)
        return
      }
      
      const timestamp = new Date().toLocaleTimeString()
      console.log(`\n🎯 === UNIFIED DATA SYNC [${timestamp}] ===`)
      console.log(`👤 Player: ${playerName}`)
      console.log(`💎 Portfolio Value: €${localPortfolioValue}`)
      console.log(`💰 Cash Balance: €${cashBalance}`)
      console.log(`💯 TOTAL VALUE: €${localTotalValue}`)
      console.log(`📊 Portfolio:`, updatedPortfolio)
      
      // 🎯 SINGLE UPDATE TO SERVER - Will broadcast to ALL devices
      socket.emit('player:updateData', {
        roomCode: roomId,
        playerData: {
          name: playerName,
          avatar: playerAvatar,
          portfolio: updatedPortfolio,
          cashBalance: cashBalance,
          portfolioValue: localPortfolioValue,
          totalValue: localTotalValue,
          timestamp: Date.now()
        }
      })
      
      lastSentTotalValue.current = localTotalValue
      console.log(`🎯 === UNIFIED SYNC SENT ===\n`)
    }

    // 🚨 CRITICAL FIX: ALWAYS send update when cryptos or cashBalance changes
    // Don't check server state - just send the latest local calculation
    // The server will validate and broadcast to all clients
    const valueDifference = lastSentTotalValue.current !== null 
      ? Math.abs(localTotalValue - lastSentTotalValue.current) 
      : Infinity
    
    // Send update if there's ANY change (even 0.01 cent)
    if (valueDifference > 0.001 || lastSentTotalValue.current === null) {
      console.log(`📊 Value changed by €${valueDifference.toFixed(2)} - sending update`)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      sendUnifiedUpdate()
    } else {
      console.log(`📊 No significant value change (€${valueDifference.toFixed(4)}) - skipping update`)
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [cashBalance, cryptos, socket, roomId, playerName, playerAvatar])

  // Removed duplicate useEffect - using single useEffect above for player data updates

  // 🔄 PERIODIC SYNC - Ensure dashboard always has latest data
  // 🚨 Use refs to always access current state without recreating interval
  const cryptosRef = useRef(cryptos)
  const cashBalanceRef = useRef(cashBalance)
  const cryptoPortfolioRef = useRef(cryptoPortfolio)
  
  useEffect(() => {
    cryptosRef.current = cryptos
    cashBalanceRef.current = cashBalance
    cryptoPortfolioRef.current = cryptoPortfolio
  }, [cryptos, cashBalance, cryptoPortfolio])
  
  useEffect(() => {
    if (!socket || !roomId || roomId === 'solo-mode' || !playerName || playerName === 'Market Dashboard') {
      return
    }

    console.log(`🔄 Starting periodic sync for ${playerName}`)

    // Send update every 3 seconds to ensure dashboard is always in sync - pause when game is paused
    const periodicSyncInterval = setInterval(() => {
      // Skip sync when game is paused
      if (isGamePaused) return
      
      // 🚨 CRITICAL: Access CURRENT state via refs (not stale closure values)
      const currentCryptos = cryptosRef.current
      const currentCash = cashBalanceRef.current
      const currentPortfolio = cryptoPortfolioRef.current
      
      const localPortfolioValue = Math.round(currentCryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
      const localTotalValue = Math.round((localPortfolioValue + currentCash) * 100) / 100

      // 🚨 CRITICAL: Never send zero or invalid values
      if (localTotalValue <= 0 || isNaN(localTotalValue)) {
        console.warn(`⚠️ PERIODIC SYNC BLOCKED - Invalid totalValue: €${localTotalValue}`)
        return
      }

      console.log(`\n🔄 === PERIODIC SYNC ===`)
      console.log(`👤 Player: ${playerName}`)
      console.log(`💯 Total Value: €${localTotalValue.toFixed(2)}`)
      console.log(`💎 Portfolio Value: €${localPortfolioValue.toFixed(2)}`)
      console.log(`💰 Cash Balance: €${currentCash.toFixed(2)}`)
      
      socket.emit('player:updateData', {
        roomCode: roomId,
        playerData: {
          name: playerName,
          avatar: playerAvatar,
          portfolio: currentPortfolio,
          cashBalance: currentCash,
          portfolioValue: localPortfolioValue,
          totalValue: localTotalValue,
          timestamp: Date.now()
        }
      })
      
      console.log(`🔄 === PERIODIC SYNC SENT ===\n`)
    }, 3000) // Every 3 seconds (faster updates)

    return () => {
      console.log(`🔄 Stopping periodic sync for ${playerName}`)
      clearInterval(periodicSyncInterval)
    }
  }, [socket, roomId, playerName, playerAvatar]) // Only recreate when connection changes

  // 🚀 INITIAL SYNC - Send data immediately after joining room
  useEffect(() => {
    if (!socket || !roomId || roomId === 'solo-mode' || !playerName) {
      return
    }

    // Wait a bit for socket to be fully connected and room joined
    const initialSyncTimer = setTimeout(() => {
      const updatedPortfolio = cryptoPortfolio
      const localPortfolioValue = Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
      const localTotalValue = Math.round((localPortfolioValue + cashBalance) * 100) / 100

      console.log(`\n🚀 === INITIAL SYNC AFTER JOIN ===`)
      console.log(`👤 Player: ${playerName}`)
      console.log(`💯 Initial Total Value: €${localTotalValue}`)
      
      socket.emit('player:updateData', {
        roomCode: roomId,
        playerData: {
          name: playerName,
          avatar: playerAvatar,
          portfolio: updatedPortfolio,
          cashBalance: cashBalance,
          portfolioValue: localPortfolioValue,
          totalValue: localTotalValue,
          timestamp: Date.now()
        }
      })
      
      console.log(`🚀 === INITIAL SYNC SENT ===\n`)
    }, 500) // Wait 500ms after join

    return () => clearTimeout(initialSyncTimer)
  }, [socket, roomId, playerName]) // Only run when these change (i.e., when joining)

  // Respond to dashboard refresh requests by immediately sending current player data
  useEffect(() => {
    if (!socket || !roomId || !playerName) return
    const handleDashboardRefresh = () => {
      try {
        const updatedPortfolio = cryptoPortfolio
        // 🚨 CRITICAL: Fresh calculations for dashboard sync
        const localPortfolioValue = Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
        const localTotalValue = Math.round((localPortfolioValue + cashBalance) * 100) / 100
        console.log('📡 Responding to dashboard:refreshRequested with fresh totals')
        socket.emit('player:updateData', {
          roomCode: roomId,
          playerData: {
            name: playerName,
            avatar: playerAvatar,
            portfolio: updatedPortfolio,
            cashBalance: cashBalance,
            portfolioValue: localPortfolioValue,
            totalValue: localTotalValue
          }
        })
      } catch (e) {
        console.warn('Failed to respond to dashboard refresh request', e)
      }
    }
    socket.on('dashboard:refreshRequested', handleDashboardRefresh)
    return () => {
      socket.off('dashboard:refreshRequested', handleDashboardRefresh)
    }
  }, [socket, roomId, playerName, playerAvatar, cryptos, cashBalance])

  // Check for existing session on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('cryptoclash-session')
        if (savedSession) {
          const sessionData = JSON.parse(savedSession)
          const now = Date.now()
          
          // Check if session is less than 24 hours old
          if (now - sessionData.lastSaveTime < 24 * 60 * 60 * 1000) {
            setPlayerName(sessionData.playerName || '')
            setPlayerAvatar(sessionData.playerAvatar || '👑')
            setGameState(sessionData.gameState || null)
            setCashBalance(sessionData.cashBalance || 1000)
            if (sessionData.cryptos) {
              setCryptos(sessionData.cryptos)
            }
            setHasExistingSession(true)
            setCurrentScreen('resume-game')
          } else {
            // Session expired, clear it
            console.log('Session expired, clearing')
            localStorage.removeItem('cryptoclash-session')
          }
        }
      } catch (error) {
        console.error('Error loading session:', error)
        localStorage.removeItem('cryptoclash-session')
      }
    }
  }, [])

  const simulateMarketChange = () => {
    setCryptos(prev => prev.map(crypto => {
      const changePercent = (Math.random() - 0.5) * 20 // -10% tot +10%
      const newPrice = crypto.price * (1 + changePercent / 100)
      
      return {
        ...crypto,
        price: Math.max(0.01, newPrice), // Minimum price of 0.01
        change24h: changePercent,
        volume: crypto.volume * (0.8 + Math.random() * 0.4), // 80% to 120% of original
        marketCap: crypto.marketCap * (1 + changePercent / 100)
      }
    }))
  }

  // Removed client-side periodic market updates. Prices now change only via
  // server live activities and manual scans to ensure consistent behavior across devices.

  // Monitor socket connection status
  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        console.log('✅ Socket connected')
        setIsConnected(true)
      }
      
      const handleDisconnect = () => {
        console.log('❌ Socket disconnected')
        setIsConnected(false)
      }
      
      const handleLobbyUpdate = (room: any) => {
        console.log('👥 === LOBBY UPDATE RECEIVED ===')
        console.log('👥 Room data:', room)
        if (room && room.players) {
          console.log('👥 Room players data:', room.players)
          setConnectedPlayers(Object.keys(room.players).length)
          
          // 🚨 CRITICAL: Dashboard should ONLY use dashboard:livePlayerUpdate for rankings
          // lobby:update can contain stale totalValue and override live player updates
          if (playerName === 'Market Dashboard') {
            console.log('📊 === DASHBOARD: BLOCKING ALL LOBBY:UPDATE LOGIC ===')
            console.log('📊 Dashboard uses ONLY dashboard:livePlayerUpdate')
            console.log('📊 NOT updating roomPlayers, NOT touching players state')
            console.log('📊 This prevents ALL flickering to 0')
            
            // 🚨 DO NOT set roomPlayers - this triggers updatePlayersFromRoom
            // DO NOT add/update players - wait for livePlayerUpdate only
            
            return // Skip EVERYTHING from lobby:update on dashboard
          }
          
          // Only set roomPlayers for non-dashboard clients
          setRoomPlayers(room.players)
          
          // 🚨 CRITICAL FIX: Immediately sync players array with room.players
          // This ensures new players appear in rankings instantly
          setPlayers(prevPlayers => {
            const existingPlayerIds = new Set(prevPlayers.map(p => p.id))
            const newPlayers: any[] = []
            
            Object.entries(room.players).forEach(([socketId, playerData]: [string, any]) => {
              if (!isValidPlayer(playerData)) {
                console.log(`⏭️ Skipping invalid player in lobby update: ${playerData.name}`)
                return
              }
              
              if (!existingPlayerIds.has(socketId)) {
                console.log(`➕ Adding new player to rankings: ${playerData.name}`)
                
                // 🚨 CRITICAL FIX: Calculate totalValue properly for new players
                let totalValue = playerData.totalValue
                if (totalValue === undefined || totalValue === null) {
                  const portfolioValue = playerData.portfolioValue || 0
                  const cashBalance = playerData.cashBalance || 1000
                  totalValue = Math.round((portfolioValue + cashBalance) * 100) / 100
                  console.log(`🔧 New player ${playerData.name} - Calculated totalValue: €${totalValue.toFixed(2)}`)
                }
                
                newPlayers.push({
                  id: socketId,
                  name: playerData.name,
                  avatar: playerData.avatar,
                  totalValue: totalValue,
                  portfolioValue: playerData.portfolioValue || 0,
                  cashBalance: playerData.cashBalance || 1000,
                  portfolio: playerData.portfolio || {},
                  rank: 0,
                  lastUpdate: Date.now()
                })
              }
            })
            
            if (newPlayers.length > 0) {
              const combined = [...prevPlayers, ...newPlayers]
              const sorted = combined.sort((a, b) => b.totalValue - a.totalValue).map((p, i) => ({ ...p, rank: i + 1 }))
              console.log(`✅ Updated rankings with ${newPlayers.length} new players`)
              return sorted
            }
            return prevPlayers
          })
          
          // DASHBOARD SELF-HEAL: Request fresh data
          if (playerName === 'Market Dashboard' && socket && roomId) {
            console.log('🔧 DASHBOARD SELF-HEAL: Requesting immediate refresh after lobby update')
            setTimeout(() => {
              socket.emit('dashboard:requestRefresh', { roomCode: roomId })
            }, 100)
          }
          
          console.log('🔄 Room players updated')
        }
      }
      
      // Set initial connection status
      setIsConnected(socket.connected)

      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('lobby:update', handleLobbyUpdate)
      socket.on('dashboard:livePlayerUpdate', handleLivePlayerUpdate)
      socket.on('player:dataSync', handlePlayerDataSync)
      
      // Handle year undo from admin
      socket.on('player:yearUndo', ({ playerName: undoPlayerName, actionId, cashAmount }: any) => {
        console.log('🔄 === YEAR UNDO EVENT ===')
        console.log('  Player to undo:', undoPlayerName)
        console.log('  My player name:', playerName)
        console.log('  Action ID:', actionId)
        console.log('  Cash to deduct:', cashAmount)
        
        // Only process if this is for the current player
        if (undoPlayerName === playerName) {
          console.log('🗓️ Decreasing year for current player')
          setCurrentYear((prev: number) => Math.max(2024, prev - 1))
          
          // Deduct cash balance
          if (cashAmount) {
            setCashBalance((prev: number) => Math.max(0, prev - cashAmount))
            console.log(`💰 Cash reduced by €${cashAmount}`)
          }
          
          // Remove the action from player scan actions
          setPlayerScanActions((prev: any[]) => prev.filter(a => a.id !== actionId))
          
          console.log('✅ Year undo processed')
        }
        
        console.log('🔄 === YEAR UNDO EVENT END ===')
      })
      
      // Handle general undo actions (buy/sell)
      socket.on('player:undoAction', ({ playerName: undoPlayerName, actionId, actionType, cryptoSymbol, amount, cashRefund, cashDeduction }: any) => {
        console.log('🔄 === UNDO ACTION EVENT ===')
        console.log('  Player to undo:', undoPlayerName)
        console.log('  My player name:', playerName)
        console.log('  Action ID:', actionId)
        console.log('  Action type:', actionType)
        console.log('  Crypto:', cryptoSymbol)
        console.log('  Amount:', amount)
        
        // Only process if this is for the current player
        if (undoPlayerName === playerName) {
          if (actionType === 'buy') {
            // Reverse buy: remove crypto, refund cash
            console.log(`🛒 Reversing buy: -${amount}x ${cryptoSymbol}, +€${cashRefund}`)
            
            setCryptos((prev: any[]) => prev.map(c => 
              c.symbol === cryptoSymbol 
                ? { ...c, amount: Math.max(0, c.amount - amount) }
                : c
            ))
            
            setCashBalance((prev: number) => prev + cashRefund)
            
          } else if (actionType === 'sell') {
            // Reverse sell: add crypto back, deduct cash
            console.log(`💰 Reversing sell: +${amount}x ${cryptoSymbol}, -€${cashDeduction}`)
            
            setCryptos((prev: any[]) => prev.map(c => 
              c.symbol === cryptoSymbol 
                ? { ...c, amount: c.amount + amount }
                : c
            ))
            
            setCashBalance((prev: number) => Math.max(0, prev - cashDeduction))
          }
          
          // Remove the action from player scan actions
          setPlayerScanActions((prev: any[]) => prev.filter(a => a.id !== actionId))
          
          console.log('✅ Undo action processed')
        }
        
        console.log('🔄 === UNDO ACTION EVENT END ===')
      })
      
      // Handle turn changes
      socket.on('turn:changed', ({ newTurnPlayerId, newTurnPlayerName, previousTurnPlayerId, autoAdvanced }: any) => {
        console.log('⏭️ === TURN CHANGED EVENT ===')
        console.log('  New turn player ID:', newTurnPlayerId)
        console.log('  New turn player name:', newTurnPlayerName)
        console.log('  Previous turn player ID:', previousTurnPlayerId)
        console.log('  Auto advanced:', autoAdvanced)
        console.log('  My socket ID:', mySocketId)
        console.log('  Is it my turn now?:', newTurnPlayerId === mySocketId)
        
        // First turn has ended - enable timer from now on
        if (isFirstTurn) {
          console.log('⏰ First turn ended - timer will now be active for future turns')
          setIsFirstTurn(false)
        }
        
        // Show notification popup - find player avatar
        const notificationId = `turn-${Date.now()}`
        const newTurnPlayer = players.find(p => p.name === newTurnPlayerName)
        const newTurnPlayerAvatar = newTurnPlayer?.avatar || '👤'
        
        setTurnNotification({
          id: notificationId,
          message: `Beurt nu aan ${newTurnPlayerName}`,
          playerName: newTurnPlayerName,
          playerAvatar: newTurnPlayerAvatar
        })
        
        // Auto-hide notification after 4 seconds
        setTimeout(() => {
          setTurnNotification(prev => prev?.id === notificationId ? null : prev)
        }, 4000)
        
        // Reset insider usage for new turn
        setInsiderUsed(false)
        console.log('🔄 Insider usage reset for new turn')
        
        console.log('⏭️ === TURN CHANGED EVENT END ===')
      })

      // Handle insider info response from server
      socket.on('player:insiderInfo', (data) => {
        console.log('🕵️ === INSIDER INFO RECEIVED ===')
        console.log('📊 Data:', data)
        
        setInsiderForecastData(data)
        setShowInsiderForecast(true)
        console.log('🕵️ Insider forecast popup shown')
      })

      // Handle game pause/resume events
      socket.on('game:paused', () => {
        console.log('\n⏸️ === GAME PAUSED EVENT RECEIVED ===')
        console.log('🏠 Room:', roomId)
        console.log('🔌 Socket ID:', socket.id)
        console.log('⏸️ Setting isGamePaused to TRUE')
        setIsGamePaused(true)
        console.log('✅ Game pause state updated')
      })

      socket.on('game:resumed', () => {
        console.log('\n▶️ === GAME RESUMED EVENT RECEIVED ===')
        console.log('🏠 Room:', roomId)
        console.log('🔌 Socket ID:', socket.id)
        console.log('▶️ Setting isGamePaused to FALSE')
        setIsGamePaused(false)
        console.log('✅ Game resume state updated')
      })
      
      // Handle incoming swap from another player
      socket.on('player:swapReceived', ({ fromPlayerName, fromPlayerAvatar, receivedCryptoId, receivedAmount, lostCryptoId, lostAmount }: any) => {
        console.log('🔄 Swap received from another player:', { fromPlayerName, receivedCryptoId, receivedAmount, lostCryptoId, lostAmount })
        
        // Update local cryptos: -1 of lost crypto, +1 of received crypto
        // receivedCryptoId and lostCryptoId are SYMBOLS (not IDs)
        setCryptos(prevCryptos => {
          const newCryptos = prevCryptos.map(c => {
            if (c.symbol === lostCryptoId) {
              // Lose 1 coin
              return { ...c, amount: Math.max(0, c.amount - 1) }
            } else if (c.symbol === receivedCryptoId) {
              // Gain 1 coin
              return { ...c, amount: c.amount + 1 }
            }
            return c
          })
          
          // Calculate new values
          const newPortfolioValue = Math.round(newCryptos.reduce((sum, c) => sum + (c.price * c.amount), 0) * 100) / 100
          const newTotalValue = Math.round((newPortfolioValue + cashBalance) * 100) / 100
          
          // Update server with new values
          if (socket && roomId) {
            const newPortfolioMap = newCryptos.reduce((acc: any, c: any) => { 
              acc[c.symbol] = c.amount
              return acc 
            }, {} as Record<string, number>)
            
            socket.emit('player:updateData', {
              roomCode: roomId,
              playerData: {
                name: playerName,
                avatar: playerAvatar,
                portfolio: newPortfolioMap,
                cashBalance: cashBalance,
                portfolioValue: newPortfolioValue,
                totalValue: newTotalValue,
                timestamp: Date.now()
              }
            })
          }
          
          // Record swap action using the NEW cryptos state
          const receivedCrypto = newCryptos.find(c => c.symbol === receivedCryptoId)
          const lostCrypto = newCryptos.find(c => c.symbol === lostCryptoId)
          const swapAction = {
            id: `swap-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            timestamp: Date.now(),
            // Log vanuit HUIDIGE speler gezien
            player: playerName,
            action: `Swap 1x ${lostCrypto?.symbol || lostCryptoId} ↔ 1x ${receivedCrypto?.symbol || receivedCryptoId}`,
            effect: `met ${fromPlayerName}`,
            avatar: playerAvatar
          }

          // Lokale acties-log updaten (voor speler UI)
          // De auto-broadcast useEffect zal deze actie automatisch naar de server sturen
          setPlayerScanActions(prev => [swapAction, ...prev.slice(0, 9)])
          
          // Show styled notification instead of alert
          const notificationId = `swap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          setSwapNotification({
            id: notificationId,
            message: `Swap 1x ${lostCrypto?.symbol || lostCryptoId} ↔ 1x ${receivedCrypto?.symbol || receivedCryptoId}`,
            fromPlayerName: fromPlayerName,
            fromPlayerAvatar: fromPlayerAvatar,
            receivedCrypto: receivedCrypto?.symbol || receivedCryptoId,
            lostCrypto: lostCrypto?.symbol || lostCryptoId
          })
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setSwapNotification(prev => prev?.id === notificationId ? null : prev)
          }, 5000)
          
          return newCryptos
        })
      })
      
      // Handle game reset - when host starts a new game
      socket.on('game:reset', ({ message, roomCode }: any) => {
        console.log(`\n🔄 === GAME RESET RECEIVED ===`)
        console.log(`📝 Message: ${message}`)
        console.log(`🏠 Room: ${roomCode}`)
        console.log(`👤 Current player: ${playerName}`)
        
        // Only process if this is a regular player (not host/dashboard)
        if (playerName !== 'Market Dashboard' && !playerName.includes('Host')) {
          // Show message to player
          alert(message)
          
          // Reset to player login screen so they can rejoin with same credentials
          setCurrentScreen('player-login')
          
          // Clear room connection but keep player name/avatar
          setRoomId('')
          setConnectedPlayers(0)
          
          // Reset players list
          setPlayers([])
          
          console.log(`✅ Player ${playerName} redirected to login screen - can rejoin with same credentials`)
        } else {
          console.log(`📊 Host/Dashboard detected - ignoring reset message (they initiated it)`)
        }
        console.log(`🔄 === GAME RESET PROCESSED ===\n`)
      })
      
      // Handle player finish confirmation from server
      socket.on('player:finishConfirmed', ({ rank, yearsPlayed, finishTime }: any) => {
        console.log(`\n🏁 === PLAYER FINISH CONFIRMED ===`)
        console.log(`🏆 Rank: ${rank}`)
        console.log(`📅 Years played: ${yearsPlayed}`)
        console.log(`⏰ Finish time: ${new Date(finishTime).toLocaleTimeString()}`)
        
        setPlayerFinishRank(rank)
        setShowFinishNotification(true)
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setShowFinishNotification(false)
        }, 10000)
        
        console.log(`🏁 === FINISH CONFIRMED PROCESSED ===\n`)
      })
      
      // Handle other player finishing (for notifications)
      socket.on('player:finished', ({ playerName: finishedPlayerName, playerAvatar: finishedPlayerAvatar, rank, totalPlayers }: any) => {
        console.log(`\n🏁 === PLAYER FINISHED NOTIFICATION ===`)
        console.log(`👤 Player: ${finishedPlayerName}`)
        console.log(`🏆 Rank: ${rank}/${totalPlayers}`)
        
        // Only show notification if it's not the current player
        if (finishedPlayerName !== playerName) {
          // Could add a toast notification here
          console.log(`📢 ${finishedPlayerName} heeft het spel afgerond! Rank ${rank}/${totalPlayers}`)
        }
        
        console.log(`🏁 === PLAYER FINISHED PROCESSED ===\n`)
      })
      
      // Handle game ended - when host ends the game completely
      socket.on('game:ended', ({ message, roomCode }: any) => {
        console.log(`\n🛑 === GAME ENDED RECEIVED ===`)
        console.log(`📝 Message: ${message}`)
        console.log(`🏠 Room: ${roomCode}`)
        console.log(`👤 Current player: ${playerName}`)
        
        // Show message to all users
        alert(message)
        
        // Reset to appropriate screen
        if (playerName === 'Market Dashboard') {
          // Dashboard goes back to QR scanner
          setCurrentScreen('qr-scanner')
          console.log(`📊 Dashboard redirected to QR scanner`)
        } else if (playerName.includes('Host')) {
          // Host goes back to host setup
          setCurrentScreen('host-setup')
          console.log(`🎮 Host redirected to setup screen`)
        } else {
          // Regular players go to login
          setCurrentScreen('player-login')
          console.log(`👤 Player redirected to login screen`)
        }
        
        // Clear all game state
        setRoomId('')
        setConnectedPlayers(0)
        setPlayers([])
        setPlayerScanActions([])
        setAutoScanActions([])
        
        console.log(`✅ Game state cleared - ready for new game`)
        console.log(`🛑 === GAME ENDED PROCESSED ===\n`)
      })
      
      // Test message -> used to show toast on Market Dashboard
      socket.on('test:messageReceived', handleTestMessageReceived)
      // Authoritative market state (percentages) from server
      socket.on('market:stateUpdate', ({ change24h }: any) => {
        try {
          if (!change24h) return
          console.log('📡 market:stateUpdate received:', change24h)
          setCryptos(prev => prev.map(c => {
            const v = change24h[c.symbol]
            if (typeof v === 'number') {
              return { ...c, change24h: v }
            }
            return c
          }))
        } catch (e) {
          console.warn('Failed to apply market:stateUpdate', e)
        }
      })
      // 🚨 CRITICAL: Handle forced recalculation from server
      socket.on('crypto:forceRecalculation', ({ prices, timestamp, triggeredBy }: any) => {
        console.log(`🔄 FORCED RECALCULATION by ${triggeredBy} at ${new Date(timestamp).toLocaleTimeString()}`)
        console.log('💰 Using server prices:', prices)
        
        // Force update crypto prices
        setCryptos(prevCryptos => 
          prevCryptos.map(crypto => {
            const forcedPrice = prices[crypto.symbol]
            if (typeof forcedPrice !== 'number') return crypto

            return {
              ...crypto,
              price: forcedPrice
            }
          })
        )
        
        // Force immediate data sync after price update
        setTimeout(() => {
          if (socket && roomId && playerName) {
            const freshPortfolioValue = Object.entries(cryptoPortfolio).reduce((sum, [symbol, amount]) => {
              return sum + ((prices[symbol] || 0) * amount)
            }, 0)
            const freshTotalValue = Math.round((freshPortfolioValue + cashBalance) * 100) / 100
            
            console.log('🔄 Sending forced recalculation update to server')
            socket.emit('player:updateData', {
              roomCode: roomId,
              playerData: {
                name: playerName,
                avatar: playerAvatar,
                portfolio: cryptoPortfolio,
                cashBalance: cashBalance,
                portfolioValue: Math.round(freshPortfolioValue * 100) / 100,
                totalValue: freshTotalValue,
                timestamp: Date.now()
              }
            })
          }
        }, 100) // Small delay to ensure crypto state is updated
      })

      socket.on('crypto:priceHistory', (history: Record<string, Array<{percentage: number, timestamp: number}>>) => {
        console.log('📊 Received price history update:', history)
        setPriceHistory(history)
      })

      return () => {
        socket.off('connect', handleConnect)
        socket.off('disconnect', handleDisconnect)
        socket.off('lobby:update', handleLobbyUpdate)
        socket.off('dashboard:livePlayerUpdate', handleLivePlayerUpdate)
        socket.off('player:dataSync', handlePlayerDataSync)
        socket.off('player:yearUndo')
        socket.off('player:undoAction')
        socket.off('turn:changed')
        socket.off('player:insiderInfo')
        socket.off('player:swapReceived')
        socket.off('game:reset')
        socket.off('game:ended')
        socket.off('game:paused')
        socket.off('game:resumed')
        socket.off('test:messageReceived', handleTestMessageReceived)
        socket.off('market:stateUpdate')
        socket.off('crypto:priceUpdate')
        socket.off('crypto:forceRecalculation')
        socket.off('crypto:priceHistory')
      }
    }
  }, [socket, handleLivePlayerUpdate, handlePlayerDataSync, handleTestMessageReceived])

  // ALL CLIENTS push their current market snapshot once to initialize server state
  // This ensures the server knows the initial change24h values (like -3.2%, -1.8%, etc.)
  useEffect(() => {
    try {
      if (!socket || !roomId) return
      if (hasSyncedMarketStateRef.current) return
      const changeMap = cryptos.reduce((acc, c) => {
        acc[c.symbol] = typeof c.change24h === 'number' ? c.change24h : 0
        return acc
      }, {} as Record<string, number>)
      console.log(`📤 ${playerName} syncing initial market state to server`, changeMap)
      socket.emit('dashboard:syncMarketState', { roomCode: roomId, changeMap })
      hasSyncedMarketStateRef.current = true
    } catch (e) {
      console.warn('Failed to sync initial market state', e)
    }
  }, [socket, roomId, playerName, cryptos])

  useEffect(() => {
    if (!socket || !roomId || roomId === 'solo-mode') return
    if (playerName !== 'Market Dashboard') return

    const interval = setInterval(() => {
      // Skip refresh when game is paused
      if (isGamePaused) return
      
      console.log('⏱️ Dashboard requesting periodic refresh (10s)')
      socket.emit('dashboard:requestRefresh', { roomCode: roomId })
    }, 10000)

    return () => clearInterval(interval)
  }, [socket, roomId, playerName, isGamePaused])

  // Request scan data when joining a room
  useEffect(() => {
    if (socket && roomId && roomId !== 'solo-mode' && (currentScreen === 'main-menu' || currentScreen === 'market-dashboard')) {
      console.log('📊 Requesting scan data from server for room:', roomId)
      socket.emit('scanData:request', { roomCode: roomId })
    }
  }, [socket, roomId, currentScreen])

  // Handle rejoin detection and navigation
  useEffect(() => {
    if (socket && room) {
      const currentPlayer = socket.id ? room.players[socket.id] : null
      
      // Check if this is a rejoin to an active game
      if (currentPlayer && currentPlayer.isRejoining && room.started) {
        console.log('🔄 Detected rejoin to active game')
        console.log('💰 Restoring player data - Cash:', currentPlayer.cashBalance, 'Portfolio:', currentPlayer.portfolio)
        
        // Restore player's cash balance and portfolio
        if (typeof currentPlayer.cashBalance === 'number') {
          setCashBalance(currentPlayer.cashBalance)
        }
        
        if (currentPlayer.portfolio) {
          // Update crypto amounts from server portfolio data
          setCryptos(prev => prev.map(crypto => ({
            ...crypto,
            amount: currentPlayer.portfolio[crypto.symbol] || 0
          })))
        }
        
        console.log('🔄 Navigating to main menu after data restoration')
        navigateToScreen('main-menu')
      }
    }
  }, [room, socket])

  // Sync starting cash from room settings when available (for both host and players)
  useEffect(() => {
    try {
      if (room && socket) {
        // For host: use room settings
        if (isHost && room.settings && typeof room.settings.startingCash === 'number') {
          console.log(`💰 Host: Setting cash balance to €${room.settings.startingCash}`)
          setCashBalance(room.settings.startingCash)
        }
        // For players: use their player data from room
        else if (!isHost && socket.id && room.players && room.players[socket.id]) {
          const playerCash = room.players[socket.id].cashBalance
          if (typeof playerCash === 'number') {
            console.log(`💰 Player: Setting cash balance to €${playerCash}`)
            setCashBalance(playerCash)
          }
        }
      }
    } catch (e) {
      console.warn('Error syncing cash balance:', e)
    }
  }, [room, isHost, socket])

  // Auto-hide dashboard toast after 5 seconds
  useEffect(() => {
    if (!dashboardToasts || dashboardToasts.length === 0) return
    console.log('⏰ Dashboard toast shown, will auto-hide in 5 seconds')
    const t = setTimeout(() => {
      console.log('⏰ Auto-hiding oldest dashboard toast')
      setDashboardToasts(prev => prev.slice(1))
    }, 5000)
    return () => clearTimeout(t)
  }, [dashboardToasts])

  // Auto-hide join notification after 5 seconds
  useEffect(() => {
    if (!joinNotification) return
    const t = setTimeout(() => setJoinNotification(null), 5000)
    return () => clearTimeout(t)
  }, [joinNotification])

  // Auto-hide turn notification after 4 seconds
  useEffect(() => {
    if (!turnNotification) return
    const t = setTimeout(() => setTurnNotification(null), 4000)
    return () => clearTimeout(t)
  }, [turnNotification])

  // Ensure newest player-added scan is broadcast to room if not yet emitted
  useEffect(() => {
    // Skip if not in multiplayer room
    if (!socket || !roomId || roomId === 'solo-mode' || playerScanActions.length === 0) return
    
    const latest = playerScanActions[0]
    if (!latest) return
    
    // Only emit if the scan belongs to this player and wasn't already emitted
    if (latest.player === playerName && latest.id !== lastEmittedScanId.current) {
      console.log('\n🔄 === AUTO-BROADCAST CHECK ===')
      console.log('🔍 Latest scan ID:', latest.id)
      console.log('🔍 Last emitted ID:', lastEmittedScanId.current)
      console.log('🔍 Player match:', latest.player === playerName)
      console.log('🔍 Room ID:', roomId)
      console.log('🔍 Socket connected:', socket?.connected)
      
      try {
        console.log('📤 Auto-broadcasting scan action...')
        socket.emit('player:scanAction', {
          roomCode: roomId,
          scanAction: latest
        })
        lastEmittedScanId.current = latest.id
        console.log('🔁 Auto-broadcasted latest player scan to room:', roomId)
        console.log('📊 Scan details:', latest.effect)
        console.log('🔄 === AUTO-BROADCAST COMPLETE ===\n')
      } catch (e) {
        console.warn('Failed to auto-broadcast latest player scan', e)
      }
    } else {
      console.log('🔄 Auto-broadcast skipped:', {
        isOwnScan: latest.player === playerName,
        alreadyEmitted: latest.id === lastEmittedScanId.current,
        latestId: latest.id,
        lastEmittedId: lastEmittedScanId.current
      })
    }
  }, [playerScanActions, socket, roomId, playerName])

  // Listen for game start event from server
  useEffect(() => {
    if (socket) {
      const handleGameStarted = () => {
        console.log('🎮 === GAME STARTED EVENT RECEIVED ===')
        console.log('👤 Current player:', playerName)
        console.log('👑 Is host:', isHost)
        console.log('📱 Current screen:', currentScreen)
        
        // IMMEDIATE loading screen first
        console.log('⚡ IMMEDIATE navigation to loading screen')
        setCurrentScreen('starting-game')
        
        // Then navigate to final destination after 7 seconds
        setTimeout(() => {
          if (isHost) {
            console.log('👑 Host navigating to LIVE MARKET SCREEN (market-dashboard)')
            setCurrentScreen('market-dashboard')
          } else {
            console.log('👤 Player navigating to UNIQUE PLAYER INTERFACE (main-menu)')
            setCurrentScreen('main-menu')
          }
          console.log('✅ Final navigation completed')
        }, 7000)
      }

      socket.on('game:started', handleGameStarted)

      return () => {
        socket.off('game:started', handleGameStarted)
      }
    }
  }, [socket, isHost, playerName, currentScreen])

  // === SESSION RECOVERY EVENT HANDLERS ===
  useEffect(() => {
    if (!socket) return

    const handleSessionRecovered = ({ room: recoveredRoom, message }: any) => {
      console.log('\n\n🔥 === FULL SESSION RECOVERY DEBUG ===')
      console.log('💬 Message:', message)
      console.log('📦 Recovered Room:', recoveredRoom)
      console.log('🔍 Current socket.id:', socket?.id)
      
      // CRITICAL: Restore roomId from recovered room
      if (recoveredRoom && recoveredRoom.code) {
        console.log('🏠 Setting roomId:', recoveredRoom.code)
        setRoomId(recoveredRoom.code)
      } else {
        console.error('❌ No room code in recovered room!')
      }
      
      // Find my player data in the recovered room
      let restoredPlayerName = playerName
      if (recoveredRoom && recoveredRoom.players) {
        console.log('👥 All players in recovered room:', Object.keys(recoveredRoom.players))
        
        // Find player by socket ID (current socket)
        const myPlayerData = recoveredRoom.players[socket?.id || '']
        console.log('👤 My player data:', myPlayerData)
        
        if (myPlayerData && !myPlayerData.isHost) {
          console.log('✅ Restoring player identity:', myPlayerData)
          // Restore player name and avatar from server
          setPlayerName(myPlayerData.name)
          setPlayerAvatar(myPlayerData.avatar)
          restoredPlayerName = myPlayerData.name
          console.log('✅ Player identity restored:', myPlayerData.name, myPlayerData.avatar)
          
          // Restore isHost status
          setIsHost(false)
          console.log('✅ isHost set to false')
        } else {
          console.error('❌ Could not find player data in recovered room or player is host!')
          console.error('  socket.id:', socket?.id)
          console.error('  myPlayerData:', myPlayerData)
        }
      } else {
        console.error('❌ No players in recovered room!')
      }
      
      // Show success notification
      setDashboardToasts(prev => [...prev, {
        id: Date.now().toString(),
        message: message || 'Sessie hersteld!',
        sender: 'Systeem'
      }])
      
      // Log current state AFTER recovery
      console.log('\n📊 === STATE AFTER RECOVERY ===')
      console.log('  roomId:', recoveredRoom?.code)
      console.log('  playerName:', restoredPlayerName)
      console.log('  socket.id:', socket?.id)
      console.log('  currentScreen:', currentScreen)
      console.log('  room.currentTurnPlayerId:', recoveredRoom?.currentTurnPlayerId)
      console.log('  room.playerOrder:', recoveredRoom?.playerOrder)
      
      // Navigate to main menu if not already in game
      if (currentScreen === 'login' || currentScreen === 'waiting-room') {
        console.log('➡️ Navigating to main-menu')
        navigateToScreen('main-menu')
      } else {
        console.log('ℹ️ Staying on current screen:', currentScreen)
      }
      
      console.log('🔥 === SESSION RECOVERY DEBUG COMPLETE ===\n\n')
    }

    const handleSessionRecoveryFailed = ({ message }: any) => {
      console.error('❌ Session recovery failed:', message)
      // Clear stale data and return to login
      try {
        localStorage.removeItem('cryptoclash-player-state')
        localStorage.removeItem('cryptoclash-room-state')
      } catch (e) {
        console.warn('Failed to clear stale data', e)
      }
      navigateToScreen('login')
    }

    const handlePlayerReconnected = ({ playerName: reconnectedPlayer, playerAvatar: reconnectedAvatar, message }: any) => {
      console.log('🔄 Player reconnected:', reconnectedPlayer)
      if (currentScreen === 'market-dashboard') {
        setDashboardToasts(prev => [...prev, {
          id: Date.now().toString(),
          message: message || `${reconnectedPlayer} is weer verbonden`,
          sender: 'Systeem'
        }])
      }
    }

    socket.on('player:sessionRecovered', handleSessionRecovered)
    socket.on('player:sessionRecoveryFailed', handleSessionRecoveryFailed)
    socket.on('player:reconnected', handlePlayerReconnected)

    return () => {
      socket.off('player:sessionRecovered', handleSessionRecovered)
      socket.off('player:sessionRecoveryFailed', handleSessionRecoveryFailed)
      socket.off('player:reconnected', handlePlayerReconnected)
    }
  }, [socket, currentScreen])

  // === CORE EVENT HANDLERS FOR MARKET DATA ===
  useEffect(() => {
    if (!socket) return

    // handleTestMessageReceived moved to component scope as useCallback

    const handlePlayerJoinNotification = (payload: any) => {
      console.log('\n👋 === PLAYER JOIN NOTIFICATION ===')
      console.log('📥 Payload:', payload)
      const { playerName: joinedPlayerName, playerAvatar: joinedPlayerAvatar, message, isRejoining, timestamp } = payload || {}
      
      // Only show notification on Market Dashboard and not for self-joins
      if (currentScreen === 'market-dashboard' && joinedPlayerName !== playerName) {
        console.log('🎉 Showing join notification on Market Dashboard')
        setJoinNotification({
          id: `join-${timestamp || Date.now()}`,
          message,
          playerName: joinedPlayerName,
          playerAvatar: joinedPlayerAvatar,
          isRejoining: isRejoining || false
        })
      }
      console.log('👋 === PLAYER JOIN NOTIFICATION PROCESSED ===\n')
    }

    // Note: Socket event logging removed for production

    const handleRoomVerificationResult = (result: any) => {
      console.log('\n🔍 === ROOM VERIFICATION RESULT ===')
      console.log('📊 Room exists:', result.roomExists)
      console.log('🎯 Player in data:', result.playerInRoom)
      console.log('🎯 Socket in Socket.IO room:', result.socketInRoom)
      console.log('👥 Players count:', result.playersCount)
      console.log('🔌 Socket IDs in data:', result.socketIds)
      console.log('🔌 Actual sockets in Socket.IO room:', result.actualSocketsInRoom)
      
      if (!result.roomExists) {
        console.error('❌ CRITICAL: Room does not exist in data!')
        console.log('🔍 Available rooms:', result.availableRooms)
        console.log('🔌 But Socket.IO room has connections:', result.actualSocketsInRoom)
      } else if (!result.playerInRoom) {
        console.error('❌ CRITICAL: Player not in room data!')
        console.log('🔧 Need to rejoin room')
      } else if (!result.socketInRoom) {
        console.error('❌ CRITICAL: Socket not in Socket.IO room!')
        console.log('🔧 Socket.IO room membership missing - broadcasts will NOT work!')
      } else {
        console.log('✅ Room membership verified - all good!')
        console.log('✅ Both data and Socket.IO room membership confirmed')
      }
      console.log('🔍 === ROOM VERIFICATION COMPLETE ===\n')
    }

    // Dashboard refresh request handler - send fresh data immediately
    const handleDashboardRefresh = () => {
      if (roomId && roomId !== 'solo-mode' && playerName) {
        console.log('🔄 Dashboard requested refresh - sending fresh data NOW')
        
        const updatedPortfolio = cryptos.reduce((acc, crypto) => {
          acc[crypto.symbol] = crypto.amount
          return acc
        }, {} as any)
        
        const localPortfolioValue = Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
        const localTotalValue = Math.round((localPortfolioValue + cashBalance) * 100) / 100
        
        socket.emit('player:updateData', {
          roomCode: roomId,
          playerData: {
            name: playerName,
            avatar: playerAvatar,
            portfolio: updatedPortfolio,
            cashBalance: cashBalance,
            portfolioValue: localPortfolioValue,
            totalValue: localTotalValue
          }
        })
        
        console.log(`✅ Sent fresh data: €${localTotalValue}`)
      }
    }

    // Handle server-side scan data updates
    const handleScanDataUpdate = ({ autoScanActions, playerScanActions }: any) => {
      console.log('\n📊 === SERVER SCAN DATA UPDATE ===')
      console.log(`🤖 Auto scans received: ${autoScanActions.length}`)
      console.log(`👤 Player scans received: ${playerScanActions.length}`)
      
      // DEBUG: Log all player scans to see if forecast data is present
      playerScanActions.forEach((scan: any, index: number) => {
        if (scan.isForecast) {
          console.log(`🔮 FORECAST SCAN #${index}:`, {
            player: scan.player,
            effect: scan.effect,
            hasForecastData: !!scan.forecastData,
            forecastData: scan.forecastData
          })
        }
      })

      // Normalize timestamps to numbers and sort descending by time to ensure newest first
      const normalizeAndSort = (arr: any[] = []) =>
        arr
          .map(a => ({
            ...a,
            timestamp: Number(a?.timestamp ?? 0)
          }))
          .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))

      const normAuto = normalizeAndSort(autoScanActions)
      const normPlayer = normalizeAndSort(playerScanActions)

      // DETECT AND APPLY MARKET EVENTS IMMEDIATELY (before state update)
      // Find the NEWEST scan by timestamp (regardless of type)
      const allScans = [...normPlayer, ...normAuto]
      const latestScan = allScans.sort((a, b) => b.timestamp - a.timestamp)[0] // NEWEST scan by timestamp
      
      if (latestScan && latestScan.effect) {
        console.log('\n🔍 === CHECKING LATEST SCAN FOR MARKET EVENTS ===')
        console.log('📊 Latest scan effect:', latestScan.effect)
        
        // Check if this is a market event that needs price application
        if (latestScan.effect.includes('Market Crash') || 
            latestScan.effect.includes('Bull Run') || 
            latestScan.effect.includes('Whale Alert')) {
          
          console.log('🎯 MARKET EVENT DETECTED - Applying price changes!')
          
          // Create a ScanEffect object to pass to handleQRScan logic
          const marketEffect = {
            type: 'event' as const,
            message: latestScan.effect,
            icon: latestScan.effect.includes('Market Crash') ? '📉' : 
                  latestScan.effect.includes('Bull Run') ? '🚀' : '🐋',
            color: latestScan.effect.includes('Market Crash') ? 'red-500' : 
                   latestScan.effect.includes('Bull Run') ? 'green-500' : 'blue-500'
          }
          
          // Apply the market event logic (same as handleQRScan but without navigation)
          if (marketEffect.message.includes('Bull Run')) {
            console.log('🚀 APPLYING BULL RUN: All coins +5%')
            playPositiveSound()
            setCryptos(prev => prev.map(crypto => {
              const newPrice = Math.round(crypto.price * 1.05 * 100) / 100
              console.log(`  ${crypto.symbol}: €${crypto.price} → €${newPrice} (+5%)`)
              return {
                ...crypto,
                price: newPrice,
                change24h: crypto.change24h + 5,
                volume: crypto.volume * (0.9 + Math.random() * 0.2),
                marketCap: crypto.marketCap * 1.05
              }
            }))
          } else if (marketEffect.message.includes('Market Crash')) {
            console.log('📉 APPLYING MARKET CRASH: All coins -10%')
            playNegativeSound()
            setCryptos(prev => prev.map(crypto => {
              const newPrice = Math.round(crypto.price * 0.9 * 100) / 100
              console.log(`  ${crypto.symbol}: €${crypto.price} → €${newPrice} (-10%)`)
              return {
                ...crypto,
                price: newPrice,
                change24h: crypto.change24h - 10,
                volume: crypto.volume * (0.8 + Math.random() * 0.4),
                marketCap: crypto.marketCap * 0.9
              }
            }))
          } else if (marketEffect.message.includes('Whale Alert')) {
            console.log(`🐋 WHALE ALERT DETECTED - Navigating to choice screen`)
            // Navigeer direct naar whale-choice scherm (popup wordt automatisch gesloten)
            navigateToScreen('whale-choice')
            return // Stop verdere verwerking
          }
          
          console.log('✅ Market event applied to crypto prices!')
          
          // 🎯 CRITICAL FIX: Recalculate and update totalValue after market events
          // This ensures rankings stay accurate when prices change
          // Use setCryptos callback to get the updated crypto values
          setCryptos(prevCryptos => {
            // Calculate new portfolio value with updated prices
            const updatedPortfolioValue = Math.round(prevCryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
            const updatedTotalValue = Math.round((updatedPortfolioValue + cashBalance) * 100) / 100
            
            console.log('🔄 Recalculating totalValue after market event...')
            console.log(`📊 Updated Portfolio Value: €${updatedPortfolioValue.toFixed(2)}`)
            console.log(`💯 Updated Total Value: €${updatedTotalValue.toFixed(2)}`)
            
            if (socket && roomId && roomId !== 'solo-mode') {
              socket.emit('player:updateData', {
                roomCode: roomId,
                playerData: {
                  name: playerName,
                  avatar: playerAvatar,
                  totalValue: updatedTotalValue,
                  portfolioValue: updatedPortfolioValue,
                  cashBalance: cashBalance,
                  portfolio: prevCryptos.reduce((acc, crypto) => {
                    if (crypto.amount > 0) {
                      acc[crypto.symbol] = crypto.amount
                    }
                    return acc
                  }, {} as { [key: string]: number }),
                  timestamp: Date.now(),
                  version: Date.now()
                }
              })
              console.log('📡 Updated player data sent to server after market event')
            }
            
            return prevCryptos // Return unchanged cryptos since we already updated them above
          })
        }
        console.log('🔍 === MARKET EVENT CHECK COMPLETE ===\n')
      }

      // NOW update state with normalized data after event processing
      setAutoScanActions(normAuto)
      setPlayerScanActions(normPlayer)

      // Show event ONLY if it's NEW (not already shown)
      // CRITICAL: Find the ABSOLUTE NEWEST event across ALL scans
      // For Market Dashboard (host): show both player AND auto events
      // For Player screens: show ONLY player events (filter out auto beurs events)
      const allScansForPopup = isHost 
        ? [...normPlayer, ...normAuto]  // Market Dashboard: both
        : [...normPlayer]  // Player screens: only player events
      
      const newestEvent = allScansForPopup.sort((a, b) => b.timestamp - a.timestamp)[0]
      
      if (newestEvent && newestEvent.player && newestEvent.effect) {
        // Skip buy/sell/win actions - they should NOT trigger pop-ups
        if (newestEvent.action && (
          newestEvent.action.includes('Koop') || 
          newestEvent.action.includes('Verkoop') ||
          newestEvent.action.includes('Buy') ||
          newestEvent.action.includes('Sell') ||
          newestEvent.action.includes('Win') ||
          (newestEvent as any).isWinAction === true
        )) {
          console.log('⏭️ Skipping buy/sell/win action, no pop-up:', newestEvent.action)
          return
        }
        
        // ONLY block Bot automatic market events on player screens
        if (!isHost && newestEvent.player === 'Bot') {
          console.log('🚫 BLOCKED Bot auto event on Player Screen:', newestEvent.effect)
          return
        }
        
        // Only show pop-ups for actual game events (Test Scan, Kans, Event, Forecast)
        const isEventAction = newestEvent.action && (
          newestEvent.action.includes('Test Scan') || 
          newestEvent.action.includes('Kans') ||
          newestEvent.action.includes('Event') ||
          newestEvent.action.includes('Forecast')
        )
        
        if (!isEventAction) {
          console.log('⏭️ Not an event action, skipping popup:', newestEvent.action)
          return
        }
        
        // Check if we've already shown this event
        const eventId = newestEvent.id || `${newestEvent.timestamp}-${newestEvent.effect}`
        
        if (shownEventIdsRef.current.has(eventId)) {
          console.log('⏭️ Event already shown, skipping:', eventId)
          return // Already shown this event
        }
        
        // Mark this event as shown
        shownEventIdsRef.current.add(eventId)
        
        // Clean up old event IDs (keep only last 50)
        if (shownEventIdsRef.current.size > 50) {
          const idsArray = Array.from(shownEventIdsRef.current)
          shownEventIdsRef.current = new Set(idsArray.slice(-50))
        }
        
        const isForecast = newestEvent.effect.includes('Market Forecast') || newestEvent.isForecast

        const normalizeName = (name?: string | null) => (name || '').trim().toLowerCase()

        const normalizedEventPlayer = normalizeName(newestEvent.player)
        const normalizedCurrentPlayer = normalizeName(playerName)

        // Check if forecast data is present (server already filtered it)
        const hasForecastData = !!(newestEvent as any).forecastData?.topGainer && !!(newestEvent as any).forecastData?.topLoser
        
        const isMyForecast = isForecast && hasForecastData
        const isOtherPlayerForecast = isForecast && !hasForecastData
        
        console.log('🔔 NEW Event detected:', newestEvent.player, newestEvent.effect)
        console.log('🔮 Forecast check:', { isForecast, isMyForecast, isOtherPlayerForecast, hasForecastData })
        console.log('📊 Event ID:', eventId)
        console.log('📊 Event timestamp:', newestEvent.timestamp)
        console.log('📊 Current player (raw):', playerName)
        console.log('📊 Normalized names:', { normalizedEventPlayer, normalizedCurrentPlayer })
        console.log('📊 Scan data:', {
          effect: newestEvent.effect,
          cryptoSymbol: newestEvent.cryptoSymbol,
          percentageValue: newestEvent.percentageValue,
          player: newestEvent.player,
          isForecast: newestEvent.isForecast,
          isMyForecast,
          isOtherPlayerForecast,
          forecastData: (newestEvent as any).forecastData
        })
        
        // EXTRA DEBUG: Log complete newestEvent object to see all properties
        if (isForecast) {
          console.log('🔮 COMPLETE FORECAST EVENT:', JSON.stringify(newestEvent, null, 2))
        }
        
        // CRITICAL: Handle forecast privacy
        if (isForecast) {
          // If this is OTHER player's forecast (no data), show eye icon ONLY
          if (isOtherPlayerForecast) {
            const scanEffect: ScanEffect = {
              type: 'forecast',
              cryptoSymbol: null,
              percentage: 0,
              message: `${newestEvent.player} bekijkt Market Forecast`,
              icon: '👁️',
              color: 'neon-purple'
            }
            
            console.log('👁️ Other player forecast - showing eye icon ONLY')
            
            // Clear any existing auto-close timer
            if (autoCloseTimerRef.current) {
              clearTimeout(autoCloseTimerRef.current)
              autoCloseTimerRef.current = null
            }
            
            setCurrentEventId(eventId)
            setOtherPlayerEventData(scanEffect)
            setShowOtherPlayerEvent(true)
            
            // Short auto-close for forecast eye icon (3 seconds)
            autoCloseTimerRef.current = setTimeout(() => {
              setShowOtherPlayerEvent(false)
              setOtherPlayerEventData(null)
              setCurrentEventId('')
              autoCloseTimerRef.current = null
            }, 3000)
            return
          }
          
          // If this is MY forecast with data, continue to show full forecast
          if (isMyForecast) {
            console.log('🔮 MY FORECAST with data - will show full forecast with topGainer and topLoser')
          }
        }
        
        // Determine type based on effect message
        // CRITICAL: Check in correct order - most specific first!
        let eventType: 'boost' | 'crash' | 'event' | 'forecast' = 'boost'
        
        if (isForecast) {
          eventType = 'forecast'
        } else if (newestEvent.effect.includes('Bull Run!') || newestEvent.effect.includes('Market Crash!') || newestEvent.effect.includes('Whale Alert')) {
          // Market-wide events (with exclamation mark to be specific)
          eventType = 'event'
        } else if (newestEvent.percentageValue !== undefined && newestEvent.percentageValue !== null) {
          // Individual crypto events - use percentage to determine type
          eventType = newestEvent.percentageValue < 0 ? 'crash' : 'boost'
        } else if (newestEvent.effect.includes('daalt') || newestEvent.effect.includes('crash') || newestEvent.effect.includes('dip')) {
          // Fallback: text-based detection for crash
          eventType = 'crash'
        } else if (newestEvent.effect.includes('stijgt') || newestEvent.effect.includes('rally') || newestEvent.effect.includes('move')) {
          // Fallback: text-based detection for boost
          eventType = 'boost'
        }
        
        // Convert scan data to ScanEffect format
        const scanEffect: ScanEffect = {
          type: eventType,
          cryptoSymbol: newestEvent.cryptoSymbol,
          percentage: newestEvent.percentageValue,
          message: newestEvent.effect,
          icon: eventType === 'forecast' ? '🔮' : (newestEvent.cryptoSymbol || ''),
          color: eventType === 'event' ? 
                 (newestEvent.effect.includes('Bull Run') ? 'neon-gold' :
                  newestEvent.effect.includes('Market Crash') ? 'red-500' : 'neon-turquoise') :
                 eventType === 'forecast' ? 'neon-purple' :
                 eventType === 'crash' ? 'red-500' : 'neon-green',
          // CRITICAL: Only pass forecast data if this is MY forecast
          // Server filters it, but we add extra client-side validation for safety
          topGainer: (isForecast && isMyForecast) ? (newestEvent as any).forecastData?.topGainer : undefined,
          topLoser: (isForecast && isMyForecast) ? (newestEvent as any).forecastData?.topLoser : undefined
        }
        
        console.log('✅ Created ScanEffect:', scanEffect)
        console.log('🔮 Forecast flags:', { isForecast, isMyForecast, isOtherPlayerForecast })
        console.log('🔮 Raw forecastData from event:', (newestEvent as any).forecastData)
        if (eventType === 'forecast') {
          console.log('🔮 Forecast data in ScanEffect:', {
            hasTopGainer: !!scanEffect.topGainer,
            hasTopLoser: !!scanEffect.topLoser,
            topGainer: scanEffect.topGainer,
            topLoser: scanEffect.topLoser
          })
        }
        
        // Clear any existing auto-close timer before showing new popup
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current)
          autoCloseTimerRef.current = null
        }
        
        setCurrentEventId(eventId)
        setOtherPlayerEventData(scanEffect)
        setShowOtherPlayerEvent(true)
        
        // Play sound based on event type
        console.log('🔊 Playing sound for event:', scanEffect.type, scanEffect.message)
        if (scanEffect.type === 'forecast') {
          playForecastSound()
        } else {
          playEventSound(scanEffect.message)
        }
        
        // REMOVED: Auto-close timer - EventPopup component handles its own timing
        // This prevents popups from auto-closing when player manually dismisses them
      }

      console.log('✅ Scan data normalized and sorted from server')
      console.log('📊 === SERVER SCAN DATA UPDATE END ===\n')
    }

    // Handle undo action - show CORRECTIE popup
    const handleActionUndone = ({ action, isUndo }: any) => {
      console.log('\n🔄 === ACTION UNDONE EVENT ===')
      console.log('Action:', action)
      
      // Create event scenario for EventPopup
      const undoScenario: ScanEffect = {
        type: action.effect?.includes('Bull Run') || action.effect?.includes('Bear Market') || action.effect?.includes('Market Crash') ? 'event' : 'boost',
        message: action.effect || 'Actie teruggedraaid',
        icon: action.effect?.includes('Bull Run') ? '🐂' : 
              action.effect?.includes('Bear Market') || action.effect?.includes('Market Crash') ? '🐻' : 
              '↩️',
        color: action.percentageValue && action.percentageValue > 0 ? 'neon-gold' : 'red-500',
        percentage: action.percentageValue ? -action.percentageValue : undefined, // Reverse percentage
        cryptoSymbol: action.cryptoSymbol,
        isUndo: true // Mark as undo for CORRECTIE header
      }
      
      // Clear any existing auto-close timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
        autoCloseTimerRef.current = null
      }
      
      const undoEventId = `undo-${action.id}-${Date.now()}`
      setCurrentEventId(undoEventId)
      setOtherPlayerEventData(undoScenario)
      setShowOtherPlayerEvent(true)
    }

    // 📊 Core event listeners (clean architecture)
    socket.on('test:messageReceived', handleTestMessageReceived)
    socket.on('player:joinNotification', handlePlayerJoinNotification)
    socket.on('room:verificationResult', handleRoomVerificationResult)
    socket.on('dashboard:refreshRequested', handleDashboardRefresh)
    socket.on('scanData:update', handleScanDataUpdate)
    socket.on('action:undone', handleActionUndone)

    return () => {
      socket.off('test:messageReceived', handleTestMessageReceived)
      socket.off('player:joinNotification', handlePlayerJoinNotification)
      socket.off('room:verificationResult', handleRoomVerificationResult)
      socket.off('dashboard:refreshRequested', handleDashboardRefresh)
      socket.off('scanData:update', handleScanDataUpdate)
      socket.off('action:undone', handleActionUndone)
    }
  }, [socket])

  // Auto scan actions simulation - SYNCHRONIZED VERSION
  useEffect(() => {
    // Only skip on initial screens or if game hasn't started
    if (currentScreen === 'start-screen' || currentScreen === 'host-setup' || currentScreen === 'player-login' || !gameState) {
      return
    }
    
    const isInMultiplayerRoom = socket && roomId && roomId !== 'solo-mode'
    
    console.log(`🎯 Live market activity setup for screen: ${currentScreen}`)
    console.log(`🔍 Multiplayer: ${isInMultiplayerRoom}, Room: ${roomId}, Game: ${gameState}`)
    
    // In multiplayer: Server broadcasts activities to ALL clients every 30s
    // Clients just listen via 'market:activityReceived' handler (already set up)
    if (isInMultiplayerRoom) {
      console.log(`📡 Multiplayer mode: Listening to server broadcasts only`)
      return // Don't generate locally, server handles it
    }
    
    // Solo mode only: Generate activities locally after 30s delay
    console.log(`🎮 Solo mode: Starting local activities in 30 seconds...`)
    
    let activityInterval: NodeJS.Timeout | null = null
    
    const startDelay = setTimeout(() => {
      console.log(`🎮 Solo mode: Now generating local activities`)
      
      const getBound = () => {
        const v = selectedVolatility || 'medium'
        if (v === 'low') return 1
        if (v === 'high') return 3
        return 2
      }

      const generateActivity = () => {
        // Don't generate activities when game is paused
        if (isGamePaused) return
        
        const cryptoSymbols = ['DSHEEP', 'NGT', 'LNTR', 'OMLT', 'REX', 'ORLO']
        const randomCrypto = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)]
        
        // Generate random percentage within selected volatility bound
        const bound = getBound()
        const percentage = (Math.random() * (2 * bound) - bound).toFixed(1)
        const isPositive = parseFloat(percentage) >= 0
        const sign = isPositive ? '+' : ''
        const percentageValue = parseFloat(percentage)
        
        const actions = ['Market Move', 'Price Alert', 'Trading Signal', 'Volume Spike']
        const randomActionType = actions[Math.floor(Math.random() * actions.length)]
        
        // Create consistent message format matching server events
        const activityMessage = `${randomActionType}: ${randomCrypto} ${sign}${percentage}%`
        console.log(`📊 Generated activity: ${activityMessage}`)
        
        // Update cryptos state for UI display
        setCryptos(prev => prev.map(crypto => {
          if (crypto.symbol === randomCrypto) {
            const newPrice = crypto.price * (1 + percentageValue / 100)
            const newMarketCap = crypto.marketCap * (1 + percentageValue / 100)
            const newVolume = crypto.volume * (0.9 + Math.random() * 0.2)
            
            console.log(`💰 Updated ${crypto.symbol}: ${crypto.price.toFixed(2)} → ${newPrice.toFixed(2)} (${percentageValue > 0 ? '+' : ''}${percentageValue}%)`)
            
            return {
              ...crypto,
              price: Math.max(0.01, newPrice),
              change24h: crypto.change24h + percentageValue, // Add to existing percentage
              marketCap: newMarketCap,
              volume: newVolume
            }
          }
          return crypto
        }))
      }
      
      // Generate first activity immediately
      generateActivity()
      
      // Start recurring activities
      activityInterval = setInterval(() => {
        generateActivity()
      }, 30000) // Update every 30 seconds
    }, 30000)
    
    return () => {
      clearTimeout(startDelay)
      if (activityInterval) {
        clearInterval(activityInterval)
        console.log(`🎮 Stopped local activity generation`)
      }
    }
  }, [selectedVolatility, roomId, isGamePaused])

  // Helper function to navigate and scroll to top
  const navigateToScreen = (screen: Screen) => {
    setPreviousScreen(currentScreen)
    setCurrentScreen(screen)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStartScreenRoleSelection = (role: 'host' | 'player') => {
    setIsHost(role === 'host')
    setIntendedRole(role)
    
    if (role === 'host') {
      // Check if user is logged in
      if (!user) {
        setShowAuthModal(true)
        return
      }
      // Check if user has active subscription
      if (!isSubscribed) {
        setShowSubscriptionModal(true)
        return
      }
      // Hosts get default name/avatar and go directly to host-setup
      setPlayerName('Host')
      setPlayerAvatar('👑')
      navigateToScreen('host-setup')
    } else {
      // Players need to choose name/avatar first
      navigateToScreen('login')
    }
  }

  const handleRoleSelection = (role: 'host' | 'player') => {
    setIsHost(role === 'host')
    // RoleSelection now only handles Market Screen setup after room creation
    navigateToScreen('waiting-room')
  }

  const handleBypass = () => {
    // Bypass authentication and subscription - go directly to host setup
    setIsHost(true)
    setPlayerName('Host')
    setPlayerAvatar('👑')
    navigateToScreen('host-setup')
  }

  const handleGoToMarketScreen = () => {
    navigateToScreen('room-create')
  }

  const handleCreateRoom = (roomId: string) => {
    setRoomId(roomId)
    navigateToScreen('role-selection')
  }

  const handleHostSetup = (roomId: string, volatility: string, gameDuration: number, startingCash: number) => {
    setRoomId(roomId)
    setCashBalance(startingCash)
    // Persist volatility selection for solo-mode/local generation fallback
    const v = (volatility || 'medium').toLowerCase()
    if (v === 'low' || v === 'medium' || v === 'high') {
      setSelectedVolatility(v as 'low'|'medium'|'high')
    } else {
      setSelectedVolatility('medium')
    }
    navigateToScreen('waiting-room')
  }

  const handleJoinRoom = (roomId: string) => {
    console.log('🎉 handleJoinRoom called with roomId:', roomId)
    setRoomId(roomId)
    // Navigate directly to waiting room after successful Socket.io join
    navigateToScreen('waiting-room')
  }

  const handleBypassToGame = () => {
    console.log('🚀 Bypassing room join, going directly to game')
    console.log('👤 Player:', playerName, playerAvatar)
    
    // Save session data for solo play
    const sessionData = {
      playerName: playerName,
      playerAvatar: playerAvatar,
      roomId: 'solo-mode',
      isHost: false,
      soloMode: true,
      timestamp: Date.now()
    }
    localStorage.setItem('cryptoClashSession', JSON.stringify(sessionData))
    
    // Skip waiting room and go directly to main game
    navigateToScreen('main-menu')
  }

  const handleLogin = (name: string, avatar: string, roomCode: string) => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setRoomId(roomCode)
    
    // Save session data including room info for potential rejoin
    const sessionData = {
      playerName: name,
      playerAvatar: avatar,
      roomId: roomCode,
      isHost: false,
      timestamp: Date.now(),
      lastRoomId: roomCode
    }
    localStorage.setItem('cryptoClashSession', JSON.stringify(sessionData))
    
    // Navigate to waiting room with the room code
    navigateToScreen('waiting-room')
  }

  const handleStartGame = (startYear: number, gameDuration: number, language: string) => {
    const newGameState: GameState = {
      startYear,
      gameDuration,
      gameStartTime: Date.now(),
      lastSaveTime: Date.now()
    }
    console.log('🎮 Setting gameState:', newGameState)
    setGameState(newGameState)
    setIsGameFinishedForPlayer(false)
    setCurrentYear(startYear)
    // Players go to main menu (hosts already at market dashboard)
    navigateToScreen('main-menu')
  }

  const handleResumeGame = () => {
    navigateToScreen('main-menu')
  }

  // Keep currentYear in sync when gameState changes elsewhere
  useEffect(() => {
    if (gameState && typeof gameState.startYear === 'number') {
      setCurrentYear(prev => prev || gameState.startYear)
    }
  }, [gameState])

  const handleNewGame = () => {
    // Clear existing session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cryptoclash-session')
    }
    
    // Reset all state
    setGameState(null)
    setIsGameFinishedForPlayer(false)
    setCashBalance(1000)
    setCryptos([
      {
        id: '1',
        name: 'Virticoin',
        symbol: 'VTC',
        price: 1250.50,
        change24h: 5.2,
        amount: 2.5,
        color: 'neon-purple',
        icon: '⚡',
        volume: 2500000,
        marketCap: 15000000
      },
      {
        id: '2',
        name: 'Crypta',
        symbol: 'CRP',
        price: 890.25,
        change24h: -2.1,
        amount: 2,
        color: 'neon-blue',
        icon: '🔷',
        volume: 1800000,
        marketCap: 12000000
      },
      {
        id: '3',
        name: 'LedgerX',
        symbol: 'LDX',
        price: 445.75,
        change24h: 8.7,
        amount: 4,
        color: 'neon-turquoise',
        icon: '📊',
        volume: 3200000,
        marketCap: 8500000
      },
      {
        id: '4',
        name: 'BlockChain',
        symbol: 'BCH',
        price: 2100.00,
        change24h: -1.5,
        amount: 1,
        color: 'neon-gold',
        icon: '🔗',
        volume: 4100000,
        marketCap: 25000000
      },
      {
        id: '5',
        name: 'EtherX',
        symbol: 'ETX',
        price: 675.80,
        change24h: 3.4,
        amount: 1.5,
        color: 'neon-purple',
        icon: '💠',
        volume: 2800000,
        marketCap: 9800000
      },
      {
        id: '6',
        name: 'BitCoin',
        symbol: 'BTC',
        price: 3450.00,
        change24h: -0.8,
        amount: 0.5,
        color: 'neon-gold',
        icon: '₿',
        volume: 5200000,
        marketCap: 35000000
      }
    ])
    
    navigateToScreen('game-setup')
  }

  const handleQRScan = (effect: ScanEffect) => {
    console.log('\n🎯 === QR SCAN EFFECT APPLIED ===')
    console.log('📊 Effect:', effect)
    
    // Whale Alert wordt nu behandeld binnen de EventPopup component
    // Geen navigatie naar apart scherm meer
    
    // STEP 2: EVENT effects (Bull Run, Market Crash)
    // Marktprijzen worden ALLEEN via server scanData (handleScanDataUpdate) aangepast,
    // zodat elke client dezelfde +/‑% ziet en we geen dubbele toepassing krijgen.
    if (effect.type === 'event') {
      console.log('\n🎰 === EVENT EFFECT DETECTED (handled by server scanData) ===')
      console.log('🔍 Effect type:', effect.type)
      console.log('🔍 Effect message:', JSON.stringify(effect.message))
      console.log('🔍 Contains "Market Crash"?', effect.message.includes('Market Crash'))
      console.log('🔍 Contains "Bull Run"?', effect.message.includes('Bull Run'))
      // Geen lokale prijsaanpassing hier: server past markt aan en stuurt scanData/update,
      // die in handleScanDataUpdate de nieuwe prijzen doorvoert voor alle spelers.
    }
    
    // STEP 2: Build effect text for display - USE ORIGINAL MESSAGE FROM EVENTPOPUP
    // This ensures consistency with server-generated events
    let effectText = effect.message || ''
    
    // Fallback: if no message, build one (should not happen with EventPopup)
    if (!effectText) {
      if (effect.type === 'boost' || effect.type === 'crash') {
        if (effect.cryptoSymbol && effect.percentage) {
          const sign = effect.percentage > 0 ? '+' : ''
          effectText = `${effect.cryptoSymbol} ${sign}${effect.percentage}%`
        }
      } else if (effect.type === 'event') {
        effectText = effect.message
      }
    }
    
    setLastScanEffect(effectText)
    
    // STEP 3: Add scan action and apply portfolio effects for single-coin scans
    if (effectText) {
      const newScanAction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        player: playerName,
        action: effect.type === 'forecast' ? 'Kans - Market Forecast' : 'Kans',
        effect: effectText,
        avatar: playerAvatar,
        cryptoSymbol: effect.cryptoSymbol,
        percentageValue: effect.percentage,
        isForecast: effect.type === 'forecast',
        forecastData: effect.type === 'forecast' ? { topGainer: effect.topGainer, topLoser: effect.topLoser } : undefined
      }
      setPlayerScanActions(prev => [newScanAction, ...prev.slice(0, 9)])
      
      // Play sound based on event type
      if (effect.type === 'forecast') {
        playForecastSound()
      } else if (effect.percentage !== undefined) {
        if (effect.percentage > 0) {
          playPositiveSound()
        } else if (effect.percentage < 0) {
          playNegativeSound()
        }
      }
      
      // Apply portfolio effects for single-coin boost/crash
      // Skip when effect is marked as marketOnly (e.g., Kans events should not modify portfolio)
      if (effect.type !== 'event' && effect.cryptoSymbol && effect.percentage !== undefined && !(effect as any)?.marketOnly) {
        console.log(`💰 Applying portfolio effects for ${effect.cryptoSymbol} ${effect.percentage}%`)
        
        setCryptos(prev => prev.map(crypto => {
          if (crypto.symbol === effect.cryptoSymbol && effect.percentage !== undefined) {
            const percentageAbs = Math.abs(effect.percentage)
            const isPositive = effect.percentage > 0
            
            if (isPositive && cashBalance >= crypto.price) {
              const maxSpend = cashBalance * 0.2
              const amountToBuy = Math.min(maxSpend / crypto.price, percentageAbs * 0.1)
              const cost = amountToBuy * crypto.price
              
              console.log(`💰 Buying ${amountToBuy.toFixed(2)} ${crypto.symbol} for €${cost.toFixed(2)}`)
              setCashBalance(prev => prev - cost)
              
              return {
                ...crypto,
                amount: crypto.amount + amountToBuy
              }
            } else if (!isPositive && crypto.amount > 0) {
              const maxSell = crypto.amount * 0.3
              const amountToSell = Math.min(maxSell, percentageAbs * 0.05)
              const revenue = amountToSell * crypto.price
              
              console.log(`💰 Selling ${amountToSell.toFixed(2)} ${crypto.symbol} for €${revenue.toFixed(2)}`)
              setCashBalance(prev => prev + revenue)
              
              return {
                ...crypto,
                amount: Math.max(0, crypto.amount - amountToSell)
              }
            }
          }
          return crypto
        }))
      }
      
      // STEP 4: Broadcast to room
      if (socket && roomId && roomId !== 'solo-mode') {
        console.log('\n📡 Broadcasting scan action to room')
        socket.emit('player:scanAction', {
          roomCode: roomId,
          scanAction: newScanAction
        })
        lastEmittedScanId.current = newScanAction.id
        console.log('✅ Broadcast complete\n')
      }
    }
    
    // STEP 5: Navigate to main menu AFTER all effects are applied
    console.log('🎯 === QR SCAN COMPLETE - Navigating to main menu ===\n')
    navigateToScreen('main-menu')
  }

  const handleMenuNavigation = (screen: 'qr-scanner' | 'market' | 'portfolio' | 'cash' | 'rankings' | 'settings' | 'scan-transcript') => {
    if (screen === 'portfolio') {
      navigateToScreen('dashboard')
    } else {
      navigateToScreen(screen)
    }
  }

  // Send a test message from player UI to Market Screen via socket
  const handleSendTestMessage = (customMessage?: string) => {
    const inRoom = !!roomId && roomId !== 'solo-mode'
    if (!socket || !inRoom) {
      console.warn('⚠️ Cannot send test message - not connected to a room')
      return
    }
    const message = customMessage || `Test van ${playerName}`
    console.log('\n🧪 Sending test message to room', roomId, '->', message)
    socket.emit('test:message', {
      roomCode: roomId,
      message,
      sender: playerName || 'Player'
    })
  }

  // Room verification function
  const verifyRoomMembership = () => {
    console.log('\n🔍 === ROOM MEMBERSHIP VERIFICATION ===')
    console.log('🏠 Current Room ID:', roomId)
    console.log('🔌 Socket ID:', socket?.id)
    console.log('🔗 Socket Connected:', socket?.connected)
    console.log('👤 Player Name:', playerName)
    console.log('👑 Is Host:', isHost)
    console.log('📺 Current Screen:', currentScreen)
    
    if (socket && roomId && roomId !== 'solo-mode') {
      console.log('📤 Requesting room info from server...')
      socket.emit('room:verify', { roomCode: roomId, playerName })
    } else {
      console.warn('⚠️ Cannot verify room - missing socket or room ID')
    }
    console.log('🔍 === ROOM VERIFICATION REQUEST SENT ===\n')
  }

  // Direct test function to add scan to dashboard (for debugging)
  const addDirectTestScan = () => {
    console.log('\n🔧 === DIRECT TEST SCAN (NO SOCKET) ===')
    const directScan = {
      id: `direct-${Date.now()}`,
      timestamp: Date.now(),
      player: 'Test Player',
      action: 'Direct Test',
      effect: 'NGT +10.0%',
      avatar: '🧪'
    }
    console.log('📊 Adding direct scan:', directScan)
    setPlayerScanActions(prev => [directScan, ...prev.slice(0, 9)])
    console.log('✅ Direct scan added to playerScanActions')
    console.log('🔧 === DIRECT TEST SCAN COMPLETE ===\n')
  }

  // Simple scan action handler for testing
  const handleAddScanAction = (scanAction: any) => {
    console.log('\n🧪 === SIMPLE TEST SCAN ===')
    console.log('📊 Scan action:', scanAction)
    console.log('🔍 Current screen:', currentScreen)
    console.log('🔍 Room ID:', roomId)
    console.log('🔍 Socket connected:', socket?.connected)
    
    // Add to local player scan actions
    setPlayerScanActions(prev => {
      console.log('📊 Adding test scan to local playerScanActions')
      return [scanAction, ...prev.slice(0, 9)]
    })
    
    // 🚨 REMOVED LOCAL PRICE UPDATES - Let server handle all price changes
    console.log('💰 Skipping local price updates - server will handle crypto price changes')
    console.log(`💰 Scan effect: ${scanAction.effect} - will be applied by server`)
    
    // Broadcast to room if in multiplayer - ALWAYS broadcast test scans
    if (socket && roomId && roomId !== 'solo-mode') {
      console.log('📤 Broadcasting test scan to room:', roomId)
      console.log('📤 Scan details:', {
        player: scanAction.player,
        action: scanAction.action,
        effect: scanAction.effect,
        id: scanAction.id
      })
      
      socket.emit('player:scanAction', {
        roomCode: roomId,
        scanAction: scanAction
      })
      lastEmittedScanId.current = scanAction.id
      console.log('✅ Test scan broadcasted to all clients in room')
    } else {
      console.warn('⚠️ Cannot broadcast test scan - Socket:', !!socket, 'Room:', roomId, 'Solo mode:', roomId === 'solo-mode')
    }
    
    console.log('🧪 === SIMPLE TEST SCAN COMPLETE ===\n')
  }

  const handleWaitingRoomStart = () => {
    // IMMEDIATE loading screen - no delay
    console.log('🎮 Game starting - showing loading screen immediately')
    
    // Set gameState for multiplayer based on room settings
    if (room && room.settings) {
      const currentYear = new Date().getFullYear()
      const newGameState: GameState = {
        startYear: currentYear,
        gameDuration: room.settings.gameDuration || 1,
        gameStartTime: Date.now(),
        lastSaveTime: Date.now()
      }
      console.log('🎮 Setting multiplayer gameState:', newGameState)
      setGameState(newGameState)
      setIsGameFinishedForPlayer(false)
      setCurrentYear(currentYear)
    }
    
    navigateToScreen('starting-game')
    
    // Longer 7-second loading screen
    setTimeout(() => {
      console.log('🎮 Loading complete - navigating to game interface')
      if (isHost) {
        navigateToScreen('market-dashboard')
      } else {
        navigateToScreen('main-menu')
      }
    }, 7000)
  }

  const handleMarketDashboardNavigation = (screen: 'qr-scanner' | 'main-menu' | 'market' | 'portfolio' | 'cash' | 'rankings' | 'settings' | 'scan-transcript') => {
    if (screen === 'portfolio') {
      navigateToScreen('dashboard')
    } else {
      navigateToScreen(screen)
    }
  }

  const handleSellCrypto = (cryptoId: string, amountToSell: number) => {
    const crypto = cryptos.find(c => c.id === cryptoId)
    if (!crypto || crypto.amount < amountToSell) return

    const saleValue = crypto.price * amountToSell
    
    // Update crypto amount
    setCryptos(prev => prev.map(c => 
      c.id === cryptoId 
        ? { ...c, amount: Math.max(0, c.amount - amountToSell) }
        : c
    ))
    
    // Add to cash balance
    setCashBalance(prev => prev + saleValue)
    
    // Add transaction record
    const newTransaction = {
      id: Date.now().toString(),
      type: 'sell',
      cryptoSymbol: crypto.symbol,
      cryptoName: crypto.name,
      amount: amountToSell,
      price: crypto.price,
      total: saleValue,
      timestamp: Date.now()
    }
    setTransactions(prev => [newTransaction, ...prev])

    const sellAction = {
      id: `sell-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      timestamp: Date.now(),
      player: playerName || 'Speler',
      action: `Verkoop ${crypto.name}`,
      effect: `+€${saleValue.toFixed(2)} cash`,
      avatar: playerAvatar
    }
    setPlayerScanActions(prev => [sellAction, ...prev.slice(0, 9)])
    
    // The crypto amounts and cash balance will be automatically synced to server
    // via the useEffect that watches for changes in cryptos and cashBalance
    
    console.log(`Sold ${amountToSell.toFixed(2)} ${crypto.symbol} for €${saleValue.toFixed(2)}`)
  }

  const updateCryptoAmount = (id: string, newAmount: number) => {
    setCryptos(prev => prev.map(crypto => 
      crypto.id === id ? { ...crypto, amount: newAmount } : crypto
    ))
  }

  const updateCryptoPrice = (symbol: string, percentage: number) => {
    setCryptos(prev => prev.map(crypto => {
      if (crypto.symbol !== symbol) return crypto

      // Update absolute price
      const updatedPrice = Math.max(0.01, crypto.price * (1 + percentage / 100))

      // Update displayed 24h change percentage so the UI reflects the manual scan
      const prevChange = typeof crypto.change24h === 'number' ? crypto.change24h : 0
      const updatedChange = Math.round((prevChange + percentage) * 10) / 10

      return {
        ...crypto,
        price: updatedPrice,
        change24h: updatedChange
      }
    }))
  }


  return (
    <>
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Render the current screen */}
      {(() => {
        switch (currentScreen) {
          case 'start-screen':
            return (
              <StartScreen 
                onSelectRole={handleStartScreenRoleSelection}
                onBypass={handleBypass}
                onSignOut={signOut}
                userName={user?.email?.split('@')[0] || ''}
                lobbyCode={lobbyCode || ''}
              />
            )
          
          case 'welcome':
            return (
              <WelcomeScreen
                userName={user?.email?.split('@')[0] || 'Gebruiker'}
                userEmail={user?.email || ''}
                isSubscribed={isSubscribed}
                onContinue={() => handleStartScreenRoleSelection(intendedRole)}
              />
            )
            
          case 'host-setup':
            return (
              <HostSetup 
                onStartRoom={handleHostSetup}
                onBack={() => navigateToScreen('start-screen')}
                playerName={playerName}
                playerAvatar={playerAvatar}
                lobbyCode={lobbyCode || undefined}
              />
            )
            
          case 'player-login':
            return (
              <RoomJoin 
                onJoinRoom={handleJoinRoom}
                onBack={() => navigateToScreen('start-screen')}
                onBypassToGame={handleBypassToGame}
                playerName={playerName}
                playerAvatar={playerAvatar}
              />
            )
            
          case 'waiting-room':
            return (
              <WaitingRoom 
                roomId={roomId}
                onStartGame={handleWaitingRoomStart}
                onBack={() => navigateToScreen(isHost ? 'room-create' : 'start-screen')}
                isHost={isHost}
                playerName={playerName}
                playerAvatar={playerAvatar}
              />
            )
            
          case 'login':
            return <LoginScreen onLogin={handleLogin} onBack={() => setCurrentScreen('start-screen')} room={room} />
            
          case 'game-setup':
            return (
              <GameSetup 
                onStartGame={handleStartGame}
                onBack={() => navigateToScreen('login')}
              />
            )
            
          case 'main-menu':
            return (
              <MainMenu 
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                year={currentYear}
                onPassStart={() => {
                  try {
                    console.log('\n🎯 === START BONUS CLICKED ===')
                    console.log('🎯 gameState:', JSON.stringify(gameState))
                    console.log('🎯 currentYear:', currentYear)
                    console.log('🎯 isGameFinishedForPlayer:', isGameFinishedForPlayer)
                    
                    // CRITICAL: Check if player has already finished
                    if (isGameFinishedForPlayer) {
                      console.log('🛑 Player already finished - blocking action')
                      alert('Je hebt al je speljaren voltooid! Je kunt niet verder spelen.')
                      return
                    }
                    
                    // Check ALLEEN als gameState bestaat EN compleet is
                    if (gameState && typeof gameState.startYear === 'number' && typeof gameState.gameDuration === 'number') {
                      // Bereken hoeveel jaren we NU al hebben gespeeld (VOOR de increment)
                      const yearsPlayedSoFar = currentYear - gameState.startYear
                      console.log(`🔍 BEFORE increment check:`)
                      console.log(`   startYear: ${gameState.startYear}`)
                      console.log(`   currentYear: ${currentYear}`)
                      console.log(`   yearsPlayedSoFar: ${yearsPlayedSoFar}`)
                      console.log(`   gameDuration: ${gameState.gameDuration}`)
                      
                      // CRITICAL: Check of we NA deze increment over de limiet gaan
                      // We moeten checken of next year (currentYear + 1) de limiet overschrijdt
                      const yearsAfterThisIncrement = (currentYear + 1) - gameState.startYear
                      console.log(`   yearsAfterThisIncrement: ${yearsAfterThisIncrement}`)
                      console.log(`   Would exceed limit? ${yearsAfterThisIncrement > gameState.gameDuration}`)
                      
                      // Als we al gameDuration jaren hebben gespeeld, stop
                      // Voorbeeld: startYear=2024, gameDuration=2
                      // - currentYear=2024: yearsPlayedSoFar=0, yearsAfter=1, OK (go to 2025) ✓
                      // - currentYear=2025: yearsPlayedSoFar=1, yearsAfter=2, OK (go to 2026) ✓
                      // - currentYear=2026: yearsPlayedSoFar=2, yearsAfter=3, STOP! (would be year 3) ✗
                      if (yearsAfterThisIncrement > gameState.gameDuration) {
                        console.log('🛑 Speler heeft al alle jaren voltooid, kan niet verder')
                        console.log(`   Je hebt ${yearsPlayedSoFar} jaar gespeeld van ${gameState.gameDuration} toegestaan`)
                        setIsGameFinishedForPlayer(true)
                        
                        // Notify server that player has finished (if not already done)
                        if (socket && roomId && roomId !== 'solo-mode' && !hasNotifiedFinishRef.current) {
                          hasNotifiedFinishRef.current = true
                          console.log('📡 Notifying server that player finished')
                          socket.emit('player:finishGame', {
                            roomCode: roomId,
                            playerName,
                            playerAvatar,
                            yearsPlayed: yearsPlayedSoFar
                          })
                        }
                        
                        alert(`Je hebt al ${yearsPlayedSoFar} jaar gespeeld van de ${gameState.gameDuration} toegestane jaren. Het spel is voor jou afgelopen!`)
                        return // Stop hier, geen jaar-verhoging
                      }
                      
                      // Check of dit het LAATSTE toegestane jaar wordt
                      if (yearsAfterThisIncrement === gameState.gameDuration) {
                        console.log('⚠️ Dit wordt het LAATSTE toegestane jaar!')
                        console.log(`   Na deze increment: ${yearsAfterThisIncrement} jaar van ${gameState.gameDuration}`)
                        // We laten de increment doorgaan, maar markeren dit als laatste jaar
                        // De finish notification komt NA de increment
                      }
                    } else {
                      console.log('⚠️ Geen gameState - jaren check overslaan (mag doorgaan)')
                    }

                  // Voeg alleen jaren toe als het spel nog loopt
                  console.log('✅ Adding year and bonus')
                  setCashBalance(prev => Math.round((prev + 500) * 100) / 100)
                  setCurrentYear(prev => {
                    const next = prev + 1
                    console.log(`📅 Year increment: ${prev} → ${next}`)

                    // Check na verhoging of dit het laatste jaar was
                    if (gameState && typeof gameState.startYear === 'number' && typeof gameState.gameDuration === 'number') {
                      const yearsPlayedAfterIncrement = next - gameState.startYear
                      console.log(`🔍 AFTER increment check:`)
                      console.log(`   next year: ${next}`)
                      console.log(`   yearsPlayedAfterIncrement: ${yearsPlayedAfterIncrement}`)
                      console.log(`   gameDuration: ${gameState.gameDuration}`)
                      
                      if (yearsPlayedAfterIncrement >= gameState.gameDuration) {
                        console.log('🏁 Dit was het laatste toegestane jaar!')
                        console.log(`   Je hebt nu ${yearsPlayedAfterIncrement} jaar gespeeld van ${gameState.gameDuration} toegestaan`)
                        setIsGameFinishedForPlayer(true)
                        
                        // Notify server that player has finished
                        if (socket && roomId && roomId !== 'solo-mode' && !hasNotifiedFinishRef.current) {
                          hasNotifiedFinishRef.current = true
                          console.log('📡 Notifying server that player finished')
                          socket.emit('player:finishGame', {
                            roomCode: roomId,
                            playerName,
                            playerAvatar,
                            yearsPlayed: yearsPlayedAfterIncrement
                          })
                        }
                      }
                    }

                    // Add a player scan action so it shows in the activities list
                    try {
                      const scan = {
                        id: `ny-${Date.now()}`,
                        timestamp: Date.now(),
                        player: playerName || 'Speler',
                        action: 'Nieuwjaar bonus',
                        effect: `START BONUS +€500 (${prev} → ${next})`,
                        avatar: playerAvatar
                      } as any
                      setPlayerScanActions(p => [scan, ...p.slice(0, 9)])
                    } catch {}
                    return next
                  })
                  } catch (error) {
                    console.error('Error in onPassStart:', error)
                  }
                }}
                onNavigate={handleMenuNavigation}
                lastScanEffect={lastScanEffect}
                cashBalance={cashBalance}
                players={players}
                playerScanActions={playerScanActions}
                autoScanActions={autoScanActions}
                transactions={transactions}
                actionsDisabled={actionsDisabled}
                onShowInsider={() => {
                  console.log('🕵️ Insider info requested')
                  if (socket && roomId && !insiderUsed) {
                    // Request forecast data from server
                    socket.emit('player:requestInsiderInfo', {
                      roomCode: roomId,
                      playerName: playerName
                    })
                    console.log('✅ Insider info request sent')
                    // Mark insider as used
                    setInsiderUsed(true)
                  } else if (insiderUsed) {
                    console.log('⚠️ Insider already used this turn')
                  }
                }}
                insiderUsed={insiderUsed}
                onEndTurnConfirm={() => {
                  console.log('\n🔥 === END TURN CLICKED (MainMenu) ===')
                  console.log('  socket exists:', !!socket)
                  console.log('  socket.id:', socket?.id)
                  console.log('  socket.connected:', socket?.connected)
                  console.log('  roomId:', roomId)
                  console.log('  isMyTurn:', isMyTurn)
                  console.log('  actionsDisabled:', actionsDisabled)
                  
                  if (socket && roomId && roomId !== 'solo-mode') {
                    console.log('✅ Emitting turn:end to room:', roomId)
                    socket.emit('turn:end', { roomCode: roomId })
                    console.log('✅ turn:end emitted successfully')
                  } else {
                    console.error('❌ Cannot emit turn:end!')
                    console.error('  socket:', !!socket)
                    console.error('  roomId:', roomId)
                  }
                  console.log('🔥 === END TURN COMPLETE ===\n')
                  navigateToScreen('main-menu')
                }}
                onSendTestMessage={handleSendTestMessage}
                onAddScanAction={handleAddScanAction}
                onVerifyRoom={verifyRoomMembership}
                onApplyScanEffect={handleQRScan}
                gameFinished={isGameFinishedForPlayer || false}
              />
            )
            
          case 'market-dashboard':
            console.log('🖥️ Rendering MarketDashboard with playerScanActions:', playerScanActions.length, 'items')
            console.log('🖥️ PlayerScanActions data:', playerScanActions.map(s => `${s.player}: ${s.effect}`))
            console.log('🖥️ DashboardToasts:', dashboardToasts)
            return (
              <MarketDashboard 
                playerName={isHost ? 'Market Dashboard' : playerName}
                playerAvatar={isHost ? '📊' : playerAvatar}
                cryptos={cryptos}
                players={players}
                playerScanActions={playerScanActions}
                autoScanActions={autoScanActions}
                onNavigate={handleMarketDashboardNavigation}
                isConnected={isConnected}
                connectedPlayers={connectedPlayers}
                roomId={roomId}
                dashboardToasts={dashboardToasts}
                socket={socket}
                onEndGame={handleEndGame}
                isMarketDashboard={isHost}
                externalPriceHistory={priceHistory}
                isGamePaused={isGamePaused}
              />
            )
          
          case 'starting-game':
            return (
              <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-dark-bg via-purple-900/20 to-blue-900/20">
                {/* Animated radial gradients */}
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-neon-purple/20 blur-3xl rounded-full animate-pulse" />
                <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-neon-blue/20 blur-3xl rounded-full animate-pulse" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-neon-gold/10 blur-3xl rounded-full animate-pulse" />
                
                <div className="relative text-center crypto-card px-10 py-12 bg-white/5 border-white/10">
                  <div className="mb-6 flex justify-center">
                    <Image
                      src="/Collage_logo.png"
                      alt="CryptoClash"
                      width={600}
                      height={600}
                      priority
                      quality={95}
                      className="w-[40vw] md:w-[18vw] h-auto max-h-[40vh] drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
                    />
                  </div>
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold bg-clip-text text-transparent">
                    Spel wordt gestart...
                  </h2>
                  <p className="text-gray-300 text-sm mt-2">Even geduld, we zetten alles klaar</p>
                  <div className="mt-6 w-full max-w-xs mx-auto">
                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )
            
          case 'qr-scanner':
            return (
              <QRScanner 
                onScan={handleQRScan}
                onClose={() => navigateToScreen('main-menu')}
                playerName={playerName}
                playerAvatar={playerAvatar}
              />
            )
            
          case 'dashboard':
            return (
              <GameDashboard 
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                onBack={() => navigateToScreen('main-menu')}
                onSellCrypto={handleSellCrypto}
                onEndGame={handleEndGame}
                priceHistory={priceHistory}
              />
            )
            
          case 'market':
            return (
              <MarketOverview 
                onBack={() => navigateToScreen('main-menu')}
                currentPlayer={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                priceHistory={priceHistory}
                onEndTurnConfirm={() => {
                  console.log('\n🔥 === END TURN CLICKED (Market) ===')
                  if (socket && roomId) {
                    socket.emit('turn:end', { roomCode: roomId, playerName })
                    console.log('⏰ turn:end event emitted')
                  } else {
                    console.error('⏰ Cannot emit turn:end - socket or roomId missing', { socket: !!socket, roomId })
                  }
                  console.log('🔥 === END TURN COMPLETE ===\n')
                  navigateToScreen('main-menu')
                }}
                actionsDisabled={actionsDisabled}
              />
            )
            
          case 'cash':
            return (
              <Cash 
                onBack={() => navigateToScreen('main-menu')}
                playerName={playerName}
                playerAvatar={playerAvatar}
                cashBalance={cashBalance}
                transactions={transactions}
              />
            )
            
          case 'rankings':
            return (
              <SpelersRanking 
                onBack={() => navigateToScreen('main-menu')}
                playerName={playerName}
                playerAvatar={playerAvatar}
                players={players}
                cryptos={cryptos}
              />
            )
            
          case 'scan-transcript':
            return (
              <ScanTranscript 
                onBack={() => navigateToScreen(previousScreen)}
                playerName={playerName}
                playerAvatar={playerAvatar}
                playerScanActions={playerScanActions}
                autoScanActions={autoScanActions}
              />
            )
            
          case 'actions-menu':
            return (
              <ActionsMenu 
                playerName={playerName}
                playerAvatar={playerAvatar}
                onEndTurnConfirm={() => {
                  console.log('\n🔥 === END TURN CLICKED (ActionsMenu) ===')
                  console.log('  socket exists:', !!socket)
                  console.log('  socket.id:', socket?.id)
                  console.log('  socket.connected:', socket?.connected)
                  console.log('  roomId:', roomId)
                  console.log('  isMyTurn:', isMyTurn)
                  console.log('  actionsDisabled:', actionsDisabled)
                  
                  if (socket && roomId && roomId !== 'solo-mode') {
                    console.log('✅ Emitting turn:end to room:', roomId)
                    socket.emit('turn:end', { roomCode: roomId })
                    console.log('✅ turn:end emitted successfully')
                  } else {
                    console.error('❌ Cannot emit turn:end!')
                    console.error('  socket:', !!socket)
                    console.error('  roomId:', roomId)
                  }
                  console.log('🔥 === END TURN COMPLETE ===\n')
                  navigateToScreen('main-menu')
                }}
                onNavigate={(screen) => {
                  if (screen === 'main-menu') {
                    navigateToScreen('main-menu')
                  } else if (screen === 'buy') {
                    navigateToScreen('buy')
                  } else if (screen === 'sell') {
                    navigateToScreen('sell')
                  } else if (screen === 'win') {
                    navigateToScreen('win')
                  } else if (screen === 'swap') {
                    navigateToScreen('swap')
                  } else {
                    console.log(`Navigate to ${screen} - Coming soon!`)
                  }
                }}
                onApplyScanEffect={handleQRScan}
                onTriggerEvent={() => {
                  console.log('🎲 Trigger event via server')
                  if (socket && roomId) {
                    socket.emit('player:triggerEvent', {
                      roomCode: roomId,
                      playerName: playerName,
                      playerAvatar: playerAvatar
                    })
                    console.log('✅ player:triggerEvent emitted')
                    navigateToScreen('main-menu')
                  }
                }}
                playerScanActions={playerScanActions}
                autoScanActions={autoScanActions}
                actionsDisabled={actionsDisabled}
                turnTimeLeft={turnTimeLeft}
              />
            )
            
          case 'buy':
            return (
              <BuyCrypto
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                cashBalance={cashBalance}
                priceHistory={priceHistory}
                onBack={() => navigateToScreen('main-menu')}
                onEndTurnConfirm={() => {
                  console.log('\n🔥 === END TURN CLICKED (Buy) ===')
                  if (socket && roomId) {
                    socket.emit('turn:end', { roomCode: roomId, playerName })
                    console.log('⏰ turn:end event emitted')
                  } else {
                    console.error('⏰ Cannot emit turn:end - socket or roomId missing', { socket: !!socket, roomId })
                  }
                  console.log('🔥 === END TURN COMPLETE ===\n')
                  navigateToScreen('main-menu')
                }}
                actionsDisabled={actionsDisabled}
                onConfirmBuy={(symbol, quantity) => {
                  // Calculate cost using current price
                  const selected = cryptos.find(c => c.symbol === symbol)
                  if (!selected) return
                  const cost = Math.round(selected.price * quantity * 100) / 100
                  const newCash = Math.round((cashBalance - cost) * 100) / 100
                  if (newCash < 0) return

                  // Update crypto met nieuwe amount EN sla aankoopprijs op
                  const newCryptos = cryptos.map(c => c.symbol === symbol ? { 
                    ...c, 
                    amount: c.amount + quantity,
                    purchasePrice: selected.price  // Sla huidige prijs op als aankoopprijs
                  } : c)
                  setCryptos(newCryptos)
                  setCashBalance(newCash)

                  // Prepare portfolio map and totals for unified sync
                  const newPortfolioMap = newCryptos.reduce((acc: any, c: any) => { acc[c.symbol] = c.amount; return acc }, {} as Record<string, number>)
                  const newPortfolioValue = Math.round(newCryptos.reduce((sum, c) => sum + (c.price * c.amount), 0) * 100) / 100
                  const newTotalValue = Math.round((newPortfolioValue + newCash) * 100) / 100

                  const buyAction = {
                    id: `buy-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    timestamp: Date.now(),
                    player: playerName || 'Speler',
                    action: `Koop ${selected.name}`,
                    effect: `-€${cost.toFixed(2)} cash`,
                    avatar: playerAvatar
                  }
                  setPlayerScanActions(prev => [buyAction, ...prev.slice(0, 9)])

                  if (socket && roomId) {
                    socket.emit('player:updateData', {
                      roomCode: roomId,
                      playerData: {
                        name: playerName,
                        avatar: playerAvatar,
                        portfolio: newPortfolioMap,
                        cashBalance: newCash,
                        portfolioValue: newPortfolioValue,
                        totalValue: newTotalValue,
                        timestamp: Date.now()
                      }
                    })
                  }
                }}
              />
            )
          
          case 'portfolio':
            return (
              <GameDashboard
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                onBack={() => navigateToScreen('main-menu')}
                priceHistory={priceHistory}
                onEndTurnConfirm={() => {
                  console.log('\n🔥 === END TURN CLICKED (Portfolio) ===')
                  if (socket && roomId) {
                    socket.emit('turn:end', { roomCode: roomId, playerName })
                    console.log('⏰ turn:end event emitted')
                  } else {
                    console.error('⏰ Cannot emit turn:end - socket or roomId missing', { socket: !!socket, roomId })
                  }
                  console.log('🔥 === END TURN COMPLETE ===\n')
                  navigateToScreen('main-menu')
                }}
                actionsDisabled={actionsDisabled}
              />
            )

          case 'sell':
            return (
              <GameDashboard
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                priceHistory={priceHistory}
                onBack={() => navigateToScreen('main-menu')}
                showSellControls={true}
                onEndTurnConfirm={() => {
                  console.log('\n🔥 === END TURN CLICKED (Sell) ===')
                  if (socket && roomId) {
                    socket.emit('turn:end', { roomCode: roomId, playerName })
                    console.log('⏰ turn:end event emitted')
                  } else {
                    console.error('⏰ Cannot emit turn:end - socket or roomId missing', { socket: !!socket, roomId })
                  }
                  console.log('🔥 === END TURN COMPLETE ===\n')
                  navigateToScreen('main-menu')
                }}
                actionsDisabled={actionsDisabled}
                onSellCrypto={(cryptoId: string, amountToSell: number) => {
                  const coin = cryptos.find(c => c.id === cryptoId)
                  if (!coin) return
                  const revenue = Math.round(coin.price * amountToSell * 100) / 100

                  const newCryptos = cryptos.map(c => {
                    if (c.id === cryptoId) {
                      const newAmount = Math.max(0, c.amount - amountToSell)
                      // Verwijder purchasePrice als alle coins verkocht zijn
                      if (newAmount === 0) {
                        const { purchasePrice, ...rest } = c
                        return { ...rest, amount: 0 }
                      }
                      return { ...c, amount: newAmount }
                    }
                    return c
                  })
                  const newCash = Math.round((cashBalance + revenue) * 100) / 100
                  setCryptos(newCryptos)
                  setCashBalance(newCash)

                  // Record transaction for Cash wallet
                  setTransactions(prev => [{
                    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    type: 'sell',
                    cryptoSymbol: coin.symbol,
                    cryptoName: coin.name,
                    amount: amountToSell,
                    price: coin.price,
                    total: revenue,
                    timestamp: Date.now()
                  }, ...prev])

                  const sellAction = {
                    id: `sell-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    timestamp: Date.now(),
                    player: playerName || 'Speler',
                    action: `Verkoop ${coin.name}`,
                    effect: `+€${revenue.toFixed(2)} cash`,
                    avatar: playerAvatar
                  }
                  setPlayerScanActions(prev => [sellAction, ...prev.slice(0, 9)])

                  const newPortfolioMap = newCryptos.reduce((acc: any, c: any) => { acc[c.symbol] = c.amount; return acc }, {} as Record<string, number>)
                  const newPortfolioValue = Math.round(newCryptos.reduce((sum, c) => sum + (c.price * c.amount), 0) * 100) / 100
                  const newTotalValue = Math.round((newPortfolioValue + newCash) * 100) / 100

                  if (socket && roomId) {
                    socket.emit('player:updateData', {
                      roomCode: roomId,
                      playerData: {
                        name: playerName,
                        avatar: playerAvatar,
                        portfolio: newPortfolioMap,
                        cashBalance: newCash,
                        portfolioValue: newPortfolioValue,
                        totalValue: newTotalValue,
                        timestamp: Date.now()
                      }
                    })
                  }

                  // Na verkoop terug naar hoofdmenu i.p.v. in verkoopflow te blijven
                  navigateToScreen('main-menu')
                }}
              />
            )
            
          case 'win':
            return (
              <Win
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                onNavigate={(screen) => navigateToScreen(screen as Screen)}
                onWinCrypto={(cryptoSymbol: string) => {
                  // Add 1 crypto coin to player's wallet
                  const newCryptos = cryptos.map(c => 
                    c.symbol === cryptoSymbol ? { ...c, amount: c.amount + 1 } : c
                  )
                  setCryptos(newCryptos)

                  // Calculate new portfolio value and total value
                  const newPortfolioMap = newCryptos.reduce((acc: any, c: any) => { 
                    acc[c.symbol] = c.amount
                    return acc 
                  }, {} as Record<string, number>)
                  const newPortfolioValue = Math.round(newCryptos.reduce((sum, c) => sum + (c.price * c.amount), 0) * 100) / 100
                  const newTotalValue = Math.round((newPortfolioValue + cashBalance) * 100) / 100

                  // Record win action (marked as win so it doesn't show as beurs event)
                  const coin = cryptos.find(c => c.symbol === cryptoSymbol)
                  const winAction = {
                    id: `win-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    timestamp: Date.now(),
                    player: playerName || 'Speler',
                    action: `Win ${coin?.name || cryptoSymbol}`,
                    effect: `+1 ${cryptoSymbol}`,
                    avatar: playerAvatar,
                    isWinAction: true // Flag to exclude from beurs event display
                  }
                  setPlayerScanActions(prev => [winAction, ...prev.slice(0, 9)])

                  // Sync with server
                  if (socket && roomId) {
                    socket.emit('player:updateData', {
                      roomCode: roomId,
                      playerData: {
                        name: playerName,
                        avatar: playerAvatar,
                        portfolio: newPortfolioMap,
                        cashBalance: cashBalance,
                        portfolioValue: newPortfolioValue,
                        totalValue: newTotalValue,
                        timestamp: Date.now()
                      }
                    })
                  }

                  console.log(`✅ Player won 1 ${cryptoSymbol}`)
                }}
                onWinCash={() => {
                  // Add €500 to player's cash wallet
                  const newCash = Math.round((cashBalance + 500) * 100) / 100
                  setCashBalance(newCash)

                  // Calculate new total value
                  const newPortfolioMap = cryptos.reduce((acc: any, c: any) => { 
                    acc[c.symbol] = c.amount
                    return acc 
                  }, {} as Record<string, number>)
                  const newPortfolioValue = Math.round(cryptos.reduce((sum, c) => sum + (c.price * c.amount), 0) * 100) / 100
                  const newTotalValue = Math.round((newPortfolioValue + newCash) * 100) / 100

                  // Record transaction
                  setTransactions(prev => [{
                    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    type: 'win',
                    cryptoSymbol: 'CASH',
                    cryptoName: 'Cash Win',
                    amount: 500,
                    price: 1,
                    total: 500,
                    timestamp: Date.now()
                  }, ...prev])

                  // Record win action (marked as win so it doesn't show as beurs event)
                  const winAction = {
                    id: `win-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    timestamp: Date.now(),
                    player: playerName || 'Speler',
                    action: 'Win Cash',
                    effect: '+€500',
                    avatar: playerAvatar,
                    isWinAction: true // Flag to exclude from beurs event display
                  }
                  setPlayerScanActions(prev => [winAction, ...prev.slice(0, 9)])

                  // Sync with server
                  if (socket && roomId) {
                    socket.emit('player:updateData', {
                      roomCode: roomId,
                      playerData: {
                        name: playerName,
                        avatar: playerAvatar,
                        portfolio: newPortfolioMap,
                        cashBalance: newCash,
                        portfolioValue: newPortfolioValue,
                        totalValue: newTotalValue,
                        timestamp: Date.now()
                      }
                    })
                  }

                  console.log(`✅ Player won €500 cash`)
                }}
                onWinGoldHen={() => {
                  // Add €1000 to player's cash wallet via Goudhaantje
                  const newCash = Math.round((cashBalance + 1000) * 100) / 100
                  setCashBalance(newCash)

                  // Calculate new total value
                  const newPortfolioMap = cryptos.reduce((acc: any, c: any) => { 
                    acc[c.symbol] = c.amount
                    return acc 
                  }, {} as Record<string, number>)
                  const newPortfolioValue = Math.round(cryptos.reduce((sum, c) => sum + (c.price * c.amount), 0) * 100) / 100
                  const newTotalValue = Math.round((newPortfolioValue + newCash) * 100) / 100

                  // Record transaction
                  setTransactions(prev => [{
                    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    type: 'win',
                    cryptoSymbol: 'CASH',
                    cryptoName: 'Goudhaantje',
                    amount: 1000,
                    price: 1,
                    total: 1000,
                    timestamp: Date.now()
                  }, ...prev])

                  // Record win action (marked as win so it doesn't show as beurs event)
                  const winAction = {
                    id: `win-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                    timestamp: Date.now(),
                    player: playerName || 'Speler',
                    action: 'Win Goudhaantje',
                    effect: '+€1000',
                    avatar: playerAvatar,
                    isWinAction: true // Flag to exclude from beurs event display
                  }
                  setPlayerScanActions(prev => [winAction, ...prev.slice(0, 9)])

                  // Sync with server
                  if (socket && roomId) {
                    socket.emit('player:updateData', {
                      roomCode: roomId,
                      playerData: {
                        name: playerName,
                        avatar: playerAvatar,
                        portfolio: newPortfolioMap,
                        cashBalance: newCash,
                        portfolioValue: newPortfolioValue,
                        totalValue: newTotalValue,
                        timestamp: Date.now()
                      }
                    })
                  }

                  console.log(`✅ Player won €1000 via Goudhaantje`)
                }}
              />
            )
            
          case 'whale-choice':
            return (
              <WhaleChoice
                cryptos={cryptos}
                onSelectCrypto={(symbol: string, direction: 'up' | 'down') => {
                  const multiplier = direction === 'up' ? 1.5 : 0.5
                  const percentage = direction === 'up' ? 50 : -50
                  console.log(`🐋 Player selected ${symbol} for ${direction === 'up' ? '+' : ''}${percentage}% whale boost`)
                  
                  // Pas percentage toe op gekozen crypto
                  setCryptos(prev => prev.map(crypto => {
                    if (crypto.symbol === symbol) {
                      const newPrice = Math.round(crypto.price * multiplier * 100) / 100
                      console.log(`  ${crypto.symbol}: €${crypto.price} → €${newPrice} (${direction === 'up' ? '+' : ''}${percentage}%)`)
                      return {
                        ...crypto,
                        price: newPrice,
                        change24h: percentage,
                        volume: crypto.volume * (direction === 'up' ? 2 : 0.5),
                        marketCap: crypto.marketCap * multiplier
                      }
                    }
                    return crypto
                  }))
                  
                  // Broadcast whale alert met gekozen crypto naar andere spelers
                  if (socket && roomId) {
                    socket.emit('market:priceUpdate', {
                      roomCode: roomId,
                      cryptos: cryptos.map(crypto => {
                        if (crypto.symbol === symbol) {
                          return {
                            ...crypto,
                            price: Math.round(crypto.price * multiplier * 100) / 100,
                            change24h: percentage
                          }
                        }
                        return crypto
                      })
                    })
                  }
                  
                  // Ga terug naar main menu
                  navigateToScreen('main-menu')
                }}
              />
            )
            
          case 'swap':
            return (
              <SwapScreen
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                players={players}
                onNavigate={(screen) => navigateToScreen(screen as Screen)}
                onSwapConfirm={(myCryptoId: string, otherPlayerId: string, otherCryptoId: string) => {
                  // Zoek mijn crypto, de gekozen crypto van de andere speler en de speler zelf
                  const myCrypto = cryptos.find(c => c.id === myCryptoId)
                  const otherCrypto = cryptos.find(c => c.id === otherCryptoId)
                  const otherPlayer = players.find(p => p.id === otherPlayerId)
                  
                  if (!myCrypto || !otherCrypto || !otherPlayer) {
                    console.error('❌ Ongeldige swap: crypto of speler niet gevonden')
                    return
                  }

                  // Controle: beide spelers moeten minstens 1 munt hebben
                  const myAmount = myCrypto.amount
                  const otherAmount = otherPlayer.portfolio[otherCrypto.symbol] || 0

                  if (myAmount < 1) {
                    console.error('❌ Ongeldige swap: jij hebt minder dan 1 munt')
                    return
                  }

                  if (otherAmount < 1) {
                    console.error('❌ Ongeldige swap: andere speler heeft minder dan 1 munt')
                    return
                  }

                  // Stuur swap request naar server - server doet alle updates
                  // Beide spelers krijgen player:swapReceived en updaten daar hun portfolio
                  if (socket && roomId && mySocketId) {
                    socket.emit('player:swap', {
                      roomCode: roomId,
                      fromPlayerId: mySocketId,
                      toPlayerId: otherPlayerId,
                      fromCryptoId: myCrypto.symbol,
                      toCryptoId: otherCrypto.symbol
                    })

                    console.log(`✅ Swap aangevraagd: 1x ${myCrypto.symbol} ↔ 1x ${otherCrypto.symbol} met ${otherPlayer.name}`)
                  }

                  // Na bevestigen van de swap terug naar hoofdmenu; updates komen via player:swapReceived
                  navigateToScreen('main-menu')
                }}
              />
            )
            
          case 'settings':
            return (
              <Settings 
                onBack={() => navigateToScreen('main-menu')} 
                playerName={playerName}
                playerAvatar={playerAvatar}
              />
            )
            
          default:
            return (
              <StartScreen 
                onSelectRole={handleStartScreenRoleSelection}
              />
            )
        }
      })()}


      {/* Player join notification overlay */}
      {currentScreen === 'market-dashboard' && joinNotification && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`bg-dark-bg/90 backdrop-blur-sm border rounded-lg shadow-lg px-4 py-3 flex items-start space-x-3 ${
            joinNotification.isRejoining 
              ? 'border-neon-gold/40 shadow-neon-gold/20' 
              : 'border-green-500/40 shadow-green-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse mt-1 ${
              joinNotification.isRejoining ? 'bg-neon-gold' : 'bg-green-400'
            }`}></div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{joinNotification.playerAvatar}</span>
              <div>
                <p className={`text-sm font-semibold ${
                  joinNotification.isRejoining ? 'text-neon-gold' : 'text-green-400'
                }`}>
                  {joinNotification.isRejoining ? '🔄 Speler teruggekeerd' : '🎉 Nieuwe speler'}
                </p>
                <p className="text-base font-bold text-white">{joinNotification.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Turn change notification overlay - niet tonen op Market Dashboard */}
      {currentScreen !== 'market-dashboard' && turnNotification && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-dark-bg/95 border border-neon-gold/50 shadow-[0_0_40px_rgba(255,215,0,0.35)] overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-neon-gold via-neon-purple to-neon-gold" />

            <div className="px-6 pt-5 pb-6 flex items-center justify-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neon-gold/15 border border-neon-gold/60 shadow-inner">
                <span className="text-3xl">{turnNotification.playerAvatar}</span>
              </div>
              <div className="flex-1 text-center">
                <p className="text-2xl font-extrabold text-white">
                  Beurt nu aan <span className="text-neon-gold">{turnNotification.playerName}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap notification overlay - niet tonen op Market Dashboard */}
      {currentScreen !== 'market-dashboard' && swapNotification && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-dark-bg/95 border border-neon-purple/50 shadow-[0_0_40px_rgba(168,85,247,0.35)] overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-neon-purple via-neon-gold to-neon-purple" />

            <div className="px-6 pt-5 pb-6 flex items-start space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-purple/15 border border-neon-purple/60 shadow-inner">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neon-purple tracking-wide uppercase mb-1">Swap ontvangen</p>
                <p className="text-xl font-extrabold text-white mb-2">
                  Ruil met <span className="text-neon-gold">{swapNotification.fromPlayerName}</span> {swapNotification.fromPlayerAvatar}
                </p>
                <p className="text-sm text-gray-300">
                  Je hebt <span className="text-neon-gold font-semibold">1x {swapNotification.receivedCrypto}</span> ontvangen en <span className="text-red-400 font-semibold">1x {swapNotification.lostCrypto}</span> weggegeven.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Turn Timer - visible on all screens when it's player's turn, hidden during turn notifications */}
      {roomId && roomId !== 'solo-mode' && !isHost && !turnNotification && !isFirstTurn && (
        <TurnTimer 
          isMyTurn={isMyTurn && !isGameFinishedForPlayer}
          onTimeExpired={() => {
            console.log('⏰ CLIENT: Turn timer expired - requesting turn end')
            if (socket && roomId) {
              console.log('⏰ Emitting turn:end event to room:', roomId)
              socket.emit('turn:end', { roomCode: roomId })
              console.log('⏰ turn:end event emitted')
            } else {
              console.error('⏰ Cannot emit turn:end - socket or roomId missing', { socket: !!socket, roomId })
            }
          }}
          onTimeUpdate={(timeLeft) => {
            setTurnTimeLeft(timeLeft)
          }}
          turnDuration={120}
          gameStartTime={gameState?.gameStartTime}
        />
      )}
    </div>

    {/* Game Paused Overlay - shown for ALL players except Market Dashboard */}
    {isGamePaused && currentScreen !== 'market-dashboard' && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="crypto-card max-w-md w-full p-8 text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-600/20 border border-yellow-600/60 animate-pulse">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Spel gepauzeerd</h2>
          <p className="text-gray-300 text-sm mb-6">
            Het spel is momenteel gepauzeerd. Alle timers en automatische events zijn gestopt.
          </p>
          <p className="text-yellow-400 text-sm">
            Wacht tot de Market Dashboard het spel hervat...
          </p>
        </div>
      </div>
    )}

    {/* Insider Forecast Popup */}
    {showInsiderForecast && insiderForecastData && (
      <InsiderForecast
        forecastData={insiderForecastData}
        onClose={() => {
          console.log('🕵️ Insider forecast closed manually')
          setShowInsiderForecast(false)
          setInsiderForecastData(null)
        }}
      />
    )}

    {/* Event from other player - NIET tonen op Market Dashboard om dubbele overlay te vermijden */}
    {currentScreen !== 'market-dashboard' && showOtherPlayerEvent && otherPlayerEventData && (
      <EventPopup
        key={currentEventId}
        externalScenario={otherPlayerEventData}
        onClose={() => {
          // ENABLED: Player kan popup wegklikken op eigen scherm
          // Dit sluit ALLEEN lokaal, niet op andere schermen of dashboard
          console.log('👆 Player clicked to close popup locally')
          
          // Clear auto-close timer
          if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current)
            autoCloseTimerRef.current = null
          }
          
          // Close popup ONLY on this player's screen
          setShowOtherPlayerEvent(false)
          setOtherPlayerEventData(null)
          setCurrentEventId('')
          
          console.log('✅ Popup closed locally - still visible on other screens')
        }}
        onApplyEffect={(effect) => {
          console.log('✅ Event auto-applied after timer completion')
          // Clear auto-close timer
          if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current)
            autoCloseTimerRef.current = null
          }
          // Effect is already applied by server, just close
          setShowOtherPlayerEvent(false)
          setOtherPlayerEventData(null)
          setCurrentEventId('')
        }}
      />
    )}

    {/* Player Finish Notification */}
    {showFinishNotification && playerFinishRank && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-dark-card via-dark-bg to-dark-card border-2 border-neon-gold rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-r from-neon-gold/20 to-yellow-500/20 border-b border-neon-gold/30 p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🏁</div>
              <h2 className="text-3xl font-bold text-neon-gold">Speljaren Bereikt!</h2>
            </div>
          </div>
          
          <div className="p-6 text-center space-y-4">
            <div className="bg-neon-gold/10 border border-neon-gold/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Jouw Positie</p>
              <p className="text-5xl font-bold text-neon-gold">#{playerFinishRank}</p>
            </div>
            
            <p className="text-gray-300 text-lg">
              Je hebt al je speljaren voltooid!
            </p>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                ✅ Je portfolio en wallet zijn opgeslagen
              </p>
              <p className="text-blue-300 text-sm mt-2">
                ⏳ Andere spelers kunnen nog doorspelen
              </p>
            </div>
            
            <p className="text-gray-400 text-sm">
              Je kunt je portfolio en wallet nog bekijken, maar geen nieuwe acties meer uitvoeren.
            </p>
          </div>
          
          <div className="bg-dark-bg/30 border-t border-white/10 p-4">
            <button
              onClick={() => setShowFinishNotification(false)}
              className="w-full py-3 bg-neon-gold/20 hover:bg-neon-gold/30 text-neon-gold rounded-lg transition-all font-bold"
            >
              Begrepen
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Auth Modal */}
    <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)}
      onSuccess={() => {
        setShowAuthModal(false)
        // Go back to start screen with user info
        navigateToScreen('start-screen')
      }}
    />

    {/* Subscription Modal */}
    <SubscriptionModal 
      isOpen={showSubscriptionModal} 
      onClose={() => setShowSubscriptionModal(false)}
    />
    </>
  )
}
