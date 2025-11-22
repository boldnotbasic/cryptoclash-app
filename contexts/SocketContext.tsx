'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  }>
  started: boolean
  settings: {
    volatility: string
    gameDuration: number
  }
}

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  room: Room | null
  error: string | null
  createRoom: (roomCode: string, hostName: string, hostAvatar: string, settings: any) => void
  joinRoom: (roomCode: string, playerName: string, playerAvatar: string) => void
  startGame: (roomCode: string) => void
  clearError: () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}`
      
      console.log('🔌 Creating global socket connection:', socketUrl)
      
      socketRef.current = io(socketUrl, {
        transports: ['polling'],
        timeout: 20000,
        forceNew: false,
        upgrade: false,
        rememberUpgrade: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      })

      const socket = socketRef.current

      // Connection events
      socket.on('connect', () => {
        console.log('🔌 Global socket connected:', socket.id)
        setConnected(true)
        setError(null)
      })

      socket.on('disconnect', (reason) => {
        console.log('🔌 Global socket disconnected:', reason)
        setConnected(false)
        setRoom(null)
      })

      socket.on('connect_error', (error) => {
        console.error('🔌 Global socket connection error:', error)
        setConnected(false)
        setError(`Verbindingsfout: ${error.message}`)
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
        
        if (room && room.players) {
          setRoom(room)
          setError(null)
          console.log('✅ Room state updated successfully')
        } else {
          console.error('❌ Invalid room data received:', room)
          setError('Ongeldige kamer data ontvangen')
        }
      })

      socket.on('player:joinError', (errorMessage) => {
        console.error('❌ === PLAYER JOIN ERROR RECEIVED ===')
        console.error('👤 Join error:', errorMessage)
        setError(errorMessage)
      })

      // Lobby events
      socket.on('lobby:update', (updatedRoom) => {
        console.log('🔄 Lobby updated')
        setRoom(updatedRoom)
      })

      // Game events
      socket.on('game:started', ({ room }) => {
        console.log('🎮 Game started!')
        setRoom(room)
      })

      socket.on('host:startError', (errorMessage) => {
        console.error('🎮 Start game error:', errorMessage)
        setError(errorMessage)
      })

      // Test message events
      socket.on('test:messageReceived', ({ message, sender, timestamp, roomCode }) => {
        console.log(`📡 Test message received in room ${roomCode}:`, message, 'from', sender)
      })

      socket.on('debug:rooms', (rooms) => {
        console.log('📋 Available rooms:', Object.keys(rooms))
      })
    }

    // Cleanup only on component unmount
    return () => {
      console.log('🔌 SocketProvider cleanup - keeping connection alive')
      // Don't disconnect here - keep connection alive across page changes
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

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      room,
      error,
      createRoom,
      joinRoom,
      startGame,
      clearError
    }}>
      {children}
    </SocketContext.Provider>
  )
}
