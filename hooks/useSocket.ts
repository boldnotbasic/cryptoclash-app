'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Room {
  hostId: string
  hostName: string
  hostAvatar: string
  players: Record<string, {
    name: string
    avatar: string
    joinedAt: number
    isHost: boolean
    isRejoining?: boolean
    cashBalance?: number
    portfolio?: any
  }>
  started: boolean
  settings: {
    volatility: string
    gameDuration: number
    startingCash?: number
  }
  playerOrder?: string[]
  currentTurnPlayerId?: string | null
}

interface UseSocketReturn {
  socket: Socket | null
  connected: boolean
  room: Room | null
  error: string | null
  createRoom: (roomCode: string, hostName: string, hostAvatar: string, settings: any) => void
  joinRoom: (roomCode: string, playerName: string, playerAvatar: string) => void
  startGame: (roomCode: string) => void
  clearError: () => void
}

// Global socket instance to prevent multiple connections
let globalSocket: Socket | null = null as Socket | null

export const useSocket = (): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const AUTO_JOIN_STORAGE_KEY = 'cryptoclash-last-join'
  const AUTO_JOIN_ATTEMPT_KEY = 'cryptoclash-last-join-attempt'
  const triedPollingOnlyRef = useRef(false)

  useEffect(() => {
    // Use global socket if it exists
    if (globalSocket && globalSocket.connected) {
      console.log('🔌 Reusing existing global socket connection:', globalSocket.id)
      socketRef.current = globalSocket
      setConnected(true)
      
      // Setup state listeners for existing socket
      const socket = globalSocket
      
      socket.on('host:createSuccess', ({ roomCode, room }) => {
        console.log('🏠 Room created/joined successfully:', roomCode)
        setRoom(room)
        setError(null)
      })
      
      socket.on('host:createError', (errorMessage) => {
        console.error('❌ Room creation error:', errorMessage)
        setError(errorMessage)
      })
      
      socket.on('player:joinSuccess', ({ roomCode, room }) => {
        console.log('🎉 Player joined successfully:', roomCode)
        setRoom(room)
        setError(null)
      })
      
      socket.on('player:joinError', (errorMessage) => {
        console.error('❌ Player join error:', errorMessage)
        setError(errorMessage)
        // CRITICAL: Clear room state to prevent navigation with stale data
        setRoom(null)
        console.log('🧹 Room state cleared due to join error')
      })
      
      socket.on('lobby:update', (updatedRoom) => {
        console.log('🔄 Lobby updated')
        setRoom(updatedRoom)
      })
      
      socket.on('game:started', ({ room }) => {
        console.log('🎮 Game started!')
        setRoom(room)
      })
      
      return () => {
        console.log('🔌 Component cleanup - keeping socket alive')
      }
    }
    
    // Prevent multiple socket connections
    if (socketRef.current) {
      console.log('🔌 Socket already exists in ref, reusing connection')
      return
    }

    // Initialize socket connection with proper URL handling
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}`
    // Force polling-only in production to maximize compatibility on mobile networks
    // You can later set NEXT_PUBLIC_FORCE_POLLING=false to re-enable upgrade
    const forcePollingOnly = process.env.NODE_ENV === 'production'
      ? true
      : (typeof process.env.NEXT_PUBLIC_FORCE_POLLING !== 'undefined'
          ? process.env.NEXT_PUBLIC_FORCE_POLLING === 'true'
          : false)
    
    console.log('🔌 Connecting to Socket.IO server:', socketUrl)
    console.log('🌐 Environment:', process.env.NODE_ENV)
    console.log('📱 User Agent:', navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop')
    
    // Primary attempt
    socketRef.current = io(socketUrl, forcePollingOnly ? {
      path: '/socket.io',
      transports: ['polling'],
      upgrade: false,
      timeout: 40000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000
    } : {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      rememberUpgrade: true,
      timeout: 35000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    // Store in global variable to prevent multiple connections
    globalSocket = socketRef.current
    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Connected to server:', socket.id)
      setConnected(true)
      setError(null)
      
      // Try to recover session from localStorage
      try {
        const savedRoomState = localStorage.getItem('cryptoclash-room-state')
        const savedIdentity = localStorage.getItem(AUTO_JOIN_STORAGE_KEY)
        
        if (savedRoomState && savedIdentity) {
          const roomData = JSON.parse(savedRoomState)
          const identity = JSON.parse(savedIdentity)
          const { roomCode, playerName, playerAvatar } = identity
          
          console.log('🔄 === SESSION RECOVERY ATTEMPT ===')
          console.log('📦 Saved room state found:', roomData)
          console.log('👤 Player identity:', { playerName, playerAvatar })
          console.log('🏠 Room code:', roomCode)
          
          // Emit session recovery request to server
          socket.emit('player:recoverSession', {
            roomCode,
            playerName,
            playerAvatar,
            previousRoomState: roomData
          })
          
          console.log('✅ Session recovery request sent')
        } else if (savedIdentity && !room) {
          // Fallback to simple rejoin if no room state saved
          const attemptRaw = sessionStorage.getItem(AUTO_JOIN_ATTEMPT_KEY)
          const lastAttempt = attemptRaw ? parseInt(attemptRaw, 10) : 0
          const now = Date.now()
          
          if (!lastAttempt || now - lastAttempt > 3000) {
            const data = JSON.parse(savedIdentity)
            const { roomCode, playerName, playerAvatar } = data || {}
            if (roomCode && playerName && playerAvatar) {
              console.log('🤖 Auto-rejoin attempt with saved identity:', data)
              sessionStorage.setItem(AUTO_JOIN_ATTEMPT_KEY, String(now))
              socket.emit('player:join', { roomCode, playerName, playerAvatar })
            }
          }
        }
      } catch (e) {
        console.warn('Session recovery failed', e)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason)
      console.log('💾 Keeping room state for reconnection recovery')
      setConnected(false)
      // DON'T clear room - keep it for recovery on reconnect
      // Save current room state to localStorage for recovery
      if (room) {
        try {
          localStorage.setItem('cryptoclash-room-state', JSON.stringify(room))
          console.log('💾 Room state saved to localStorage')
        } catch (e) {
          console.warn('Failed to save room state', e)
        }
      }
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message)
      console.error('📊 Error details:', error)
      setConnected(false)
      setError(`Verbindingsfout: ${error.message}`)
      
      // Fallback: retry once with polling-only (no upgrade) for restrictive networks
      if (!triedPollingOnlyRef.current && error.message.includes('xhr poll error')) {
        triedPollingOnlyRef.current = true
        console.log('🔁 XHR poll error detected - Retrying with strict polling-only mode...')
        console.log('⚠️ This fallback disables websocket upgrade for compatibility')
        
        try {
          socket.disconnect()
          socket.off()
        } catch {}
        
        // Force strict polling-only mode
        const fallbackSocket = io(socketUrl, {
          path: '/socket.io',
          transports: ['polling'],
          upgrade: false,
          timeout: 40000,
          forceNew: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 15,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000
        })
        
        socketRef.current = fallbackSocket
        globalSocket = fallbackSocket
        
        console.log('✅ Fallback socket created - attempting connection...')
      }
    })

    // Host events
    socket.on('host:createSuccess', ({ roomCode, room }) => {
      console.log('🏠 Room created/joined successfully:', roomCode)
      console.log('🏠 Room data:', room)
      setRoom(room)
      setError(null)
    })

    socket.on('host:createError', (errorMessage) => {
      console.error('🏠 Room creation error:', errorMessage)
      setError(errorMessage)
    })

    // Player events
    socket.on('player:joinSuccess', ({ roomCode, room }) => {
      console.log('🎉 === PLAYER JOIN SUCCESS RECEIVED ===')
      console.log('👤 Joined room successfully:', roomCode)
      console.log('🏠 Room data:', room)
      console.log('👥 Players in room:', Object.keys(room?.players || {}).length)
      
      // Ensure room data is valid before setting
      if (room && room.players) {
        setRoom(room)
        setError(null)
        console.log('✅ Room state updated successfully')
        // Persist successful join for future auto-rejoin
        try {
          const raw = localStorage.getItem(AUTO_JOIN_STORAGE_KEY)
          if (!raw) {
            const sid = socketRef.current?.id
            if (sid) {
              // If we didn't store yet (e.g., host invited flow), try to infer identity from players list matching this socket id
              const self = (room.players as any)[sid]
              if (self && !self.isHost) {
                localStorage.setItem(AUTO_JOIN_STORAGE_KEY, JSON.stringify({
                  roomCode: roomCode,
                  playerName: self.name,
                  playerAvatar: self.avatar
                }))
              }
            }
          }
        } catch {}
      } else {
        console.error('❌ Invalid room data received:', room)
        setError('Ongeldige kamer data ontvangen')
      }
    })

    socket.on('player:joinError', (errorMessage) => {
      console.error('❌ === PLAYER JOIN ERROR RECEIVED ===')
      console.error('👤 Join error:', errorMessage)
      setError(errorMessage)
      // CRITICAL: Clear room state to prevent navigation with stale data
      setRoom(null)
      console.log('🧹 Room state cleared due to join error')
    })

    // Language update event - when room language is set/changed
    socket.on('room:languageUpdate', ({ language }) => {
      console.log('🌐 Room language update received:', language)
      // Dispatch custom event that LanguageContext can listen to
      window.dispatchEvent(new CustomEvent('roomLanguageUpdate', { detail: { language } }))
    })

    // Lobby events
    socket.on('lobby:update', (updatedRoom) => {
      console.log('🔄 Lobby updated')
      setRoom(updatedRoom)
      // Save updated room state
      try {
        localStorage.setItem('cryptoclash-room-state', JSON.stringify(updatedRoom))
      } catch (e) {
        console.warn('Failed to save updated room state', e)
      }
    })

    // Game events
    socket.on('game:started', ({ room }) => {
      console.log('🎮 Game started!')
      setRoom(room)
      // Save room state for recovery
      try {
        localStorage.setItem('cryptoclash-room-state', JSON.stringify(room))
      } catch (e) {
        console.warn('Failed to save room state on game start', e)
      }
    })
    
    // Session recovery events
    socket.on('player:sessionRecovered', ({ room, message }) => {
      console.log('✅ === SESSION RECOVERED ===')
      console.log('📦 Room state:', room)
      console.log('💬 Message:', message)
      setRoom(room)
      setError(null)
      // Update saved room state
      try {
        localStorage.setItem('cryptoclash-room-state', JSON.stringify(room))
      } catch (e) {
        console.warn('Failed to update room state', e)
      }
    })
    
    socket.on('player:sessionRecoveryFailed', ({ message }) => {
      console.error('❌ Session recovery failed:', message)
      // Clear stale data
      try {
        localStorage.removeItem('cryptoclash-room-state')
        localStorage.removeItem(AUTO_JOIN_STORAGE_KEY)
      } catch (e) {
        console.warn('Failed to clear stale session data', e)
      }
      setError(message)
    })

    // Host start game events - ERROR HANDLING REMOVED
    // NO MORE ERRORS - GAME ALWAYS STARTS
    socket.on('host:startError', (errorMessage) => {
      console.warn('⚠️ Received old error (ignoring):', errorMessage)
      // IGNORE ALL ERRORS - DON'T SET ERROR STATE
    })

    // Test message events for room sync verification
    socket.on('test:messageReceived', ({ message, sender, timestamp, roomCode }) => {
      console.log(`📡 Test message received in room ${roomCode}:`, message, 'from', sender)
      // You could add a toast notification here or update UI
    })

    return () => {
      console.log('🔌 Component cleanup - keeping socket alive for other components')
      // DON'T disconnect the socket - keep it alive for other components
      // Only remove listeners if the socket is being recreated
      // socketRef.current = null
    }
  }, [])

  const createRoom = (roomCode: string, hostName: string, hostAvatar: string, settings: any) => {
    if (socketRef.current?.connected) {
      console.log('🏠 Creating room:', roomCode)
      socketRef.current.emit('host:createRoom', {
        roomCode,
        hostName,
        hostAvatar,
        settings
      })
    } else {
      setError('Geen verbinding met server')
    }
  }

  const joinRoom = (roomCode: string, playerName: string, playerAvatar: string) => {
    console.log('🔍 joinRoom called with:', { roomCode, playerName, playerAvatar })
    console.log('🔍 Socket connected:', socketRef.current?.connected)
    console.log('🔍 Socket ID:', socketRef.current?.id)
    
    if (socketRef.current?.connected) {
      console.log('👤 Emitting player:join event')
      socketRef.current.emit('player:join', {
        roomCode,
        playerName,
        playerAvatar
      })
      console.log('👤 player:join event emitted successfully')
      // Save identity for auto-rejoin
      try {
        localStorage.setItem(AUTO_JOIN_STORAGE_KEY, JSON.stringify({ roomCode, playerName, playerAvatar }))
      } catch {}
    } else {
      console.error('❌ No socket connection available')
      setError('Geen verbinding met server')
    }
  }

  const startGame = (roomCode: string) => {
    if (socketRef.current?.connected) {
      console.log('🎮 Starting game in room:', roomCode)
      socketRef.current.emit('host:startGame', { roomCode })
    } else {
      setError('Geen verbinding met server')
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    socket: socketRef.current,
    connected,
    room,
    error,
    createRoom,
    joinRoom,
    startGame,
    clearError
  }
}
