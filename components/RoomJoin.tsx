'use client'

import { useState, useEffect } from 'react'
import { Gamepad2, AlertCircle, ArrowLeft, BarChart3 } from 'lucide-react'
import { RoomStorage } from '@/utils/roomStorage'
import { useSocket } from '@/hooks/useSocket'

interface RoomJoinProps {
  onJoinRoom: (roomId: string) => void
  onBack: () => void
  onGoToMarketScreen?: () => void
  onBypassToGame?: () => void
  playerName?: string
  playerAvatar?: string
}

export default function RoomJoin({ onJoinRoom, onBack, onGoToMarketScreen, onBypassToGame, playerName, playerAvatar }: RoomJoinProps) {
  const { joinRoom, room, error: socketError, connected } = useSocket()
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<string[]>([])

  // Sync rooms from URL on component mount
  useEffect(() => {
    RoomStorage.syncFromUrl()
    setAvailableRooms(RoomStorage.getRooms())
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔍 RoomJoin handleSubmit called')
    console.log('🔍 Room ID:', roomId)
    console.log('🔍 Player Name:', playerName)
    console.log('🔍 Player Avatar:', playerAvatar)
    console.log('🔍 Connected:', connected)
    
    if (!roomId.trim()) {
      setError('Voer een lobby ID in')
      return
    }

    if (roomId.trim().length < 3) {
      setError('Lobby ID moet minimaal 3 karakters zijn')
      return
    }

    if (!playerName || !playerAvatar) {
      setError('Speler gegevens ontbreken - ga terug en vul je naam in')
      return
    }

    if (!connected) {
      setError('Geen verbinding met server - probeer de pagina te verversen')
      return
    }

    setIsJoining(true)
    setError('')

    const targetRoomId = roomId.trim()
    console.log('🔍 Calling joinRoom with:', targetRoomId, playerName, playerAvatar)
    
    // Join room via Socket.io
    joinRoom(targetRoomId, playerName, playerAvatar)
    
    // Add timeout fallback with direct navigation
    setTimeout(() => {
      setIsJoining(prev => {
        // Als join inmiddels is gestopt (success of error), doe niets
        if (!prev) {
          return prev
        }

        console.log('⏰ Join timeout - using fallback navigation')
        
        // If Socket.io fails, still navigate to waiting room for offline mode
        if (targetRoomId === '123') {
          console.log('🔄 Using fallback navigation for room 123')
          onJoinRoom(targetRoomId)
        } else {
          // Alleen hier een generieke timeout-error tonen
          setError('Verbinding timeout - probeer opnieuw of gebruik kamer 123')
        }

        return false
      })
    }, 5000) // Reduced to 5 seconds for faster fallback
  }

  // Handle successful room join - FIXED LOGIC
  useEffect(() => {
    if (room) {
      console.log('🎉 Room received, navigating to waiting room')
      console.log('🏠 Room data:', room)
      setIsJoining(false) // Stop loading state
      onJoinRoom(roomId) // Navigate immediately when room is received
    }
  }, [room, roomId, onJoinRoom])

  // Handle Socket.io errors
  useEffect(() => {
    if (socketError) {
      console.log('❌ Socket error received:', socketError)
      setError(socketError)
      setIsJoining(false)
    }
  }, [socketError])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/Collage_logo.png"
              alt="CryptoClash"
              className="w-[50vw] md:w-[25vw] h-auto max-h-[60vh] drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
            />
          </div>
          <h1 className="sr-only">CryptoClash</h1>
          <p className="text-gray-400">Join een spel lobby om te beginnen</p>
          
          {/* Connection Status */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? 'Verbonden met server' : 'Geen verbinding'}
            </span>
          </div>
        </div>

        {/* Join Form */}
        <div className="crypto-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
                Lobby ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value)
                  setError('')
                }}
                placeholder="Voer lobby ID in..."
                className="w-full p-4 bg-dark-bg border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-purple focus:outline-none text-center text-2xl font-bold tracking-wider"
                disabled={isJoining}
                maxLength={10}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining || !roomId.trim()}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold py-4 px-6 rounded-lg shadow-neon-purple transition-all duration-300 hover:shadow-neon-blue hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Lobby zoeken...</span>
                </>
              ) : (
                <>
                  <Gamepad2 className="w-5 h-5" />
                  <span>Join Lobby</span>
                </>
              )}
            </button>

            {/* Bypass Button */}
            {onBypassToGame && (
              <button
                type="button"
                onClick={onBypassToGame}
                disabled={isJoining}
                className="w-full mt-4 bg-gradient-to-r from-neon-gold to-neon-turquoise text-white font-bold py-4 px-6 rounded-lg shadow-neon-gold transition-all duration-300 hover:shadow-neon-turquoise hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Direct naar Spel</span>
              </button>
            )}
          </form>
          
          
          {/* Back Button */}
          <button
            onClick={onBack}
            disabled={isJoining}
            className="w-full mt-4 py-3 px-6 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Terug</span>
          </button>
        </div>

        

        {/* Game Info */}
        <div className="mt-6 crypto-card">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-neon-turquoise" />
            <span>Over CryptoClash</span>
          </h3>
          <div className="space-y-2 text-gray-300 text-sm">
            <p>🎮 Multiplayer crypto trading game</p>
            <p>📱 Scan QR codes voor boosts</p>
            <p>📊 Live marktkoersen</p>
            <p>🏆 Compete met andere spelers</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Heb je geen lobby ID? Vraag de spelleider om een nieuwe lobby aan te maken.
          </p>
        </div>
      </div>
    </div>
  )
}
