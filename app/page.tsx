'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import StartScreen from '@/components/StartScreen'
import LoginScreen from '@/components/LoginScreen'
import GameSetup from '@/components/GameSetup'
import HostSetup from '@/components/HostSetup'
import RoleSelection from '@/components/RoleSelection'
import RoomCreate from '@/components/RoomCreate'
import RoomJoin from '@/components/RoomJoin'
import WaitingRoom from '@/components/WaitingRoom'
import MainMenu from '@/components/MainMenu'
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
import { ScanEffect } from '@/components/ScanResult'
import { useSocket } from '@/hooks/useSocket'

type Screen = 'start-screen' | 'host-setup' | 'player-login' | 'role-selection' | 'room-create' | 'room-join' | 'waiting-room' | 'login' | 'game-setup' | 'starting-game' | 'main-menu' | 'market-dashboard' | 'dashboard' | 'market' | 'qr-scanner' | 'portfolio' | 'cash' | 'rankings' | 'settings' | 'scan-transcript' | 'actions-menu' | 'buy' | 'sell' | 'game-over' | 'resume-game'

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

interface GameState {
  startYear: number
  gameDuration: number
  gameStartTime: number
  lastSaveTime: number
}

export default function Home() {
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
  const [currentYear, setCurrentYear] = useState<number>(2024)
  
  // Get socket connection for game events
  const { socket, room } = useSocket()
  const lastEmittedScanId = useRef<string | null>(null)
  const appliedEventIdsRef = useRef<Set<string>>(new Set())
  const hasSyncedMarketStateRef = useRef<boolean>(false)
  
  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([])
  
  // Scan actions state
  const [playerScanActions, setPlayerScanActions] = useState<any[]>([])
  const [autoScanActions, setAutoScanActions] = useState<any[]>([])
  
  // Dynamic players data based on room players
  const [players, setPlayers] = useState<any[]>([])
  const [roomPlayers, setRoomPlayers] = useState<any>({}) // Store room player data from server
  
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

    const updatedPlayers = Object.entries(roomPlayersData)
      .filter(([playerId, playerData]: [string, any]) => !playerData.isHost) // Exclude hosts from ranking
      .map(([playerId, playerData]: [string, any]) => {
        
        // ALWAYS use server's totalValue - this is what the player calculated and sent
        let totalValue
        if (playerData.totalValue !== undefined && playerData.totalValue !== null) {
          totalValue = playerData.totalValue
          console.log(`📊 ${playerData.name}: Server totalValue = €${totalValue.toFixed(2)}`)
        } else {
          // Fallback calculation (should rarely happen)
          console.warn(`⚠️ ${playerData.name} - No totalValue from server, calculating fallback`)
          const portfolioValue = calculatePortfolioValue(playerData.portfolio, playerData.name)
          totalValue = Math.round((portfolioValue + (playerData.cashBalance || 0)) * 100) / 100
          console.warn(`⚠️ ${playerData.name} - Fallback calculation = €${totalValue.toFixed(2)}`)
        }
        
        return {
          id: playerId,
          name: playerData.name || 'Unknown Player',
          avatar: playerData.avatar || '👤',
          totalValue: totalValue,
          portfolio: playerData.portfolio || {},
          cashBalance: playerData.cashBalance || 0,
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
      change24h: 7.3,
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
      change24h: -1.8,
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
      change24h: 12.1,
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
      change24h: -3.2,
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
      change24h: 15.7,
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
      change24h: 4.5,
      amount: 0,
      color: 'neon-gold',
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

  // ⚡ INSTANT Dashboard Updates - Direct from players - Optimized
  const handleLivePlayerUpdate = useCallback(({ playerId, playerName, totalValue, portfolioValue, cashBalance, timestamp }: any) => {
    console.log(`⚡ LIVE UPDATE RECEIVED: ${playerName} → €${totalValue} (${new Date(timestamp).toLocaleTimeString()})`)
    
    // Update players state immediately with live data
    setPlayers(prev => {
      const updated = prev.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            totalValue: totalValue,
            portfolioValue: portfolioValue,
            cashBalance: cashBalance,
            lastUpdate: timestamp
          }
        }
        return player
      })
      
      // Sort by totalValue and reassign ranks
      const sorted = updated
        .sort((a, b) => b.totalValue - a.totalValue)
        .map((player, index) => ({ ...player, rank: index + 1 }))
      
      console.log(`📊 LIVE RANKINGS UPDATE:`)
      sorted.forEach(p => {
        console.log(`  ${p.rank}. ${p.name}: €${p.totalValue.toFixed(2)}`)
      })
      
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
    // Only proceed if we have crypto data
    if (cryptos.length === 0) {
      return
    }
    
    if (Object.keys(roomPlayers).length > 0) {
      updatePlayersFromRoom(roomPlayers)
    } else if (roomId === 'solo-mode' || !roomId) {
      updatePlayersFromRoom(null) // Triggers solo mode fallback
    }
  }, [cashBalance, playerName, playerAvatar, roomId, roomPlayers, cryptos])

  // 🎯 UNIFIED DATA SYNC - Single Source of Truth
  useEffect(() => {
    if (!socket || !roomId || roomId === 'solo-mode' || !playerName) {
      return
    }

    const updatedPortfolio = cryptoPortfolio

    // 🚨 CRITICAL: Use FRESH calculations for sync - NO MEMOIZATION
    const localPortfolioValue = Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
    const localTotalValue = Math.round((localPortfolioValue + cashBalance) * 100) / 100

    const sendUnifiedUpdate = () => {
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

    // 🔍 CONSISTENCY CHECK - Compare with server state
    const serverTotalValue = socket?.id ? roomPlayers[socket.id]?.totalValue : undefined
    const needsSync = serverTotalValue !== undefined && 
                     Math.abs(localTotalValue - serverTotalValue) > 0.01

    if (needsSync) {
      console.log(`🔧 CONSISTENCY CHECK FAILED!`)
      console.log(`📊 Server: €${serverTotalValue}`)
      console.log(`📱 Local: €${localTotalValue}`)
      console.log(`🔄 Forcing immediate sync...`)
      
      // Clear any pending timeout and send immediately
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      sendUnifiedUpdate()
      return
    }

    // 📊 SMART THROTTLING - Reduce server load while maintaining accuracy
    const valueDifference = lastSentTotalValue.current !== null 
      ? Math.abs(localTotalValue - lastSentTotalValue.current) 
      : Infinity
    
    if (valueDifference > 0.5) {
      // Significant change - send immediately
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      sendUnifiedUpdate()
    } else if (valueDifference > 0.01) {
      // Small change - debounce for 1 second
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      updateTimeoutRef.current = setTimeout(sendUnifiedUpdate, 1000)
    }
    // No change - don't send update

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [cashBalance, cryptos, socket, roomId, playerName, playerAvatar, roomPlayers])

  // Removed duplicate useEffect - using single useEffect above for player data updates

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
        console.log('👥 Lobby update received:', room)
        if (room && room.players) {
          console.log('👥 Room players data:', room.players)
          setConnectedPlayers(Object.keys(room.players).length)
          setRoomPlayers(room.players)
          
          // DASHBOARD SELF-HEAL: If we're viewing the dashboard, immediately request fresh data
          if (playerName === 'Market Dashboard' && socket && roomId) {
            console.log('🔧 DASHBOARD SELF-HEAL: Requesting immediate refresh after lobby update')
            setTimeout(() => {
              socket.emit('dashboard:requestRefresh', { roomCode: roomId })
            }, 100) // Small delay to ensure all players have processed the lobby update
          }
          
          console.log('🔄 Room players updated, useEffect will handle player calculations')
        }
      }
      
      // Set initial connection status
      setIsConnected(socket.connected)

      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('lobby:update', handleLobbyUpdate)
      socket.on('dashboard:livePlayerUpdate', handleLivePlayerUpdate)
      socket.on('player:dataSync', handlePlayerDataSync)
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
      socket.on('crypto:priceUpdate', (serverPrices: Record<string, number>) => {
        console.log('💰 Received server crypto prices:', serverPrices)
        
        setCryptos(prevCryptos => 
          prevCryptos.map(crypto => {
            const newPrice = serverPrices[crypto.symbol]
            if (typeof newPrice !== 'number') return crypto

            return {
              ...crypto,
              price: newPrice
            }
          })
        )
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
      
      return () => {
        socket.off('connect', handleConnect)
        socket.off('disconnect', handleDisconnect)
        socket.off('lobby:update', handleLobbyUpdate)
        socket.off('dashboard:livePlayerUpdate', handleLivePlayerUpdate)
        socket.off('player:dataSync', handlePlayerDataSync)
        socket.off('test:messageReceived', handleTestMessageReceived)
        socket.off('crypto:priceUpdate')
        socket.off('crypto:forceRecalculation')
      }
    }
  }, [socket, handleLivePlayerUpdate, handlePlayerDataSync])

  // Dashboard pushes its current market snapshot once to initialize server state
  useEffect(() => {
    try {
      if (!socket || !roomId) return
      if (playerName !== 'Market Dashboard') return
      if (hasSyncedMarketStateRef.current) return
      const changeMap = cryptos.reduce((acc, c) => {
        acc[c.symbol] = typeof c.change24h === 'number' ? c.change24h : 0
        return acc
      }, {} as Record<string, number>)
      console.log('📤 Dashboard syncing market state to server', changeMap)
      socket.emit('dashboard:syncMarketState', { roomCode: roomId, changeMap })
      hasSyncedMarketStateRef.current = true
    } catch (e) {
      console.warn('Failed to sync dashboard market state', e)
    }
  }, [socket, roomId, playerName, cryptos])

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
        
        // Then navigate to final destination after 3 seconds
        setTimeout(() => {
          if (isHost) {
            console.log('👑 Host navigating to LIVE MARKET SCREEN (market-dashboard)')
            setCurrentScreen('market-dashboard')
          } else {
            console.log('👤 Player navigating to UNIQUE PLAYER INTERFACE (main-menu)')
            setCurrentScreen('main-menu')
          }
          console.log('✅ Final navigation completed')
        }, 3000)
      }

      socket.on('game:started', handleGameStarted)

      return () => {
        socket.off('game:started', handleGameStarted)
      }
    }
  }, [socket, isHost, playerName, currentScreen])

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
      const allScans = [...normAuto, ...normPlayer]
      const latestScan = allScans[0] // Most recent scan
      
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
            const randomIndex = Math.floor(Math.random() * cryptos.length)
            const targetCoin = cryptos[randomIndex]
            console.log(`🐋 APPLYING WHALE ALERT: Random coin +50% → ${targetCoin?.symbol || 'unknown'}`)
            setCryptos(prev => prev.map((crypto, index) => {
              if (index === randomIndex) {
                const newPrice = Math.round(crypto.price * 1.5 * 100) / 100
                console.log(`  ${crypto.symbol}: €${crypto.price} → €${newPrice} (+50%)`)
                return {
                  ...crypto,
                  price: newPrice,
                  change24h: 50,
                  volume: crypto.volume * 2,
                  marketCap: crypto.marketCap * 1.5
                }
              }
              return crypto
            }))
          }
          
          console.log('✅ Market event applied to crypto prices!')
        }
        console.log('🔍 === MARKET EVENT CHECK COMPLETE ===\n')
      }

      // NOW update state with normalized data after event processing
      setAutoScanActions(normAuto)
      setPlayerScanActions(normPlayer)

      console.log('✅ Scan data normalized and sorted from server')
      console.log('📊 === SERVER SCAN DATA UPDATE END ===\n')
    }

    // 📊 Core event listeners (clean architecture)
    socket.on('test:messageReceived', handleTestMessageReceived)
    socket.on('player:joinNotification', handlePlayerJoinNotification)
    socket.on('room:verificationResult', handleRoomVerificationResult)
    socket.on('dashboard:refreshRequested', handleDashboardRefresh)
    socket.on('scanData:update', handleScanDataUpdate)

    return () => {
      socket.off('test:messageReceived', handleTestMessageReceived)
      socket.off('player:joinNotification', handlePlayerJoinNotification)
      socket.off('room:verificationResult', handleRoomVerificationResult)
      socket.off('dashboard:refreshRequested', handleDashboardRefresh)
      socket.off('scanData:update', handleScanDataUpdate)
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
    
    const startDelay = setTimeout(() => {
      console.log(`🎮 Solo mode: Now generating local activities`)
      
      const getBound = () => {
        const v = selectedVolatility || 'medium'
        if (v === 'low') return 1
        if (v === 'high') return 3
        return 2
      }

      const generateActivity = () => {
        const cryptoSymbols = ['DSHEEP', 'NUGGET', 'LNTR', 'OMLT', 'REX', 'ORLO']
        const randomCrypto = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)]
        
        // Generate random percentage within selected volatility bound
        const bound = getBound()
        const percentage = (Math.random() * (2 * bound) - bound).toFixed(1)
        const isPositive = parseFloat(percentage) >= 0
        const sign = isPositive ? '+' : ''
        const percentageValue = parseFloat(percentage)
        
        const actions = ['Market Move', 'Price Alert', 'Trading Signal', 'Volume Spike']
        const randomActionType = actions[Math.floor(Math.random() * actions.length)]
        
        const newScanAction = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          player: 'Bot',
          action: randomActionType,
          effect: `${randomCrypto} ${sign}${percentage}%`,
          cryptoSymbol: randomCrypto,
          percentageValue: percentageValue
        }
        
        console.log(`🎯 Solo activity: ${newScanAction.effect}`)
        
        // Add to auto scan actions
        setAutoScanActions(prev => [newScanAction, ...prev.slice(0, 4)])
        
        // Update crypto prices directly
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
      
      const interval = setInterval(() => {
        generateActivity()
      }, 30000) // Update every 30 seconds

      return () => {
        console.log(`🛑 Stopping solo mode activity generation`)
        clearInterval(interval)
      }
    }, 30000) // 30 second delay

    return () => {
      clearTimeout(startDelay)
    }
  }, [gameState, socket, roomId, currentScreen])

  // Helper function to navigate and scroll to top
  const navigateToScreen = (screen: Screen) => {
    setPreviousScreen(currentScreen)
    setCurrentScreen(screen)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStartScreenRoleSelection = (role: 'host' | 'player') => {
    setIsHost(role === 'host')
    if (role === 'host') {
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

  const handleLogin = (name: string, avatar: string) => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    
    // Save session data including room info for potential rejoin
    const sessionData = {
      playerName: name,
      playerAvatar: avatar,
      roomId: roomId,
      isHost: isHost,
      timestamp: Date.now(),
      lastRoomId: roomId // Keep track of last room for rejoin
    }
    localStorage.setItem('cryptoClashSession', JSON.stringify(sessionData))
    
    // Only players use login - they go to room join
    navigateToScreen('player-login')
  }

  const handleStartGame = (startYear: number, gameDuration: number, language: string) => {
    const newGameState: GameState = {
      startYear,
      gameDuration,
      gameStartTime: Date.now(),
      lastSaveTime: Date.now()
    }
    setGameState(newGameState)
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
    
    // STEP 1: Apply EVENT effects FIRST (Bull Run, Market Crash, Whale Alert)
    // These must happen BEFORE navigation to ensure state updates complete
    if (effect.type === 'event') {
      console.log('\n🎰 === APPLYING EVENT EFFECT ===')
      console.log('🔍 Effect type:', effect.type)
      console.log('🔍 Effect message:', JSON.stringify(effect.message))
      console.log('🔍 Contains "Market Crash"?', effect.message.includes('Market Crash'))
      console.log('🔍 Contains "Bull Run"?', effect.message.includes('Bull Run'))
      console.log('🔍 Contains "Whale Alert"?', effect.message.includes('Whale Alert'))
      
      if (effect.message.includes('Bull Run')) {
        console.log('🚀 BULL RUN: All coins +5%')
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
        console.log('✅ Bull Run applied to all coins')
      } else if (effect.message.includes('Market Crash') || effect.message.toLowerCase().includes('market crash')) {
        console.log('📉 MARKET CRASH: All coins -10%')
        console.log('🔍 Original prices before crash:', cryptos.map(c => `${c.symbol}: €${c.price}`))
        
        setCryptos(prev => {
          const newCryptos = prev.map(crypto => {
            const newPrice = Math.round(crypto.price * 0.9 * 100) / 100
            console.log(`  ${crypto.symbol}: €${crypto.price} → €${newPrice} (-10%)`)
            return {
              ...crypto,
              price: newPrice,
              change24h: crypto.change24h - 10,
              volume: crypto.volume * (0.8 + Math.random() * 0.4),
              marketCap: crypto.marketCap * 0.9
            }
          })
          console.log('🔍 New prices after crash:', newCryptos.map(c => `${c.symbol}: €${c.price}`))
          return newCryptos
        })
        console.log('✅ Market Crash applied to all coins')
      } else if (effect.message.includes('Whale Alert')) {
        const randomIndex = Math.floor(Math.random() * cryptos.length)
        const targetCoin = cryptos[randomIndex]
        console.log(`🐋 WHALE ALERT: Random coin +50% → ${targetCoin?.symbol || 'unknown'}`)
        setCryptos(prev => prev.map((crypto, index) => {
          if (index === randomIndex) {
            const newPrice = Math.round(crypto.price * 1.5 * 100) / 100
            console.log(`  ${crypto.symbol}: €${crypto.price} → €${newPrice} (+50%)`)
            return {
              ...crypto,
              price: newPrice,
              change24h: 50,
              volume: crypto.volume * 2,
              marketCap: crypto.marketCap * 1.5
            }
          }
          return crypto
        }))
        console.log('✅ Whale Alert applied to random coin')
      } else {
        console.log('⚠️ UNKNOWN EVENT - No matching pattern found!')
        console.log('🔍 Effect message was:', JSON.stringify(effect.message))
        console.log('🔍 Available patterns: "Bull Run", "Market Crash", "Whale Alert"')
      }
      console.log('🎰 === EVENT EFFECT COMPLETE ===\n')
    }
    
    // STEP 2: Build effect text for display
    let effectText = ''
    if (effect.type === 'boost' || effect.type === 'crash') {
      if (effect.cryptoSymbol && effect.percentage) {
        const sign = effect.percentage > 0 ? '+' : ''
        effectText = `${effect.cryptoSymbol} ${sign}${effect.percentage}%`
      }
    } else if (effect.type === 'event') {
      effectText = effect.message
    }
    
    setLastScanEffect(effectText)
    
    // STEP 3: Add scan action and apply portfolio effects for single-coin scans
    if (effectText) {
      const newScanAction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        player: playerName,
        action: 'QR Scan',
        effect: effectText,
        avatar: playerAvatar,
        cryptoSymbol: effect.cryptoSymbol,
        percentageValue: effect.percentage
      }
      setPlayerScanActions(prev => [newScanAction, ...prev.slice(0, 9)])
      
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
    navigateToScreen('starting-game')
    
    // Short 3-second loading screen
    setTimeout(() => {
      console.log('🎮 Loading complete - navigating to game interface')
      if (isHost) {
        navigateToScreen('market-dashboard')
      } else {
        navigateToScreen('main-menu')
      }
    }, 3000)
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
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Render the current screen */}
      {(() => {
        switch (currentScreen) {
          case 'start-screen':
            return (
              <StartScreen 
                onSelectRole={handleStartScreenRoleSelection}
              />
            )
            
          case 'host-setup':
            return (
              <HostSetup 
                onStartRoom={handleHostSetup}
                onBack={() => navigateToScreen('start-screen')}
                playerName={playerName}
                playerAvatar={playerAvatar}
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
            return <LoginScreen onLogin={handleLogin} />
            
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
                  setCashBalance(prev => Math.round((prev + 500) * 100) / 100)
                  setCurrentYear(prev => {
                    const next = prev + 1
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
                }}
                onNavigate={handleMenuNavigation}
                lastScanEffect={lastScanEffect}
                cashBalance={cashBalance}
                players={players}
                playerScanActions={playerScanActions}
                autoScanActions={autoScanActions}
                transactions={transactions}
                onSendTestMessage={handleSendTestMessage}
                onAddScanAction={handleAddScanAction}
                onVerifyRoom={verifyRoomMembership}
                onApplyScanEffect={handleQRScan}
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
                  <div className="w-20 h-20 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-5 shadow-neon-blue/30" />
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold bg-clip-text text-transparent">
                    Spel wordt gestart...
                  </h2>
                  <p className="text-gray-300 text-sm mt-2">Even geduld, we zetten alles klaar</p>
                  <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-neon-purple rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 bg-neon-gold rounded-full animate-bounce [animation-delay:0.3s]" />
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
              />
            )
            
          case 'market':
            return (
              <MarketOverview 
                onBack={() => navigateToScreen('main-menu')}
                currentPlayer={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
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
                onNavigate={(screen) => {
                  if (screen === 'main-menu') {
                    navigateToScreen('main-menu')
                  } else if (screen === 'buy') {
                    navigateToScreen('buy')
                  } else if (screen === 'sell') {
                    navigateToScreen('sell')
                  } else {
                    console.log(`Navigate to ${screen} - Coming soon!`)
                  }
                }}
                onApplyScanEffect={handleQRScan}
              />
            )
            
          case 'buy':
            return (
              <BuyCrypto
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                cashBalance={cashBalance}
                onBack={() => navigateToScreen('actions-menu')}
                onConfirmBuy={(symbol, quantity) => {
                  // Calculate cost using current price
                  const selected = cryptos.find(c => c.symbol === symbol)
                  if (!selected) return
                  const cost = Math.round(selected.price * quantity * 100) / 100
                  const newCash = Math.round((cashBalance - cost) * 100) / 100
                  if (newCash < 0) return

                  const newCryptos = cryptos.map(c => c.symbol === symbol ? { ...c, amount: c.amount + quantity } : c)
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

                  navigateToScreen('main-menu')
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
              />
            )

          case 'sell':
            return (
              <GameDashboard
                playerName={playerName}
                playerAvatar={playerAvatar}
                cryptos={cryptos}
                onBack={() => navigateToScreen('main-menu')}
                showSellControls={true}
                onSellCrypto={(cryptoId: string, amountToSell: number) => {
                  const coin = cryptos.find(c => c.id === cryptoId)
                  if (!coin) return
                  const revenue = Math.round(coin.price * amountToSell * 100) / 100

                  const newCryptos = cryptos.map(c => c.id === cryptoId ? { ...c, amount: Math.max(0, c.amount - amountToSell) } : c)
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

                  // After selling, hide sell buttons by navigating to plain portfolio view
                  navigateToScreen('portfolio')
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
    </div>
  )
}
